import { supabase } from '../../libs/supabase.js';

// Chart Data Functions

export const getRevenueChartData = async (days: number = 30) => {
  const { data, error } = await supabase
    .from('payments')
    .select('created_at, amount')
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by date
  const grouped = (data ?? []).reduce((acc, payment) => {
    const date = payment.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += Number(payment.amount ?? 0);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([date, revenue]) => ({
    date,
    revenue: Number(Number(revenue).toFixed(2))
  }));
};

export const getOrdersChartData = async (days: number = 30) => {
  const { data, error } = await supabase
    .from('payments')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by date
  const grouped = (data ?? []).reduce((acc, payment) => {
    const date = payment.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([date, orders]) => ({
    date,
    orders
  }));
};

export const getUserGrowthChartData = async (months: number = 6) => {
  const { data, error } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by month
  const grouped = (data ?? []).reduce((acc, user) => {
    const date = new Date(user.created_at);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([month, users]) => ({
    month,
    users
  }));
};

export const getMachineStatusChartData = async () => {
  const { data, error } = await supabase
    .from('machine')
    .select('machine_operation_state');

  if (error) throw error;

  // Count by status
  const grouped = (data ?? []).reduce((acc, machine) => {
    const status = machine.machine_operation_state || 'unknown';
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status] += 1;
    return acc;
  }, {} as Record<string, number>);

  // Map to chart format with friendly names
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'inactive': 'Inactive',
    'maintenance': 'Maintenance',
    'unknown': 'Unknown'
  };

  return Object.entries(grouped).map(([status, value]) => ({
    name: statusMap[status.toLowerCase()] || status,
    value
  }));
};
