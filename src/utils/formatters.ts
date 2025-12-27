// Currency formatting (handles auto-generated currency codes)
export const formatCurrency = (amount: number, currency: string = 'USD', currencySymbol?: string): string => {
  // If currencySymbol is provided, use it directly
  if (currencySymbol) {
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${currencySymbol}${formattedNumber}`;
  }
  
  // Check if currency is a valid ISO 4217 code (3 uppercase letters)
  const isISOCode = /^[A-Z]{3}$/.test(currency);
  
  if (isISOCode) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback if currency code is invalid
      const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
      return `${currency} ${formattedNumber}`;
    }
  } else {
    // For auto-generated codes (like HAM-CUR-0001), format without currency style
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return formattedNumber; // Return formatted number without symbol if code is invalid
  }
};

// Helper function to get system default currency
export const getSystemCurrency = (): string => {
  // This will be overridden by components that have access to company settings
  // Default fallback to USD
  return 'USD';
};

// Enhanced currency formatting with system default
export const formatCurrencyWithSystemDefault = (amount: number, systemCurrency?: string): string => {
  const currency = systemCurrency || getSystemCurrency();
  return formatCurrency(amount, currency);
};

// Number formatting
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Date formatting
export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

// Date and time formatting
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Percentage formatting
export const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};