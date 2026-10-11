const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function colorOf(number: number): 'red' | 'black' | 'green' {
    if (number === 0) return 'green';
    return RED_NUMBERS.has(number) ? 'red' : 'black';
}

export interface PendingBet {
    key: string;
    bet_type: string;
    bet_value: Record<string, unknown>;
    amount: number;
    label: string;
}

export function betKey(betType: string, betValue: Record<string, unknown>): string {
    return `${betType}:${JSON.stringify(betValue)}`;
}

/*
 * Client-side mirror of the backend spin rules (SpinRequest + RouletteController).
 * This is only a convenience so obviously invalid spins never hit the API - the
 * server still validates everything and stays the source of truth.
 */
export const MAX_BETS_PER_SPIN = 20;
/* Mirrors FairnessController::rotate: 'client_seed' => max:64 */
export const CLIENT_SEED_MAX_LENGTH = 64;

/* Money is compared in integer cents - never as floats (0.1 + 0.2 !== 0.3) */
export function toCents(amount: number | string): number {
    return Math.round(Number(amount) * 100);
}

export function hasAtMostTwoDecimals(amount: number): boolean {
    return Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6;
}

/* Adds two money amounts without float drift, e.g. 0.1 + 0.2 -> 0.3 */
export function addAmounts(a: number, b: number): number {
    return (toCents(a) + toCents(b)) / 100;
}

interface SpinValidationInput {
    bets: PendingBet[];
    /* Limits are skipped while the game / wallet are still loading - the server checks them anyway */
    minBet?: string;
    maxBet?: string;
    balance?: string;
}

/** Returns the reason the spin must be blocked, or null when it can be sent. */
export function validateSpin({ bets, minBet, maxBet, balance }: SpinValidationInput): string | null {
    if (bets.length === 0) return 'Place at least one bet.';
    if (bets.length > MAX_BETS_PER_SPIN) return `You can place at most ${MAX_BETS_PER_SPIN} bets per spin.`;

    for (const bet of bets) {
        if (!Number.isFinite(bet.amount) || bet.amount <= 0) return `${bet.label}: amount must be greater than 0.`;
        if (!hasAtMostTwoDecimals(bet.amount)) return `${bet.label}: amount can have at most 2 decimal places.`;
        if (minBet !== undefined && toCents(bet.amount) < toCents(minBet)) return `${bet.label}: minimum bet is ${minBet}.`;
        if (maxBet !== undefined && toCents(bet.amount) > toCents(maxBet)) return `${bet.label}: maximum bet is ${maxBet}.`;
    }

    const totalCents = bets.reduce((sum, bet) => sum + toCents(bet.amount), 0);
    if (balance !== undefined && totalCents > toCents(balance)) return 'Insufficient balance for this spin.';

    return null;
}

/*
 * Browser-side re-implementation of ProvablyFair::resolveNumber() and hashServerSeed(),
 * so a revealed seed can be checked without trusting the server's own claim:
 *   number = int(first 8 hex chars of HMAC-SHA256(key: serverSeed, msg: "client:nonce")) % 37
 */
const textEncoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(value: string): Promise<string> {
    return toHex(await crypto.subtle.digest('SHA-256', textEncoder.encode(value)));
}

export async function resolveRouletteNumber(serverSeed: string, clientSeed: string, nonce: number): Promise<number> {
    const key = await crypto.subtle.importKey('raw', textEncoder.encode(serverSeed), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = toHex(await crypto.subtle.sign('HMAC', key, textEncoder.encode(`${clientSeed}:${nonce}`)));

    return parseInt(signature.slice(0, 8), 16) % 37;
}

export function randomClientSeed(): string {
    return toHex(crypto.getRandomValues(new Uint8Array(8)).buffer);
}
