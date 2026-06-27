import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ADMIN_REVENUE_CHART, GET_ADMIN_CATEGORY_REVENUE } from '@/services/graphql/admin.graphql';

export type TimePeriod = '7days' | '30days' | 'year';

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface CategoryRevenueDataPoint {
  name: string;
  value: number;
  color: string;
}

interface RevenueData {
  adminRevenueChart: RevenueDataPoint[];
}

interface CategoryData {
  adminCategoryRevenue: CategoryRevenueDataPoint[];
}

export function useDashboardLogic() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');

  const { data: revenueData, loading: revenueLoading } = useQuery<RevenueData>(GET_ADMIN_REVENUE_CHART, {
    variables: { timePeriod },
    fetchPolicy: 'network-only',
  });

  const { data: categoryData, loading: categoryLoading } = useQuery<CategoryData>(GET_ADMIN_CATEGORY_REVENUE, {
    variables: { timePeriod },
    fetchPolicy: 'network-only',
  });

  return {
    timePeriod,
    setTimePeriod,
    chartData: revenueData?.adminRevenueChart || [],
    monthlyCategoryRevenue: categoryData?.adminCategoryRevenue || [],
    isLoadingCharts: revenueLoading || categoryLoading,
  };
}
