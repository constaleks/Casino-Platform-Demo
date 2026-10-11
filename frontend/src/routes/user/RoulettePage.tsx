import { GameLayout } from '@/components/layout/GameLayout';
import { PageHeader } from '@/components/user/PageHeader';
import { RouletteBoard } from '@/features/user/games/roulette/components/RouletteBoard';
import { RouletteWheel } from '@/features/user/games/roulette/components/RouletteWheel';
import { BetSlip } from '@/features/user/games/roulette/components/BetSlip';
import { SpinResult } from '@/features/user/games/roulette/components/SpinResult';
import { FairnessPanel, type VerifiableRound } from '@/features/user/games/roulette/components/FairnessPanel';

import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { spinRoulette } from '@/api/user/roulette';
import { fetchWallets } from '@/api/user/wallets';
import { fetchGames } from '@/api/user/games';
import { fetchFairness } from '@/api/user/fairness';
import { useAuthStore } from '@/features/user/auth/authStore';
import { useEchoConnectionState, useUserChannel } from '@/features/user/realtime/useUserChannel';
import { addAmounts, betKey, colorOf, hasAtMostTwoDecimals, validateSpin, type PendingBet } from '@/features/user/games/roulette/utils';
import { cn } from '@/lib/utils';
import type { Bet, FairnessState, Game, GameRound, SpinResponse, Wallet } from '@/types/model';

const GAME_SLUG = 'european-roulette';
const RECENT_LIMIT = 12;

const RESULT_CHIP_CLASSES = {
    red: 'bg-red-600 text-white',
    black: 'bg-neutral-900 text-white ring-1 ring-white/15',
    green: 'bg-green-700 text-white',
} as const;

export function RoulettePage() {
    const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);
    const [chipAmount, setChipAmount] = useState(1);
    const [isSpinning, setIsSpinning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    /* Server answer for the spin in flight - the wheel is decelerating towards it */
    const [landing, setLanding] = useState<SpinResponse | null>(null);
    const [lastRound, setLastRound] = useState<GameRound | null>(null);
    const [lastBets, setLastBets] = useState<Bet[]>([]);
    const [demoWallet, setDemoWallet] = useState<Wallet | null>(null);
    const [game, setGame] = useState<Game | null>(null);
    const [stakeInFlight, setStakeInFlight] = useState(0);
    const [fairness, setFairness] = useState<FairnessState | null>(null);
    /* Every round seen this session, newest first - the strip shows the latest few, the fairness panel verifies all */
    const [sessionRounds, setSessionRounds] = useState<VerifiableRound[]>([]);
    const refreshAuthUser = useAuthStore((s) => s.fetchCurrentUser);
    const connectionState = useEchoConnectionState();

    /*
     * The socket usually beats the wheel: wallet.updated / round.resolved arrive
     * while the ball is still rolling. Applying them right away would spoil the
     * result (balance jumps before the wheel stops), so they are queued during
     * a spin and flushed once the wheel settles.
     */
    const isSpinningRef = useRef(false);
    const deferredRef = useRef<Array<() => void>>([]);

    function runWhenIdle(apply: () => void) {
        if (isSpinningRef.current) {
            deferredRef.current.push(apply);
        } else {
            apply();
        }
    }

    function setSpinning(value: boolean) {
        isSpinningRef.current = value;
        setIsSpinning(value);

        if (!value) {
            const queued = deferredRef.current;
            deferredRef.current = [];
            queued.forEach((apply) => apply());
        }
    }

    function applyWallet(wallet: Wallet) {
        setDemoWallet((current) => (current && current.id === wallet.id ? { ...current, ...wallet } : current));
    }

    function addSessionRound(round: Pick<GameRound, 'id' | 'result' | 'nonce' | 'server_seed_hash'>) {
        const number = round.result?.number;
        if (number === undefined) return;

        setSessionRounds((prev) =>
            prev.some((r) => r.roundId === round.id)
                ? prev
                : [{ roundId: round.id, number, nonce: round.nonce, serverSeedHash: round.server_seed_hash }, ...prev],
        );
    }

    useEffect(() => {
        fetchWallets()
            .then((wallets) => setDemoWallet(wallets.find((w) => w.currency === 'DEMO') ?? null))
            .catch(() => setDemoWallet(null));

        /* Only needed for the min/max bet pre-check; if it fails the server still enforces the limits */
        fetchGames()
            .then((games) => setGame(games.find((g) => g.slug === GAME_SLUG) ?? null))
            .catch(() => setGame(null));

        /* The commitment: shown before the first spin, so the result can't be chosen afterwards */
        fetchFairness()
            .then(setFairness)
            .catch(() => setFairness(null));
    }, []);

    useUserChannel({
        onWalletUpdated: (wallet) => runWhenIdle(() => applyWallet(wallet)),
        onRoundResolved: ({ round }) => {
            runWhenIdle(() => addSessionRound(round));

            /* A round played in another tab still consumed a nonce of this pair */
            setFairness((current) =>
                current && current.server_seed_hash === round.server_seed_hash
                    ? { ...current, nonce: Math.max(current.nonce, round.nonce + 1) }
                    : current,
            );
        },
    });

    function handleBoardBet(betType: string, betValue: Record<string, unknown>, label: string) {
        if (!Number.isFinite(chipAmount) || chipAmount <= 0) {
            setError('Choose a chip amount first.');
            return;
        }
        if (!hasAtMostTwoDecimals(chipAmount)) {
            setError('Chip amount can have at most 2 decimal places.');
            return;
        }
        setError(null);

        const key = betKey(betType, betValue);
        setPendingBets((prev) => {
            const existing = prev.find((b) => b.key === key);
            if (existing) {
                return prev.map((b) => (b.key === key ? { ...b, amount: addAmounts(b.amount, chipAmount) } : b));
            }
            return [...prev, { key, bet_type: betType, bet_value: betValue, amount: chipAmount, label }];
        });
    }

    function handleRemoveBet(key: string) {
        setPendingBets((prev) => prev.filter((b) => b.key !== key));
    }

    const spinBlockedReason = validateSpin({
        bets: pendingBets,
        minBet: game?.min_bet,
        maxBet: game?.max_bet,
        balance: demoWallet?.balance,
    });

    async function handleSpin() {
        /* The button is already disabled in this case - this guards any other caller */
        if (isSpinningRef.current) return;
        if (spinBlockedReason) {
            setError(spinBlockedReason);
            return;
        }

        setError(null);
        setLanding(null);
        setStakeInFlight(pendingBets.reduce((sum, bet) => addAmounts(sum, bet.amount), 0));
        setSpinning(true);

        try {
            const response = await spinRoulette(
                GAME_SLUG,
                pendingBets.map((b) => ({ bet_type: b.bet_type, bet_value: b.bet_value, amount: b.amount })),
            );
            setLanding(response);
            /* Just the next nonce - nothing here gives the result away before the wheel stops */
            setFairness(response.fairness);
        } catch (err) {
            if (isAxiosError<{ message?: string }>(err)) {
                setError(err.response?.data?.message ?? 'Spin failed. Please try again.');
            } else {
                setError('Spin failed. Please try again.');
            }
            setStakeInFlight(0);
            setSpinning(false);
        }
    }

    function handleWheelSettled() {
        if (!landing) return;

        setLastRound(landing.round);
        setLastBets(landing.bets);
        applyWallet(landing.wallet);
        addSessionRound(landing.round);
        setPendingBets([]);
        setStakeInFlight(0);
        setLanding(null);
        setSpinning(false);
        refreshAuthUser();
    }

    const winningNumber = landing?.round.result?.number ?? null;
    const lastNumber = lastRound?.result?.number ?? null;
    const displayedBalance = demoWallet ? parseFloat(demoWallet.balance) - stakeInFlight : null;
    const recentResults = sessionRounds.slice(0, RECENT_LIMIT);

    return (
        <GameLayout>
            {/* Below game-fit this is a normal scrolling column; at game-fit every panel shares one screen */}
            <div className="flex flex-col gap-4 game-fit:min-h-0 game-fit:flex-1">
                <PageHeader eyebrow="Table games" title="European Roulette" backTo="/dashboard" backLabel="Lobby">
                    <ConnectionPill state={connectionState} />
                </PageHeader>

                {error && <p className="-mt-2 text-sm text-destructive">{error}</p>}

                <div className="grid gap-4 game-fit:min-h-0 game-fit:flex-1 game-fit:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <section className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-felt-800/60 p-4 game-fit:min-h-0">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold tracking-[0.22em] text-white/40 uppercase">Demo balance</p>
                                <p className="text-2xl font-black text-gold tabular-nums">
                                    {displayedBalance === null ? '—' : displayedBalance.toFixed(2)}
                                </p>
                            </div>

                            <div aria-live="polite" className="text-right">
                                {isSpinning || !lastRound?.result ? (
                                    <p className="text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
                                        {isSpinning ? (winningNumber === null ? 'No more bets' : 'Ball is dropping…') : 'Place your bets'}
                                    </p>
                                ) : (
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-sm font-semibold text-white/70 capitalize">
                                            {lastRound.result.color}
                                            {lastRound.result.parity && ` · ${lastRound.result.parity}`}
                                        </span>
                                        <span
                                            className={cn(
                                                'grid size-11 place-items-center rounded-full text-lg font-black',
                                                RESULT_CHIP_CLASSES[lastRound.result.color],
                                            )}>
                                            {lastRound.result.number}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Size container: the wheel takes the largest square that fits the space left */}
                        <div className="grid place-items-center game-fit:min-h-0 game-fit:flex-1 game-fit:[container-type:size]">
                            <RouletteWheel
                                spinning={isSpinning}
                                result={winningNumber}
                                highlight={lastNumber}
                                onSettled={handleWheelSettled}
                                className="game-fit:w-[min(100cqw,100cqh)] game-fit:max-w-none"
                            />
                        </div>

                        <div>
                            <p className="mb-2 text-[11px] font-bold tracking-[0.22em] text-white/40 uppercase">Recent results</p>
                            {recentResults.length === 0 ? (
                                <p className="flex h-8 items-center text-xs text-white/40">No spins yet this session.</p>
                            ) : (
                                <ol className="flex h-8 gap-1.5 overflow-hidden">
                                    {recentResults.map((r, i) => (
                                        <li
                                            key={r.roundId}
                                            className={cn(
                                                'grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums',
                                                RESULT_CHIP_CLASSES[colorOf(r.number)],
                                                i === 0 && 'ring-2 ring-gold ring-inset',
                                            )}>
                                            {r.number}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>

                        <FairnessPanel fairness={fairness} rounds={sessionRounds} disabled={isSpinning} onRotated={setFairness} />
                    </section>

                    <section className="flex flex-col gap-4 game-fit:min-h-0">
                        <div className="shrink-0 rounded-2xl border border-white/5 bg-felt-800/60 p-3">
                            <RouletteBoard onBet={handleBoardBet} disabled={isSpinning} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 game-fit:min-h-0 game-fit:flex-1">
                            <BetSlip
                                pendingBets={pendingBets}
                                chipAmount={chipAmount}
                                onChipAmountChange={setChipAmount}
                                onRemoveBet={handleRemoveBet}
                                onClear={() => setPendingBets([])}
                                onSpin={handleSpin}
                                isSpinning={isSpinning}
                                spinBlockedReason={spinBlockedReason}
                                className="game-fit:min-h-0"
                            />

                            {!isSpinning && lastRound ? (
                                <SpinResult round={lastRound} bets={lastBets} className="game-fit:min-h-0" />
                            ) : (
                                <div className="hidden place-items-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground md:grid">
                                    {isSpinning ? 'Waiting for the ball…' : 'Your bet results appear here after a spin.'}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </GameLayout>
    );
}

function ConnectionPill({ state }: { state: 'connecting' | 'connected' | 'unavailable' }) {
    const label = state === 'connected' ? 'Live' : state === 'connecting' ? 'Connecting' : 'Offline';

    return (
        <span
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white/60 uppercase"
            title="Realtime connection to the game server">
            <span
                className={cn(
                    'size-2 rounded-full',
                    state === 'connected' && 'bg-win',
                    state === 'connecting' && 'animate-pulse bg-gold',
                    state === 'unavailable' && 'bg-destructive',
                )}
            />
            {label}
        </span>
    );
}
