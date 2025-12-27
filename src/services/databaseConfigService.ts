import api from './api';

export interface DatabaseConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_DIALECT: string;
  DB_LOGGING: boolean;
}

export interface DatabaseConfigResponse {
  success: boolean;
  config: DatabaseConfig;
  error?: string;
  message?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  error?: string;
  details?: {
    name?: string;
    code?: string;
  };
}

export interface UpdateConfigResponse {
  success: boolean;
  message: string;
  warning?: string;
  error?: string;
}

export const databaseConfigService = {
  // Get current database configuration
  getConfig: async (): Promise<DatabaseConfigResponse> => {
    const response = await api.get<DatabaseConfigResponse>('/database-config');
    return response.data;
  },

  // Test database connection with provided credentials
  testConnection: async (config: Partial<DatabaseConfig>): Promise<TestConnectionResponse> => {
    const response = await api.post<TestConnectionResponse>('/database-config/test', config);
    return response.data;
  },

  // Update database configuration
  updateConfig: async (config: Partial<DatabaseConfig>): Promise<UpdateConfigResponse> => {
    const response = await api.put<UpdateConfigResponse>('/database-config', config);
    return response.data;
  }
};

