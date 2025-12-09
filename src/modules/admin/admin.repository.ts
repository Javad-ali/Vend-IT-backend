import { supabase } from '../../libs/supabase.js';
const sumPayments = async () => {
  const { data, error } = await supabase.from('payments').select('amount');
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
};
export const getDashboardMetrics = async () => {
  const [totalUsers, activeUsers, totalRevenue, totalOrders, activeMachines] = await Promise.all([
    supabase.from('users').select('id', { head: true, count: 'exact' }),
    supabase.from('users').select('id', { head: true, count: 'exact' }).eq('status', 1),
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
export const listUsers = async (params?: {
  page?: number;
  limit?: number;
  status?: number;
  search?: string;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select(
      `id,
       first_name,
       last_name,
       email,
       phone_number,
       user_profile,
       country,
       dob,
       is_otp_verify,
       status,
       created_at`,
      { count: 'exact' }
    );

  // Apply filters
  if (params?.status !== undefined) {
    query = query.eq('status', params.status);
  }

  if (params?.search) {
    query = query.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone_number.ilike.%${params.search}%`
    );
  }

  // Apply pagination and sorting
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    }
  };
};

export const removeUser = async (userId) => {
  // First, update any users who have this user as their referrer (set to null)
  await supabase.from('users').update({ referrer_user_id: null }).eq('referrer_user_id', userId);

  // Now delete the user
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
};
export const setUserStatus = async (userId, status) => {
  const { error } = await supabase.from('users').update({ status }).eq('id', userId);
  if (error) throw error;
};
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select(
      `id,
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
       loyalty:user_loyality_points(points)`
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const getUserPayments = async (userId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `id,
       charge_id,
       amount,
       created_at,
       transaction_id,
       machine:machine_u_id (
         machine_tag,
         location_address
       )`
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
export const listMachines = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('machine')
    .select(
      `u_id,
       machine_tag,
       location_address,
       machine_image_url,
       machine_operation_state,
       last_machine_status,
       machine_qrcode,
       created_at`,
      { count: 'exact' }
    );

  if (params?.status) {
    query = query.eq('machine_operation_state', params.status);
  }

  if (params?.search) {
    query = query.or(
      `machine_tag.ilike.%${params.search}%,u_id.ilike.%${params.search}%,location_address.ilike.%${params.search}%`
    );
  }

  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    }
  };
};
export const listMachineProducts = async (machineUId) => {
  const { data, error } = await supabase
    .from('machine_slots')
    .select(
      `
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
    `
    )
    .eq('machine_u_id', machineUId);
  if (error) throw error;
  return data ?? [];
};
export const getProduct = async (productUId) => {
  const { data, error } = await supabase
    .from('product')
    .select(
      `
      product_u_id,
      brand_name,
      description,
      product_image_url,
      product_detail_image_url,
      unit_price,
      cost_price,
      category:category_id (category_name),
      metadata
    `
    )
    .eq('product_u_id', productUId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const listProducts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('machine_slots')
    .select(
      `
      machine:machine_u_id (machine_tag),
      product:product_u_id (
        product_u_id,
        description,
        product_image_url,
        brand_name
      ),
      quantity
    `,
      { count: 'exact' }
    );

  if (params?.search) {
    query = query.or(
      `product_u_id.ilike.%${params.search}%`
    );
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    }
  };
};
export const listOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('payments')
    .select(
      `
      id,
      amount,
      payment_method,
      status,
      created_at,
      machine:machine_u_id(machine_tag),
      user:users!payments_user_id_fkey(first_name, last_name)
    `,
      { count: 'exact' }
    );

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.search) {
    query = query.or(
      `id.ilike.%${params.search}%`
    );
  }

  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    }
  };
};
export const getOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      amount,
      payment_method,
      status,
      created_at,
      charge_id,
      machine:machine_u_id(machine_tag, machine_image_url, location_address),
      user:users!payments_user_id_fkey(first_name, last_name, phone_number, user_profile)
    `
    )
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const listOrderProducts = async (orderId) => {
  const { data, error } = await supabase
    .from('payment_products')
    .select(
      `
      quantity,
      dispensed_quantity,
      product:product_u_id (
        product_u_id,
        description,
        product_image_url,
        cost_price
      )
    `
    )
    .eq('payment_id', orderId);
  if (error) throw error;
  return data ?? [];
};
export const listFeedback = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('contact_us')
    .select(
      `
      id,
      subject,
      message,
      created_at,
      user:users!contact_us_user_id_fkey(phone_number, email)
    `,
      { count: 'exact' }
    );

  if (params?.search) {
    query = query.or(
      `message.ilike.%${params.search}%,subject.ilike.%${params.search}%`
    );
  }

  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    }
  };
};
