/**
 * Sprint Descriptors — ES11 (Engenharia de Software, Módulo 11)
 *
 * Based on the real metaproject "GRAD ES11 - 2025-2A.xlsx".
 * Each descriptor maps TAPI deliverables to Git-verifiable artifacts
 * with expected file paths, document sections, and evaluation criteria.
 *
 * Document deliverables include:
 *   - path: expected file location in the repo
 *   - expected_sections: heading names the document must contain
 *   - evaluation_criteria: text from the metaproject rubric
 *
 * These fields enable both structural (deterministic) and semantic (LLM)
 * conformance evaluation.
 */

const ES11_SPRINT_DESCRIPTORS = [
  // ── Sprint 1 (Semanas 01-02) ───────────────────────────────────────────────
  {
    sprint_id: 'ES11-S1',
    module: 'ES11',
    sprint_number: 1,
    title: 'Contextualização, Modelagem e Especificação Inicial',
    partner: 'Parceiro Corporativo',
    baseline_version: 1,
    baseline_origin: 'metaproject',
    previous_baseline_id: null,
    start_date: '2026-08-04',
    end_date: '2026-08-15',
    working_days: 10,

    deliverables: [
      {
        id: 'D1',
        name: 'Contextualização e Especificação de Requisitos do Projeto',
        type: 'document',
        path: 'docs/Contextualizacao-e-Especificacao-de-Requisitos-do-Projeto.md',
        expected_sections: [
          'Cenário Organizacional e de Governança',
          'Requisitos Funcionais (RFs)',
          'Requisitos Não Funcionais (RNFs)',
          'Testes de Usuário e Critérios de Aceitação',
          'Tabela de Correlação RF ↔ RNF',
        ],
        evaluation_criteria:
          'Cenário organizacional: pesquisa aprofundada e contextualizada sobre o parceiro, com fontes confiáveis. ' +
          'RFs: relevância, rastreabilidade, detalhamento adequado com identificadores únicos. ' +
          'RNFs: aderência a padrões reconhecidos (ISO 25010), justificativa técnica clara. ' +
          'Testes: estrutura completa, clareza e mensurabilidade, com foco na validação eficaz de RFs e RNFs. ' +
          'Correlação RF↔RNF: tabela clara mostrando dependências entre requisitos.',
        weight: 2,
      },
      {
        id: 'D2',
        name: 'Modelagem Dimensional do Data Warehouse',
        type: 'document',
        path: 'docs/Modelagem-Dimensional-do-Data-Warehouse.md',
        expected_sections: [
          'Tabelas de Fato',
          'Tabelas de Dimensão',
          'Data Mapping',
          'Transformações ETL',
        ],
        evaluation_criteria:
          'Tabelas de fato: clareza na definição da granularidade, relevância dos eventos/transações modelados, ' +
          'métricas mensuráveis e justificadas. ' +
          'Tabelas de dimensão: atributos descritivos completos, hierarquias bem definidas, SCD type justificado. ' +
          'Data mapping: rastreabilidade completa fonte→DW, joins documentados entre fontes distintas. ' +
          'Transformações ETL: regras de transformação claras, tratamento de nulos e duplicatas.',
        weight: 2,
      },
      {
        id: 'D3',
        name: 'Especificação dos Dashboards em Power BI',
        type: 'document',
        path: 'docs/Especificacao-dos-Dashboards-em-Power-BI.md',
        expected_sections: [
          'Visão Geral',
          'Descrição dos Dashboards Criados',
          'Tabela de Rastreabilidade RF ↔ Dashboards',
          'Medidas DAX Criadas',
          'Filtros e Segmentações',
        ],
        evaluation_criteria:
          'Visão geral: contexto claro de uso dos dashboards pelo parceiro. ' +
          'Dashboards: descrição visual e funcional de cada relatório, screenshots ou mockups. ' +
          'Rastreabilidade RF↔Dashboards: tabela clara mostrando quais RFs cada dashboard atende. ' +
          'Medidas DAX: fórmulas documentadas com explicação do cálculo. ' +
          'Filtros: segmentações disponíveis e justificativa de cada filtro.',
        weight: 2,
      },
      {
        id: 'D4',
        name: 'Gestão Evolutiva do Projeto - Sprint 1',
        type: 'document',
        path: 'docs/Gestao-Evolutiva-do-Projeto-Sprint-1.md',
        expected_sections: [
          'Backlog Revisado',
          'Métricas da Sprint 1',
          'Planejamento da Sprint 2',
          'Conformidade com os Critérios do Escritório de Projetos',
          'Políticas de Gestão de Configuração',
        ],
        evaluation_criteria:
          'Backlog: atualizado com todas as features relevantes, user stories claramente definidas e priorizadas. ' +
          'Métricas: throughput e cycle time contabilizados corretamente, burndown chart calculado. ' +
          'Planejamento: tasks da próxima sprint com descrições claras e detalhadas, priorizadas. ' +
          'Conformidade EP: checklist dos critérios possíveis para esta etapa. ' +
          'GCM: evidências de controle de versões, pull requests, tags, padronização de nomenclatura.',
        weight: 2,
      },
    ],

    commit_requirements: {
      min_total: 12,
      conventional_format: true,
      min_per_member: 2,
      max_median_size: 200,
      min_test_ratio: 0.0,
      max_contributor_concentration: 0.70,
    },

    expected_daily_pace: {
      commits_per_day: 1.5,
      active_members_ratio: 0.5,
      issues_closed_per_week: 1,
    },

    assessment_weights: {
      structural_conformance: 0.25,
      semantic_quality: 0.35,
      commit_discipline: 0.20,
      quantitative_cep: 0.20,
    },

    rubric_weights: {
      commit_quality: 0.25,
      review_process: 0.20,
      issue_tracking: 0.20,
      delivery_cadence: 0.35,
    },
  },

  // ── Sprint 2 (Semanas 03-04) ───────────────────────────────────────────────
  {
    sprint_id: 'ES11-S2',
    module: 'ES11',
    sprint_number: 2,
    title: 'Governança de Dados e Refinamento',
    partner: 'Parceiro Corporativo',
    start_date: '2026-08-18',
    end_date: '2026-08-29',
    working_days: 10,

    deliverables: [
      {
        id: 'D1',
        name: 'Governança de Dados do Projeto',
        type: 'document',
        path: 'docs/Governanca-de-Dados-do-Projeto.md',
        expected_sections: [
          'Estrutura Organizacional da Governança de Dados',
          'Política de Qualidade de Dados',
          'Gestão de Metadados e Catálogo de Dados',
          'Classificação de Dados e Proteção',
          'Segurança e Acesso aos Dados',
          'Ciclo de Vida dos Dados',
          'Avaliação de Maturidade em Governança',
        ],
        evaluation_criteria:
          'Estrutura organizacional: papéis bem definidos (Data Owner, Steward, Engineer). ' +
          'Qualidade: dimensões de qualidade mapeadas com métricas e thresholds. ' +
          'Metadados: catálogo com descrição, tipo, origem, atualização de cada dataset. ' +
          'Classificação: critérios claros por categoria (público, interno, confidencial). ' +
          'Segurança: controles de acesso documentados. ' +
          'Ciclo de vida: políticas de retenção, archival, descarte. ' +
          'Maturidade: framework aplicado, diagnóstico coerente, plano de evolução.',
        weight: 2,
      },
      {
        id: 'D2',
        name: 'Contextualização e Especificação de Requisitos - v2',
        type: 'document',
        path: 'docs/Contextualizacao-e-Especificacao-de-Requisitos-do-Projeto.md',
        expected_sections: [
          'Cenário Organizacional e de Governança',
          'Requisitos Funcionais (RFs)',
          'Requisitos Não Funcionais (RNFs)',
          'Testes de Usuário e Critérios de Aceitação',
          'Tabela de Correlação RF ↔ RNF',
        ],
        evaluation_criteria:
          'Refinamento da v1 com incorporação de feedback do sprint review. ' +
          'RFs e RNFs atualizados com base em novos entendimentos do parceiro. ' +
          'Testes de aceitação refinados e mais detalhados.',
        weight: 1,
      },
      {
        id: 'D3',
        name: 'Modelagem Dimensional do Data Warehouse - v2',
        type: 'document',
        path: 'docs/Modelagem-Dimensional-do-Data-Warehouse.md',
        expected_sections: [
          'Tabelas de Fato',
          'Tabelas de Dimensão',
          'Data Mapping',
          'Transformações ETL',
        ],
        evaluation_criteria:
          'Refinamento da modelagem v1 com feedback incorporado. ' +
          'Granularidade revisada, dimensões expandidas, mapeamento completo.',
        weight: 2,
      },
      {
        id: 'D4',
        name: 'Especificação dos Dashboards em Power BI - v2',
        type: 'document',
        path: 'docs/Especificacao-dos-Dashboards-em-Power-BI.md',
        expected_sections: [
          'Visão Geral',
          'Descrição dos Dashboards Criados',
          'Tabela de Rastreabilidade RF ↔ Dashboards',
          'Medidas DAX Criadas',
          'Filtros e Segmentações',
        ],
        evaluation_criteria:
          'Dashboards refinados com base no feedback. ' +
          'Novos visuais e medidas DAX adicionados conforme necessidade.',
        weight: 2,
      },
      {
        id: 'D5',
        name: 'Gestão Evolutiva do Projeto - Sprint 2',
        type: 'document',
        path: 'docs/Gestao-Evolutiva-do-Projeto-Sprint-2.md',
        expected_sections: [
          'Backlog Revisado',
          'Métricas da Sprint 2',
          'Planejamento da Sprint 3',
          'Conformidade com os Critérios do Escritório de Projetos',
          'Políticas de Gestão de Configuração',
        ],
        evaluation_criteria:
          'Backlog atualizado, métricas calculadas, planejamento da sprint seguinte, ' +
          'evidências de GCM (commits, PRs, tags).',
        weight: 1,
      },
    ],

    commit_requirements: {
      min_total: 15,
      conventional_format: true,
      min_per_member: 2,
      max_median_size: 200,
      min_test_ratio: 0.0,
      max_contributor_concentration: 0.70,
    },

    expected_daily_pace: {
      commits_per_day: 1.5,
      active_members_ratio: 0.5,
      issues_closed_per_week: 2,
    },

    assessment_weights: {
      structural_conformance: 0.25,
      semantic_quality: 0.35,
      commit_discipline: 0.20,
      quantitative_cep: 0.20,
    },

    rubric_weights: {
      commit_quality: 0.25,
      review_process: 0.25,
      issue_tracking: 0.20,
      delivery_cadence: 0.30,
    },
  },

  // ── Sprint 3 (Semanas 05-06) ───────────────────────────────────────────────
  {
    sprint_id: 'ES11-S3',
    module: 'ES11',
    sprint_number: 3,
    title: 'Pipeline ETL e Governança Avançada',
    partner: 'Parceiro Corporativo',
    start_date: '2026-09-01',
    end_date: '2026-09-12',
    working_days: 10,

    deliverables: [
      {
        id: 'D1',
        name: 'Pipeline ETL - versão 1',
        type: 'code',
        paths: ['src/etl/', 'src/pipeline/', 'pipelines/'],
        expected_artifacts: [
          { type: 'file', pattern: 'requirements.txt', context: 'Python dependencies' },
          { type: 'file', pattern: '*.yml', context: 'CI pipeline config' },
          { type: 'dir', pattern: 'tests/', context: 'Test directory' },
        ],
        documentation_path: 'docs/Pipeline-ETL.md',
        expected_sections: [
          'Objetivo',
          'Escopo',
          'Módulo de Processamento ETL',
          'Gerenciador de DAGs (Orquestração)',
          'Integração Contínua (CI)',
          'Observabilidade',
          'Testes Automatizados',
          'Entregáveis de Arquitetura e Modelagem',
        ],
        evaluation_criteria:
          'ETL modular em camadas (extract, transform, load). ' +
          'Orquestrador de DAGs configurado (Airflow, Prefect ou n8n). ' +
          'Pipeline CI funcional com testes, linting, cobertura. ' +
          'Observabilidade com métricas/logs. ' +
          'Testes unitários e de integração. ' +
          'Documentação arquitetural com diagramas UML.',
        weight: 3,
      },
      {
        id: 'D2',
        name: 'Governança de Dados do Projeto - v2',
        type: 'document',
        path: 'docs/Governanca-de-Dados-do-Projeto.md',
        expected_sections: [
          'Estrutura Organizacional da Governança de Dados',
          'Política de Qualidade de Dados',
          'Gestão de Metadados e Catálogo de Dados',
          'Classificação de Dados e Proteção',
          'Segurança e Acesso aos Dados',
          'Ciclo de Vida dos Dados',
          'Avaliação de Maturidade em Governança',
        ],
        evaluation_criteria:
          'Versão refinada com feedback incorporado. ' +
          'Maturidade com framework aplicado, diagnóstico coerente e plano de evolução proposto.',
        weight: 3,
      },
      {
        id: 'D3',
        name: 'Gestão Evolutiva do Projeto - Sprint 3',
        type: 'document',
        path: 'docs/Gestao-Evolutiva-do-Projeto-Sprint-3.md',
        expected_sections: [
          'Backlog Revisado',
          'Métricas da Sprint 3',
          'Planejamento da Sprint 4',
          'Conformidade com os Critérios do Escritório de Projetos',
          'Políticas de Gestão de Configuração',
        ],
        evaluation_criteria:
          'Backlog atualizado, métricas calculadas, planejamento da sprint seguinte.',
        weight: 2,
      },
    ],

    commit_requirements: {
      min_total: 20,
      conventional_format: true,
      min_per_member: 3,
      max_median_size: 150,
      min_test_ratio: 0.15,
      max_contributor_concentration: 0.60,
    },

    expected_daily_pace: {
      commits_per_day: 2.0,
      active_members_ratio: 0.6,
      issues_closed_per_week: 3,
    },

    assessment_weights: {
      structural_conformance: 0.20,
      semantic_quality: 0.35,
      commit_discipline: 0.25,
      quantitative_cep: 0.20,
    },

    rubric_weights: {
      commit_quality: 0.25,
      review_process: 0.25,
      issue_tracking: 0.20,
      delivery_cadence: 0.30,
    },
  },
];

module.exports = { ES11_SPRINT_DESCRIPTORS };
