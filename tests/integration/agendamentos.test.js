import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../../src/config/database.js';
import { createApp } from '../../src/app.js';

const app = createApp(pool);

describe('API Agendamentos (Integracao HTTP + PostgreSQL)', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE agendamentos RESTART IDENTITY');
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE agendamentos RESTART IDENTITY');
    await pool.end();
  });

  it('GET /health e GET /metrics devem responder com status 200', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'ok', database: 'connected' });

    const metrics = await request(app).get('/metrics');
    expect(metrics.status).toBe(200);
    expect(metrics.text).toContain('http_request_duration_seconds');
  });

  it('deve executar o ciclo completo CRUD de um agendamento', async () => {
    // 1. Criar (201)
    const createRes = await request(app).post('/agendamentos').send({
      titulo: 'Entrega Final',
      descricao: 'Validacao com Supertest',
      responsavel: 'Vinicius',
      inicio: '2026-12-01T09:00:00Z',
      fim: '2026-12-01T10:00:00Z',
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(1);

    // 2. Listar com filtro (200)
    const listRes = await request(app).get('/agendamentos?responsavel=Vinicius&status=AGENDADO');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    // 3. Buscar por ID (200)
    const getRes = await request(app).get('/agendamentos/1');
    expect(getRes.status).toBe(200);
    expect(getRes.body.titulo).toBe('Entrega Final');

    // 4. Atualizar (200)
    const updateRes = await request(app).put('/agendamentos/1').send({
      titulo: 'Entrega Final Atualizada',
      status: 'CONCLUIDO',
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.titulo).toBe('Entrega Final Atualizada');
    expect(updateRes.body.status).toBe('CONCLUIDO');

    // 5. Remover (204)
    const deleteRes = await request(app).delete('/agendamentos/1');
    expect(deleteRes.status).toBe(204);

    // 6. Confirmar remocao (404)
    const afterDelete = await request(app).get('/agendamentos/1');
    expect(afterDelete.status).toBe(404);
  });

  it('deve retornar 409 ao tentar criar agendamento conflitante e 400 para ID invalido', async () => {
    await request(app).post('/agendamentos').send({
      titulo: 'Bloco 1',
      responsavel: 'Vinicius',
      inicio: '2026-12-02T14:00:00Z',
      fim: '2026-12-02T16:00:00Z',
    });

    const conflictRes = await request(app).post('/agendamentos').send({
      titulo: 'Bloco 2',
      responsavel: 'Vinicius',
      inicio: '2026-12-02T15:00:00Z',
      fim: '2026-12-02T17:00:00Z',
    });
    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error).toBe('SCHEDULE_CONFLICT');

    const invalidIdRes = await request(app).get('/agendamentos/abc');
    expect(invalidIdRes.status).toBe(400);
    expect(invalidIdRes.body.error).toBe('INVALID_ID');
  });
});
