# Registro de Prompts — Engenharia Assistida por IA

Este documento registra os prompts, direcionamentos técnicos e critérios de validação humana utilizados durante o desenvolvimento da **API Agenda** (Projeto Final — **Geração Tech** / **Formação em Fullcycle – Engenharia de Software**).

O fluxo foi conduzido de forma incremental por Pull Requests, mantendo revisão arquitetural, testes automatizados e validação local em cada etapa.

---

## 1. Planejamento Arquitetural e Definição de Escopo

- **Prompt / Direcionamento:**
  > *"Estruturar uma API RESTful de domínio único (Agenda) em Node.js (ES Modules), Express e PostgreSQL que atenda aos critérios de Arquitetura em Camadas, SOLID (SRP e DIP), Repository Pattern, observabilidade (logs estruturados e métricas), testes automatizados e execução via Docker Compose, organizada em Pull Requests incrementais."*
- **Decisão e Validação:**
  - Definição da estrutura em camadas (`Routes -> Controller -> Service -> Repository`).
  - Organização do fluxo em 5 PRs temáticos (`infra/docker`, `docs/adr-001`, `feat/api-agenda`, `test/automated-tests` e `docs/docker-and-readme`).

---

## 2. PR #1 — Infraestrutura e Banco de Dados (`infra/docker`)

- **Prompt / Direcionamento:**
  > *"Criar o docker-compose.yml inicial com PostgreSQL 16 Alpine, healthcheck via pg_isready, volume persistente e script sql/init.sql contendo a tabela agendamentos com restrição CHECK (fim > inicio), TIMESTAMPTZ e índice composto para consultas por responsável e intervalo de horário."*
- **Validação Técnica Aplicada:**
  - Configuração da porta externa `5433` (`DB_PORT`) para evitar conflito com o serviço PostgreSQL nativo rodando na porta `5432` do ambiente Linux.
  - Subida do contêiner (`docker compose up -d`) e conferência da criação automática da tabela e restrições via `psql`.

---

## 3. PR #2 — Registro de Decisão Arquitetural (`docs/adr-001`)

- **Prompt / Direcionamento:**
  > *"Redigir o ADR 0001 (docs/adr/0001-arquitetura-e-persistencia.md) documentando a escolha de Arquitetura em Camadas com Repository Pattern e PostgreSQL com driver nativo pg, detalhando o contexto, as consequências e os motivos para descartar NoSQL (MongoDB), ORMs completos (Prisma/TypeORM) e MVC acoplado."*
- **Validação Técnica Aplicada:**
  - Conferência de consistência entre os tipos e constraints descritos no ADR (`TIMESTAMPTZ`, `CHECK (fim > inicio)`) e o DDL real em `sql/init.sql`.

---

## 4. PR #3 — Implementação da API, SOLID e Observabilidade (`feat/api-agenda`)

- **Prompt / Direcionamento:**
  > *"Implementar a API REST de agendamentos separando responsabilidades entre AgendamentoController, AgendamentoService e AgendamentoRepository (com mapeamento snake_case para camelCase), aplicando injeção de dependência, bloqueio de conflito de horário (HTTP 409), tratamento global de erros (AppError), logs estruturados em JSON com Pino e métricas HTTP com prom-client (/metrics e /health)."*
- **Validação Técnica Aplicada:**
  - Revisão da query de interseção temporal (`inicio < $3 AND fim > $2`) garantindo que agendamentos adjacentes não gerem falso conflito e que registros cancelados não bloqueiem a agenda.
  - Testes manuais via `curl` validando `GET /health` (`200`), criação (`201`), bloqueio de conflito (`409 SCHEDULE_CONFLICT`), listagem (`200`) e remoção (`204`).

---

## 5. PR #4 — Testes Unitários e de Integração (`test/automated-tests`)

- **Prompt / Direcionamento:**
  > *"Criar suíte de testes automatizados com Vitest e Supertest dividida em: (1) testes unitários do AgendamentoService utilizando repositório in-memory para validar obrigatoriedade de campos, datas inválidas, intervalo fim > inicio e conflitos; (2) testes de integração HTTP + PostgreSQL validando o ciclo CRUD completo, filtros, /health e /metrics com relatório de cobertura."*
- **Validação Técnica Aplicada:**
  - Execução de `npm run test:coverage` com aprovação dos 9 testes (6 unitários + 3 de integração), alcançando 100% de cobertura de funções e ~89% de cobertura total de código.

---

## 6. PR #5 — Empacotamento Docker e Documentação Final (`docs/docker-and-readme`)

- **Prompt / Direcionamento:**
  > *"Criar Dockerfile enxuto baseado em node:20-alpine, atualizar docker-compose.yml para orquestrar a API condicionada ao healthcheck do PostgreSQL em um único comando e redigir o README.md completo com arquitetura, organização de pastas, guia de execução, exemplos de requisições curl e instruções de teste."*
- **Validação Técnica Aplicada:**
  - Teste ponta a ponta subindo o ambiente completo com `docker compose up --build -d` e verificando a resposta de `GET /health`.
  - Auditoria final da estrutura de arquivos, links internos do `README.md` e limpeza dos contêineres de teste (`docker compose down -v`).