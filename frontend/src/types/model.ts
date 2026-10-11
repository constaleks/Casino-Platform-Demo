export interface User {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'blocked' | 'suspended';
    wallets?: Wallet[];
}

export interface Wallet {
    id: number;
    currency: 'USD' | 'EUR' | 'DEMO';
    balance: string;
    locked_balance: string;
}

export interface WalletTransaction {
    id: number;
    wallet_id: number;
    type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'bonus';
    amount: string;
    balance_before: string;
    balance_after: string;
    reference: string | null;
    created_at: string;
    wallet?: { id: number; currency: Wallet['currency'] };
}

export interface Game {
    id: number;
    slug: string;
    name: string;
    type: 'roulette' | 'blackjack' | 'slots';
    is_active: boolean;
    min_bet: string;
    max_bet: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

export interface RouletteResult {
    number: number;
    color: 'red' | 'black' | 'green';
    parity: 'even' | 'odd' | null;
    dozen: 1 | 2 | 3 | null;
    column: 1 | 2 | 3 | null;
    range: 'low' | 'high' | null;
}

export interface GameRound {
    id: number;
    game_id: number;
    status: 'pending' | 'accepting_bets' | 'spinning' | 'completed' | 'cancelled';
    /* Absent / null until the round's seed pair is rotated and the seed revealed */
    server_seed?: string | null;
    server_seed_hash: string;
    client_seed: string | null;
    nonce: number;
    server_seed_revealed: boolean;
    result: RouletteResult | null;
    resolved_at: string | null;
    created_at: string;
}

export interface Bet {
    id: number;
    bet_type: string;
    bet_value: Record<string, unknown>;
    amount: string;
    payout_multiplier: string | null;
    payout_amount: string;
    status: 'placed' | 'won' | 'lost' | 'cancelled';
}

/*
 * Payload of the backend's RouletteRoundResolved broadcast - a hand-built
 * subset of GameRound/Bet (see broadcastWith()), not the full models
 */
export interface RoundResolvedEvent {
    round: Pick<GameRound, 'id' | 'result' | 'server_seed_hash' | 'server_seed' | 'client_seed' | 'nonce' | 'resolved_at'>;
    bets: Pick<Bet, 'id' | 'bet_type' | 'bet_value' | 'amount' | 'status' | 'payout_amount'>[];
}

export interface SpinResponse {
    round: GameRound;
    bets: Bet[];
    wallet: Wallet;
    fairness: FairnessState;
}

/* The active seed pair as the player may see it - the server seed itself stays secret */
export interface FairnessState {
    server_seed_hash: string;
    client_seed: string;
    /* Nonce the next round will use */
    nonce: number;
}

/* A rotated-out pair. Its rounds used nonces 0 .. nonce - 1 */
export interface RevealedSeedPair extends FairnessState {
    server_seed: string;
}

export interface RotateSeedResponse {
    previous: RevealedSeedPair | null;
    active: FairnessState;
}
