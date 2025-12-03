import multer from 'multer';
import { createAdminCategory, getAdminCategories, getAdminProfile, updateAdminCategory, updateAdminProfile } from './admin.profile.service.js';
const upload = multer({ storage: multer.memoryStorage() });
export const avatarUpload = upload.single('avatar');
export const categoryUpload = upload.single('icon');
export const renderProfilePage = async (req, res) => {
    const profile = await getAdminProfile(req.session.admin.id);
    return res.render('admin/profile.njk', {
        title: 'Admin Profile',
        profile: profile.data
    });
};
export const handleProfileUpdate = async (req, res) => {
    try {
        await updateAdminProfile(req.session.admin.id, {
            name: req.body.name,
            file: req.file ?? undefined
        });
        res.flash('success', 'Profile updated successfully');
    }
    catch (error) {
        res.flash('error', error.message);
    }
    return res.redirect('/admin/profile');
};
export const renderCategoryList = async (_req, res) => {
    const categories = await getAdminCategories();
    return res.render('admin/category-list.njk', {
        title: 'Categories',
        categories
    });
};
export const renderCategoryForm = async (req, res) => {
    const category = req.category ?? null;
    return res.render('admin/category-form.njk', {
        title: category ? 'Edit Category' : 'Create Category',
        category
    });
};
export const handleCreateCategory = async (req, res) => {
    try {
        await createAdminCategory({
            name: req.body.name,
            description: req.body.description,
            file: req.file ?? undefined
        });
        res.flash('success', 'Category created successfully');
        return res.redirect('/admin/categories');
    }
    catch (error) {
        res.flash('error', error.message);
        return res.redirect('/admin/categories/create');
    }
};
export const handleUpdateCategory = async (req, res) => {
    try {
        await updateAdminCategory(req.params.categoryId, {
            name: req.body.name,
            description: req.body.description,
            file: req.file ?? undefined
        });
        res.flash('success', 'Category updated successfully');
    }
    catch (error) {
        res.flash('error', error.message);
    }
    return res.redirect('/admin/categories');
};
