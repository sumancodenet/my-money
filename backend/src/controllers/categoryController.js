import { Category } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

export const listCategories = asyncHandler(async (req, res) => {
  const own = await Category.findAll({ where: { userId: req.user.id }, order: [['name', 'ASC']] });
  const defaults = await Category.findAll({ where: { userId: null }, order: [['name', 'ASC']] });
  sendSuccess(res, 200, 'Categories fetched', [...defaults, ...own]);
});

export const createCategory = asyncHandler(async (req, res) => {
  const cat = await Category.create({ ...req.body, userId: req.user.id, isDefault: false });
  sendSuccess(res, 201, 'Category created', cat);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!cat) throw new ApiError(404, 'Category not found.');
  await cat.update(req.body);
  sendSuccess(res, 200, 'Category updated', cat);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!cat) throw new ApiError(404, 'Category not found.');
  await cat.destroy();
  sendSuccess(res, 200, 'Category deleted');
});
