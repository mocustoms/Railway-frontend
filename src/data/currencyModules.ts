import { Coins, DollarSign, TrendingUp, Globe } from 'lucide-react';
import { Currency } from '../types';

export interface CurrencyStats {
  totalCurrencies: number;
  activeCurrencies: number;
  defaultCurrency: string;
  lastUpdate: string;
}

export interface CurrencyFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  isDefault: 'all' | 'default' | 'non-default';
}

export interface CurrencySortConfig {
  column: keyof Currency;
  direction: 'asc' | 'desc';
}

// Currency status options for filtering
export const currencyStatusOptions = [
  { value: 'all', label: 'All Currencies', color: 'gray' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'red' }
];

// Default currency options for filtering
export const defaultCurrencyOptions = [
  { value: 'all', label: 'All Currencies', color: 'gray' },
  { value: 'default', label: 'Default', color: 'blue' },
  { value: 'non-default', label: 'Non-Default', color: 'gray' }
];

// Sortable columns
export const sortableColumns: (keyof Currency)[] = [
  'name',
  'code',
  'symbol',
  'is_default',
  'is_active',
  'created_at',
  'updated_at'
];

// Countries list for currency selection
export const countriesList = [
  { name: 'United States', code: 'US', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  { name: 'European Union', code: 'EU', currency: 'EUR', symbol: '€', flag: '🇪🇺' },
  { name: 'Japan', code: 'JP', currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { name: 'Canada', code: 'CA', currency: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', currency: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { name: 'Switzerland', code: 'CH', currency: 'CHF', symbol: 'CHF', flag: '🇨🇭' },
  { name: 'China', code: 'CN', currency: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { name: 'India', code: 'IN', currency: 'INR', symbol: '₹', flag: '🇮🇳' },
  { name: 'Brazil', code: 'BR', currency: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', symbol: 'R', flag: '🇿🇦' },
  { name: 'Mexico', code: 'MX', currency: 'MXN', symbol: '$', flag: '🇲🇽' },
  { name: 'South Korea', code: 'KR', currency: 'KRW', symbol: '₩', flag: '🇰🇷' },
  { name: 'Singapore', code: 'SG', currency: 'SGD', symbol: 'S$', flag: '🇸🇬' },
  { name: 'Hong Kong', code: 'HK', currency: 'HKD', symbol: 'HK$', flag: '🇭🇰' },
  { name: 'New Zealand', code: 'NZ', currency: 'NZD', symbol: 'NZ$', flag: '🇳🇿' },
  { name: 'Sweden', code: 'SE', currency: 'SEK', symbol: 'kr', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', currency: 'NOK', symbol: 'kr', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', currency: 'DKK', symbol: 'kr', flag: '🇩🇰' },
  { name: 'Poland', code: 'PL', currency: 'PLN', symbol: 'zł', flag: '🇵🇱' },
  { name: 'Czech Republic', code: 'CZ', currency: 'CZK', symbol: 'Kč', flag: '🇨🇿' },
  { name: 'Hungary', code: 'HU', currency: 'HUF', symbol: 'Ft', flag: '🇭🇺' },
  { name: 'Turkey', code: 'TR', currency: 'TRY', symbol: '₺', flag: '🇹🇷' },
  { name: 'Russia', code: 'RU', currency: 'RUB', symbol: '₽', flag: '🇷🇺' },
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', symbol: 'ر.س', flag: '🇸🇦' },
  { name: 'United Arab Emirates', code: 'AE', currency: 'AED', symbol: 'د.إ', flag: '🇦🇪' },
  { name: 'Israel', code: 'IL', currency: 'ILS', symbol: '₪', flag: '🇮🇱' },
  { name: 'Egypt', code: 'EG', currency: 'EGP', symbol: 'E£', flag: '🇪🇬' },
  { name: 'Nigeria', code: 'NG', currency: 'NGN', symbol: '₦', flag: '🇳🇬' },
  { name: 'Kenya', code: 'KE', currency: 'KES', symbol: 'KSh', flag: '🇰🇪' },
  { name: 'Tanzania', code: 'TZ', currency: 'TZS', symbol: 'TSh', flag: '🇹🇿' },
  { name: 'Uganda', code: 'UG', currency: 'UGX', symbol: 'USh', flag: '🇺🇬' },
  { name: 'Ghana', code: 'GH', currency: 'GHS', symbol: 'GH₵', flag: '🇬🇭' },
  { name: 'Morocco', code: 'MA', currency: 'MAD', symbol: 'MAD', flag: '🇲🇦' },
  { name: 'Thailand', code: 'TH', currency: 'THB', symbol: '฿', flag: '🇹🇭' },
  { name: 'Malaysia', code: 'MY', currency: 'MYR', symbol: 'RM', flag: '🇲🇾' },
  { name: 'Philippines', code: 'PH', currency: 'PHP', symbol: '₱', flag: '🇵🇭' },
  { name: 'Indonesia', code: 'ID', currency: 'IDR', symbol: 'Rp', flag: '🇮🇩' },
  { name: 'Vietnam', code: 'VN', currency: 'VND', symbol: '₫', flag: '🇻🇳' },
  { name: 'Argentina', code: 'AR', currency: 'ARS', symbol: '$', flag: '🇦🇷' },
  { name: 'Chile', code: 'CL', currency: 'CLP', symbol: '$', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', currency: 'COP', symbol: '$', flag: '🇨🇴' },
  { name: 'Peru', code: 'PE', currency: 'PEN', symbol: 'S/', flag: '🇵🇪' },
  { name: 'Venezuela', code: 'VE', currency: 'VES', symbol: 'Bs', flag: '🇻🇪' }
];

// Currency module configuration
export const currencyModuleConfig = {
  title: 'Currency Management',
  description: 'Manage currencies and exchange rates for multi-currency support',
  icon: Coins,
  color: 'blue',
  gradient: 'from-blue-500 to-blue-600',
  features: [
    'Multi-currency support',
    'Exchange rate management',
    'Default currency setting',
    'Currency status tracking',
    'Export functionality'
  ],
  category: 'Financial',
  priority: 'high' as const,
  status: 'active' as const,
  isRequired: true
};

// Validation rules
export const currencyValidationRules = {
  code: {
    required: 'Currency code is required',
    pattern: 'Currency code must be 3 uppercase letters (ISO 4217 format)',
    minLength: 'Currency code must be at least 1 character',
    maxLength: 'Currency code must not exceed 10 characters'
  },
  name: {
    required: 'Currency name is required',
    minLength: 'Currency name must be at least 1 character',
    maxLength: 'Currency name must not exceed 100 characters'
  },
  symbol: {
    required: 'Currency symbol is required',
    minLength: 'Currency symbol must be at least 1 character',
    maxLength: 'Currency symbol must not exceed 10 characters'
  }
};

// Default currency form data
export const defaultCurrencyFormData: Partial<Currency> = {
  code: '',
  name: '',
  symbol: '',
  country: '',
  flag: '',
  is_default: false,
  is_active: true
}; 