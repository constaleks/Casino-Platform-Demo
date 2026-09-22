import { Link } from 'react-router-dom';

// Decorative placeholder feed
const LIVE_WINS = [
    { player: 'LuckyMax', game: 'European Roulette', amount: '+1,240.00' },
    { player: 'Ace_Nina', game: 'European Roulette', amount: '+380.50' },
    { player: 'ChipKing', game: 'European Roulette', amount: '+92.00' },
    { player: 'Rouletta', game: 'European Roulette', amount: '+2,015.75' },
];

export function ActivityRail() {
    return (
        <div className="flex flex-col gap-4">
            <Link
                to="/transactions"
                className="group relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/15 via-felt-800 to-felt-900 p-4 transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_20px_50px_-24px_oklch(0.84_0.15_88/0.7)]">
                <span className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-gold/25 blur-2xl transition-opacity group-hover:opacity-100" />
                <p className="relative text-[10px] font-bold tracking-[0.22em] text-gold/80 uppercase">Your money</p>
                <p className="relative mt-1 text-base font-black">Transaction history</p>
                <p className="relative mt-1 text-[11px] text-white/45">Deposits, bets, wins and bonuses.</p>
                <span className="relative mt-3 inline-block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">View all</span>
            </Link>

            <section className="rounded-2xl border border-white/8 bg-felt-800/60 p-4">
                <header className="mb-3 flex items-center gap-2">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-win/70" />
                        <span className="relative inline-flex size-2 rounded-full bg-win" />
                    </span>
                    <h2 className="text-[11px] font-bold tracking-[0.22em] text-white/40 uppercase">Live wins</h2>
                </header>

                <ul className="flex flex-col gap-2.5">
                    {LIVE_WINS.map((win) => (
                        <li key={win.player} className="flex items-center gap-2.5">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-felt-600 to-felt-900 text-[10px] font-black ring-1 ring-white/10">
                                {win.player.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-semibold">{win.player}</p>
                                <p className="truncate text-[10px] text-white/35">{win.game}</p>
                            </div>
                            <span className="text-[11px] font-bold text-win tabular-nums">{win.amount}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
