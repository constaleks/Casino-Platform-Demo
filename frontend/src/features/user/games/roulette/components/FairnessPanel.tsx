import { useState, type SubmitEvent } from 'react';
import { isAxiosError } from 'axios';
import { Check, Dices, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rotateSeedPair } from '@/api/user/fairness';
import {
    CLIENT_SEED_MAX_LENGTH,
    randomClientSeed,
    resolveRouletteNumber,
    sha256Hex,
} from '@/features/user/games/roulette/utils';
import type { FairnessState, RevealedSeedPair } from '@/types/model';

/* A round seen this session, kept so it can be re-checked once its seed is revealed */
export interface VerifiableRound {
    roundId: number;
    number: number;
    nonce: number;
    serverSeedHash: string;
}

interface Verification {
    pair: RevealedSeedPair;
    hashMatches: boolean;
    /* The new pair uses the server seed whose hash was shown before the client seed was picked */
    commitmentHonored: boolean;
    checked: number;
    /* Round ids whose recomputed number differs from what the server reported */
    mismatches: number[];
}

interface FairnessPanelProps {
    fairness: FairnessState | null;
    rounds: VerifiableRound[];
    disabled: boolean;
    onRotated: (active: FairnessState) => void;
}

function shortHash(hash: string): string {
    return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

/*
 * Verification runs in the browser (WebCrypto), independent of the server: the
 * revealed seed must hash to the commitment shown before play, and must reproduce
 * every round of this session that used it. The new active pair must also carry
 * the next-seed hash that was shown before the new client seed was sent.
 */
async function verifyReveal(
    pair: RevealedSeedPair,
    rounds: VerifiableRound[],
    committedNextHash: string | undefined,
    active: FairnessState,
): Promise<Verification> {
    const hashMatches = (await sha256Hex(pair.server_seed)) === pair.server_seed_hash;
    const ownRounds = rounds.filter((r) => r.serverSeedHash === pair.server_seed_hash);
    const recomputed = await Promise.all(
        ownRounds.map((r) => resolveRouletteNumber(pair.server_seed, pair.client_seed, r.nonce)),
    );

    return {
        pair,
        hashMatches,
        commitmentHonored: committedNextHash === active.server_seed_hash,
        checked: ownRounds.length,
        mismatches: ownRounds.filter((r, i) => recomputed[i] !== r.number).map((r) => r.roundId),
    };
}

export function FairnessPanel({ fairness, rounds, disabled, onRotated }: FairnessPanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newSeed, setNewSeed] = useState('');
    const [isRotating, setIsRotating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verification, setVerification] = useState<Verification | null>(null);

    async function handleRotate(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsRotating(true);

        /* Captured before the request: the commitment as the player saw it */
        const committedNextHash = fairness?.next_server_seed_hash;

        try {
            const response = await rotateSeedPair(newSeed.trim() || undefined);
            onRotated(response.active);
            setVerification(
                response.previous
                    ? await verifyReveal(response.previous, rounds, committedNextHash, response.active)
                    : null,
            );
            setIsEditing(false);
            setNewSeed('');
        } catch (err) {
            setError(
                isAxiosError<{ message?: string }>(err)
                    ? (err.response?.data?.message ?? 'Could not change the seed.')
                    : 'Could not change the seed.',
            );
        } finally {
            setIsRotating(false);
        }
    }

    const isVerified =
        verification &&
        verification.hashMatches &&
        verification.commitmentHonored &&
        verification.mismatches.length === 0;

    return (
        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-felt-900/50 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold tracking-[0.22em] text-white/40 uppercase">Provably fair</p>
                {!isEditing && (
                    <button
                        type="button"
                        disabled={disabled || !fairness}
                        onClick={() => setIsEditing(true)}
                        className="font-semibold text-gold hover:underline disabled:opacity-40 disabled:hover:no-underline">
                        Change seed
                    </button>
                )}
            </div>

            {fairness ? (
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                    <dt className="text-white/40">Server seed hash</dt>
                    <dd className="truncate font-mono text-white/80" title={fairness.server_seed_hash}>
                        {shortHash(fairness.server_seed_hash)}
                    </dd>
                    <dt className="text-white/40">Next seed hash</dt>
                    <dd className="truncate font-mono text-white/80" title={fairness.next_server_seed_hash}>
                        {shortHash(fairness.next_server_seed_hash)}
                    </dd>
                    <dt className="text-white/40">Client seed</dt>
                    <dd className="truncate font-mono text-white/80" title={fairness.client_seed}>
                        {fairness.client_seed}
                    </dd>
                    <dt className="text-white/40">Next nonce</dt>
                    <dd className="font-mono text-white/80">{fairness.nonce}</dd>
                </dl>
            ) : (
                <p className="text-white/40">Loading seed pair…</p>
            )}

            {isEditing && (
                <form onSubmit={handleRotate} className="flex flex-col gap-2 border-t border-white/5 pt-2">
                    <label htmlFor="new-client-seed" className="text-white/60">
                        New client seed. This reveals the current server seed so you can verify your rounds, and
                        starts a new pair with the next seed shown above.
                    </label>
                    <div className="flex gap-2">
                        <Input
                            id="new-client-seed"
                            value={newSeed}
                            maxLength={CLIENT_SEED_MAX_LENGTH}
                            placeholder="Empty = random"
                            spellCheck={false}
                            autoComplete="off"
                            className="h-8 font-mono text-xs"
                            onChange={(e) => setNewSeed(e.target.value)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setNewSeed(randomClientSeed())}
                            aria-label="Generate a random client seed">
                            <Dices />
                        </Button>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isRotating || disabled}>
                            {isRotating ? 'Rotating…' : 'Reveal & rotate'}
                        </Button>
                    </div>
                </form>
            )}

            {error && <p className="text-destructive">{error}</p>}

            {verification && (
                <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                    <p className="text-white/40">Revealed server seed (used {verification.pair.nonce} times)</p>
                    <p className="font-mono break-all text-white/80 select-all">{verification.pair.server_seed}</p>
                    <p className={isVerified ? 'flex items-center gap-1 text-win' : 'flex items-center gap-1 text-destructive'}>
                        {isVerified ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
                        {!verification.hashMatches
                            ? 'Seed does NOT match the hash you were shown.'
                            : !verification.commitmentHonored
                              ? 'The new seed pair does NOT use the next seed hash you were shown.'
                              : verification.mismatches.length > 0
                              ? `${verification.mismatches.length} of ${verification.checked} rounds do NOT reproduce.`
                              : `Hash matches · ${verification.checked} round${verification.checked === 1 ? '' : 's'} from this session verified in your browser.`}
                    </p>
                </div>
            )}
        </div>
    );
}
