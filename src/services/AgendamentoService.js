import { AppError } from '../errors/AppError.js';

const STATUS_PERMITIDOS = ['AGENDADO', 'CANCELADO', 'CONCLUIDO'];

export class AgendamentoService {
  constructor(agendamentoRepository) {
    this.repository = agendamentoRepository;
  }

  #validarDatas(inicio, fim) {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) {
      throw new AppError('Datas de inicio e fim devem estar em formato ISO valido.', 400, 'INVALID_DATE');
    }

    if (dataFim <= dataInicio) {
      throw new AppError('A data de fim deve ser posterior a data de inicio.', 400, 'INVALID_INTERVAL');
    }

    return { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() };
  }

  async criar({ titulo, descricao = null, responsavel, inicio, fim }) {
    if (!titulo || !titulo.trim()) {
      throw new AppError('O titulo do agendamento e obrigatorio.', 400, 'VALIDATION_ERROR');
    }
    if (!responsavel || !responsavel.trim()) {
      throw new AppError('O responsavel pelo agendamento e obrigatorio.', 400, 'VALIDATION_ERROR');
    }

    const { dataInicio, dataFim } = this.#validarDatas(inicio, fim);

    const conflitos = await this.repository.buscarConflitos({
      responsavel: responsavel.trim(),
      inicio: dataInicio,
      fim: dataFim,
    });

    if (conflitos.length > 0) {
      throw new AppError(
        'Ja existe um agendamento ativo para este responsavel neste intervalo de horario.',
        409,
        'SCHEDULE_CONFLICT'
      );
    }

    return this.repository.criar({
      titulo: titulo.trim(),
      descricao: descricao ? descricao.trim() : null,
      responsavel: responsavel.trim(),
      inicio: dataInicio,
      fim: dataFim,
    });
  }

  async listar(filtros = {}) {
    if (filtros.status && !STATUS_PERMITIDOS.includes(filtros.status)) {
      throw new AppError(
        `Status invalido. Valores permitidos: ${STATUS_PERMITIDOS.join(', ')}.`,
        400,
        'INVALID_STATUS'
      );
    }
    return this.repository.listar(filtros);
  }

  async buscarPorId(id) {
    const agendamento = await this.repository.buscarPorId(id);
    if (!agendamento) {
      throw new AppError('Agendamento nao encontrado.', 404, 'NOT_FOUND');
    }
    return agendamento;
  }

  async atualizar(id, dados) {
    const atual = await this.buscarPorId(id);

    const titulo = dados.titulo !== undefined ? dados.titulo.trim() : atual.titulo;
    const descricao = dados.descricao !== undefined ? dados.descricao : atual.descricao;
    const responsavel = dados.responsavel !== undefined ? dados.responsavel.trim() : atual.responsavel;
    const status = dados.status !== undefined ? dados.status : atual.status;

    if (!titulo) {
      throw new AppError('O titulo do agendamento e obrigatorio.', 400, 'VALIDATION_ERROR');
    }
    if (!responsavel) {
      throw new AppError('O responsavel pelo agendamento e obrigatorio.', 400, 'VALIDATION_ERROR');
    }
    if (!STATUS_PERMITIDOS.includes(status)) {
      throw new AppError(
        `Status invalido. Valores permitidos: ${STATUS_PERMITIDOS.join(', ')}.`,
        400,
        'INVALID_STATUS'
      );
    }

    const { dataInicio, dataFim } = this.#validarDatas(
      dados.inicio ?? atual.inicio,
      dados.fim ?? atual.fim
    );

    if (status === 'AGENDADO') {
      const conflitos = await this.repository.buscarConflitos({
        responsavel,
        inicio: dataInicio,
        fim: dataFim,
        ignorarId: id,
      });

      if (conflitos.length > 0) {
        throw new AppError(
          'Ja existe um agendamento ativo para este responsavel neste intervalo de horario.',
          409,
          'SCHEDULE_CONFLICT'
        );
      }
    }

    return this.repository.atualizar(id, {
      titulo,
      descricao,
      responsavel,
      inicio: dataInicio,
      fim: dataFim,
      status,
    });
  }

  async remover(id) {
    await this.buscarPorId(id);
    await this.repository.remover(id);
  }
}
