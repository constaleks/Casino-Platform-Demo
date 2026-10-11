import Echo from 'laravel-echo';
import Pusher, { type ChannelAuthorizationCallback } from 'pusher-js';
import { apiClient } from '@/api/user/client';

type ChannelAuthorizationData = NonNullable<Parameters<ChannelAuthorizationCallback>[1]>;

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

window.Pusher = Pusher;

let echo: Echo<'reverb'> | null = null;

/**
 * Lazily created so guests (login/register pages) never open a socket.
 * Private channel auth goes through apiClient rather than Echo's default
 * fetch, so it carries the Sanctum session cookie + XSRF header exactly
 * like every other API call.
 */
export function getEcho(): Echo<'reverb'> {
    if (echo) return echo;

    const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';

    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel: { name: string }) => ({
            authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
                apiClient
                    .post<ChannelAuthorizationData>('/api/broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
                    .then((response) => callback(null, response.data))
                    .catch((error) => callback(error, null));
            },
        }),
    });

    return echo;
}

export function disconnectEcho(): void {
    echo?.disconnect();
    echo = null;
}
