<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class IpGeolocationService
{
    /**
     * @return array{
     *     ip_country: ?string,
     *     ip_region: ?string,
     *     ip_city: ?string,
     *     ip_isp: ?string,
     *     location_summary: string
     * }
     */
    public function lookup(?string $ip): array
    {
        if ($ip === null || $ip === '' || $this->isPrivateIp($ip)) {
            return [
                'ip_country' => null,
                'ip_region' => null,
                'ip_city' => null,
                'ip_isp' => null,
                'location_summary' => 'Local / private network',
            ];
        }

        return Cache::remember("ip_geo:{$ip}", 86400, function () use ($ip) {
            try {
                $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}", [
                    'fields' => 'status,country,regionName,city,isp,query',
                ]);

                if ($response->ok() && $response->json('status') === 'success') {
                    $country = $response->json('country');
                    $region = $response->json('regionName');
                    $city = $response->json('city');
                    $isp = $response->json('isp');
                    $parts = array_values(array_filter([$city, $region, $country]));

                    return [
                        'ip_country' => $country,
                        'ip_region' => $region,
                        'ip_city' => $city,
                        'ip_isp' => $isp,
                        'location_summary' => $parts !== [] ? implode(', ', $parts) : 'Unknown location',
                    ];
                }
            } catch (\Throwable) {
                // ignore lookup failures
            }

            return [
                'ip_country' => null,
                'ip_region' => null,
                'ip_city' => null,
                'ip_isp' => null,
                'location_summary' => 'Unknown location',
            ];
        });
    }

    private function isPrivateIp(string $ip): bool
    {
        if ($ip === '127.0.0.1' || $ip === '::1') {
            return true;
        }

        return ! filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }
}
