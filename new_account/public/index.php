<?php
/**
 * SPA fallback for LiteSpeed/cPanel when mod_rewrite is disabled in subfolders.
 * Serves index.html for any non-file route under /sky_erp/
 */
declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$base = '/sky_erp';

// Serve existing files (assets, images, etc.)
$relative = substr($uri, strlen($base));
$relative = $relative === '' ? '/' : $relative;
$candidate = __DIR__ . $relative;

if ($relative !== '/' && $relative !== '/index.html' && is_file($candidate)) {
    $ext = strtolower(pathinfo($candidate, PATHINFO_EXTENSION));
    $types = [
        'js' => 'application/javascript',
        'css' => 'text/css',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'json' => 'application/json',
        'map' => 'application/json',
    ];
    if (isset($types[$ext])) {
        header('Content-Type: ' . $types[$ext]);
    }
    readfile($candidate);
    exit;
}

$indexFile = __DIR__ . '/index.html';
if (!is_file($indexFile)) {
    http_response_code(500);
    echo 'index.html missing';
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
readfile($indexFile);
