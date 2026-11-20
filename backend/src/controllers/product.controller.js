const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const result = await productService.search(req.validated.query);
  res.status(200).json(result);
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.validated.params.id);
  res.status(200).json(product);
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.validated.body);
  res.status(201).json(product);
});

const update = asyncHandler(async (req, res) => {
  await productService.update(req.validated.params.id, req.validated.body);
  res.status(204).send();
});

const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.validated.params.id);
  res.status(204).send();
});

module.exports = { search, getById, create, update, remove };
