import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGames } from '@/api/user/games';
import type { Game } from '@/types/model';

export function GamesList() {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchGames()
            .then(setGames)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return <p className="text-muted-foreground">Loading games...</p>;
    }

    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-lg text-center font-semibold">Games</h2>
            <div className="flex flex-wrap w-full">
                {games.map((game) => (
                    <Link
                        key={game.id}
                        to={`/games/${game.slug}`}
                        className="w-full text-center rounded-lg border p-4 transition-colors hover:bg-muted/50">
                        <p className="font-medium">{game.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Bets {game.min_bet}–{game.max_bet}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
