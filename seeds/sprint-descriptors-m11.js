/**
 * Sprint Descriptors — Module 11
 * "Arquitetura e governança de dados alinhada à estratégia corporativa"
 *
 * Derived from the Inteli metaproject (TAPI) for Module 11.
 * Each Sprint Descriptor encodes the MINIMUM SCM baseline verifiable
 * through Git repository events. Topics not observable in the repository
 * (e.g., leadership soft skills) are excluded from the baseline.
 *
 * The mapping principle:
 *   Metaproject topic → Expected artifact type → Repository path pattern
 *                     → SCM verification rule in the Sprint Descriptor
 */

const MODULE_11_DESCRIPTORS = [
  // ─── Sprint 1: Entendimento do Negócio e Arquitetura Inicial ──────────
  {
    sprint_id: 'M11-S1',
    module: 'M11',
    sprint_number: 1,
    title: 'Entendimento do Negócio e Arquitetura de Dados Inicial',
    partner: 'Parceiro Corporativo',
    start_date: '2026-08-03',
    end_date: '2026-08-14',
    working_days: 10,
    // Tópicos do metaprojeto cobertos nesta sprint:
    //   Negócios: Arquitetura de negócio, Frameworks para estratégia
    //   Computação: Arquitetura e governança de dados (introdução)
    //   Matemática: Álgebra relacional (modelagem conceitual)
    //   UX: Entropia e informação (análise exploratória)
    deliverables: [
      {
        id: 'D1',
        name: 'Documentação de entendimento do negócio',
        type: 'document',
        metaproject_topics: [
          'Arquitetura de negócio',
          'Frameworks para implementação da estratégia',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'docs/business/',
            min_total: 3,
            conventional_format: true,
          },
        },
      },
      {
        id: 'D2',
        name: 'Modelo conceitual de dados e arquitetura inicial',
        type: 'document',
        metaproject_topics: [
          'Arquitetura e governança de dados',
          'Álgebra relacional',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'docs/architecture/',
            min_total: 2,
            conventional_format: true,
          },
        },
      },
      {
        id: 'D3',
        name: 'Análise exploratória dos dados (notebook)',
        type: 'code',
        metaproject_topics: [
          'Conceitos estatísticos',
          'Entropia e informação',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'notebooks/',
            min_total: 2,
          },
        },
      },
    ],
    expected_daily_pace: {
      commits_per_day: 1.5,
      active_members_ratio: 0.5,
      issues_closed_per_week: 2,
    },
    rubric_weights: {
      commit_quality: 0.20,
      review_process: 0.15,
      issue_tracking: 0.25,
      delivery_cadence: 0.40,
    },
  },

  // ─── Sprint 2: Pipeline de Dados e Governança ─────────────────────────
  {
    sprint_id: 'M11-S2',
    module: 'M11',
    sprint_number: 2,
    title: 'Pipeline de Dados (ETL) e Governança Inicial',
    partner: 'Parceiro Corporativo',
    start_date: '2026-08-17',
    end_date: '2026-08-28',
    working_days: 10,
    // Tópicos do metaprojeto cobertos:
    //   Computação: ETL/Data Lake/DW, Design Patterns, Microserviços
    //   Negócios: Auditoria de dados, Precificação em nuvem
    //   UX: Visualização da informação (primeiros protótipos)
    deliverables: [
      {
        id: 'D1',
        name: 'Pipeline ETL funcional',
        type: 'code',
        metaproject_topics: [
          'ETL, Data lake e DW',
          'Design Patterns',
          'Processamento em larga escala',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'src/etl/',
            min_total: 8,
            conventional_format: true,
            min_per_member: 2,
          },
          merge_requests: {
            min_merged: 2,
            review_required: true,
          },
        },
      },
      {
        id: 'D2',
        name: 'Infraestrutura containerizada (microserviços)',
        type: 'code',
        metaproject_topics: [
          'Microserviços',
          'Arquitetura TCP/IP',
          'Precificação em nuvem',
        ],
        scm_requirements: {
          commits: {
            path_pattern: '{Dockerfile,docker-compose}',
            min_total: 2,
          },
        },
      },
      {
        id: 'D3',
        name: 'Documentação de governança e auditoria',
        type: 'document',
        metaproject_topics: [
          'Segurança e governança de dados',
          'Auditoria de dados',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'docs/governance/',
            min_total: 2,
            conventional_format: true,
          },
        },
      },
    ],
    expected_daily_pace: {
      commits_per_day: 2.0,
      active_members_ratio: 0.6,
      issues_closed_per_week: 3,
    },
    rubric_weights: {
      commit_quality: 0.25,
      review_process: 0.25,
      issue_tracking: 0.20,
      delivery_cadence: 0.30,
    },
  },

  // ─── Sprint 3: Data Warehouse, Dashboard e Segurança ──────────────────
  {
    sprint_id: 'M11-S3',
    module: 'M11',
    sprint_number: 3,
    title: 'Data Warehouse, Dashboards de Governança e Segurança',
    partner: 'Parceiro Corporativo',
    start_date: '2026-08-31',
    end_date: '2026-09-11',
    working_days: 10,
    // Tópicos do metaprojeto cobertos:
    //   Computação: ETL/DW (evolução), Segurança de redes, Gerenciamento de redes
    //   UX: Dashboards de governança, Visualização da informação, Testes com usuários
    //   Negócios: ESG, Sustentabilidade
    //   Matemática: Conceitos estatísticos (métricas dos dashboards)
    deliverables: [
      {
        id: 'D1',
        name: 'Data Warehouse populado com dados tratados',
        type: 'code',
        metaproject_topics: [
          'ETL, Data lake e DW',
          'Álgebra relacional',
          'Processamento em larga escala',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'src/{dw,warehouse,data}/',
            min_total: 6,
            conventional_format: true,
            min_per_member: 2,
          },
          merge_requests: {
            min_merged: 2,
            review_required: true,
          },
        },
      },
      {
        id: 'D2',
        name: 'Dashboard de governança de dados',
        type: 'code',
        metaproject_topics: [
          'Dashboards de governança de dados',
          'Visualização da informação',
          'Sistemas de apoio à decisão',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'src/{dashboard,frontend,web}/',
            min_total: 6,
            conventional_format: true,
          },
        },
      },
      {
        id: 'D3',
        name: 'Documentação de segurança e testes com usuários',
        type: 'document',
        metaproject_topics: [
          'Segurança e governança de dados',
          'Gerenciamento e segurança de redes',
          'Testes com usuários em Dashboards',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'docs/{security,tests}/',
            min_total: 3,
          },
        },
      },
      {
        id: 'D4',
        name: 'Documentação ESG e sustentabilidade',
        type: 'document',
        metaproject_topics: [
          'Sustentabilidade e gestão ambiental',
          'ESG',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'docs/{esg,sustainability}/',
            min_total: 1,
          },
        },
      },
    ],
    expected_daily_pace: {
      commits_per_day: 2.5,
      active_members_ratio: 0.6,
      issues_closed_per_week: 3,
    },
    rubric_weights: {
      commit_quality: 0.25,
      review_process: 0.25,
      issue_tracking: 0.20,
      delivery_cadence: 0.30,
    },
  },

  // ─── Sprint 4: MLOps, Predição e Integração ───────────────────────────
  {
    sprint_id: 'M11-S4',
    module: 'M11',
    sprint_number: 4,
    title: 'MLOps, Modelo Preditivo em Produção e Integração',
    partner: 'Parceiro Corporativo',
    start_date: '2026-09-14',
    end_date: '2026-09-25',
    working_days: 10,
    // Tópicos do metaprojeto cobertos:
    //   Computação: MLOps, Predição em produção, Algoritmos de busca,
    //               Padrões arquiteturais MVC/MVP/MVVM
    //   Matemática: Técnicas de otimização, Conceitos estatísticos
    //   UX: Testes com usuários (validação do dashboard)
    deliverables: [
      {
        id: 'D1',
        name: 'Pipeline MLOps com modelo preditivo',
        type: 'code',
        metaproject_topics: [
          'MLOps',
          'Predição em produção',
          'Técnicas de otimização',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'src/{ml,model,mlops}/',
            min_total: 8,
            conventional_format: true,
            min_per_member: 2,
            no_last_day_cramming: true,
          },
          merge_requests: {
            min_merged: 3,
            review_required: true,
          },
        },
      },
      {
        id: 'D2',
        name: 'Integração end-to-end (ETL→DW→Dashboard→Predição)',
        type: 'code',
        metaproject_topics: [
          'Padrões arquiteturais MVC, MVP e MVVM',
          'Algoritmos de busca',
          'Sistemas de apoio à decisão',
        ],
        scm_requirements: {
          commits: {
            min_total: 6,
            conventional_format: true,
          },
          merge_requests: {
            min_merged: 2,
            review_required: true,
          },
          issues: {
            labels: ['sprint-4', 'integration'],
            all_closed_by_end: true,
            min_total: 5,
          },
        },
      },
      {
        id: 'D3',
        name: 'Relatório de testes e validação com usuários',
        type: 'document',
        metaproject_topics: [
          'Testes com usuários em Dashboards',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'docs/tests/',
            min_total: 2,
          },
        },
      },
    ],
    expected_daily_pace: {
      commits_per_day: 3.0,
      active_members_ratio: 0.7,
      issues_closed_per_week: 4,
    },
    rubric_weights: {
      commit_quality: 0.30,
      review_process: 0.30,
      issue_tracking: 0.20,
      delivery_cadence: 0.20,
    },
  },

  // ─── Sprint 5: Entrega Final, Refinamento e Apresentação ──────────────
  {
    sprint_id: 'M11-S5',
    module: 'M11',
    sprint_number: 5,
    title: 'Entrega Final, Refinamento e Documentação Completa',
    partner: 'Parceiro Corporativo',
    start_date: '2026-09-28',
    end_date: '2026-10-09',
    working_days: 10,
    // Sprint final: integração de TODOS os tópicos em entrega coesa
    // Foco em qualidade, documentação e preparação para apresentação
    deliverables: [
      {
        id: 'D1',
        name: 'Sistema completo integrado e funcional',
        type: 'code',
        metaproject_topics: [
          'Arquitetura e governança de dados',
          'Microserviços',
          'MLOps',
          'Sistemas de apoio à decisão',
        ],
        scm_requirements: {
          commits: {
            min_total: 10,
            conventional_format: true,
            min_per_member: 3,
            no_last_day_cramming: true,
          },
          merge_requests: {
            min_merged: 3,
            review_required: true,
          },
          issues: {
            labels: ['sprint-5'],
            all_closed_by_end: true,
            min_total: 5,
          },
          release_tag: 'v1\\.0.*',
        },
      },
      {
        id: 'D2',
        name: 'Documentação técnica final (arquitetura, governança, segurança)',
        type: 'document',
        metaproject_topics: [
          'Arquitetura e governança de dados',
          'Segurança e governança de dados',
          'Auditoria de dados',
          'ESG',
        ],
        scm_requirements: {
          commits: {
            path_pattern: 'docs/',
            min_total: 5,
            conventional_format: true,
          },
        },
      },
    ],
    expected_daily_pace: {
      commits_per_day: 3.0,
      active_members_ratio: 0.8,
      issues_closed_per_week: 5,
    },
    rubric_weights: {
      commit_quality: 0.30,
      review_process: 0.30,
      issue_tracking: 0.25,
      delivery_cadence: 0.15,
    },
  },
];

module.exports = { MODULE_11_DESCRIPTORS };
