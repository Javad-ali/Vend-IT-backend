import {
  getRevenueChartData,
  getOrdersChartData,
  getUserGrowthChartData,
  getMachineStatusChartData
} from './admin-chart-data.repository.js';

export const getAdminChartData = async () => {
  const [revenue, orders, userGrowth, machineStatus] = await Promise.all([
    getRevenueChartData(30),
    getOrdersChartData(30),
    getUserGrowthChartData(6),
    getMachineStatusChartData()
  ]);

  return {
    revenue,
    orders,
    userGrowth,
    machineStatus
  };
};
