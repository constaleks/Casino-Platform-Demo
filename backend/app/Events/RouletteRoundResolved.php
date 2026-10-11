<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use App\Models\GameRound;
use App\Models\Bet; 

class RouletteRoundResolved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public GameRound $round, public array $bets)
    {
        //
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("users.{$this->round->user_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return "roulette.round.resolved";
    }

    /*
     * Payload is built by hand rather than via toArray() so model internals never
     * leak over the socket. server_seed is only sent once revealed: while the seed
     * pair is active it also decides the player's next rounds.
     */
    public function broadcastWith(): array
    {
        return [
            'round' => [
                'id' => $this->round->id,
                'result' => $this->round->result,
                'server_seed_hash' => $this->round->server_seed_hash,
                'server_seed' => $this->round->server_seed_revealed ? $this->round->server_seed : null,
                'client_seed' => $this->round->client_seed,
                'nonce' => $this->round->nonce,
                'resolved_at' => $this->round->resolved_at?->toISOString(),
            ],
            'bets' => array_map(fn (Bet $bet) => [
                'id' => $bet->id,
                'bet_type' => $bet->bet_type,
                'bet_value' => $bet->bet_value,
                'amount' => $bet->amount,
                'status' => $bet->status->value,
                'payout_amount' => $bet->payout_amount,
            ], $this->bets),
        ];
    }
}
