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
            'client_seed' => ['nullable', 'string', 'max:64'],
            'wallet_id' => ['nullable', 'integer', 'exists:wallets,id'],
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
            foreach ($this->input('bets', []) as $index => $bet) {
                $type = $bet['bet_type'] ?? null;
                $value = $bet['bet_value'] ?? [];
 
                $valid = match ($type) {
                    'straight' => is_array($value['numbers'] ?? null)
                        && count($value['numbers']) === 1
                        && is_int($value['numbers'][0])
                        && $value['numbers'][0] >= 0
                        && $value['numbers'][0] <= 36,
                    'dozen' => in_array($value['dozen'] ?? null, [1, 2, 3], true),
                    'column' => in_array($value['column'] ?? null, [1, 2, 3], true),
                    'red', 'black', 'even', 'odd', 'low', 'high' => true,
                    default => false,
                };
 
                if (! $valid) {
                    $validator->errors()->add("bets.$index.bet_value", 'Invalid bet value for this bet type.');
                }
            }
        });
    }
}
