/**
 * Unified Image Utility Service
 * Handles image URL generation, error handling, and fallbacks across all modules
 */

// Get the base URL for API calls
const getBaseUrl = (): string => {
  // In production, try to detect the current hostname if REACT_APP_API_URL is not set
  if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
    // Use the current window location to determine the API URL
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${protocol}//${hostname}${port}/api`;
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};

// Get the server base URL (without /api)
const getServerBaseUrl = (): string => {
  const baseUrl = getBaseUrl();
  return baseUrl.replace('/api', '');
};

/**
 * Generate image URL for any module
 * @param imagePath - The image path from database (filename or relative path)
 * @param module - The module name (e.g., 'products', 'sales-agents', 'product-brand-names')
 * @returns Complete image URL
 */
export const getImageUrl = (imagePath: string, module: string): string => {
  if (!imagePath) return '';
  
  const serverBaseUrl = getServerBaseUrl();
  
  // Handle different path formats
  let cleanPath = imagePath;
  
  // Remove leading slash if present
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }
  
  // If path already includes uploads directory, use as is
  if (cleanPath.includes('uploads/')) {
    return `${serverBaseUrl}/${cleanPath}`;
  }
  
  // Otherwise, construct the path based on module
  const moduleUploadPath = getModuleUploadPath(module);
  return `${serverBaseUrl}/uploads/${moduleUploadPath}/${cleanPath}`;
};

/**
 * Get the upload directory path for different modules
 */
const getModuleUploadPath = (module: string): string => {
  const modulePaths: Record<string, string> = {
    'products': 'products',
    'sales-agents': 'sales-agent-photos',
    'product-brand-names': 'product-brand-name-logos',
    'product-manufacturers': 'product-manufacturer-logos',
    'product-models': 'product-model-logos',
    'users': 'profile-pictures', // Backend saves profile pictures to profile-pictures directory
    'companies': 'company-logos'
  };
  
  return modulePaths[module] || 'uploads';
};

/**
 * Test if an image URL is accessible
 * @param url - The image URL to test
 * @returns Promise<boolean> - True if image is accessible
 */
export const testImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Get image URL with fallback testing
 * @param imagePath - The image path from database
 * @param module - The module name
 * @returns Promise<string> - The working image URL or empty string
 */
export const getImageUrlWithFallback = async (imagePath: string, module: string): Promise<string> => {
  if (!imagePath) return '';
  
  const url = getImageUrl(imagePath, module);
  const isAccessible = await testImageUrl(url);
  
  return isAccessible ? url : '';
};

// Legacy function for backward compatibility
export const getUploadUrl = (path: string): string => {
  return getImageUrl(path, 'products');
};
