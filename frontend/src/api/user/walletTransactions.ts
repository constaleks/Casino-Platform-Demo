import { apiClient } from './client';
import type { PaginatedResponse, WalletTransaction } from '@/types/model';

export async function fetchWalletTransactions(page = 1): Promise<PaginatedResponse<WalletTransaction>> {
    const { data } = await apiClient.get<PaginatedResponse<WalletTransaction>>('/api/wallet-transactions', {
        params: { page },
    });
    return data;
}
