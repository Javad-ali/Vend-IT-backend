import { supabase } from '../../libs/supabase.js';
export const getAdminById = async (id) => {
  const { data, error } = await supabase
    .from('admins')
    .select('id, name, email, avatar_path')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const updateAdminProfileInDb = async (id, payload) => {
  const { data, error } = await supabase
    .from('admins')
    .update({
      name: payload.name,
      avatar_path: payload.avatarPath ?? null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, name, email, avatar_path')
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const listCategories = async () => {
  const { data, error } = await supabase
    .from('category')
    .select('id, category_name, description, icon_path, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
export const createCategory = async (payload) => {
  const { data, error } = await supabase
    .from('category')
    .insert({
      category_name: payload.name,
      description: payload.description ?? null,
      icon_path: payload.iconPath ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id, category_name, description, icon_path')
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const getCategoryById = async (id) => {
  const { data, error } = await supabase
    .from('category')
    .select('id, category_name, description, icon_path')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const updateCategory = async (id, payload) => {
  const { data, error } = await supabase
    .from('category')
    .update({
      category_name: payload.name,
      description: payload.description ?? null,
      icon_path: payload.iconPath ?? null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, category_name, description, icon_path')
    .maybeSingle();
  if (error) throw error;
  return data;
};
