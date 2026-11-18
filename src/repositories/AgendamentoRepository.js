export class AgendamentoRepository {
  constructor(db) {
    this.db = db;
  }

  #mapearLinha(row) {
    if (!row) return null;
    return {
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      responsavel: row.responsavel,
      inicio: row.inicio,
      fim: row.fim,
      status: row.status,
      criadoEm: row.criado_em,
    };
  }

  async criar({ titulo, descricao = null, responsavel, inicio, fim }) {
    const query = `
      INSERT INTO agendamentos (titulo, descricao, responsavel, inicio, fim)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, titulo, descricao, responsavel, inicio, fim, status, criado_em
    `;
    const values = [titulo, descricao, responsavel, inicio, fim];
    const { rows } = await this.db.query(query, values);
    return this.#mapearLinha(rows[0]);
  }

  async listar({ responsavel, status } = {}) {
    const condicoes = [];
    const values = [];

    if (responsavel) {
      values.push(responsavel);
      condicoes.push(`responsavel ILIKE $${values.length}`);
    }

    if (status) {
      values.push(status);
      condicoes.push(`status = $${values.length}`);
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    const query = `
      SELECT id, titulo, descricao, responsavel, inicio, fim, status, criado_em
      FROM agendamentos
      ${where}
      ORDER BY inicio ASC
    `;

    const { rows } = await this.db.query(query, values);
    return rows.map((row) => this.#mapearLinha(row));
  }

  async buscarPorId(id) {
    const query = `
      SELECT id, titulo, descricao, responsavel, inicio, fim, status, criado_em
      FROM agendamentos
      WHERE id = $1
    `;
    const { rows } = await this.db.query(query, [id]);
    return this.#mapearLinha(rows[0]);
  }

  async buscarConflitos({ responsavel, inicio, fim, ignorarId = null }) {
    const values = [responsavel, inicio, fim];
    let filtroId = '';

    if (ignorarId !== null) {
      values.push(ignorarId);
      filtroId = `AND id <> $${values.length}`;
    }

    const query = `
      SELECT id, titulo, descricao, responsavel, inicio, fim, status, criado_em
      FROM agendamentos
      WHERE responsavel = $1
        AND status = 'AGENDADO'
        AND inicio < $3
        AND fim > $2
        ${filtroId}
      ORDER BY inicio ASC
    `;

    const { rows } = await this.db.query(query, values);
    return rows.map((row) => this.#mapearLinha(row));
  }

  async atualizar(id, { titulo, descricao, responsavel, inicio, fim, status }) {
    const query = `
      UPDATE agendamentos
      SET titulo = $1,
          descricao = $2,
          responsavel = $3,
          inicio = $4,
          fim = $5,
          status = $6
      WHERE id = $7
      RETURNING id, titulo, descricao, responsavel, inicio, fim, status, criado_em
    `;
    const values = [titulo, descricao, responsavel, inicio, fim, status, id];
    const { rows } = await this.db.query(query, values);
    return this.#mapearLinha(rows[0]);
  }

  async remover(id) {
    const query = 'DELETE FROM agendamentos WHERE id = $1 RETURNING id';
    const { rowCount } = await this.db.query(query, [id]);
    return rowCount > 0;
  }
}
