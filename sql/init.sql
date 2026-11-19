CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  responsavel VARCHAR(100) NOT NULL,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AGENDADO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_agendamentos_intervalo CHECK (fim > inicio),
  CONSTRAINT chk_agendamentos_status CHECK (status IN ('AGENDADO', 'CANCELADO', 'CONCLUIDO'))
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_responsavel_inicio
  ON agendamentos (responsavel, inicio, fim);
