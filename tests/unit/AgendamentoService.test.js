import { describe, it, expect, beforeEach } from 'vitest';
import { AgendamentoService } from '../../src/services/AgendamentoService.js';
import { AppError } from '../../src/errors/AppError.js';

class InMemoryAgendamentoRepository {
  constructor() {
    this.items = [];
    this.nextId = 1;
  }

  async criar(dados) {
    const novo = {
      id: this.nextId++,
      ...dados,
      status: 'AGENDADO',
      criadoEm: new Date().toISOString(),
    };
    this.items.push(novo);
    return novo;
  }

  async listar({ responsavel, status } = {}) {
    return this.items.filter((item) => {
      if (responsavel && !item.responsavel.toLowerCase().includes(responsavel.toLowerCase())) {
        return false;
      }
      if (status && item.status !== status) {
        return false;
      }
      return true;
    });
  }

  async buscarPorId(id) {
    return this.items.find((item) => item.id === id) || null;
  }

  async buscarConflitos({ responsavel, inicio, fim, ignorarId = null }) {
    const reqInicio = new Date(inicio).getTime();
    const reqFim = new Date(fim).getTime();

    return this.items.filter((item) => {
      if (ignorarId !== null && item.id === ignorarId) return false;
      if (item.responsavel !== responsavel || item.status !== 'AGENDADO') return false;

      const itemInicio = new Date(item.inicio).getTime();
      const itemFim = new Date(item.fim).getTime();
      return itemInicio < reqFim && itemFim > reqInicio;
    });
  }

  async atualizar(id, dados) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    this.items[index] = { ...this.items[index], ...dados };
    return this.items[index];
  }

  async remover(id) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }
}

describe('AgendamentoService (Unitario)', () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = new InMemoryAgendamentoRepository();
    service = new AgendamentoService(repository);
  });

  it('deve criar um agendamento valido com sucesso', async () => {
    const criado = await service.criar({
      titulo: 'Sprint Review',
      descricao: 'Apresentacao das entregas',
      responsavel: 'Vinicius',
      inicio: '2026-11-25T10:00:00Z',
      fim: '2026-11-25T11:00:00Z',
    });

    expect(criado.id).toBe(1);
    expect(criado.status).toBe('AGENDADO');
    expect(criado.titulo).toBe('Sprint Review');
  });

  it('deve rejeitar agendamento sem titulo ou responsavel (400)', async () => {
    await expect(
      service.criar({
        titulo: '   ',
        responsavel: 'Vinicius',
        inicio: '2026-11-25T10:00:00Z',
        fim: '2026-11-25T11:00:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });

    await expect(
      service.criar({
        titulo: 'Reuniao',
        responsavel: '',
        inicio: '2026-11-25T10:00:00Z',
        fim: '2026-11-25T11:00:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });

  it('deve rejeitar datas invalidas ou fim menor/igual ao inicio (400)', async () => {
    await expect(
      service.criar({
        titulo: 'Reuniao',
        responsavel: 'Vinicius',
        inicio: 'data-invalida',
        fim: '2026-11-25T11:00:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_DATE' });

    await expect(
      service.criar({
        titulo: 'Reuniao',
        responsavel: 'Vinicius',
        inicio: '2026-11-25T11:00:00Z',
        fim: '2026-11-25T10:00:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_INTERVAL' });
  });

  it('deve bloquear conflito de horario para o mesmo responsavel (409)', async () => {
    await service.criar({
      titulo: 'Reuniao 1',
      responsavel: 'Vinicius',
      inicio: '2026-11-25T14:00:00Z',
      fim: '2026-11-25T15:00:00Z',
    });

    await expect(
      service.criar({
        titulo: 'Reuniao 2',
        responsavel: 'Vinicius',
        inicio: '2026-11-25T14:30:00Z',
        fim: '2026-11-25T15:30:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 409, code: 'SCHEDULE_CONFLICT' });
  });

  it('deve permitir mesmo horario para responsaveis diferentes ou apos cancelamento', async () => {
    const primeiro = await service.criar({
      titulo: 'Reuniao 1',
      responsavel: 'Vinicius',
      inicio: '2026-11-25T14:00:00Z',
      fim: '2026-11-25T15:00:00Z',
    });

    const outroResponsavel = await service.criar({
      titulo: 'Reuniao Maria',
      responsavel: 'Maria',
      inicio: '2026-11-25T14:00:00Z',
      fim: '2026-11-25T15:00:00Z',
    });
    expect(outroResponsavel.id).toBe(2);

    await service.atualizar(primeiro.id, { status: 'CANCELADO' });

    const aposCancelamento = await service.criar({
      titulo: 'Reuniao Substituta',
      responsavel: 'Vinicius',
      inicio: '2026-11-25T14:00:00Z',
      fim: '2026-11-25T15:00:00Z',
    });
    expect(aposCancelamento.id).toBe(3);
  });

  it('deve lancar 404 ao buscar, atualizar ou remover ID inexistente', async () => {
    await expect(service.buscarPorId(999)).rejects.toBeInstanceOf(AppError);
    await expect(service.buscarPorId(999)).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.remover(999)).rejects.toMatchObject({ statusCode: 404 });
  });
});
