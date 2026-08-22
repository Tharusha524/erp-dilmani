<?php

namespace App\Providers;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;
use League\Flysystem\GoogleCloudStorage\GoogleCloudStorageAdapter;
use League\Flysystem\GoogleCloudStorage\UniformBucketLevelAccessVisibility;

/**
 * Registers a "gcs" filesystem disk (config/filesystems.php) backed by
 * Google Cloud Storage, so config('filesystems.disks.gcs') / Storage::disk('gcs')
 * works the same way the built-in "local"/"s3" disks do.
 */
class GoogleCloudStorageServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Storage::extend('gcs', function ($app, array $config) {
            $keyFilePath = $config['key_file'] ?? null;

            $client = new StorageClient([
                'projectId' => $config['project_id'] ?? null,
                'keyFilePath' => $keyFilePath && file_exists($keyFilePath) ? $keyFilePath : null,
            ]);

            $bucket = $client->bucket($config['bucket']);

            // Buckets with Uniform Bucket-Level Access (the modern GCS default)
            // reject legacy per-object ACL calls entirely — public/private access
            // is controlled by the bucket's IAM policy instead, so visibility
            // here is a no-op rather than the ACL-based default handler.
            $adapter = new GoogleCloudStorageAdapter(
                $bucket,
                $config['path_prefix'] ?? '',
                new UniformBucketLevelAccessVisibility()
            );

            $filesystem = new Filesystem($adapter, $config);

            return new FilesystemAdapter($filesystem, $adapter, $config);
        });
    }
}
