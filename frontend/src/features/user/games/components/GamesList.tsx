import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from 'cn';
import { fetchGames } from '@/api/user/games';
import type { Game } from '@/types/model';
import { Skeleton } from '@/components/user/Loading';

const GAME_META: Record<Game['type'], { icon: string; gradient: string; glow: string }> = {
    roulette: {
        icon: '🎡',
        gradient: 'from-chip-red/35 via-felt-700 to-felt-900',
        glow: 'oklch(0.64 0.21 22 / 0.45)',
    },
    blackjack: {
        icon: '🃏',
        gradient: 'from-win/30 via-felt-700 to-felt-900',
        glow: 'oklch(0.79 0.18 155 / 0.4)',
    },
    slots: {
        icon: '🎰',
        gradient: 'from-chip-purple/35 via-felt-700 to-felt-900',
        glow: 'oklch(0.64 0.19 305 / 0.45)',
    },
};

const COMING_SOON = [
    { name: 'Blackjack', icon: '🃏' },
    { name: 'Lucky Slots', icon: '🎰' },
    { name: 'Poker Room', icon: '♠️' },
];

type Filter = 'all' | Game['type'];

export function GamesList() {
    const [games, setGames] = useState<Game[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        fetchGames()
            .then((data) => {
                if (!ignore) setGames(data);
            })
            .finally(() => {
                if (!ignore) setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, []);

    const availableTypes = [...new Set(games.map((g) => g.type))];
    const visibleGames = filter === 'all' ? games : games.filter((g) => g.type === filter);

    return (
        <section className="flex flex-col gap-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[11px] font-bold tracking-[0.22em] text-white/40 uppercase">Game Lobby</h2>

                {!isLoading && availableTypes.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                        {(['all', ...availableTypes] as Filter[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFilter(type)}
                                className={cn(
                                    'cursor-pointer rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors',
                                    filter === type
                                        ? 'bg-gold text-felt-900'
                                        : 'border border-white/10 bg-white/5 text-white/50 hover:text-white',
                                )}>
                                {type}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-44 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {visibleGames.map((game) => {
                        const meta = GAME_META[game.type];

                        return (
                            <Link
                                key={game.id}
                                to={`/games/${game.slug}`}
                                style={{ '--game-glow': meta.glow } as React.CSSProperties}
                                className={cn(
                                    'group relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-4 transition-all duration-300',
                                    'hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_24px_60px_-24px_var(--game-glow)]',
                                    meta.gradient,
                                )}>
                                <span className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-[var(--game-glow)] opacity-60 blur-3xl transition-opacity group-hover:opacity-100" />

                                <div className="relative flex items-start justify-between">
                                    <span className="animate-float text-4xl drop-shadow-lg">{meta.icon}</span>
                                    <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase backdrop-blur-sm">
                                        {game.type}
                                    </span>
                                </div>

                                <div className="relative">
                                    <h3 className="text-lg leading-tight font-black">{game.name}</h3>
                                    <p className="mt-1 text-[11px] font-medium text-white/50 tabular-nums">
                                        Bets {parseFloat(game.min_bet).toFixed(0)} – {parseFloat(game.max_bet).toFixed(0)}
                                    </p>

                                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-[11px] font-black tracking-[0.16em] text-felt-900 uppercase opacity-0 transition-all duration-300 group-hover:opacity-100">
                                        Play now
                                    </span>
                                </div>
                            </Link>
                        );
                    })}

                    {filter === 'all' &&
                        COMING_SOON.map((placeholder) => (
                            <div
                                key={placeholder.name}
                                aria-hidden="true"
                                className="flex h-44 flex-col justify-between rounded-2xl border border-dashed border-white/8 bg-felt-800/30 p-4 opacity-45">
                                <span className="text-4xl grayscale">{placeholder.icon}</span>
                                <div>
                                    <h3 className="text-lg leading-tight font-black text-white/60">{placeholder.name}</h3>
                                    <p className="mt-1 text-[11px] font-bold tracking-[0.16em] text-white/30 uppercase">🔒 Coming soon</p>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </section>
    );
}
