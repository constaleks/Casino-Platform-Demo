import { apiClient } from './client';
import type { SpinResponse } from '@/types/model';

export interface SpinBetInput {
    bet_type: string;
    bet_value?: Record<string, unknown>;
    amount: number;
}

export async function spinRoulette(gameSlug: string, bets: SpinBetInput[], clientSeed?: string): Promise<SpinResponse> {
    const { data } = await apiClient.post<SpinResponse>(`/api/games/${gameSlug}/spin`, {
        bets,
        client_seed: clientSeed,
    });

    return data;
}
