CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descricao TEXT,
    responsavel VARCHAR(100) NOT NULL,
    inicio TIMESTAMPTZ NOT NULL,
    fim TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AGENDADO',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_intervalo_valido CHECK (fim > inicio),
    CONSTRAINT chk_status_valido CHECK (status IN ('AGENDADO', 'CANCELADO', 'CONCLUIDO'))
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_periodo ON agendamentos (inicio, fim);
