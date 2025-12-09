import bcrypt from 'bcryptjs';
import { supabase } from '../../libs/supabase.js';
import { apiError } from '../../utils/response.js';
export const authenticateAdmin = async (email, password) => {
  const { data, error } = await supabase
    .from('admins')
    .select('id, name, email, password')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new apiError(401, 'Invalid credentials');
  const valid = await bcrypt.compare(password, data.password);
  if (!valid) throw new apiError(401, 'Invalid credentials');
  return { id: data.id, name: data.name, email: data.email };
};
export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  const { data, error } = await supabase
    .from('admins')
    .select('password')
    .eq('id', adminId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new apiError(404, 'Admin not found');
  const valid = await bcrypt.compare(currentPassword, data.password);
  if (!valid) throw new apiError(400, 'Current password is incorrect');
  const hashed = await bcrypt.hash(newPassword, 12);
  const { error: updateError } = await supabase
    .from('admins')
    .update({ password: hashed })
    .eq('id', adminId);
  if (updateError) throw updateError;
};
