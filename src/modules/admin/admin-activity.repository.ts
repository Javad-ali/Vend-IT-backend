import { supabase } from '../../libs/supabase.js';

// Using existing audit_logs table
export const listActivityLogs = async (params?: {
  page?: number;
  limit?: number;
  admin_id?: string;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params?.admin_id) {
    query = query.eq('admin_id', params.admin_id);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  // Transform to match frontend ActivityLog type
  const logs = (data ?? []).map((log: any) => ({
    id: log.id,
    admin_name: log.details?.admin_name || 'System',
    action: log.action?.split('.')[1] || log.action,
    entity: log.resource_type,
    entity_id: log.resource_id,
    details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
    ip_address: log.ip_address,
    created_at: log.created_at
  }));

  return {
    data: logs,
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    }
  };
};

export const createActivityLog = async (log: {
  admin_id?: string;
  admin_name: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
}) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert([
      {
        admin_id: log.admin_id,
        action: `${log.entity}.${log.action}`,
        resource_type: log.entity,
        resource_id: log.entity_id,
        details: { admin_name: log.admin_name, message: log.details },
        ip_address: log.ip_address
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
