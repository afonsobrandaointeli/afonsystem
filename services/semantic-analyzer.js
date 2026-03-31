/**
 * Semantic Analyzer — LLM-based Document Quality Assessment
 *
 * Phase 3: Uses Anthropic Claude API to evaluate document content
 * against Sprint Descriptor criteria. The LLM receives:
 *
 *   - The document content
 *   - Expected sections and evaluation criteria from the metaproject
 *   - Structural check results (already computed deterministically)
 *   - Contribution history per member
 *
 * Returns a structured JSON assessment with per-section scores,
 * executive summary, strengths, weaknesses, and recommended actions.
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 * Falls back to mock results if API key is not set.
 */

const { getDB } = require('../config/db');

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch {
  Anthropic = null;
}

const MODEL = process.env.SEMANTIC_MODEL || 'claude-haiku-4-5-20251001';
const MAX_CONTENT_CHARS = 8000; // truncate very large documents

// ─── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(deliverable, structuralResult, contributionData) {
  const content = (structuralResult.file_content || '')
    .slice(0, MAX_CONTENT_CHARS);

  const contributionText = (contributionData || [])
    .map(m => `- ${m.name}: ${m.lines} linhas, ${m.commits} commits (${m.percentage}%)`)
    .join('\n');

  return `Você é um avaliador acadêmico de artefatos PBL (Problem-Based Learning) em engenharia de software.
Avalie o documento abaixo comparando com os critérios do metaprojeto.

## Entregável
- Nome: ${deliverable.name}
- Peso: ${deliverable.weight}
- Arquivo: ${deliverable.path}

## Seções esperadas pelo metaprojeto
${(deliverable.expected_sections || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Critérios de avaliação do metaprojeto
${deliverable.evaluation_criteria}

## Resultado da verificação estrutural automática
- Completude estrutural: ${(structuralResult.structural_completeness * 100).toFixed(0)}%
- Seções presentes: ${structuralResult.sections_found.join(', ') || 'nenhuma'}
- Seções ausentes: ${structuralResult.sections_missing.join(', ') || 'nenhuma'}
- Placeholders detectados: ${structuralResult.placeholders_detected.join(', ') || 'nenhum'}
- Total de palavras: ${structuralResult.word_count}

## Histórico de contribuição (git)
${contributionText || 'Não disponível'}

## Conteúdo do documento
\`\`\`markdown
${content}
\`\`\`

---

Avalie CADA SEÇÃO esperada e retorne APENAS um JSON válido (sem markdown, sem explicações fora do JSON) com esta estrutura:

{
  "section_assessments": [
    {
      "section": "nome da seção esperada",
      "present": true,
      "completeness": 0.85,
      "quality": 0.70,
      "feedback": "explicação concisa do que está bom e do que falta"
    }
  ],
  "overall_semantic_score": 0.72,
  "executive_summary": "2-3 frases sobre o estado geral do entregável",
  "strengths": ["ponto forte 1"],
  "weaknesses": ["ponto fraco 1"],
  "recommended_actions": ["ação recomendada 1"]
}`;
}

// ─── Mock response (when no API key) ────────────────────────────────────────

function generateMockResponse(deliverable, structuralResult) {
  const sections = deliverable.expected_sections || [];
  const sectionAssessments = sections.map(s => {
    const found = structuralResult.section_details?.find(sd => sd.section === s);
    const present = found?.present || false;
    const isSubstantive = found?.is_substantive || false;

    return {
      section: s,
      present,
      completeness: isSubstantive ? 0.8 : (present ? 0.3 : 0.0),
      quality: isSubstantive ? 0.75 : (present ? 0.25 : 0.0),
      feedback: isSubstantive
        ? `Seção "${s}" contém conteúdo substantivo. [avaliação mock — LLM não disponível]`
        : present
          ? `Seção "${s}" presente mas com conteúdo insuficiente ou placeholder. [mock]`
          : `Seção "${s}" ausente no documento. [mock]`,
    };
  });

  const avgScore = sectionAssessments.length > 0
    ? sectionAssessments.reduce((sum, s) => sum + s.quality, 0) / sectionAssessments.length
    : 0;

  return {
    section_assessments: sectionAssessments,
    overall_semantic_score: +avgScore.toFixed(2),
    executive_summary: `[MOCK] Avaliação simulada baseada na verificação estrutural. Score: ${(avgScore * 100).toFixed(0)}%. Utilize ANTHROPIC_API_KEY para avaliação semântica real via LLM.`,
    strengths: sectionAssessments.filter(s => s.quality >= 0.7).map(s => `Seção "${s.section}" bem desenvolvida`),
    weaknesses: sectionAssessments.filter(s => s.quality < 0.5).map(s => `Seção "${s.section}" precisa de melhoria`),
    recommended_actions: structuralResult.sections_missing.length > 0
      ? [`Adicionar seções ausentes: ${structuralResult.sections_missing.join(', ')}`]
      : ['Revisar seções com placeholders'],
    _mock: true,
  };
}

// ─── LLM call ───────────────────────────────────────────────────────────────

async function callLLM(prompt) {
  if (!Anthropic || !process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();

  // Extract JSON from response (handle markdown code blocks)
  let jsonText = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  return JSON.parse(jsonText);
}

// ─── Main analysis function ─────────────────────────────────────────────────

async function analyzeDeliverable(deliverable, structuralResult, contributionData) {
  const prompt = buildPrompt(deliverable, structuralResult, contributionData);

  try {
    const llmResult = await callLLM(prompt);
    if (llmResult) {
      llmResult._mock = false;
      return llmResult;
    }
  } catch (err) {
    console.error(`[Semantic] LLM error for "${deliverable.name}": ${err.message}`);
  }

  // Fallback to mock
  return generateMockResponse(deliverable, structuralResult);
}

// ─── Analyze all deliverables for a project ─────────────────────────────────

async function analyzeAllDeliverables(projectId, descriptor, structuralResults, diffMetrics) {
  const db = getDB();
  const results = [];
  const usingLLM = !!(Anthropic && process.env.ANTHROPIC_API_KEY);

  console.log(`[Semantic] Analyzing ${structuralResults.length} deliverables for project ${projectId} (LLM: ${usingLLM ? MODEL : 'mock'})`);

  for (const structural of structuralResults) {
    const deliverable = descriptor.deliverables.find(d => d.id === structural.deliverable_id);
    if (!deliverable) continue;

    const contribution = diffMetrics?.contribution_by_member || [];
    const result = await analyzeDeliverable(deliverable, structural, contribution);

    // Persist
    await db.collection('semantic_assessments').updateOne(
      {
        project_id: projectId,
        sprint_id: descriptor.sprint_id,
        deliverable_id: deliverable.id,
      },
      {
        $set: {
          project_id: projectId,
          sprint_id: descriptor.sprint_id,
          deliverable_id: deliverable.id,
          deliverable_name: deliverable.name,
          model_used: usingLLM ? MODEL : 'mock',
          ...result,
          evaluated_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    results.push({ deliverable_id: deliverable.id, ...result });
    console.log(`  [${deliverable.name}] semantic_score=${result.overall_semantic_score} (${result._mock ? 'mock' : 'LLM'})`);
  }

  return results;
}

module.exports = { analyzeDeliverable, analyzeAllDeliverables, buildPrompt, generateMockResponse };
