import api from "../apiClient";

const backupApi = api;

// Types
export interface Backup {
  id: number;
  name: string;
  size: string;
  createdAt: string;
  compression: 'none' | 'zip' | 'gzip';
  comments?: string;
}

export interface BackupStats {
  total_backups: number;
  total_size: string;
  total_size_bytes: number;
  compression_stats: Array<{
    compression: string;
    count: number;
    total_size: string;
    total_size_bytes: number;
  }>;
  recent_backups: Backup[];
  storage_info: {
    path: string;
    exists: boolean;
    writable: boolean;
    free_space: string;
  };
}

export interface CreateBackupRequest {
  comments?: string;
  compression: 'none' | 'zip' | 'gzip';
  include_data?: boolean;
  include_schema?: boolean;
}

export interface CreateBackupResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    size: string;
    path: string;
    created_at: string;
    compression: 'none' | 'zip' | 'gzip';
    comments?: string;
  };
}

export interface ActionRequest {
  action: 'view' | 'download' | 'restore' | 'delete' | 'test';
  id?: number;
}

export interface BackupContent {
  id: number;
  name: string;
  content: string;
  size: number;
  extension: string;
  download_url?: string;
}

export interface RestoreResponse {
  success: boolean;
  message: string;
  data: {
    backup_name: string;
    queries_executed: number;
    errors_encountered: number;
    restored_at: string;
  };
}

export interface SystemTest {
  success: boolean;
  data?: {
    database: {
      connected: boolean;
      name: string;
      host: string;
      port: number;
      table_count: number;
      size: string;
      mysql_version: string;
    };
    storage: {
      backup_directory: string;
      full_path: string;
      exists: boolean;
      writable: boolean;
      free_space: string;
    };
    php_extensions: {
      pdo_mysql: boolean;
      zip: boolean;
      zlib: boolean;
    };
    system: {
      php_version: string;
      laravel_version: string;
      memory_limit: string;
      max_execution_time: string;
    };
  };
  message?: string;
}

// API Methods
export const backupApiService = {
  /**
   * Test system connectivity and requirements
   */
  testSystem: async (): Promise<SystemTest> => {
    try {
      const response = await backupApi.get('/backups/test');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'System test failed');
    }
  },

  /**
   * Get all backups
   */
  getBackups: async (): Promise<Backup[]> => {
    try {
      const response = await backupApi.get('/backups');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch backups');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch backups');
    }
  },

  /**
   * Create a new backup
   */
  createBackup: async (data: CreateBackupRequest): Promise<CreateBackupResponse> => {
    try {
      const response = await backupApi.post('/backups', data);
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Backup creation failed');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Backup creation failed');
    }
  },

  /**
   * Upload a backup file
   */
  uploadBackup: async (file: File, comments?: string, autoRestore: boolean = true): Promise<CreateBackupResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (comments) {
        formData.append('comments', comments);
      }
      formData.append('auto_restore', autoRestore ? '1' : '0');

      const response = await backupApi.post('/backups/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Upload failed');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Upload failed');
    }
  },

  /**
   * Perform backup actions (view, download, restore, delete)
   */
  performAction: async (action: ActionRequest): Promise<any> => {
    try {
      const response = await backupApi.post('/backups/action', action);
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Action failed');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Action failed');
    }
  },

  /**
   * View backup content
   */
  viewBackup: async (id: number): Promise<BackupContent> => {
    const response = await backupApiService.performAction({ action: 'view', id });
    return response.data;
  },

  /**
   * Get download info for backup
   */
  getDownloadInfo: async (id: number): Promise<BackupContent> => {
    const response = await backupApiService.performAction({ action: 'download', id });
    return response.data;
  },

  /**
   * Restore database from backup
   */
  restoreBackup: async (id: number): Promise<RestoreResponse> => {
    return await backupApiService.performAction({ action: 'restore', id });
  },

  /**
   * Delete backup
   */
  deleteBackup: async (id: number): Promise<{ success: boolean; message: string; data: any }> => {
    return await backupApiService.performAction({ action: 'delete', id });
  },

  /**
   * Get backup statistics
   */
  getStatistics: async (): Promise<BackupStats> => {
    try {
      const response = await backupApi.get('/backups/stats');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to get statistics');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get statistics');
    }
  },

  /**
   * Direct download backup file
   */
  downloadBackupFile: async (id: number): Promise<void> => {
    try {
      // Use the action endpoint to get download info first
      const downloadInfo = await backupApiService.getDownloadInfo(id);
      
      if (downloadInfo.download_url) {
        // If backend provides a download URL, use it directly
        window.location.href = downloadInfo.download_url;
      } else if (downloadInfo.content) {
        // If we have base64 content, decode and download
        const binaryString = atob(downloadInfo.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { 
          type: 'application/octet-stream' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${downloadInfo.name}.${downloadInfo.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('No download URL or content available from server');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Download failed');
    }
  },

  /**
 * View backup content in new window
 */
viewBackupContent: async (id: number): Promise<boolean> => {
  try {
    const backupContent = await backupApiService.viewBackup(id);
    
    // Create a new window/tab with the backup content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${backupContent.name}</title>
            <style>
              body { 
                font-family: monospace; 
                white-space: pre-wrap; 
                margin: 20px; 
                background: #f5f5f5; 
              }
              pre { 
                background: white; 
                padding: 20px; 
                border-radius: 5px; 
                border: 1px solid #ddd; 
                max-width: 100%; 
                overflow-x: auto; 
              }
            </style>
          </head>
          <body>
            <h2>${backupContent.name}</h2>
            <pre>${backupContent.content}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
      return true;
    }
    return false;
  } catch (error: any) {
    throw new Error(error.message || 'View backup failed');
  }
},
};

export default backupApiService;
