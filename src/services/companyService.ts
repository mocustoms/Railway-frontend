import { api } from './api';

export interface InitializationResult {
  success: boolean;
  message: string;
  total: number;
  successful: number;
  failed: number;
  details: Record<string, { total: number; created: number; errors: any[] }>;
  errors: any[];
}

const companyService = {
  /**
   * Initialize company with default data
   * @param tables Optional array of table names to initialize. If not provided, initializes all tables.
   */
  initializeCompany: async (tables?: string[]): Promise<InitializationResult> => {
    const response = await api.post('/company/initialize', { tables });
    return response.data;
  },
};

export default companyService;

