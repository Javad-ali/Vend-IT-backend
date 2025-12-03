import path from 'node:path';
import { nanoid } from 'nanoid';
import { supabase } from '../../libs/supabase.js';
import { apiError, ok } from '../../utils/response.js';
import { createCategory, getAdminById, getCategoryById, listCategories, updateAdminProfileInDb, updateCategory } from './admin.profile.repository.js';
const ADMIN_BUCKET = 'admin';
const CATEGORY_BUCKET = 'category-icons';
const buildAdminAvatarUrl = (avatarPath) => {
    if (!avatarPath)
        return null;
    const base = process.env.CDN_BASE_URL ?? '';
    return `${base}/admin/${avatarPath}`;
};
const buildCategoryIconUrl = (iconPath) => {
    if (!iconPath)
        return null;
    const base = process.env.CDN_BASE_URL ?? '';
    return `${base}/category-icons/${iconPath}`;
};
const uploadFile = async ({ bucket, file, prefix }) => {
    if (!file)
        return null;
    const ext = path.extname(file.originalname) || '.png';
    const objectKey = `${prefix}-${nanoid(8)}${ext}`;
    const { error } = await supabase.storage
        .from(bucket)
        .upload(objectKey, file.buffer, {
        contentType: file.mimetype,
        upsert: true
    });
    if (error)
        throw new apiError(400, 'File upload failed', error.message);
    return objectKey;
};
export const getAdminProfile = async (adminId) => {
    const admin = await getAdminById(adminId);
    if (!admin)
        throw new apiError(404, 'Admin not found');
    return ok({ ...admin, avatar_url: buildAdminAvatarUrl(admin.avatar_path ?? null) }, 'Profile fetched');
};
export const updateAdminProfile = async (adminId, payload) => {
    const admin = await getAdminById(adminId);
    if (!admin)
        throw new apiError(404, 'Admin not found');
    let avatarPath = admin.avatar_path ?? null;
    if (payload.file) {
        avatarPath = await uploadFile({
            bucket: ADMIN_BUCKET,
            file: payload.file,
            prefix: adminId
        });
    }
    const updated = await updateAdminProfileInDb(adminId, {
        name: payload.name,
        avatarPath
    });
    return ok({ ...updated, avatar_url: buildAdminAvatarUrl(updated?.avatar_path ?? null) }, 'Profile updated');
};
export const getAdminCategories = async () => {
    const rows = await listCategories();
    return rows.map(row => ({
        id: row.id,
        name: row.category_name,
        description: row.description,
        icon_url: buildCategoryIconUrl(row.icon_path ?? null),
        created_at: row.created_at
    }));
};
export const createAdminCategory = async (payload) => {
    const iconPath = await uploadFile({
        bucket: CATEGORY_BUCKET,
        file: payload.file,
        prefix: payload.name.toLowerCase().replace(/\s+/g, '-')
    });
    const category = await createCategory({
        name: payload.name,
        description: payload.description,
        iconPath
    });
    return ok({
        ...category,
        icon_url: buildCategoryIconUrl(category?.icon_path ?? null)
    }, 'Category created');
};
export const updateAdminCategory = async (id, payload) => {
    const existing = await getCategoryById(id);
    if (!existing)
        throw new apiError(404, 'Category not found');
    let iconPath = existing.icon_path ?? null;
    if (payload.file) {
        iconPath = await uploadFile({
            bucket: CATEGORY_BUCKET,
            file: payload.file,
            prefix: payload.name.toLowerCase().replace(/\s+/g, '-')
        });
    }
    const updated = await updateCategory(id, {
        name: payload.name,
        description: payload.description,
        iconPath
    });
    return ok({
        ...updated,
        icon_url: buildCategoryIconUrl(updated?.icon_path ?? null)
    }, 'Category updated');
};
