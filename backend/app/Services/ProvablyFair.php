<?php

namespace App\Services;

use Illuminate\Support\Str;

/*
 * Combine the client's seed and a counter, run them through a keyed cryptographic hash using 
 * the secret server seed as the key and producing an output nobody could have predicted without knowing that secret. 
 * Take a chunk of that output, treat it as a big number, and squeeze it down into the range 
 * we need (0–36 for roulette) via modulo. Because the server seed's hash was published before the round, 
 * and the actual seed only gets revealed after, anyone can later verify this exact calculation reproduces the same 
 * winning number proving the result wasn't manipulated
 */

class ProvablyFair
{
    public static function generateServerSeed(): string
    {
        return Str::random(32);
    }

    public static function hashServerSeed(string $serverSeed): string
    {
        return hash('sha256', $serverSeed);
    }

    /*
     * $serverSeed      - the secret random string generated server-side, hidden from the player until after the round resolves
     * $clientSeed      - a string the player can influence (or that we auto-generate for them)
     * $nonce           - a counter, currently always passed as 0 in our code (may be changed later if we gonna reuse $server_seed)
     * $modulo          - the size of the range the final number to fall into. For example, European roulette has 37 pockets (0 to 36)
     */
    public static function resolveNumber(string $serverSeed, string $clientSeed, int $nonce, int $modulo): int
    {
        /*
         * hash_hmac()  - the cryptographic core
         * HMAC stands for Hash-based Message Authentication Code. It's a specific, well-studied way of 
         * combining a secret key with a message to produce a fixed-length, unpredictable output
         * 
         * The output is a 64-character hexadecimal string (SHA-256 produces 256 bits = 32 bytes = 64 hex characters), something like:
         * a3f9c8e1d4b7... (64 hex chars total)
         */
        $combined = hash_hmac('sha256', "{$clientSeed}:{$nonce}", $serverSeed);

        /*
         * Next: substr($combined, 0, 8) takes the first 8 characters of that 64-character hex string ($combined)
         * just truncation as we don't need the full cryptographic output, only enough of it to derive one number
         * 
         * hexdec() converts a hexadecimal string into its decimal (base-10) integer equivalent. 
         * Hexadecimal is base-16 (digits 0-9 and a-f); this function does the base conversion.
         * 
         * var_dump(hexdec("a3f9c8e1")); // 2751612129 (some large integer)
         * 
         * 8 hex characters means each character can be one of 16 values, so the total range is 16^8 = 4,294,967,296
         * which not coincidentally is exactly 2^32. So $decimal ends up being some integer between 0 and 4,294,967,295
         */
        $decimal = hexdec(substr($combined, 0, 8));
        
        /*
         * % $modulo    - the final step, and where the documented bias comes from
         * 
         * The % (modulo) operator gives the remainder after division. If $decimal can be any 
         * of ~4.29 billion values, and we want a result in [0, 36], taking $decimal % 37 maps that huge range down into 37 buckets.
         * 
         * Since it's not a whole number, the 37 possible remainder-buckets (0 to 36) aren't all hit by exactly the same number 
         * of possible $decimal values. A handful of numbers near the low end of the range get one extra "hit" compared to others. 
         * This is modulo bias: a well-known, well-understood phenomenon anytime we take (large range) % (number that doesn't evenly divide it)
         */
        return $decimal % $modulo;
    }
}