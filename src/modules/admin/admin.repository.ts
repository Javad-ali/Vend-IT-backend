import { supabase } from '../../libs/supabase.js';
const sumPayments = async () => {
    const { data, error } = await supabase.from('payments').select('amount');
    if (error)
        throw error;
    return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
};
export const getDashboardMetrics = async () => {
    const [totalUsers, activeUsers, totalRevenue, totalOrders, activeMachines] = await Promise.all([
        supabase.from('users').select('id', { head: true, count: 'exact' }),
        supabase
            .from('users')
            .select('id', { head: true, count: 'exact' })
            .eq('status', 1),
        sumPayments(),
        supabase.from('payments').select('id', { head: true, count: 'exact' }),
        supabase.from('machine').select('u_id', { head: true, count: 'exact' })
    ]);
    return {
        totalUsers: totalUsers.count ?? 0,
        activeUsers: activeUsers.count ?? 0,
        totalRevenue: totalRevenue,
        totalOrders: totalOrders.count ?? 0,
        activeMachines: activeMachines.count ?? 0
    };
};
export const listUsers = async () => {
    const { data, error } = await supabase
        .from('users')
        .select(`id,
       first_name,
       last_name,
       email,
       phone_number,
       user_profile,
       country,
       dob,
       is_otp_verify,
       status,
       created_at`)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
};
export const removeUser = async (userId) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error)
        throw error;
};
export const setUserStatus = async (userId, status) => {
    const { error } = await supabase.from('users').update({ status }).eq('id', userId);
    if (error)
        throw error;
};
export const getUserProfile = async (userId) => {
    const { data, error } = await supabase
        .from('users')
        .select(`id,
       first_name,
       last_name,
       email,
       phone_number,
       user_profile,
       country,
       dob,
       is_otp_verify,
       status,
       created_at,
       wallet:wallet(balance),
       loyalty:user_loyality_points(points)`)
        .eq('id', userId)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
export const getUserPayments = async (userId) => {
    const { data, error } = await supabase
        .from('payments')
        .select(`id,
       charge_id,
       amount,
       created_at,
       transaction_id,
       machine:machine_u_id (
         machine_tag,
         location_address
       )`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
};
export const listMachines = async () => {
    const { data, error } = await supabase
        .from('machine')
        .select(`u_id,
       machine_tag,
       location_address,
       machine_image_url,
       machine_operation_state,
       last_machine_status,
       machine_qrcode,
       created_at`)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
};
export const listMachineProducts = async (machineUId) => {
    const { data, error } = await supabase
        .from('machine_slots')
        .select(`
      slot_number,
      quantity,
      max_quantity,
      product:product_u_id (
        product_u_id,
        description,
        product_image_url,
        brand_name,
        category:category_id (category_name)
      )
    `)
        .eq('machine_u_id', machineUId);
    if (error)
        throw error;
    return data ?? [];
};
export const getProduct = async (productUId) => {
    const { data, error } = await supabase
        .from('product')
        .select(`
      product_u_id,
      brand_name,
      description,
      product_image_url,
      product_detail_image_url,
      unit_price,
      cost_price,
      category:category_id (category_name),
      metadata
    `)
        .eq('product_u_id', productUId)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
export const listProducts = async () => {
    const { data, error } = await supabase
        .from('machine_slots')
        .select(`
      machine:machine_u_id (machine_tag),
      product:product_u_id (
        product_u_id,
        description,
        brand_name,
        product_image_url
      ),
      quantity
    `)
        .limit(10);
    if (error)
        throw error;
    return data ?? [];
};
export const listOrders = async () => {
    const { data, error } = await supabase
        .from('payments')
        .select(`
      id,
      amount,
      payment_method,
      status,
      created_at,
      machine:machine_u_id(machine_tag),
      user:users!payments_user_id_fkey(first_name, last_name)
    `)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
};
export const getOrder = async (orderId) => {
    const { data, error } = await supabase
        .from('payments')
        .select(`
      id,
      amount,
      payment_method,
      status,
      created_at,
      charge_id,
      machine:machine_u_id(machine_tag, machine_image_url, location_address),
      user:users!payments_user_id_fkey(first_name, last_name, phone_number, user_profile)
    `)
        .eq('id', orderId)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
export const listOrderProducts = async (orderId) => {
    const { data, error } = await supabase
        .from('payment_products')
        .select(`
      quantity,
      dispensed_quantity,
      product:product_u_id (
        product_u_id,
        description,
        product_image_url,
        cost_price
      )
    `)
        .eq('payment_id', orderId);
    if (error)
        throw error;
    return data ?? [];
};
export const listFeedback = async () => {
    const { data, error } = await supabase
        .from('contact_us')
        .select(`
      id,
      subject,
      message,
      created_at,
      user:users!contact_us_user_id_fkey(phone_number, email)
    `)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
};
