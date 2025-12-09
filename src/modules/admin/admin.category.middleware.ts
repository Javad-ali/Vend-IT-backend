import { getCategoryById } from './admin.profile.repository.js';
import { apiError } from '../../utils/response.js';
export const loadCategory = async (req, res, next) => {
  const category = await getCategoryById(req.params.categoryId);
  if (!category) {
    return next(new apiError(404, 'Category not found'));
  }
  req.category = category;
  return next();
};
