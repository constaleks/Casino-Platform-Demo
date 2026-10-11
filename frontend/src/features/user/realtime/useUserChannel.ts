import { useEffect, useRef, useState } from 'react';
import { getEcho } from '@/lib/echo';
import { useAuthStore } from '@/features/user/auth/authStore';
import type { RoundResolvedEvent, Wallet } from '@/types/model';

interface UserChannelHandlers {
    onWalletUpdated?: (wallet: Wallet) => void;
    onRoundResolved?: (event: RoundResolvedEvent) => void;
}

/*
 * Event names are prefixed with '.' because the backend events use broadcastAs(),
 * which tells Echo not to prepend the App\Events namespace.
 */
const WALLET_UPDATED = '.wallet.updated';
const ROUND_RESOLVED = '.roulette.round.resolved';

/**
 * Subscribes to the signed-in user's private channel (users.{id}).
 * Handlers live in a ref, so callers can pass inline functions without
 * resubscribing on every render.
 */
export function useUserChannel(handlers: UserChannelHandlers) {
    const userId = useAuthStore((s) => s.user?.id);
    const handlersRef = useRef(handlers);

    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        if (!userId) return;

        const channel = getEcho().private(`users.${userId}`);
        const walletListener = (payload: { wallet: Wallet }) => handlersRef.current.onWalletUpdated?.(payload.wallet);
        const roundListener = (payload: RoundResolvedEvent) => handlersRef.current.onRoundResolved?.(payload);

        channel.listen(WALLET_UPDATED, walletListener);
        channel.listen(ROUND_RESOLVED, roundListener);

        /*
         * stopListening (not leave) so other components on the same channel keep their listeners
         */
        return () => {
            channel.stopListening(WALLET_UPDATED, walletListener);
            channel.stopListening(ROUND_RESOLVED, roundListener);
        };
    }, [userId]);
}

export type ConnectionState = 'connecting' | 'connected' | 'unavailable';

export function useEchoConnectionState(): ConnectionState {
    const [state, setState] = useState<ConnectionState>('connecting');

    useEffect(() => {
        const connection = getEcho().connector.pusher.connection;
        const update = () => {
            const current = connection.state;
            setState(current === 'connected' ? 'connected' : current === 'connecting' || current === 'initialized' ? 'connecting' : 'unavailable');
        };

        update();
        connection.bind('state_change', update);
        return () => {
            connection.unbind('state_change', update);
        };
    }, []);

    return state;
}
