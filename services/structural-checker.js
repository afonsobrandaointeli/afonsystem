/**
 * Structural Checker — Deterministic Deliverable Verification
 *
 * Phase 2a: Checks document deliverables against Sprint Descriptor
 * without any LLM calls. Pure structural analysis:
 *
 *   - File existence (path in file_snapshots)
 *   - Section presence (headings vs expected_sections)
 *   - Word count per section (minimum threshold)
 *   - Table/image presence
 *   - Placeholder detection ("TODO", "preencher", "em desenvolvimento")
 *
 * Returns a structural_result per deliverable with completeness score.
 */

const { getDB } = require('../config/db');

const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/i,
  /\bpreencher\b/i,
  /\bem desenvolvimento\b/i,
  /\bserá completad[ao]\b/i,
  /\blorem ipsum\b/i,
  /\bplaceholder\b/i,
  /\bserá expandid[ao]\b/i,
  /\bàs pressas\b/i,
];

const MIN_WORDS_PER_SECTION = 50;

// ─── Section extraction ─────────────────────────────────────────────────────

function extractSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,2}\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push({
          heading: currentSection,
          content: currentContent.join('\n').trim(),
          word_count: currentContent.join(' ').split(/\s+/).filter(w => w.length > 0).length,
        });
      }
      currentSection = headingMatch[1].trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Last section
  if (currentSection) {
    sections.push({
      heading: currentSection,
      content: currentContent.join('\n').trim(),
      word_count: currentContent.join(' ').split(/\s+/).filter(w => w.length > 0).length,
    });
  }

  return sections;
}

// ─── Section matching (fuzzy) ───────────────────────────────────────────────

function normalizeHeading(h) {
  return h.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function matchSection(expectedSection, actualSections) {
  const normalizedExpected = normalizeHeading(expectedSection);

  for (const actual of actualSections) {
    const normalizedActual = normalizeHeading(actual.heading);

    // Exact match
    if (normalizedActual === normalizedExpected) return actual;

    // Substring match
    if (normalizedActual.includes(normalizedExpected) ||
        normalizedExpected.includes(normalizedActual)) return actual;

    // Word overlap (>60% of expected words present)
    const expectedWords = normalizedExpected.split(/\s+/);
    const actualWords = normalizedActual.split(/\s+/);
    const overlap = expectedWords.filter(w => actualWords.includes(w)).length;
    if (overlap / expectedWords.length > 0.6) return actual;
  }

  return null;
}

// ─── Placeholder detection ──────────────────────────────────────────────────

function detectPlaceholders(content) {
  const found = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(content)) {
      found.push(pattern.source);
    }
  }
  return found;
}

// ─── Main structural check ──────────────────────────────────────────────────

async function checkDeliverable(projectId, deliverable, sprintId) {
  const db = getDB();

  // Fetch file snapshot
  const snapshot = await db.collection('file_snapshots').findOne({
    project_id: projectId,
    sprint_id: sprintId,
    path: deliverable.path,
  });

  if (!snapshot) {
    return {
      deliverable_id: deliverable.id,
      deliverable_name: deliverable.name,
      file_exists: false,
      structural_completeness: 0,
      sections_found: [],
      sections_missing: deliverable.expected_sections || [],
      section_details: [],
      placeholders_detected: [],
      word_count: 0,
      table_count: 0,
      strong_points: [],
      weak_points: ['Arquivo não encontrado no repositório: ' + deliverable.path],
    };
  }

  const expectedSections = deliverable.expected_sections || [];
  const actualSections = extractSections(snapshot.content);

  const sectionDetails = [];
  const sectionsFound = [];
  const sectionsMissing = [];
  const strongPoints = [];
  const weakPoints = [];

  for (const expected of expectedSections) {
    const match = matchSection(expected, actualSections);

    if (match) {
      sectionsFound.push(expected);
      const placeholders = detectPlaceholders(match.content);
      const isSubstantive = match.word_count >= MIN_WORDS_PER_SECTION && placeholders.length === 0;

      sectionDetails.push({
        section: expected,
        present: true,
        matched_heading: match.heading,
        word_count: match.word_count,
        has_tables: /\|.*\|/.test(match.content),
        has_lists: /^[\s]*[-*]\s/.test(match.content),
        is_substantive: isSubstantive,
        placeholders: placeholders,
      });

      if (isSubstantive) {
        strongPoints.push(`Seção "${expected}" completa (${match.word_count} palavras)`);
      } else if (placeholders.length > 0) {
        weakPoints.push(`Seção "${expected}" contém placeholders: ${placeholders.join(', ')}`);
      } else if (match.word_count < MIN_WORDS_PER_SECTION) {
        weakPoints.push(`Seção "${expected}" muito curta (${match.word_count} palavras, mínimo ${MIN_WORDS_PER_SECTION})`);
      }
    } else {
      sectionsMissing.push(expected);
      sectionDetails.push({
        section: expected,
        present: false,
        matched_heading: null,
        word_count: 0,
        has_tables: false,
        has_lists: false,
        is_substantive: false,
        placeholders: [],
      });
      weakPoints.push(`Seção "${expected}" ausente no documento`);
    }
  }

  // Completeness: substantive sections / expected sections
  const substantiveCount = sectionDetails.filter(s => s.is_substantive).length;
  const structuralCompleteness = expectedSections.length > 0
    ? +(substantiveCount / expectedSections.length).toFixed(2)
    : 0;

  if (structuralCompleteness >= 0.8) {
    strongPoints.unshift('Documento estruturalmente completo');
  } else if (structuralCompleteness < 0.4) {
    weakPoints.unshift('Documento estruturalmente incompleto');
  }

  return {
    deliverable_id: deliverable.id,
    deliverable_name: deliverable.name,
    file_exists: true,
    structural_completeness: structuralCompleteness,
    sections_found: sectionsFound,
    sections_missing: sectionsMissing,
    section_details: sectionDetails,
    placeholders_detected: sectionDetails.flatMap(s => s.placeholders),
    word_count: snapshot.word_count,
    table_count: snapshot.table_count,
    words_per_section: Object.fromEntries(
      sectionDetails.map(s => [s.section, s.word_count])
    ),
    strong_points: strongPoints,
    weak_points: weakPoints,
    file_content: snapshot.content,
  };
}

// ─── Check all deliverables for a project ───────────────────────────────────

async function checkAllDeliverables(projectId, descriptor) {
  const results = [];

  for (const deliverable of descriptor.deliverables) {
    if (deliverable.type !== 'document') continue;
    const result = await checkDeliverable(projectId, deliverable, descriptor.sprint_id);
    results.push(result);
  }

  return results;
}

module.exports = { checkDeliverable, checkAllDeliverables, extractSections, matchSection };
