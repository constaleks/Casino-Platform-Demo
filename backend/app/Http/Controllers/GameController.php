<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Game;

class GameController extends Controller
{
    public function index()
    {
        return response()->json([
            'games' => Game::where('is_active', true)->get(),
        ]);
    }
}
