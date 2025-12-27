import axios from 'axios';

export interface AppVersionInfo {
  version: string;
  buildTimestamp: string;
  buildId: string;
}

const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${protocol}//${hostname}${port}/api`;
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};

// Create a simple axios instance for version check (no auth required)
const versionApi = axios.create({
  baseURL: getBaseUrl(),
  timeout: 5000,
  withCredentials: false, // Version check doesn't need cookies
});

export const appUpdateService = {
  // Get current app version from server
  getServerVersion: async (): Promise<AppVersionInfo> => {
    try {
      const response = await versionApi.get<{ success: boolean; data: AppVersionInfo }>('/app-version');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Invalid response format');
    } catch (error: any) {
      // If version check fails, return a default version
      return {
        version: '1.0.0',
        buildTimestamp: new Date().toISOString(),
        buildId: 'unknown'
      };
    }
  },

  // Get stored client version from localStorage
  getClientVersion: (): AppVersionInfo | null => {
    try {
      const stored = localStorage.getItem('appVersion');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // Invalid stored version
      localStorage.removeItem('appVersion');
    }
    return null;
  },

  // Store client version in localStorage
  setClientVersion: (versionInfo: AppVersionInfo): void => {
    try {
      localStorage.setItem('appVersion', JSON.stringify(versionInfo));
    } catch (error) {
      // Storage failed, ignore
    }
  },

  // Check if there's a new version available
  checkForUpdate: async (): Promise<boolean> => {
    try {
      const serverVersion = await appUpdateService.getServerVersion();
      const clientVersion = appUpdateService.getClientVersion();

      // If no client version stored, store current server version and return false
      if (!clientVersion) {
        appUpdateService.setClientVersion(serverVersion);
        return false;
      }

      // Compare build IDs (version + timestamp)
      return serverVersion.buildId !== clientVersion.buildId;
    } catch (error) {
      // If check fails, assume no update
      return false;
    }
  },

  // Get update details (changelog, etc.) - can be extended later
  getUpdateDetails: async (): Promise<{ version: string; buildTimestamp: string; changes?: string[] }> => {
    try {
      const serverVersion = await appUpdateService.getServerVersion();
      return {
        version: serverVersion.version,
        buildTimestamp: serverVersion.buildTimestamp,
        changes: [
          'Bug fixes and performance improvements',
          'Enhanced user experience',
          'Updated features'
        ] // Default changes - can be fetched from server in the future
      };
    } catch (error) {
      throw error;
    }
  }
};

