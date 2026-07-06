<?php

namespace App\Http\Controllers;

use App\Models\Backup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use PDO;
use PDOException;

class BackupController extends Controller
{
    private string $backupDir = 'backups'; // Subfolder in storage/app/
    
    /**
     * Display a listing of the backups.
     */
    public function index(): JsonResponse
    {
        try {
            // Check for manual dump files in root for convenience
            $this->syncManualBackups();

            $backups = Backup::orderBy('created_at', 'desc')->get()
                ->map(function ($backup) {
                    return [
                        'id' => $backup->id,
                        'name' => $backup->display_name,
                        'size' => $backup->formatted_size,
                        'createdAt' => $backup->created_at->format('Y-m-d H:i'),
                        'compression' => $backup->compression,
                        'comments' => $backup->comments,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $backups,
                'count' => $backups->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch backups: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch backups: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync manual dump files in root or storage to database
     */
    private function syncManualBackups(): void
    {
        try {
            // Check root for .sql files
            $rootDumps = glob(base_path('*.sql'));
            
            foreach ($rootDumps as $dump) {
                $fileName = basename($dump);
                $cleanName = pathinfo($fileName, PATHINFO_FILENAME);
                
                // If not already in DB, add it
                if (!Backup::where('file_name', $cleanName)->exists()) {
                    Backup::create([
                        'file_name' => $cleanName,
                        'file_path' => $dump,
                        'size' => filesize($dump),
                        'comments' => 'Detected in root directory',
                        'compression' => 'none',
                    ]);
                    Log::info("Synced manual backup from root: {$fileName}");
                }
            }

            // Also check storage/app/backups just in case files exist without DB records
            $backupPath = storage_path("app/{$this->backupDir}");
            if (file_exists($backupPath)) {
                $storageFiles = glob($backupPath . '/*.{sql,zip,gz}', GLOB_BRACE);
                foreach ($storageFiles as $file) {
                    $fileName = basename($file);
                    $cleanName = pathinfo($fileName, PATHINFO_FILENAME);
                    // Handle double extensions like .sql.gz
                    if (str_ends_with($fileName, '.sql.gz')) $cleanName = substr($fileName, 0, -7);
                    elseif (str_ends_with($fileName, '.sql.zip')) $cleanName = substr($fileName, 0, -8);

                    if (!Backup::where('file_name', $cleanName)->exists()) {
                        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                        $compression = match($extension) {
                            'zip' => 'zip',
                            'gz' => 'gzip',
                            default => 'none',
                        };

                        Backup::create([
                            'file_name' => $cleanName,
                            'file_path' => $file,
                            'size' => filesize($file),
                            'comments' => 'Detected in storage directory',
                            'compression' => $compression,
                        ]);
                        Log::info("Synced manual backup from storage: {$fileName}");
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning("Failed to sync manual backups: " . $e->getMessage());
        }
    }

    /**
     * Create a new database backup using PDO.
     */
    public function create(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'comments' => 'nullable|string|max:500',
                'compression' => 'required|in:none,zip,gzip',
                'include_data' => 'boolean|nullable',
                'include_schema' => 'boolean|nullable',
            ]);

            // Get database configuration
            $dbConfig = config('database.connections.mysql');
            
            // Create backup directory if it doesn't exist
            $backupPath = storage_path("app/{$this->backupDir}");
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0755, true);
            }
            
            // Generate filename and path
            $timestamp = now()->format('Y-m-d_H-i-s');
            $dumpFile = 'backup_' . $timestamp;
            $sqlFilePath = storage_path("app/{$this->backupDir}/{$dumpFile}.sql");
            
            // Generate SQL backup using PDO
            Log::info('Starting database backup generation...');
            $sqlContent = $this->generateBackupWithPDO(
                $dbConfig,
                $request->boolean('include_schema', true),
                $request->boolean('include_data', true)
            );
            
            if (empty($sqlContent)) {
                throw ValidationException::withMessages([
                    'error' => 'Empty SQL backup generated. Database might be empty or no tables found.'
                ]);
            }
            
            // Write SQL content to file
            if (file_put_contents($sqlFilePath, $sqlContent) === false) {
                throw new \Exception('Failed to write SQL file to storage');
            }
            
            $originalSize = filesize($sqlFilePath);
            Log::info("Backup file created: {$sqlFilePath} ({$originalSize} bytes)");
            
            $finalPath = $sqlFilePath;
            $finalSize = $originalSize;
            $compression = $request->compression;
            $finalFileName = $dumpFile;
            
            // Apply compression if requested
            if ($compression !== 'none') {
                $compressedPath = $this->compressBackupFile($sqlFilePath, $compression);
                
                if ($compressedPath && file_exists($compressedPath)) {
                    // Remove original uncompressed file
                    unlink($sqlFilePath);
                    $finalPath = $compressedPath;
                    $finalSize = filesize($compressedPath);
                    $finalFileName = $dumpFile . '.' . ($compression === 'gzip' ? 'gz' : 'zip');
                    Log::info("Backup compressed: {$compressedPath} ({$finalSize} bytes)");
                } else {
                    // Compression failed, keep uncompressed
                    Log::warning('Compression failed, keeping uncompressed backup');
                    $compression = 'none';
                    $finalFileName = $dumpFile . '.sql';
                }
            } else {
                $finalFileName = $dumpFile . '.sql';
            }
            
            // Store backup record in database
            $backup = Backup::create([
                'file_name' => $dumpFile, // Store without extension
                'file_path' => $finalPath,
                'size' => $finalSize,
                'comments' => $request->comments,
                'compression' => $compression,
            ]);
            
            Log::info("Backup created successfully: ID {$backup->id}, {$backup->display_name}");
            
            return response()->json([
                'success' => true,
                'message' => 'Backup created successfully',
                'data' => [
                    'id' => $backup->id,
                    'name' => $backup->display_name,
                    'size' => $backup->formatted_size,
                    'path' => $backup->file_path,
                    'created_at' => $backup->created_at->format('Y-m-d H:i:s'),
                    'compression' => $backup->compression,
                    'comments' => $backup->comments,
                ]
            ], 201);
            
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Backup creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Backup creation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate SQL backup using PDO.
     */
    private function generateBackupWithPDO(array $dbConfig, bool $includeSchema = true, bool $includeData = true): string
    {
        $sqlScript = "";
        $pdo = null;
        
        try {
            // Create PDO connection
            $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset=utf8mb4";
            Log::info("Connecting to database: {$dbConfig['host']}:{$dbConfig['port']}/{$dbConfig['database']}");
            
            $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
            ]);
            
            // Add backup header
            $sqlScript .= "-- MySQL Backup\n";
            $sqlScript .= "-- Generated: " . now()->format('Y-m-d H:i:s') . "\n";
            $sqlScript .= "-- Database: {$dbConfig['database']}\n";
            $sqlScript .= "-- Host: {$dbConfig['host']}:{$dbConfig['port']}\n";
            $sqlScript .= "-- --------------------------------------------------------\n\n";
            
            // Disable foreign key checks
            $sqlScript .= "/*!40101 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;\n";
            $sqlScript .= "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;\n\n";
            
            // Get all tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($tables)) {
                Log::warning('No tables found in database');
                return $sqlScript;
            }
            
            Log::info("Found " . count($tables) . " tables to backup");
            
            foreach ($tables as $table) {
                Log::debug("Processing table: {$table}");
                
                if ($includeSchema) {
                    // Get table creation script
                    $stmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
                    $createTable = $stmt->fetch();
                    
                    if ($createTable && isset($createTable['Create Table'])) {
                        $sqlScript .= "--\n";
                        $sqlScript .= "-- Table structure for table `{$table}`\n";
                        $sqlScript .= "--\n\n";
                        $sqlScript .= "DROP TABLE IF EXISTS `{$table}`;\n";
                        $sqlScript .= $createTable['Create Table'] . ";\n\n";
                    }
                }
                
                if ($includeData) {
                    // Get row count first
                    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM `{$table}`");
                    $rowCount = $countStmt->fetch()['count'];
                    
                    if ($rowCount > 0) {
                        Log::debug("Exporting {$rowCount} rows from table: {$table}");
                        
                        $sqlScript .= "--\n";
                        $sqlScript .= "-- Dumping data for table `{$table}`\n";
                        $sqlScript .= "--\n\n";
                        
                        // Get table data in chunks to avoid memory issues
                        $limit = 1000;
                        $offset = 0;
                        
                        do {
                            $stmt = $pdo->query("SELECT * FROM `{$table}` LIMIT {$limit} OFFSET {$offset}");
                            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                            
                            if (empty($rows)) break;
                            
                            // Get column names from first row
                            $columnNames = array_keys($rows[0]);
                            
                            foreach ($rows as $row) {
                                // Escape values properly
                                $escapedValues = array_map(function($value) use ($pdo) {
                                    if (is_null($value)) {
                                        return 'NULL';
                                    }
                                    if (is_numeric($value) && !is_string($value)) {
                                        return $value;
                                    }
                                    // Escape special characters
                                    return $pdo->quote($value);
                                }, array_values($row));
                                
                                $sqlScript .= "INSERT INTO `{$table}` (`" . 
                                    implode('`, `', $columnNames) . 
                                    "`) VALUES (" . implode(', ', $escapedValues) . ");\n";
                            }
                            
                            $offset += $limit;
                        } while (!empty($rows));
                        
                        $sqlScript .= "\n";
                    } else {
                        $sqlScript .= "-- Table `{$table}` is empty\n\n";
                    }
                }
            }
            
            // Re-enable foreign key checks
            $sqlScript .= "\n/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;\n";
            $sqlScript .= "/*!40101 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;\n";
            
            Log::info("Backup SQL generated successfully, size: " . strlen($sqlScript) . " bytes");
            
            return $sqlScript;
            
        } catch (PDOException $e) {
            Log::error('PDO Error during backup: ' . $e->getMessage());
            throw new \Exception('Database connection error: ' . $e->getMessage());
        } finally {
            // Close connection
            $pdo = null;
        }
    }

    /**
     * Compress backup file.
     */
    private function compressBackupFile(string $sourcePath, string $method): ?string
    {
        try {
            $sourceDir = dirname($sourcePath);
            $sourceName = basename($sourcePath, '.sql');
            
            if ($method === 'gzip') {
                $destPath = $sourceDir . '/' . $sourceName . '.sql.gz';
                
                // Read source file
                $content = file_get_contents($sourcePath);
                if ($content === false) {
                    throw new \Exception('Failed to read source file for compression');
                }
                
                // Compress with gzip
                $compressed = gzencode($content, 9);
                if ($compressed === false) {
                    throw new \Exception('Gzip compression failed');
                }
                
                // Write compressed file
                if (file_put_contents($destPath, $compressed) === false) {
                    throw new \Exception('Failed to write compressed file');
                }
                
                return $destPath;
                
            } elseif ($method === 'zip') {
                $destPath = $sourceDir . '/' . $sourceName . '.sql.zip';
                
                $zip = new \ZipArchive();
                if ($zip->open($destPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                    throw new \Exception('Failed to create zip archive');
                }
                
                if (!$zip->addFile($sourcePath, $sourceName . '.sql')) {
                    $zip->close();
                    throw new \Exception('Failed to add file to zip archive');
                }
                
                $zip->close();
                return $destPath;
            }
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('Compression error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Handle backup actions (view, download, restore, delete).
     */
    public function action(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'action' => 'required|string|in:view,download,restore,delete,test',
                'id' => 'required|integer|exists:backups,id',
            ]);

            $backup = Backup::findOrFail($request->id);

            switch ($request->action) {
                case 'view':
                    return $this->viewBackup($backup);
                    
                case 'download':
                    return $this->downloadBackup($backup);
                    
                case 'restore':
                    return $this->restoreBackup($backup);
                    
                case 'delete':
                    return $this->deleteBackup($backup);
                    
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid action'
                    ], 400);
            }
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Backup action failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Action failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * View backup file content.
     */
    private function viewBackup(Backup $backup): JsonResponse
    {
        try {
            if (!file_exists($backup->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            $content = $this->readBackupFile($backup);
            
            if ($content === false) {
                throw new \Exception('Failed to read backup file');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $backup->id,
                    'name' => $backup->display_name,
                    'size' => $backup->formatted_size,
                    'content' => $content,
                    'created_at' => $backup->created_at->format('Y-m-d H:i:s'),
                    'compression' => $backup->compression,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('View backup failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to view backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download backup file.
     */
    private function downloadBackup(Backup $backup): JsonResponse
    {
        try {
            if (!file_exists($backup->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            $content = $this->readBackupFile($backup);
            
            if ($content === false) {
                throw new \Exception('Failed to read backup file');
            }

            // Determine file extension
            $extension = match($backup->compression) {
                'none' => 'sql',
                'gzip' => 'sql.gz',
                'zip' => 'sql.zip',
                default => 'sql'
            };

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $backup->id,
                    'name' => $backup->display_name,
                    'content' => base64_encode($content), // Base64 encode for JSON response
                    'size' => strlen($content),
                    'extension' => $extension,
                    'download_url' => url("api/backups/{$backup->id}/download"),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Download backup failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to prepare download: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore database from backup.
     */
    private function restoreBackup(Backup $backup): JsonResponse
    {
        try {
            if (!file_exists($backup->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found at: ' . $backup->file_path
                ], 404);
            }

            // Increase resources for large restores
            ini_set('memory_limit', '512M');
            ini_set('max_execution_time', 300);

            $sqlContent = $this->readBackupFile($backup);
            
            if ($sqlContent === false || empty($sqlContent)) {
                throw new \Exception('Failed to read or decompress backup file');
            }

            Log::info("Starting database restore from backup: {$backup->display_name}");
            
            // Disable foreign key checks at the connection level
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::statement('SET UNIQUE_CHECKS=0;');
            
            // Split SQL into individual queries and execute
            $queries = $this->splitSqlQueries($sqlContent);
            $executedCount = 0;
            $errorCount = 0;
            $lastError = null;
            
            // Use a transaction for the entire restore or per-query?
            // Per-query is safer if some queries are already valid or have drops.
            foreach ($queries as $query) {
                $query = trim($query);
                if (!empty($query)) {
                    try {
                        // Some queries might fail if they are version-specific or have syntax issues
                        // but we want to continue with the data import if possible.
                        DB::unprepared($query); 
                        $executedCount++;
                    } catch (\Exception $e) {
                        $errorCount++;
                        $lastError = $e->getMessage();
                        Log::warning("Restore query failed: " . substr($query, 0, 50) . "... Error: " . $e->getMessage());
                    }
                }
            }
            
            // Re-enable checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            DB::statement('SET UNIQUE_CHECKS=1;');
            
            Log::info("Database restore completed. Queries: {$executedCount}, Errors: {$errorCount}");
            
            $message = 'Database restored successfully';
            if ($errorCount > 0) {
                $message .= " with {$errorCount} minor errors. Please check the logs if data is missing.";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'backup_name' => $backup->display_name,
                    'queries_executed' => $executedCount,
                    'errors_encountered' => $errorCount,
                    'last_error' => $errorCount > 0 ? substr($lastError, 0, 100) : null,
                    'restored_at' => now()->format('Y-m-d H:i:s'),
                ]
            ]);
            
        } catch (\Exception $e) {
            // Ensure checks are re-enabled even on error
            try {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                DB::statement('SET UNIQUE_CHECKS=1;');
            } catch (\Exception $e2) {
                Log::error('Failed to re-enable foreign key checks: ' . $e2->getMessage());
            }
            
            Log::error('Restore failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Restore failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a backup.
     */
    private function deleteBackup(Backup $backup): JsonResponse
    {
        try {
            $backupId = $backup->id;
            $backupName = $backup->display_name;
            $filePath = $backup->file_path;
            
            // Delete file from storage
            if (file_exists($filePath)) {
                if (!unlink($filePath)) {
                    throw new \Exception('Failed to delete backup file from storage');
                }
            }
            
            // Delete record from database
            $backup->delete();
            
            Log::info("Backup deleted: ID {$backupId}, {$backupName}");
            
            return response()->json([
                'success' => true,
                'message' => 'Backup deleted successfully',
                'data' => [
                    'deleted_id' => $backupId,
                    'deleted_name' => $backupName,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Delete failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Delete failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Read backup file with decompression if needed.
     */
    private function readBackupFile(Backup $backup): string|false
    {
        if (!file_exists($backup->file_path)) {
            return false;
        }

        $content = file_get_contents($backup->file_path);
        
        if ($backup->compression === 'gzip') {
            $content = gzdecode($content);
        } elseif ($backup->compression === 'zip') {
            $zip = new \ZipArchive();
            if ($zip->open($backup->file_path) === true) {
                $content = $zip->getFromIndex(0);
                $zip->close();
            } else {
                return false;
            }
        }
        
        return $content;
    }

    /**
     * Split SQL string into individual queries with better MySQL support.
     */
    private function splitSqlQueries(string $sql): array
    {
        // 1. Remove standard SQL comments (-- and #)
        // Keep lines starting with /*! as they are MySQL execution comments
        $lines = explode("\n", $sql);
        $cleanLines = [];
        
        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            
            // Skip empty lines
            if (empty($trimmedLine)) continue;
            
            // Skip standard comments
            if (str_starts_with($trimmedLine, '--') || str_starts_with($trimmedLine, '#')) {
                continue;
            }
            
            // Keep execution comments /*! ... */ but remove regular comments /* ... */
            if (str_starts_with($trimmedLine, '/*') && !str_starts_with($trimmedLine, '/*!')) {
                // If the line ends with */, skip it
                if (str_ends_with($trimmedLine, '*/')) {
                    continue;
                }
            }
            
            $cleanLines[] = $line;
        }
        
        $sql = implode("\n", $cleanLines);
        
        // 2. Split by semicolon, but be mindfull of strings
        $queries = [];
        $current = '';
        $inString = false;
        $stringChar = '';
        $escaped = false;
        
        $len = strlen($sql);
        for ($i = 0; $i < $len; $i++) {
            $char = $sql[$i];
            
            // Handle escape characters
            if ($char === '\\' && !$escaped) {
                $escaped = true;
                $current .= $char;
                continue;
            }
            
            // Handle string literals
            if (($char === "'" || $char === '"') && !$escaped) {
                if (!$inString) {
                    $inString = true;
                    $stringChar = $char;
                } elseif ($stringChar === $char) {
                    $inString = false;
                }
            }
            
            $current .= $char;
            
            // Split at semicolon if not in string
            if ($char === ';' && !$inString) {
                $queries[] = trim($current);
                $current = '';
            }
            
            $escaped = false;
        }
        
        // Add any remaining query
        if (!empty(trim($current))) {
            $queries[] = trim($current);
        }
        
        return array_filter($queries);
    }

    /**
     * Upload a backup file.
     */
    public function upload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|max:102400', // removed mimes:sql,zip,gz
                'comments' => 'nullable|string|max:500',
                'auto_restore' => 'nullable|boolean',
            ]);

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            
            // Validate extension manually if needed, or rely on file system
            $validExtensions = ['sql', 'zip', 'gz'];
            if (!in_array($extension, $validExtensions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The file must be a file of type: sql, zip, gz.'
                ], 422);
            }

            $originalNameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
            
            // Determine compression type
            $compression = match($extension) {
                'zip' => 'zip',
                'gz', 'gzip' => 'gzip',
                default => 'none',
            };
            
            // Clean filename (remove extension from original name if present)
            $cleanName = preg_replace('/\.(sql|zip|gz)$/i', '', $originalNameWithoutExt);
            
            // Generate unique filename
            $timestamp = now()->format('Y-m-d_H-i-s');
            $fileName = $cleanName . '_' . $timestamp;
            $storageName = $fileName . '.' . ($compression === 'none' ? 'sql' : $extension);
            $fullPath = storage_path("app/{$this->backupDir}/{$storageName}");
            
            // Ensure directory exists
            $backupPath = storage_path("app/{$this->backupDir}");
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0755, true);
            }
            
            // Move uploaded file
            $file->move($backupPath, $storageName);
            
            // Verify file was uploaded successfully
            if (!file_exists($fullPath)) {
                throw new \Exception('File upload failed - file not found after move');
            }
            
            // Get file size
            $size = filesize($fullPath);
            
            // Create backup record
            $backup = Backup::create([
                'file_name' => $fileName, // Store without extension
                'file_path' => $fullPath,
                'size' => $size,
                'comments' => $request->comments ?: 'Uploaded via API',
                'compression' => $compression,
            ]);
            
            Log::info("Backup uploaded: {$backup->display_name} ({$backup->formatted_size})");
            
            $restoreResult = null;
            if ($request->boolean('auto_restore', false)) {
                Log::info("Auto-restore triggered after upload for backup ID: {$backup->id}");
                $restoreResponse = $this->restoreBackup($backup);
                $restoreResult = $restoreResponse->getData();
            }

            return response()->json([
                'success' => true,
                'message' => $restoreResult && $restoreResult->success 
                    ? 'Backup uploaded and database restored successfully' 
                    : 'Backup uploaded successfully',
                'data' => [
                    'id' => $backup->id,
                    'name' => $backup->display_name,
                    'size' => $backup->formatted_size,
                    'created_at' => $backup->created_at->format('Y-m-d H:i:s'),
                    'compression' => $backup->compression,
                    'comments' => $backup->comments,
                    'restore_result' => $restoreResult
                ]
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get backup statistics.
     */
    public function stats(): JsonResponse
    {
        try {
            $totalBackups = Backup::count();
            $totalSize = Backup::sum('size');
            
            $byCompression = Backup::select('compression', DB::raw('COUNT(*) as count'), DB::raw('SUM(size) as total_size'))
                ->groupBy('compression')
                ->get()
                ->map(function ($item) {
                    return [
                        'compression' => $item->compression,
                        'count' => $item->count,
                        'total_size' => $this->formatBytes($item->total_size),
                        'total_size_bytes' => $item->total_size,
                    ];
                });
            
            $recentBackups = Backup::orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($backup) {
                    return [
                        'id' => $backup->id,
                        'name' => $backup->display_name,
                        'size' => $backup->formatted_size,
                        'created_at' => $backup->created_at->format('Y-m-d H:i'),
                        'compression' => $backup->compression,
                    ];
                });
            
            $storagePath = storage_path("app/{$this->backupDir}");
            $storageInfo = [
                'path' => $storagePath,
                'exists' => file_exists($storagePath),
                'writable' => is_writable($storagePath),
                'free_space' => disk_free_space($storagePath) ? $this->formatBytes(disk_free_space($storagePath)) : 'Unknown',
            ];
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_backups' => $totalBackups,
                    'total_size' => $this->formatBytes($totalSize),
                    'total_size_bytes' => $totalSize,
                    'compression_stats' => $byCompression,
                    'recent_backups' => $recentBackups,
                    'storage_info' => $storageInfo,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get backup stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics'
            ], 500);
        }
    }

    /**
     * Test backup functionality.
     */
    public function test(): JsonResponse
    {
        try {
            // Test database connection
            DB::connection()->getPdo();
            $dbConnected = true;
            
            // Test storage
            $storagePath = storage_path("app/{$this->backupDir}");
            $storageWritable = is_writable($storagePath);
            
            // Test required PHP extensions
            $extensions = [
                'pdo_mysql' => extension_loaded('pdo_mysql'),
                'zip' => class_exists('ZipArchive'),
                'zlib' => function_exists('gzencode'),
            ];
            
            // Get database info
            $dbInfo = DB::select("SELECT 
                (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()) as table_count,
                (SELECT SUM(data_length + index_length) FROM information_schema.tables WHERE table_schema = DATABASE()) as db_size,
                VERSION() as mysql_version")[0];
            
            return response()->json([
                'success' => true,
                'data' => [
                    'database' => [
                        'connected' => $dbConnected,
                        'name' => config('database.connections.mysql.database'),
                        'host' => config('database.connections.mysql.host'),
                        'port' => config('database.connections.mysql.port'),
                        'table_count' => $dbInfo->table_count,
                        'size' => $this->formatBytes($dbInfo->db_size),
                        'mysql_version' => $dbInfo->mysql_version,
                    ],
                    'storage' => [
                        'backup_directory' => $this->backupDir,
                        'full_path' => $storagePath,
                        'exists' => file_exists($storagePath),
                        'writable' => $storageWritable,
                        'free_space' => $this->formatBytes(disk_free_space($storagePath)),
                    ],
                    'php_extensions' => $extensions,
                    'system' => [
                        'php_version' => PHP_VERSION,
                        'laravel_version' => app()->version(),
                        'memory_limit' => ini_get('memory_limit'),
                        'max_execution_time' => ini_get('max_execution_time'),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format.
     */
    private function formatBytes($bytes, $precision = 2): string
    {
        if ($bytes <= 0) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}