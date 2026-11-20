const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const user = await userService.create(req.validated.body);
  res.status(201).json(user);
});

const getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.validated.params.id);
  res.status(200).json(user);
});

const update = asyncHandler(async (req, res) => {
  await userService.update(req.validated.params.id, req.validated.body);
  res.status(204).send();
});

const remove = asyncHandler(async (req, res) => {
  await userService.remove(req.validated.params.id);
  res.status(204).send();
});

const token = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body);
  res.status(200).json(result);
});

module.exports = { create, getById, update, remove, token };
