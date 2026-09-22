import { apiClient } from './client';
import type { Wallet } from '@/types/model';

export async function fetchWallets(): Promise<Wallet[]> {
    const { data } = await apiClient.get<{ wallets: Wallet[] }>('/api/wallets');
    return data.wallets;
}

export async function createWallet(currency: 'USD' | 'EUR'): Promise<Wallet> {
    const { data } = await apiClient.post<{ wallet: Wallet }>('/api/wallets', { currency });
    return data.wallet;
}

export async function depositToWallet(walletId: number, amount: number): Promise<Wallet> {
    const { data } = await apiClient.post<{ wallet: Wallet }>(`/api/wallets/${walletId}/deposit`, {
        amount,
    });
    return data.wallet;
}
