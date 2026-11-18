import { AppError } from '../errors/AppError.js';

export class AgendamentoController {
  constructor(agendamentoService) {
    this.service = agendamentoService;
  }

  #parseId(rawId) {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('ID do agendamento deve ser um numero inteiro positivo.', 400, 'INVALID_ID');
    }
    return id;
  }

  criar = async (req, res, next) => {
    try {
      const criado = await this.service.criar(req.body);
      return res.status(201).json(criado);
    } catch (err) {
      return next(err);
    }
  };

  listar = async (req, res, next) => {
    try {
      const { responsavel, status } = req.query;
      const lista = await this.service.listar({ responsavel, status });
      return res.status(200).json(lista);
    } catch (err) {
      return next(err);
    }
  };

  buscarPorId = async (req, res, next) => {
    try {
      const id = this.#parseId(req.params.id);
      const item = await this.service.buscarPorId(id);
      return res.status(200).json(item);
    } catch (err) {
      return next(err);
    }
  };

  atualizar = async (req, res, next) => {
    try {
      const id = this.#parseId(req.params.id);
      const atualizado = await this.service.atualizar(id, req.body);
      return res.status(200).json(atualizado);
    } catch (err) {
      return next(err);
    }
  };

  remover = async (req, res, next) => {
    try {
      const id = this.#parseId(req.params.id);
      await this.service.remover(id);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  };
}
