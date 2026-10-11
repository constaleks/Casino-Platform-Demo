import { apiClient } from './client';
import type { FairnessState, RotateSeedResponse } from '@/types/model';

export async function fetchFairness(): Promise<FairnessState> {
    const { data } = await apiClient.get<{ active: FairnessState }>('/api/fairness');
    return data.active;
}

/* Reveals the current server seed and commits to a new one */
export async function rotateSeedPair(clientSeed?: string): Promise<RotateSeedResponse> {
    const { data } = await apiClient.post<RotateSeedResponse>('/api/fairness/rotate', { client_seed: clientSeed });
    return data;
}
