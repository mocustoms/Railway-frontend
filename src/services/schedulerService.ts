import api from './api';

export interface SchedulerStatus {
  name: string;
  description: string;
  schedule: string;
  isRunning: boolean;
  taskStatus: string;
}

export interface SchedulersStatusResponse {
  success: boolean;
  schedulers: {
    scheduledInvoiceGenerator: SchedulerStatus;
    birthdayBonusScheduler: SchedulerStatus;
  };
  error?: string;
  message?: string;
}

export interface SchedulerActionResponse {
  success: boolean;
  message: string;
  status?: SchedulerStatus;
  error?: string;
}

export const schedulerService = {
  // Get status of all schedulers
  getStatus: async (): Promise<SchedulersStatusResponse> => {
    const response = await api.get<SchedulersStatusResponse>('/schedulers/status');
    return response.data;
  },

  // Manually trigger scheduled invoice generator
  triggerInvoiceGenerator: async (): Promise<SchedulerActionResponse> => {
    const response = await api.post<SchedulerActionResponse>('/schedulers/invoice-generator/trigger');
    return response.data;
  },

  // Manually trigger birthday bonus scheduler
  triggerBirthdayBonus: async (): Promise<SchedulerActionResponse> => {
    const response = await api.post<SchedulerActionResponse>('/schedulers/birthday-bonus/trigger');
    return response.data;
  },

  // Restart scheduled invoice generator
  restartInvoiceGenerator: async (): Promise<SchedulerActionResponse> => {
    const response = await api.post<SchedulerActionResponse>('/schedulers/invoice-generator/restart');
    return response.data;
  },

  // Restart birthday bonus scheduler
  restartBirthdayBonus: async (): Promise<SchedulerActionResponse> => {
    const response = await api.post<SchedulerActionResponse>('/schedulers/birthday-bonus/restart');
    return response.data;
  },

  // Stop scheduled invoice generator
  stopInvoiceGenerator: async (): Promise<SchedulerActionResponse> => {
    const response = await api.post<SchedulerActionResponse>('/schedulers/invoice-generator/stop');
    return response.data;
  },

  // Stop birthday bonus scheduler
  stopBirthdayBonus: async (): Promise<SchedulerActionResponse> => {
    const response = await api.post<SchedulerActionResponse>('/schedulers/birthday-bonus/stop');
    return response.data;
  }
};

