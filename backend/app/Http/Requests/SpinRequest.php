<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Domain\Games\Roulette\RouletteEngine;
use Illuminate\Validation\Validator;

class SpinRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /*
             * No exists:wallets,id - it would answer 422 for an id that doesn't exist and
             * 404 (from the controller's ownership lookup) for someone else's, telling
             * the two apart. The ownership lookup alone gives 404 for both.
             */
            'wallet_id' => ['nullable', 'integer'],
            'bets' => ['required', 'array', 'min:1', 'max:20'],
            'bets.*.bet_type' => ['required', 'string', Rule::in(RouletteEngine::supportedBetTypes())],
            'bets.*.bet_value' => ['nullable', 'array'],
            'bets.*.amount' => ['required', 'numeric', 'min:0.01', 'decimal:0,2'],
        ];
    }

    /*
     * bet_value's expected shape depends on bet_type, which plain rules()
     * can't express cleanly so validated here instead
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $bets = $this->input('bets');

            /* A non-array 'bets' is already reported by rules() */
            if (! is_array($bets)) {
                return;
            }

            foreach ($bets as $index => $bet) {
                $type = is_array($bet) ? ($bet['bet_type'] ?? null) : null;

                /* So is a missing or unknown bet_type */
                if (! in_array($type, RouletteEngine::supportedBetTypes(), true)) {
                    continue;
                }

                if (RouletteEngine::normalizeBetValue($type, $bet['bet_value'] ?? []) === null) {
                    $validator->errors()->add("bets.$index.bet_value", 'Invalid bet value for this bet type.');
                }
            }
        });
    }

    /*
     * The validated bets with each bet_value normalized - what the controller reads
     * instead of raw input, so only known keys are ever stored
     */
    public function bets(): array
    {
        return array_map(fn (array $bet) => [
            'bet_type' => $bet['bet_type'],
            'bet_value' => RouletteEngine::normalizeBetValue($bet['bet_type'], $bet['bet_value'] ?? []),
            'amount' => $bet['amount'],
        ], $this->validated('bets'));
    }
}
