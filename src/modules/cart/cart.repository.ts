import { supabase } from '../../libs/supabase.js';
export const findSlot = async (machineId, slotNumber) => {
  const { data, error } = await supabase
    .from('machine_slots')
    .select(
      `
      slot_number,
      quantity,
      max_quantity,
      price,
      product:product_u_id (
        product_u_id,
        brand_name,
        description,
        unit_price,
        cost_price,
        product_image_url,
        product_detail_image_url,
        category_id
      )
    `
    )
    .eq('machine_u_id', machineId)
    .eq('slot_number', slotNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const upsertCartItem = async (payload) => {
  const { data, error } = await supabase
    .from('carts')
    .upsert(
      {
        user_id: payload.userId,
        machine_u_id: payload.machineId,
        slot_number: payload.slotNumber,
        product_u_id: payload.productId,
        quantity: payload.quantity,
        unit_price: payload.unitPrice
      },
      { onConflict: 'user_id,machine_u_id,slot_number,product_u_id' }
    )
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const getCart = async (userId) => {
  const { data, error } = await supabase
    .from('carts')
    .select(
      `
      id,
      quantity,
      unit_price,
      machine_u_id,
      slot_number,
      product:product_u_id (
        product_u_id,
        brand_name,
        description,
        product_image_url,
        unit_price,
        category:category_id (id, category_name)
      )
    `
    )
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
};
export const getCartItem = async (userId, cartId) => {
  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', cartId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const updateCartQuantity = async (cartId, quantity) => {
  const { data, error } = await supabase
    .from('carts')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', cartId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const deleteCartItem = async (userId, cartId) => {
  const { error } = await supabase.from('carts').delete().eq('user_id', userId).eq('id', cartId);
  if (error) throw error;
};
export const clearCart = async (userId) => {
  const { error } = await supabase.from('carts').delete().eq('user_id', userId);
  if (error) throw error;
};
