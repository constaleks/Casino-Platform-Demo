import { apiClient } from './client';
import type { SpinResponse } from '@/types/model';

export interface SpinBetInput {
    bet_type: string;
    bet_value?: Record<string, unknown>;
    amount: number;
}

/* The result comes from the player's active seed pair - see api/user/fairness.ts */
export async function spinRoulette(gameSlug: string, bets: SpinBetInput[]): Promise<SpinResponse> {
    const { data } = await apiClient.post<SpinResponse>(`/api/games/${gameSlug}/spin`, { bets });

    return data;
}
