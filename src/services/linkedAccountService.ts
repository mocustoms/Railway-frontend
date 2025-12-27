import { api } from './api';

export interface LinkedAccount {
  id: string | null;
  accountType: string;
  accountTypeLabel: string;
  accountId: string | null;
  customerId: string | null;
  account: {
    id: string;
    code: string;
    name: string;
    type: string;
  } | null;
  customer: {
    id: string;
    customer_id: string;
    full_name: string;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface LinkedAccountUpdate {
  accountType: string;
  accountId: string | null;
  customerId?: string | null;
}

class LinkedAccountService {
  // Get all linked accounts for the company
  async getLinkedAccounts(): Promise<LinkedAccount[]> {
    const response = await api.get('/linked-accounts');
    return response.data;
  }

  // Update linked accounts (bulk update)
  async updateLinkedAccounts(linkedAccounts: LinkedAccountUpdate[]): Promise<{ message: string; linkedAccounts: any[] }> {
    const response = await api.put('/linked-accounts', {
      linkedAccounts
    });
    return response.data;
  }
}

export const linkedAccountService = new LinkedAccountService();

