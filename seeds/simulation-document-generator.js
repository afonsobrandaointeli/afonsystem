/**
 * Simulation Document & Diff Generator — LGPD-safe synthetic data
 *
 * Generates synthetic document content and commit diffs for 5 teams,
 * each exhibiting a distinct DOCUMENT QUALITY pattern:
 *
 *   Team Alpha   — Excellent docs: all sections, rich content, good structure
 *   Team Beta    — Poor docs: missing sections, placeholder text, skeleton
 *   Team Gamma   — Partial docs: some sections good, others missing
 *   Team Delta   — Late docs: documents committed late, rushed content
 *   Team Epsilon — Improving docs: started bad, getting better
 *
 * Also generates commit_diffs with per-file stats for diff analysis.
 */

const { ES11_SPRINT_DESCRIPTORS } = require('./sprint-descriptors-es11');

const SPRINT = ES11_SPRINT_DESCRIPTORS[0]; // ES11-S1

// ─── Document content templates by quality level ────────────────────────────

function generateDocContent(deliverable, qualityLevel) {
  const generators = {
    excellent: () => generateExcellentDoc(deliverable),
    poor: () => generatePoorDoc(deliverable),
    partial: () => generatePartialDoc(deliverable),
    late: () => generateLateDoc(deliverable),
    improving: () => generateImprovingDoc(deliverable),
  };
  return (generators[qualityLevel] || generators.partial)();
}

function generateExcellentDoc(deliverable) {
  const sections = deliverable.expected_sections || [];
  let content = `# ${deliverable.name}\n\n`;
  content += `> Documento elaborado pela equipe como parte do Sprint ${SPRINT.sprint_number}.\n\n`;

  for (const section of sections) {
    content += `## ${section}\n\n`;
    content += generateRichSectionContent(section, deliverable.name);
    content += '\n\n';
  }

  content += '## Referências\n\n';
  content += '- SWEBOK v4, IEEE Computer Society, 2024.\n';
  content += '- ISO/IEC 25010:2023 — Systems and software quality models.\n';
  content += '- Documentação interna do parceiro corporativo.\n';

  return content;
}

function generatePoorDoc(deliverable) {
  const sections = deliverable.expected_sections || [];
  let content = `# ${deliverable.name}\n\n`;

  // Only include 2 out of N sections, with minimal content
  const included = sections.slice(0, 2);
  for (const section of included) {
    content += `## ${section}\n\n`;
    content += 'TODO: preencher esta seção.\n\n';
  }

  return content;
}

function generatePartialDoc(deliverable) {
  const sections = deliverable.expected_sections || [];
  let content = `# ${deliverable.name}\n\n`;

  for (let i = 0; i < sections.length; i++) {
    content += `## ${sections[i]}\n\n`;
    if (i < Math.ceil(sections.length / 2)) {
      content += generateRichSectionContent(sections[i], deliverable.name);
    } else {
      content += 'Seção em desenvolvimento. Será completada na próxima sprint.\n';
    }
    content += '\n\n';
  }

  return content;
}

function generateLateDoc(deliverable) {
  const sections = deliverable.expected_sections || [];
  let content = `# ${deliverable.name}\n\n`;
  content += `*Documento criado às pressas no último dia do sprint.*\n\n`;

  for (const section of sections) {
    content += `## ${section}\n\n`;
    // Content exists but is shallow
    content += generateShallowSectionContent(section);
    content += '\n\n';
  }

  return content;
}

function generateImprovingDoc(deliverable) {
  const sections = deliverable.expected_sections || [];
  let content = `# ${deliverable.name}\n\n`;
  content += `> Versão inicial — refinamento planejado para a sprint 2.\n\n`;

  for (let i = 0; i < sections.length; i++) {
    content += `## ${sections[i]}\n\n`;
    if (i < 2) {
      content += 'Esta seção será desenvolvida na próxima iteração.\n';
    } else {
      // Later sections are better (team is improving)
      content += generateRichSectionContent(sections[i], deliverable.name);
    }
    content += '\n\n';
  }

  return content;
}

// ─── Section content generators ─────────────────────────────────────────────

function generateRichSectionContent(sectionName, docName) {
  const sectionTemplates = {
    'Cenário Organizacional e de Governança': `
O parceiro corporativo atua no setor de tecnologia financeira, atendendo mais de 2 milhões de clientes em operações de crédito e investimentos. A estrutura de governança de dados da empresa segue o modelo de três linhas de defesa, com uma equipe dedicada de Data Governance composta por 12 profissionais.

### Contexto Institucional

A empresa opera em um ambiente regulatório rigoroso (Banco Central, CVM), o que exige rastreabilidade completa de todos os dados utilizados em relatórios regulatórios. Atualmente, a empresa possui 47 sistemas legados que alimentam o data warehouse central.

### Desafios Identificados

| Desafio | Impacto | Prioridade |
|---------|---------|------------|
| Fragmentação de fontes de dados | Alto — dados inconsistentes entre sistemas | P1 |
| Ausência de catálogo de metadados | Médio — retrabalho na descoberta de dados | P2 |
| Latência na atualização do DW | Alto — decisões baseadas em dados defasados | P1 |
| Falta de lineage automatizado | Médio — dificuldade em auditorias | P3 |`,

    'Requisitos Funcionais (RFs)': `
Os requisitos funcionais foram elicitados por meio de entrevistas com stakeholders, análise de documentos do parceiro e workshops de design thinking.

| ID | Requisito | Prioridade | Rastreabilidade |
|----|-----------|------------|-----------------|
| RF01 | O sistema deve extrair dados de 3 fontes distintas (API REST, banco PostgreSQL, arquivos CSV) | Must Have | US-001, US-002 |
| RF02 | O sistema deve transformar e padronizar os dados conforme schema definido no catálogo | Must Have | US-003 |
| RF03 | O sistema deve carregar dados transformados no Data Warehouse em batch diário | Must Have | US-004 |
| RF04 | O sistema deve fornecer dashboards interativos com filtros por período e dimensão | Should Have | US-005, US-006 |
| RF05 | O sistema deve gerar alertas quando métricas ultrapassarem thresholds configurados | Could Have | US-007 |
| RF06 | O sistema deve permitir exportação de relatórios em PDF e CSV | Should Have | US-008 |

### Detalhamento RF01

**Descrição completa:** O módulo de extração deve suportar três conectores: (1) REST API com autenticação OAuth2, paginação automática e retry com backoff exponencial; (2) PostgreSQL via connection pool com queries parametrizadas; (3) CSV com detecção automática de encoding e delimitador.

**Critérios de aceitação:**
- [ ] Extração de API completa em menos de 5 minutos para volume de 100k registros
- [ ] Tratamento de timeout com retry (máximo 3 tentativas)
- [ ] Log estruturado de cada execução com contagem de registros`,

    'Requisitos Não Funcionais (RNFs)': `
Os requisitos não funcionais seguem a classificação da ISO/IEC 25010:2023.

| ID | Categoria | Requisito | Métrica | Threshold |
|----|-----------|-----------|---------|-----------|
| RNF01 | Desempenho | Tempo de carga do ETL | Tempo total de execução | < 30 min para 1M registros |
| RNF02 | Confiabilidade | Disponibilidade do DW | Uptime mensal | ≥ 99.5% |
| RNF03 | Segurança | Criptografia em trânsito | Protocolo | TLS 1.3 obrigatório |
| RNF04 | Manutenibilidade | Cobertura de testes | Percentual | ≥ 80% |
| RNF05 | Usabilidade | Tempo de carregamento do dashboard | Latência P95 | < 3 segundos |

### Justificativa Técnica

**RNF01 — Desempenho:** O parceiro processa em média 800k registros por dia. O threshold de 30 minutos para 1M garante que o batch diário completa dentro da janela de 1h entre sistemas.

**RNF03 — Segurança:** Requisito regulatório do Banco Central (Resolução 4.893/2021) exige criptografia em trânsito para todos os dados financeiros.`,

    'Testes de Usuário e Critérios de Aceitação': `
Os testes de aceitação foram derivados diretamente dos requisitos funcionais, seguindo a abordagem Given-When-Then.

### Plano de Testes

| ID Teste | RF Associado | Cenário | Resultado Esperado |
|----------|-------------|---------|-------------------|
| TA01 | RF01 | Given API disponível, When extração inicia, Then 100% dos registros são capturados | Contagem fonte = contagem destino |
| TA02 | RF02 | Given dados brutos, When transformação executa, Then schema de saída é válido | Zero erros de validação |
| TA03 | RF03 | Given dados transformados, When carga executa, Then DW atualizado | Timestamp de atualização < 1h |
| TA04 | RF04 | Given DW populado, When usuário acessa dashboard, Then dados visíveis com filtros | Todos os filtros funcionais |

### Critérios de Aceitação Globais

1. Todos os testes TA01-TA04 devem passar com 100% de sucesso
2. Nenhum dado pessoal (PII) deve ser exposto nos dashboards sem mascaramento
3. O pipeline ETL deve ser idempotente — re-execução não gera duplicatas`,

    'Tabela de Correlação RF ↔ RNF': `
| RF \\ RNF | RNF01 (Perf) | RNF02 (Confi) | RNF03 (Seg) | RNF04 (Manut) | RNF05 (Usab) |
|----------|:---:|:---:|:---:|:---:|:---:|
| RF01 — Extração | ✓ | ✓ | ✓ | | |
| RF02 — Transformação | ✓ | | | ✓ | |
| RF03 — Carga DW | ✓ | ✓ | ✓ | | |
| RF04 — Dashboards | | | | | ✓ |
| RF05 — Alertas | | ✓ | | ✓ | |
| RF06 — Exportação | ✓ | | ✓ | | ✓ |

**Legenda:** ✓ indica que o RNF impacta diretamente a implementação do RF.`,

    'Backlog Revisado': `
### Features (Épicos)

| ID | Feature | Status | Sprint |
|----|---------|--------|--------|
| F01 | Pipeline ETL | Em andamento | S1-S3 |
| F02 | Data Warehouse | Em andamento | S1-S2 |
| F03 | Dashboards Power BI | Planejado | S2-S4 |
| F04 | Governança de Dados | Planejado | S2-S3 |

### User Stories

| ID | Feature | User Story | Pontos | Status |
|----|---------|-----------|--------|--------|
| US-001 | F01 | Como engenheiro de dados, quero extrair dados da API REST para alimentar o DW | 5 | Done |
| US-002 | F01 | Como engenheiro de dados, quero extrair dados do PostgreSQL via connection pool | 3 | Done |
| US-003 | F02 | Como analista, quero que os dados estejam padronizados no schema do DW | 8 | In Progress |
| US-004 | F02 | Como analista, quero carga incremental diária no DW | 5 | To Do |
| US-005 | F03 | Como gerente, quero ver métricas de negócio em dashboard interativo | 8 | To Do |`,

    'Planejamento da Sprint 2': `
### Objetivos da Sprint 2

1. Completar a modelagem dimensional v2 com feedback incorporado
2. Iniciar implementação do módulo de transformação ETL
3. Definir framework de governança de dados

### Tasks Planejadas

| Task | Story | Responsável | Estimativa |
|------|-------|-------------|------------|
| Refinar schema de dimensões | US-003 | Alice | 2 dias |
| Implementar transformações de limpeza | US-003 | Bruno | 3 dias |
| Documentar políticas de governança | US-006 | Carol | 2 dias |
| Criar protótipos de dashboard | US-005 | Diego | 3 dias |

### Definition of Done

- Código revisado via pull request por pelo menos 1 membro
- Testes automatizados passando
- Documentação atualizada no repositório`,
  };

  // Match section name to template (fuzzy)
  for (const [key, template] of Object.entries(sectionTemplates)) {
    if (sectionName.includes(key) || key.includes(sectionName)) {
      return template.trim();
    }
  }

  // Generic rich content for sections without specific template
  return `Esta seção apresenta a análise detalhada referente a "${sectionName}" no contexto do projeto.

### Análise

A equipe realizou um levantamento completo dos aspectos relevantes, considerando as necessidades do parceiro corporativo e os requisitos definidos nas sprints anteriores.

| Aspecto | Situação Atual | Meta | Ação Necessária |
|---------|---------------|------|-----------------|
| Estrutura de dados | Parcialmente definida | Completa | Refinar modelagem |
| Documentação | Em andamento | 100% | Completar seções faltantes |
| Testes | Não iniciados | Cobertura 80% | Implementar suite |

### Considerações

Os pontos acima foram priorizados com base no impacto para o parceiro e na viabilidade técnica dentro do prazo da sprint. O acompanhamento será feito via métricas de progresso no burndown chart.`;
}

function generateShallowSectionContent(sectionName) {
  return `Breve descrição sobre ${sectionName}. Os detalhes serão expandidos conforme o projeto avança. A equipe está ciente da necessidade de aprofundamento.`;
}

// ─── Commit diff generators ────────────────────────────────────────────────

function generateCommitDiffs(team, commits) {
  const diffs = [];
  const filePaths = {
    excellent: [
      'docs/Contextualizacao-e-Especificacao-de-Requisitos-do-Projeto.md',
      'docs/Modelagem-Dimensional-do-Data-Warehouse.md',
      'docs/Especificacao-dos-Dashboards-em-Power-BI.md',
      'docs/Gestao-Evolutiva-do-Projeto-Sprint-1.md',
      'src/etl/extract.py',
      'src/etl/transform.py',
      'tests/test_extract.py',
      'tests/test_transform.py',
      'README.md',
    ],
    poor: [
      'docs/Contextualizacao-e-Especificacao-de-Requisitos-do-Projeto.md',
      'docs/Modelagem-Dimensional-do-Data-Warehouse.md',
      'main.py',
      'app.py',
    ],
    partial: [
      'docs/Contextualizacao-e-Especificacao-de-Requisitos-do-Projeto.md',
      'docs/Modelagem-Dimensional-do-Data-Warehouse.md',
      'docs/Especificacao-dos-Dashboards-em-Power-BI.md',
      'src/etl/extract.py',
      'src/etl/main.py',
      'src/etl/main.py', // repeated = churn
      'src/etl/main.py',
    ],
    late: [
      'docs/Contextualizacao-e-Especificacao-de-Requisitos-do-Projeto.md',
      'docs/Modelagem-Dimensional-do-Data-Warehouse.md',
      'docs/Gestao-Evolutiva-do-Projeto-Sprint-1.md',
      'src/app.py',
    ],
    improving: [
      'docs/Gestao-Evolutiva-do-Projeto-Sprint-1.md',
      'src/etl/extract.py',
      'src/etl/transform.py',
      'tests/test_extract.py',
      'docs/Contextualizacao-e-Especificacao-de-Requisitos-do-Projeto.md',
    ],
  };

  const paths = filePaths[team.doc_quality] || filePaths.partial;

  for (const commit of commits) {
    const numFiles = 1 + Math.floor(Math.random() * 3);
    const files = [];

    for (let i = 0; i < numFiles; i++) {
      const path = paths[Math.floor(Math.random() * paths.length)];
      const isTest = path.startsWith('tests/') || path.includes('test_');
      const isDoc = path.startsWith('docs/') || path.endsWith('.md');
      const isConfig = path.includes('docker') || path.includes('.yml') || path === 'requirements.txt';

      // Atomicity: excellent teams have small diffs, poor teams have large ones
      const sizeMultiplier = team.doc_quality === 'excellent' ? 1 :
                             team.doc_quality === 'poor' ? 5 :
                             team.doc_quality === 'late' ? 4 : 2;

      files.push({
        path,
        additions: Math.floor((5 + Math.random() * 30) * sizeMultiplier),
        deletions: Math.floor((1 + Math.random() * 10) * sizeMultiplier),
        is_test: isTest,
        is_doc: isDoc,
        is_config: isConfig,
      });
    }

    const totalLines = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);

    diffs.push({
      project_id: team.project_id,
      sha: commit.sha,
      author_name: commit.author_name,
      committed_date: commit.committed_date,
      message: commit.message,
      files_changed: files,
      total_lines: totalLines,
      largest_file_change: files.reduce((max, f) =>
        (f.additions + f.deletions) > (max.additions + max.deletions) ? f : max, files[0]),
    });
  }

  return diffs;
}

// ─── Team document quality mapping ──────────────────────────────────────────

const DOC_QUALITY_MAP = {
  consistent:   'excellent',
  cramming:     'poor',
  ghost_member: 'partial',
  mr_bottleneck: 'late',
  recovering:   'improving',
};

// ─── Main seed function ─────────────────────────────────────────────────────

async function seedDocuments(db, teams, commitsByProject) {
  console.log('[DocSeed] Generating document snapshots and commit diffs...');

  // Clear collections
  await Promise.all([
    db.collection('file_snapshots').deleteMany({}),
    db.collection('commit_diffs').deleteMany({}),
  ]);

  // Insert ES11 sprint descriptors
  const existing = await db.collection('sprint_descriptors').findOne({ sprint_id: 'ES11-S1' });
  if (!existing) {
    await db.collection('sprint_descriptors').insertMany(ES11_SPRINT_DESCRIPTORS);
    console.log('[DocSeed] ES11 sprint descriptors inserted.');
  }

  for (const team of teams) {
    const docQuality = DOC_QUALITY_MAP[team.pattern] || 'partial';
    const teamWithQuality = { ...team, doc_quality: docQuality };

    // Generate file snapshots (document content)
    for (const deliverable of SPRINT.deliverables) {
      if (deliverable.type !== 'document') continue;

      const content = generateDocContent(deliverable, docQuality);
      const headings = (content.match(/^#{1,3}\s+(.+)$/gm) || [])
        .map(h => h.replace(/^#{1,3}\s+/, ''));
      const wordCount = content.split(/\s+/).length;
      const tableCount = (content.match(/\|.*\|/g) || []).length;

      await db.collection('file_snapshots').updateOne(
        { project_id: team.project_id, sprint_id: SPRINT.sprint_id, path: deliverable.path },
        {
          $set: {
            project_id: team.project_id,
            sprint_id: SPRINT.sprint_id,
            deliverable_id: deliverable.id,
            path: deliverable.path,
            content,
            headings,
            word_count: wordCount,
            table_count: tableCount,
            image_count: 0,
            doc_quality_label: docQuality, // for test validation
            captured_at: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }

    // Generate commit diffs
    const commits = commitsByProject[team.project_id] || [];
    const diffs = generateCommitDiffs(teamWithQuality, commits);
    if (diffs.length > 0) {
      const diffOps = diffs.map(d => ({
        updateOne: {
          filter: { project_id: d.project_id, sha: d.sha },
          update: { $set: d },
          upsert: true,
        },
      }));
      await db.collection('commit_diffs').bulkWrite(diffOps);
    }

    console.log(`  [${team.name}] docs=${SPRINT.deliverables.filter(d => d.type === 'document').length} quality=${docQuality} diffs=${diffs.length}`);
  }

  const counts = await Promise.all([
    db.collection('file_snapshots').countDocuments(),
    db.collection('commit_diffs').countDocuments(),
  ]);
  console.log(`[DocSeed] Done. file_snapshots=${counts[0]} commit_diffs=${counts[1]}`);
}

module.exports = { seedDocuments, generateDocContent, generateCommitDiffs, DOC_QUALITY_MAP };
