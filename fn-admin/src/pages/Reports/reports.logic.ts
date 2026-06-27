import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ALL_REPORTS, RESOLVE_REPORT_MUTATION } from "@/services/graphql/admin.graphql";

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedStoreId: string | null;
  reportedUserId: string | null;
  reportType: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: User;
  reportedStore: Store | null;
  reportedUser: User | null;
}

interface ReportsData {
  adminReports: {
    items: Report[];
    totalItems: number;
    totalPages: number;
  };
}

export function useReports(initialPage = 1) {
  const [page, setPage] = useState(initialPage);

  const { data, loading, error, refetch } = useQuery<ReportsData>(GET_ALL_REPORTS, {
    variables: { page, limit: 15 },
    fetchPolicy: "network-only",
  });

  const [resolveReport, { loading: isResolving }] = useMutation(RESOLVE_REPORT_MUTATION, {
    onCompleted: () => {
      refetch();
    },
  });

  const handleResolve = async (reportId: string) => {
    try {
      await resolveReport({ variables: { reportId } });
      console.log(`Report ${reportId} resolved successfully.`);
    } catch (err) {
      console.error(`Failed to resolve report ${reportId}:`, err);
    }
  };

  return {
    reports: data?.adminReports.items ?? [],
    totalItems: data?.adminReports.totalItems ?? 0,
    totalPages: data?.adminReports.totalPages ?? 1,
    page,
    setPage,
    loading,
    error,
    isResolving,
    handleResolve,
  };
}
