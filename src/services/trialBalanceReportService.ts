import api from './api';

export interface TrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: 'DEBIT' | 'CREDIT';
  accountTypeId?: string;
  parentId?: string;
  level: number;
  isLeaf: boolean;
  isAccountType?: boolean;
  accountBalance: {
    debit: number;
    credit: number;
  };
  totalDebit: number;
  totalCredit: number;
  children: TrialBalanceAccount[];
}

export interface TrialBalanceSummary {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}

export interface TrialBalanceMetadata {
  financialYear: {
    id: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
  };
  currency: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  } | null;
  generatedAt: string;
  generatedBy: {
    id: string;
    name: string;
    username: string;
  };
  filters: {
    financialYearId: string;
    includeZeroBalances: boolean;
    includeInactive: boolean;
    startDate?: string;
    endDate?: string;
    accountTypeId?: string;
  };
}

export interface TrialBalanceReportFilters {
  financialYearId?: string;
  includeZeroBalances?: boolean;
  includeInactive?: boolean;
  startDate?: string;
  endDate?: string;
  accountTypeId?: string;
}

export interface TrialBalanceReportResponse {
  success: boolean;
  data: TrialBalanceAccount[];
  summary: TrialBalanceSummary;
  metadata: TrialBalanceMetadata;
}

export const trialBalanceReportService = {
  // Get Trial Balance Report Data
  getTrialBalanceReport: async (filters?: TrialBalanceReportFilters): Promise<TrialBalanceReportResponse> => {
    const params: any = {};
    
    if (filters?.financialYearId) params.financialYearId = filters.financialYearId;
    if (filters?.includeZeroBalances !== undefined) params.includeZeroBalances = filters.includeZeroBalances.toString();
    if (filters?.includeInactive !== undefined) params.includeInactive = filters.includeInactive.toString();
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.accountTypeId) params.accountTypeId = filters.accountTypeId;

    const response = await api.get('/trial-balance-report', { params });
    return response.data;
  }
};

export default trialBalanceReportService;

