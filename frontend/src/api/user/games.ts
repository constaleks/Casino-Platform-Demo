import { apiClient } from './client';
import type { Game } from '@/types/model';

export async function fetchGames(): Promise<Game[]> {
    const { data } = await apiClient.get<{ games: Game[] }>('/api/games');
    return data.games;
}
