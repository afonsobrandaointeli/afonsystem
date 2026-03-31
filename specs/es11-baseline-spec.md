# ES11 Baseline Specification

## Source

Based on the real metaproject **"GRAD ES11 - 2025-2A.xlsx"** (Engenharia de Software, Módulo 11).

## Sprint Structure

| Sprint | Weeks | Focus | Deliverables |
|--------|-------|-------|-------------|
| S1 | 01-02 | Contextualização, Modelagem, Especificação | 4 documents |
| S2 | 03-04 | Governança de Dados, Refinamento | 5 documents |
| S3 | 05-06 | Pipeline ETL, Governança Avançada | 2 docs + 1 code |

## Sprint 1 Deliverables (Implemented)

### D1: Contextualização e Especificação de Requisitos (peso 2)

**File:** `docs/Contextualizacao-e-Especificacao-de-Requisitos-do-Projeto.md`

**Expected sections:**
1. Cenário Organizacional e de Governança
2. Requisitos Funcionais (RFs)
3. Requisitos Não Funcionais (RNFs)
4. Testes de Usuário e Critérios de Aceitação
5. Tabela de Correlação RF ↔ RNF

**Evaluation criteria:**
- Cenário: pesquisa aprofundada, contextualizada, fontes confiáveis
- RFs: relevância, rastreabilidade, identificadores únicos
- RNFs: aderência ISO 25010, justificativa técnica
- Testes: estrutura completa, clareza, mensurabilidade
- Correlação: tabela clara de dependências

### D2: Modelagem Dimensional do Data Warehouse (peso 2)

**File:** `docs/Modelagem-Dimensional-do-Data-Warehouse.md`

**Expected sections:**
1. Tabelas de Fato
2. Tabelas de Dimensão
3. Data Mapping
4. Transformações ETL

### D3: Especificação dos Dashboards em Power BI (peso 2)

**File:** `docs/Especificacao-dos-Dashboards-em-Power-BI.md`

**Expected sections:**
1. Visão Geral
2. Descrição dos Dashboards Criados
3. Tabela de Rastreabilidade RF ↔ Dashboards
4. Medidas DAX Criadas
5. Filtros e Segmentações

### D4: Gestão Evolutiva do Projeto - Sprint 1 (peso 2)

**File:** `docs/Gestao-Evolutiva-do-Projeto-Sprint-1.md`

**Expected sections:**
1. Backlog Revisado
2. Métricas da Sprint 1
3. Planejamento da Sprint 2
4. Conformidade com os Critérios do Escritório de Projetos
5. Políticas de Gestão de Configuração

## Commit Requirements (Sprint 1)

| Metric | Threshold |
|--------|-----------|
| Minimum commits | 12 |
| Conventional format | Required |
| Min per member | 2 |
| Max median commit size | 200 lines |
| Test ratio | 0% (no code yet in S1) |
| Max contributor concentration | 70% |

## Document Quality Simulation Patterns

| Team Pattern | Doc Quality | Description |
|---|---|---|
| consistent | excellent | All sections present, rich content, tables, references |
| cramming | poor | Only 2/N sections, placeholder text ("TODO") |
| ghost_member | partial | First half good, second half "em desenvolvimento" |
| mr_bottleneck | late | All sections present but shallow content |
| recovering | improving | First sections empty, later sections improving |

## Scoring Weights (Sprint 1)

```
structural_conformance: 0.25
semantic_quality:       0.35
commit_discipline:      0.20
quantitative_cep:       0.20
```
