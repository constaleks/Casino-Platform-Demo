<?php

namespace App\Http\Controllers;

use App\Services\SeedPairManager;
use Illuminate\Http\Request;

class FairnessController extends Controller
{
    /*
     * The commitment: the hash of the server seed the player's next rounds will use
     */
    public function show(Request $request)
    {
        return response()->json([
            'active' => SeedPairManager::publicState(SeedPairManager::activeFor($request->user())),
        ]);
    }

    /*
     * Reveals the current server seed (so its rounds can be verified) and commits
     * to a new one, optionally with a client seed of the player's choosing
     */
    public function rotate(Request $request)
    {
        $validated = $request->validate([
            'client_seed' => ['nullable', 'string', 'min:1', 'max:64'],
        ]);

        [$previous, $active] = SeedPairManager::rotate($request->user(), $validated['client_seed'] ?? null);

        return response()->json([
            'previous' => $previous ? SeedPairManager::revealedState($previous) : null,
            'active' => SeedPairManager::publicState($active),
        ]);
    }
}
