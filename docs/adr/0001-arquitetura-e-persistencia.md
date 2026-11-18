# ADR 0001: Arquitetura em Camadas (Repository Pattern) e Persistência em PostgreSQL

- **Status:** Aceito
- **Data:** 2026-11-18
- **Autor:** Vinícius Da Silva Noronha

## Contexto
O Projeto B consiste em uma API REST de domínio único (**Agenda**) responsável pelo gerenciamento de compromissos e prevenção de conflitos de horários. A rubrica técnica exige aderência aos princípios SOLID, uso explícito de um Design Pattern (Repository Pattern), banco de dados inicializável com um único comando via Docker Compose e alta testabilidade (testes unitários isolados e testes de integração).

## Decisão
1. **Arquitetura em Camadas com Repository Pattern:** Separar a aplicação em `Routes/Controllers` (camada HTTP), `Services` (regras de negócio, como detecção de conflito de horários) e `Repositories` (acesso a dados encapsulado por contrato).
2. **PostgreSQL 16 com SQL explícito (`pg`):** Utilizar banco relacional com restrições nativas (`CHECK (fim > inicio)` e `TIMESTAMPTZ`) e queries parametrizadas na camada de repositório.

## Alternativas Descartadas

### 1. Banco de Dados NoSQL (MongoDB)
- **Motivo do descarte:** O domínio de agendamento exige integridade forte sobre intervalos temporais (`inicio` e `fim`) e consultas frequentes de sobreposição de horários. O PostgreSQL oferece suporte nativo robusto a `TIMESTAMPTZ`, restrições `CHECK` no nível do schema e transações ACID sem depender exclusivamente de validações na aplicação.

### 2. Uso de ORM completo (Prisma ou TypeORM)
- **Motivo do descarte:** Para um domínio único com uma tabela principal (`agendamentos`), um ORM adicionaria camadas extras de geração de código e abstração desnecessárias. O uso do driver `pg` com SQL explícito dentro do `AgendamentoRepository` mantém o código enxuto, facilita o controle exato das consultas de conflito de agenda e evidencia claramente a separação do Repository Pattern exigida na avaliação.

### 3. Arquitetura MVC acoplada (regras de negócio dentro dos Controllers)
- **Motivo do descarte:** Misturar acesso ao banco e validação de conflitos nas rotas HTTP violaria o Princípio da Responsabilidade Única (SRP) e obrigaria a subir o servidor HTTP e o banco de dados para testar regras simples de negócio. Com a camada `Service` recebendo o `Repository` por injeção de dependência, os testes unitários rodam em milissegundos usando repositórios em memória (*mocks/fakes*).

## Consequências
- **Positivas:** Testes unitários rápidos e isolados na camada de serviço; troca ou evolução do banco encapsulada no repositório; esquema SQL auditável e versionado na pasta `sql/`.
- **Negativas (Trade-offs):** Exige escrever manualmente o mapeamento entre linhas do banco (`snake_case`) e objetos da aplicação (`camelCase`) na camada de repositório.
