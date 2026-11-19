# API Agenda — Projeto Final

API RESTful de domínio único (**Agenda**) desenvolvida como projeto final do programa **Geração Tech**, no curso **Formação em Fullcycle – Engenharia de Software**.

O sistema gerencia compromissos e garante integridade temporal por meio de validações de intervalo e bloqueio automático de sobreposição de horários por responsável, estruturado com arquitetura em camadas, princípios **SOLID**, **Repository Pattern**, observabilidade e testes automatizados.

---

## Sumário

1. [Visão Geral e Regras de Negócio](#visão-geral-e-regras-de-negócio)
2. [Tecnologias Implementadas](#tecnologias-implementadas)
3. [Arquitetura e Boas Práticas](#arquitetura-e-boas-práticas)
4. [Organização de Pastas](#organização-de-pastas)
5. [Como Executar o Projeto](#como-executar-o-projeto)
6. [Documentação da API](#documentação-da-api)
7. [Testes Automatizados e Cobertura](#testes-automatizados-e-cobertura)
8. [Observabilidade](#observabilidade)
9. [Autor](#autor)

---

## Visão Geral e Regras de Negócio

- **Validação Temporal:** Todo agendamento exige datas em formato ISO-8601 válidas com `fim > inicio` (garantido tanto na camada de serviço quanto por restrição `CHECK` no PostgreSQL).
- **Prevenção de Conflitos (`HTTP 409`):** Impede o cadastro ou reagendamento de compromissos ativos (`AGENDADO`) que se sobreponham no intervalo `[inicio, fim)` para o mesmo responsável. Agendamentos adjacentes (ex.: `14:00–15:00` e `15:00–16:00`) ou horários previamente cancelados (`CANCELADO`) são permitidos.
- **Ciclo de Vida de Status:** Suporta os estados `AGENDADO`, `CANCELADO` e `CONCLUIDO`.
- **Contratos de Erro Padronizados:** Respostas de erro estruturadas com código semântico (`VALIDATION_ERROR`, `INVALID_DATE`, `INVALID_INTERVAL`, `INVALID_ID`, `NOT_FOUND`, `SCHEDULE_CONFLICT`).

---

## Tecnologias Implementadas

| Camada / Finalidade     | Tecnologia                                             |
| :---------------------- | :----------------------------------------------------- |
| **Runtime e Linguagem** | Node.js 20 (ES Modules)                                |
| **Framework HTTP**      | Express                                                |
| **Banco de Dados**      | PostgreSQL 16 (driver `pg` com queries parametrizadas) |
| **Logs Estruturados**   | Pino e `pino-http` (saída JSON)                        |
| **Métricas**            | `prom-client` (formato Prometheus)                     |
| **Testes e Cobertura**  | Vitest, `@vitest/coverage-v8` e Supertest              |
| **Contêineres**         | Docker e Docker Compose                                |

---

## Arquitetura e Boas Práticas

A aplicação segue uma **Arquitetura em Camadas** desacoplada com injeção explícita de dependências (`Database Pool -> Repository -> Service -> Controller -> Routes`):

- **Repository Pattern:** O `AgendamentoRepository` isola todas as queries SQL parametrizadas e traduz colunas do banco (`snake_case`) para objetos de domínio (`camelCase`).
- **Single Responsibility Principle (SRP):** Cada camada possui responsabilidade única — `Controller` lida apenas com HTTP, `Service` aplica regras de domínio e `Repository` gerencia persistência.
- **Dependency Inversion Principle (DIP):** O `AgendamentoService` recebe o repositório pelo construtor, permitindo substituir o PostgreSQL por um repositório _in-memory_ nos testes unitários.
- **Decisão Arquitetural Documentada (ADR):** Consulte [`docs/adr/0001-arquitetura-e-persistencia.md`](docs/adr/0001-arquitetura-e-persistencia.md) para detalhes sobre as escolhas técnicas e alternativas descartadas.
- **Registro de Prompts:** O histórico de direcionamentos técnicos utilizados por etapa e suas validações está documentado em [`docs/prompts/prompts-utilizados.md`](docs/prompts/prompts-utilizados.md).

---

## Organização de Pastas

```text
api-agenda/
├── docs/
│   ├── adr/
│   │   └── 0001-arquitetura-e-persistencia.md   # Registro de Decisão Arquitetural (ADR)
│   └── prompts/
│       └── prompts-utilizados.md                # Histórico de prompts e validações por PR
├── sql/
│   └── init.sql                                 # DDL de criação automática da tabela e índices
├── src/
│   ├── config/
│   │   ├── database.js                          # Pool de conexão PostgreSQL
│   │   ├── logger.js                            # Logger estruturado em JSON (Pino)
│   │   └── metrics.js                           # Coletor de métricas Prometheus
│   ├── controllers/
│   │   └── AgendamentoController.js             # Camada de entrada/saída HTTP
│   ├── errors/
│   │   └── AppError.js                          # Exceções de domínio tipadas
│   ├── middlewares/
│   │   ├── errorHandler.js                      # Tratamento global de exceções HTTP
│   │   └── metricsMiddleware.js                 # Histograma de duração e status por rota
│   ├── repositories/
│   │   └── AgendamentoRepository.js             # Persistência SQL isolada (Repository Pattern)
│   ├── routes/
│   │   └── agendamentoRoutes.js                 # Definição das rotas REST
│   ├── services/
│   │   └── AgendamentoService.js                # Regras de negócio e detecção de conflitos
│   ├── app.js                                   # Fábrica da aplicação Express (produção e testes)
│   └── server.js                                # Inicialização HTTP e Graceful Shutdown
├── tests/
│   ├── integration/
│   │   └── agendamentos.test.js                 # Testes HTTP integrados ao PostgreSQL
│   └── unit/
│       └── AgendamentoService.test.js           # Testes unitários isolados em memória
├── .dockerignore
├── .env.example                                 # Modelo de variáveis de ambiente
├── .gitignore
├── Dockerfile                                   # Imagem enxuta de produção (node:20-alpine)
├── docker-compose.yml                           # Orquestração API + PostgreSQL com healthcheck
├── package.json
└── README.md

Como Executar o Projeto
Opção 1: Execução Completa com Docker (Recomendado)

docker compose up --build -d

Verifique o status dos contêineres e a saúde da aplicação:

docker compose ps
curl http://localhost:3000/health

Para encerrar e remover os contêineres e volumes:

docker compose down -v

Opção 2: Execução Local (Desenvolvimento)
Instale as dependências:

Bash
npm install
Crie o arquivo .env a partir do exemplo e ajuste sua DATABASE_URL:

Bash
cp .env.example .env
Inicie o servidor em modo watch:

Bash
npm run dev


## Como Usar a API

### Endpoints Disponíveis

| Método | Rota | Descrição | Sucesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Verifica disponibilidade da API e conexão com o banco | `200 OK` |
| `GET` | `/metrics` | Expõe métricas de runtime e HTTP no formato Prometheus | `200 OK` |
| `POST` | `/agendamentos` | Cria um agendamento (bloqueia conflitos de horário com `409`) | `201 Created` |
| `GET` | `/agendamentos` | Lista agendamentos (filtros: `?responsavel=...&status=...`) | `200 OK` |
| `GET` | `/agendamentos/:id` | Consulta um agendamento específico pelo ID | `200 OK` |
| `PUT` | `/agendamentos/:id` | Atualiza título, descrição, horários ou status (`AGENDADO`, `CANCELADO`, `CONCLUIDO`) | `200 OK` |
| `DELETE` | `/agendamentos/:id` | Remove um agendamento | `204 No Content` |
```
