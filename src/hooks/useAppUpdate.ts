import { useState, useEffect, useCallback } from 'react';
import { appUpdateService, AppVersionInfo } from '../services/appUpdateService';

interface UseAppUpdateReturn {
  isUpdateAvailable: boolean;
  updateDetails: {
    version: string;
    buildTimestamp: string;
    changes?: string[];
  } | null;
  checkForUpdate: () => Promise<void>;
  acceptUpdate: () => void;
  dismissUpdate: () => void;
  isChecking: boolean;
}

const CHECK_INTERVAL = 2 * 60 * 1000; // Check every 2 minutes (more frequent for faster detection)
const INITIAL_DELAY = 10 * 1000; // Wait 10 seconds after mount before first check (faster initial check)

export const useAppUpdate = (): UseAppUpdateReturn => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [updateDetails, setUpdateDetails] = useState<{
    version: string;
    buildTimestamp: string;
    changes?: string[];
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [dismissedBuildId, setDismissedBuildId] = useState<string | null>(null);

  // Load dismissed build ID from localStorage
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('dismissedUpdateBuildId');
      if (dismissed) {
        setDismissedBuildId(dismissed);
      }
    } catch (error) {
      // Ignore storage errors
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    // Don't check if already checking
    if (isChecking) return;

    setIsChecking(true);
    try {
      const hasUpdate = await appUpdateService.checkForUpdate();
      
      if (hasUpdate) {
        const details = await appUpdateService.getUpdateDetails();
        const serverVersion = await appUpdateService.getServerVersion();
        
        // Check if this update was already dismissed
        if (dismissedBuildId === serverVersion.buildId) {
          setIsUpdateAvailable(false);
          setUpdateDetails(null);
        } else {
          setIsUpdateAvailable(true);
          setUpdateDetails(details);
        }
      } else {
        setIsUpdateAvailable(false);
        setUpdateDetails(null);
      }
    } catch (error) {
      // Silently fail - don't show errors for version checks
      setIsUpdateAvailable(false);
      setUpdateDetails(null);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, dismissedBuildId]);

  const acceptUpdate = useCallback(() => {
    // Store the new version before reloading
    if (updateDetails) {
      const newVersion: AppVersionInfo = {
        version: updateDetails.version,
        buildTimestamp: updateDetails.buildTimestamp,
        buildId: `${updateDetails.version}-${updateDetails.buildTimestamp}`
      };
      appUpdateService.setClientVersion(newVersion);
    }
    
    // Clear dismissed build ID
    try {
      localStorage.removeItem('dismissedUpdateBuildId');
    } catch (error) {
      // Ignore storage errors
    }
    
    // Reload the page
    window.location.reload();
  }, [updateDetails]);

  const dismissUpdate = useCallback(() => {
    // Store the dismissed build ID
    if (updateDetails) {
      const buildId = `${updateDetails.version}-${updateDetails.buildTimestamp}`;
      try {
        localStorage.setItem('dismissedUpdateBuildId', buildId);
        setDismissedBuildId(buildId);
      } catch (error) {
        // Ignore storage errors
      }
    }
    
    setIsUpdateAvailable(false);
    setUpdateDetails(null);
  }, [updateDetails]);

  // Set up periodic checking
  useEffect(() => {
    // Initial check after delay
    const initialTimeout = setTimeout(() => {
      checkForUpdate();
    }, INITIAL_DELAY);

    // Set up interval for periodic checks
    const interval = setInterval(() => {
      checkForUpdate();
    }, CHECK_INTERVAL);

    // Also check when window gains focus (user returns to tab)
    const handleFocus = () => {
      checkForUpdate();
    };
    
    // Check on network reconnection (user comes back online)
    const handleOnline = () => {
      checkForUpdate();
    };
    
    // Check on visibility change (tab becomes visible)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdate();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  // Store initial version on mount
  useEffect(() => {
    const storeInitialVersion = async () => {
      const clientVersion = appUpdateService.getClientVersion();
      if (!clientVersion) {
        // No stored version, get from server and store it
        try {
          const serverVersion = await appUpdateService.getServerVersion();
          appUpdateService.setClientVersion(serverVersion);
        } catch (error) {
          // Ignore errors
        }
      }
    };
    storeInitialVersion();
  }, []);

  return {
    isUpdateAvailable,
    updateDetails,
    checkForUpdate,
    acceptUpdate,
    dismissUpdate,
    isChecking
  };
};

