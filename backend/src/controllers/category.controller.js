const categoryService = require('../services/category.service');
const asyncHandler = require('../utils/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const result = await categoryService.search(req.validated.query);
  res.status(200).json(result);
});

const getById = asyncHandler(async (req, res) => {
  const category = await categoryService.getById(req.validated.params.id);
  res.status(200).json(category);
});

const create = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.validated.body);
  res.status(201).json(category);
});

const update = asyncHandler(async (req, res) => {
  await categoryService.update(req.validated.params.id, req.validated.body);
  res.status(204).send();
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.validated.params.id);
  res.status(204).send();
});

module.exports = { search, getById, create, update, remove };
