import { 
  Boxes, 
  Tags, 
  MapPin, 
  Palette, 
  Package,
  Building2, 
  Hash,
  DollarSign, 
  Download
} from 'lucide-react';

export interface ProductModule {
  path: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  searchTerms: string[];
  category: 'catalog' | 'organization' | 'pricing' | 'import';
  color: string;
  gradient: string;
}

export const PRODUCT_MODULES: ProductModule[] = [
  {
    path: '/product-catalog',
    title: 'Product Catalog',
    icon: Boxes,
    description: 'Manage your product catalog and listings',
    searchTerms: ['product', 'catalog', 'listings'],
    category: 'catalog',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  },
  {
    path: '/product-categories',
    title: 'Categories',
    icon: Tags,
    description: 'Organize products into categories and subcategories',
    searchTerms: ['categories', 'subcategories', 'organize'],
    category: 'organization',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  {
    path: '/product-store-locations',
    title: 'Product Store Locations',
    icon: MapPin,
    description: 'Manage product availability across different store locations',
    searchTerms: ['store', 'locations', 'availability'],
    category: 'organization',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  {
    path: '/product-color',
    title: 'Product Color',
    icon: Palette,
    description: 'Manage product colors and color variations',
    searchTerms: ['color', 'variations', 'palette'],
    category: 'organization',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  {
    path: '/product-model',
    title: 'Product Model',
    icon: Hash,
    description: 'Manage product models and specifications',
    searchTerms: ['model', 'specifications', 'cube'],
    category: 'organization',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
  },
  {
    path: '/product-manufacturer',
    title: 'Product Manufacturer',
    icon: Building2,
    description: 'Manage product manufacturers and company information',
    searchTerms: ['manufacturer', 'company', 'industry'],
    category: 'organization',
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)'
  },
  {
    path: '/product-brand-name',
    title: 'Product Brand Name',
    icon: Hash,
    description: 'Manage product brand names and trademarks',
    searchTerms: ['brand', 'trademark', 'name'],
    category: 'organization',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  {
    path: '/price-categories',
    title: 'Price Categories',
    icon: DollarSign,
    description: 'Manage price categories and pricing strategies',
    searchTerms: ['price', 'categories', 'pricing'],
    category: 'pricing',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
  },
  {
    path: '/packaging',
    title: 'Packaging',
    icon: Package,
    description: 'Manage packaging codes, names and piece counts',
    searchTerms: ['packaging', 'codes', 'pieces'],
    category: 'organization',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
  },
  {
    path: '/bulk-price-change',
    title: 'Bulk Price Change',
    icon: DollarSign,
    description: 'Update prices for multiple products at once',
    searchTerms: ['bulk', 'price', 'change', 'update'],
    category: 'pricing',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
  },
  {
    path: '/import-products',
    title: 'Import Products',
    icon: Download,
    description: 'Bulk import products from CSV files with validation and mapping',
    searchTerms: ['import', 'csv', 'bulk', 'validation'],
    category: 'import',
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
  }
];