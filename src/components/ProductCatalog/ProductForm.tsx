import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Upload, 
  Eye, 
  EyeOff,
  Package,
  Building2,
  Calculator,
  FileText,
  Tag,
  Settings,
  Info,
  Plus,
  Edit,
  ChevronDown
} from 'lucide-react';
import { useProductCatalog } from '../../hooks/useProductCatalog';
import { Product, ProductFormData } from '../../types';
import { productTypeConfig } from '../../data/productCatalogModules';
import Button from '../Button';
import { getImageUrl } from '../../utils/imageUtils';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onOpenChange,
  product,
  onSuccess
}) => {
  const {
    createProduct,
    updateProduct,
    getNextCode,
    getNextBarcode,
    loading,
    referenceData,
    fetchReferenceData
  } = useProductCatalog();

  // Form state
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    product_type: undefined,
    code: '',
    barcode: '',
    name: '',
    part_number: '',
    image: null,
    description: '',
    category_id: null,
    brand_id: null,
    manufacturer_id: null,
    model_id: null,
    color_id: null,
    store_location_id: null,
    unit_id: null,
    cogs_account_id: null,
    income_account_id: null,
    asset_account_id: null,
    average_cost: undefined,
    selling_price: undefined,
    purchases_tax_id: null,
    sales_tax_id: null,
    default_packaging_id: null,
    default_quantity: undefined,
    price_tax_inclusive: false,
    expiry_notification_days: undefined,
    track_serial_number: false,
    is_active: true,
    min_quantity: undefined,
    max_quantity: undefined,
    reorder_point: undefined,
    // Pharmaceutical fields (max_dose, frequency, duration, adjustments) are managed via DosageAssignmentModal
    manufacturing_process: '',
    production_time: undefined,
    store_ids: [],
    price_category_ids: []
  });

  // Local state
  const [activeTab, setActiveTab] = useState('basic');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null); // Track existing image path when editing

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorDropdown && !(event.target as Element).closest('.color-dropdown-container')) {
        setShowColorDropdown(false);
      }
      if (showBrandDropdown && !(event.target as Element).closest('.brand-dropdown-container')) {
        setShowBrandDropdown(false);
      }
      if (showManufacturerDropdown && !(event.target as Element).closest('.manufacturer-dropdown-container')) {
        setShowManufacturerDropdown(false);
      }
      if (showModelDropdown && !(event.target as Element).closest('.model-dropdown-container')) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorDropdown, showBrandDropdown, showManufacturerDropdown, showModelDropdown]);

  // Initialize form when product changes
  useEffect(() => {
    if (product && product.id) {
      // Edit mode - populate form with existing data
      setFormData({
        product_type: product.product_type,
        code: product.code,
        barcode: product.barcode || '',
        name: product.name,
        part_number: product.part_number || '',
        image: null, // Form image field is always null initially (will be populated if new file selected)
        description: product.description || '',
        category_id: product.category_id || null,
        brand_id: product.brand_id || null,
        manufacturer_id: product.manufacturer_id || null,
        model_id: product.model_id || null,
        color_id: product.color_id || null,
        store_location_id: product.store_location_id || null,
        unit_id: product.unit_id || null,
        cogs_account_id: product.cogs_account_id || null,
        income_account_id: product.income_account_id || null,
        asset_account_id: product.asset_account_id || null,
        average_cost: product.average_cost,
        selling_price: product.selling_price,
        purchases_tax_id: product.purchases_tax_id || null,
        sales_tax_id: product.sales_tax_id || null,
        default_packaging_id: product.default_packaging_id || null,
        default_quantity: product.default_quantity,
        price_tax_inclusive: product.price_tax_inclusive,
        expiry_notification_days: product.expiry_notification_days,
        track_serial_number: product.track_serial_number,
        is_active: product.is_active,
        min_quantity: product.min_quantity,
        max_quantity: product.max_quantity,
        reorder_point: product.reorder_point,
        // Pharmaceutical fields (max_dose, frequency, duration, adjustments) are managed via DosageAssignmentModal
        manufacturing_process: product.manufacturingInfo?.manufacturing_process || '',
        production_time: product.manufacturingInfo?.production_time_hours,
        store_ids: product.assignedStores?.filter(store => store && store.id)?.map(store => store.id) || [],
        price_category_ids: product.priceCategories?.filter(pc => pc && pc.id)?.map(pc => pc.id) || []
      });

      // Set image preview if product has an image
      if (product.image && product.image.trim() !== '') {
        const imageUrl = getImageUrl(product.image, 'products');
        // Only update if the image path has changed or if we don't have a preview URL
        if (!imagePreviewUrl || imagePreviewUrl !== imageUrl) {
          // Revoke any existing blob URL before setting new one
          if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreviewUrl);
          }
          setImagePreviewUrl(imageUrl);
          setShowImagePreview(true);
        }
        setExistingImagePath(product.image); // Track existing image path for backend
        // Clear formData.image when editing to ensure proper preview display
        setFormData(prev => ({ ...prev, image: null }));
      } else {
        // Only clear if we don't have a valid preview URL
        if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
          // Don't clear blob URLs that are from file uploads
          // They should persist until user removes them
        } else if (imagePreviewUrl) {
          // Clear server URLs only if product no longer has an image
          setImagePreviewUrl('');
          setShowImagePreview(false);
        }
        setExistingImagePath(null);
        setFormData(prev => ({ ...prev, image: null }));
      }
      setCompressionInfo(null);
      setIsCompressing(false);
    } else if (!product || !product.id) {
      // Create mode or product cleared - get next codes and reset form
      // This ensures form is reset when product becomes null (after save or when opening for new product)
      initializeNewProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, product]); // Depend on both product.id and product to catch when product becomes null

  // Reset form when modal opens for new product
  useEffect(() => {
    if (open && !product) {
      // Modal opened for new product - initialize fresh form
      initializeNewProduct();
      // Clear any existing image preview
      setImagePreviewUrl('');
      setShowImagePreview(false);
      setExistingImagePath(null);
      setCompressionInfo(null);
      setIsCompressing(false);
    } else if (open && product && product.id) {
      // Editing existing product - form will be populated by the other useEffect
      // But ensure product_type is set from the product
    } else if (!open) {
      // Modal closed - reset form state to ensure clean state for next open
      // This prevents form state from persisting when modal is closed
      setFormData(prev => ({
        ...prev,
        product_type: undefined, // Reset product_type when modal closes
        code: '',
        barcode: '',
        name: '',
        part_number: '',
        image: null,
        description: '',
        category_id: null,
        brand_id: null,
        manufacturer_id: null,
        model_id: null,
        color_id: null,
        store_location_id: null,
        unit_id: null,
        cogs_account_id: null,
        income_account_id: null,
        asset_account_id: null,
        average_cost: undefined,
        selling_price: undefined,
        purchases_tax_id: null,
        sales_tax_id: null,
        default_packaging_id: null,
        default_quantity: undefined,
        price_tax_inclusive: false,
        expiry_notification_days: undefined,
        track_serial_number: false,
        is_active: true,
        min_quantity: undefined,
        max_quantity: undefined,
        reorder_point: undefined,
        manufacturing_process: '',
        production_time: undefined,
        store_ids: [],
        price_category_ids: []
      }));
    }
  }, [open, product]); // Include product in dependencies to reset when product changes from edit to add

  // Cleanup image preview URL when component unmounts or when URL changes
  useEffect(() => {
    return () => {
      // Only revoke blob URLs, not server URLs
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Initialize new product (codes will be auto-generated by backend)
  const initializeNewProduct = async () => {
    try {
      // Reset form to initial state (codes will be auto-generated by backend)
      setFormData({
        product_type: undefined,
        code: '', // Will be auto-generated by backend
        barcode: '', // Will be auto-generated by backend if not provided
        name: '',
        part_number: '',
        image: null,
        description: '',
        category_id: '',
        brand_id: '',
        manufacturer_id: '',
        model_id: '',
        color_id: '',
        store_location_id: '',
        unit_id: '',
        cogs_account_id: '',
        income_account_id: '',
        asset_account_id: '',
        average_cost: undefined,
        selling_price: undefined,
        purchases_tax_id: '',
        sales_tax_id: '',
        default_packaging_id: '',
        default_quantity: undefined,
        price_tax_inclusive: false,
        expiry_notification_days: undefined,
        track_serial_number: false,
        is_active: true,
        min_quantity: undefined,
        max_quantity: undefined,
        reorder_point: undefined,
        // Pharmaceutical fields (max_dose, frequency, duration, adjustments) are managed via DosageAssignmentModal
        manufacturing_process: '',
        production_time: undefined,
        store_ids: [],
        price_category_ids: []
      });

      // Reset all UI states
      setActiveTab('basic');
      setShowImagePreview(false);
      setImagePreviewUrl('');
      setCompressionInfo(null);
      setIsCompressing(false);
      setShowColorDropdown(false);
      setShowBrandDropdown(false);
      setShowManufacturerDropdown(false);
      setShowModelDropdown(false);
    } catch (error) {
      }
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Handle intelligent field connections
    handleIntelligentConnections(field, value);
  };

  // Handle intelligent field connections
  const handleIntelligentConnections = async (field: keyof ProductFormData, value: any) => {
    switch (field) {
      case 'category_id':
        if (value) {
          // Auto-populate accounts when category is selected
          await handleCategoryChange(value);
        }
        break;

      case 'unit_id':
        if (value) {
          // Auto-populate packaging and default quantity when unit is selected
          await handleUnitChange(value);
        }
        break;

      case 'default_packaging_id':
        if (value) {
          // Auto-populate default quantity when default packaging is selected
          handleDefaultPackagingChange(value);
        }
        break;

      case 'product_type':
        // Show/hide relevant fields based on product type
        handleProductTypeChange(value);
        break;
    }
  };

  // Handle category change - auto-populate accounts
  const handleCategoryChange = async (categoryId: string) => {
    try {
      const selectedCategory = referenceData.categories.find(cat => cat.id === categoryId);
      if (selectedCategory) {

        // Auto-populate accounts if they exist in the category
        const updates: Partial<ProductFormData> = {};
        
        if (selectedCategory.income_account_id) {
          updates.income_account_id = selectedCategory.income_account_id;

        }
        
        if (selectedCategory.cogs_account_id) {
          updates.cogs_account_id = selectedCategory.cogs_account_id;

        }
        
        if (selectedCategory.asset_account_id) {
          updates.asset_account_id = selectedCategory.asset_account_id;

        }
        
        // Auto-populate tax codes if they exist in the category
        if (selectedCategory.tax_code_id) {
          updates.sales_tax_id = selectedCategory.tax_code_id;

        }
        
        if (selectedCategory.purchases_tax_id) {
          updates.purchases_tax_id = selectedCategory.purchases_tax_id;

        }
        
        // Apply all updates at once
        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
  
        } else {

        }
      }
    } catch (error) {
      }
  };

  // Handle unit change - auto-populate packaging and default quantity
  const handleUnitChange = async (unitId: string) => {
    try {
      if (unitId) {
        // Find the selected unit/packaging
        const selectedUnit = referenceData.packagings.find(pkg => pkg.id === unitId);
        
        if (selectedUnit) {
          // Auto-populate the default packaging with the selected unit
          setFormData(prev => ({
            ...prev,
            default_packaging_id: unitId,
            default_quantity: selectedUnit.pieces || 1 // Use packaging pieces or default to 1
          }));
        }
      }
    } catch (error) {
      }
  };

  // Handle default packaging change - auto-populate default quantity
  const handleDefaultPackagingChange = (packagingId: string) => {
    try {
      if (packagingId) {
        // Find the selected packaging
        const selectedPackaging = referenceData.packagings.find(pkg => pkg.id === packagingId);
        
        if (selectedPackaging && selectedPackaging.pieces) {
          // Auto-populate the default quantity with the packaging's pieces value
          setFormData(prev => ({
            ...prev,
            default_quantity: selectedPackaging.pieces
          }));
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  // Handle product type change - show/hide relevant fields
  const handleProductTypeChange = (productType: string) => {
    // Reset type-specific fields when product type changes
    // Note: Pharmaceutical fields (max_dose, frequency, duration, adjustments) are managed via DosageAssignmentModal
    setFormData(prev => ({
      ...prev,
      manufacturing_process: '',
      production_time: undefined
    }));
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  // Handle image file (common function for both upload and drag & drop)
  const handleImageFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image file size must be less than 5MB');
      return;
    }

    try {
      // TEMPORARILY DISABLE COMPRESSION TO TEST
      // let processedFile = file;
      // let compressionData = null;
      
      // if (file.size > 1024 * 1024) { // 1MB
      //   setIsCompressing(true);
      //   processedFile = await compressImage(file);
      //   compressionData = {
      //     originalSize: file.size,
      //     compressedSize: processedFile.size,
      //     compressionRatio: Math.round(((file.size - processedFile.size) / file.size) * 100)
      //   };
      //   setIsCompressing(false);
      // }

      // Use original file without compression
      const processedFile = file;
      const compressionData = null;

      setFormData(prev => ({ ...prev, image: processedFile }));
      setCompressionInfo(compressionData);
      
      // Create preview URL
      const url = URL.createObjectURL(processedFile);
      setImagePreviewUrl(url);
      setShowImagePreview(true);
      
      } catch (error) {
      alert('Error processing image. Please try again.');
    }
  };

  // Compress image function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with quality settings
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          0.8 // 80% quality for good balance
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleImageFile(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.product_type) {
      alert('Please select a product type');
      return;
    }
    
    if (!formData.name || formData.name.trim() === '') {
      alert('Please enter a product name');
      return;
    }
    
    // Code and barcode are auto-generated, no validation needed

    // Type assertion for the validated data
    const validatedData = formData as ProductFormData;
    
    // Helper function to clean empty strings to null for UUID fields
    const cleanEmptyStrings = (obj: any) => {
      const cleaned = { ...obj };
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === '') {
          cleaned[key] = null;
        }
      });
      return cleaned;
    };

    // Prepare data with proper types and defaults for backend
    // Note: Pharmaceutical dosage fields (max_dose, frequency, duration, adjustments) are managed via DosageAssignmentModal
    // and should NOT be sent here - they're handled separately through the pharmaceutical API
    const preparedData = {
      ...cleanEmptyStrings(validatedData),
      // Explicitly exclude pharmaceutical fields - they're managed via DosageAssignmentModal
      max_dose: undefined,
      frequency: undefined,
      duration: undefined,
      adjustments: undefined,
      // Ensure numeric fields have proper values (database requires these)
      min_quantity: validatedData.min_quantity !== undefined && validatedData.min_quantity !== null ? parseFloat(validatedData.min_quantity.toString()) : 0,
      max_quantity: validatedData.max_quantity !== undefined && validatedData.max_quantity !== null ? parseFloat(validatedData.max_quantity.toString()) : 0,
      reorder_point: validatedData.reorder_point !== undefined && validatedData.reorder_point !== null ? parseFloat(validatedData.reorder_point.toString()) : 0,
      // Ensure other numeric fields are properly converted
      average_cost: validatedData.average_cost !== undefined && validatedData.average_cost !== null ? parseFloat(validatedData.average_cost.toString()) : undefined,
      selling_price: validatedData.selling_price !== undefined && validatedData.selling_price !== null ? parseFloat(validatedData.selling_price.toString()) : undefined,
      default_quantity: validatedData.default_quantity !== undefined && validatedData.default_quantity !== null ? parseInt(validatedData.default_quantity.toString()) : undefined,
      expiry_notification_days: validatedData.expiry_notification_days !== undefined && validatedData.expiry_notification_days !== null ? parseInt(validatedData.expiry_notification_days.toString()) : undefined,
      production_time: validatedData.production_time !== undefined && validatedData.production_time !== null ? parseFloat(validatedData.production_time.toString()) : undefined,
      // Ensure boolean fields are properly set
      price_tax_inclusive: Boolean(validatedData.price_tax_inclusive),
      track_serial_number: Boolean(validatedData.track_serial_number),
      is_active: Boolean(validatedData.is_active),
      // Ensure arrays are properly formatted
      store_ids: Array.isArray(validatedData.store_ids) ? validatedData.store_ids : [],
      price_category_ids: Array.isArray(validatedData.price_category_ids) ? validatedData.price_category_ids : []
    };

    setIsSubmitting(true);
    
    try {
      if (product) {
        // Update existing product
        // Always include existingImagePath if product has an image, even if not explicitly set
        const imagePathToSend = existingImagePath || (product.image && product.image.trim() !== '' ? product.image : null);
        
        await updateProduct(product.id, preparedData, imagePathToSend);
      } else {
        // Create new product
        await createProduct(preparedData);
      }
      
      // Reset form immediately after successful save (especially important for adding new products)
      // This ensures the form is clean when opened again
      initializeNewProduct();
      
      onSuccess();
    } catch (error: any) {
      // Enhanced error handling to show specific backend errors
      let errorMessage = 'Failed to save product.';
      
      if (error.response?.status === 400) {
        // Handle validation errors
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = `Validation Error: ${errorData.error}`;
          
          // Show specific field errors if available
          if (errorData.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map((detail: any) => 
              `${detail.field}: ${detail.message}`
            ).join('\n');
            errorMessage += `\n\nField Errors:\n${fieldErrors}`;
          }
        }
      } else if (error.response?.status === 409) {
        // Handle duplicate code error
        errorMessage = 'Product code already exists. Please use a different code.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if field should be shown based on product type
  const shouldShowField = (field: string) => {
    const type = formData.product_type;
    
    switch (field) {
      case 'pharmaceutical_fields':
        return type === 'pharmaceuticals';
      case 'manufacturing_fields':
        return type === 'manufactured';
      case 'inventory_fields':
        return type !== 'services';
      default:
        return true;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Product Type Selection */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">
              Product Type
            </h3>
            <div>
              <label htmlFor="product_type" className="block text-sm font-medium text-gray-700 mb-1">
                Product Type *
              </label>
              <select
                id="product_type"
                value={formData.product_type}
                onChange={(e) => handleFieldChange('product_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Product Type</option>
                {Object.entries(productTypeConfig).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                ))}
              </select>
              {!formData.product_type && (
                <p className="mt-1 text-sm text-red-600">Product type is required</p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code || 'Auto-generated'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 cursor-not-allowed"
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  id="barcode"
                  value={formData.barcode || ''}
                  onChange={(e) => handleFieldChange('barcode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to auto-generate"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label htmlFor="part_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Part Number
                </label>
                <input
                  type="text"
                  id="part_number"
                  value={formData.part_number}
                  onChange={(e) => handleFieldChange('part_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter part number"
                />
              </div>

              <div>
                <label htmlFor="product_image" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>

                <div className="space-y-3">
                  <input
                    type="file"
                    id="product_image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                                    {/* Image Preview */}
                  {(imagePreviewUrl || (product?.image && !formData.image)) && (
                    <div className="relative">
                      <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                        <img
                          src={imagePreviewUrl || (product?.image ? getImageUrl(product.image, 'products') : '')}
                          alt="Product preview"
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            // Don't hide the image container, just show a placeholder
                            e.currentTarget.style.display = 'none';
                            // Show a placeholder div instead
                            const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder');
                            if (!placeholder) {
                              const placeholderDiv = document.createElement('div');
                              placeholderDiv.className = 'w-full h-32 bg-gray-200 rounded-md flex items-center justify-center image-placeholder';
                              placeholderDiv.innerHTML = '<span class="text-gray-400 text-sm">Image not available</span>';
                              e.currentTarget.parentElement?.appendChild(placeholderDiv);
                            }
                          }}
                          onLoad={(e) => {
                            // Remove any placeholder if image loads successfully
                            const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder');
                            if (placeholder) {
                              placeholder.remove();
                            }
                            // Ensure image is visible
                            e.currentTarget.style.display = 'block';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreviewUrl('');
                              setFormData(prev => ({ ...prev, image: null }));
                              setCompressionInfo(null);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  )}
                  
                  {/* Drag & Drop Area */}
                  {!imagePreviewUrl && !product?.image && (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                    >
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag and drop an image here, or click to browse
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
            </div>
          </div>

                                {/* Category and Classification */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category_id"
                  value={formData.category_id ?? ''}
                  onChange={(e) => handleFieldChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={referenceData.categories.length === 0}
                >
                  <option value="">
                    {referenceData.categories.length === 0 ? 'Loading categories...' : 'Select Category'}
                  </option>
                  {referenceData.categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="brand-dropdown-container">
                <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <div className="relative">
                  <button
                    type="button"
                    id="brand_id"
                    onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={referenceData.brands.length === 0}
                  >
                    {formData.brand_id ? (
                      <div className="flex items-center">
                        {(() => {
                          const selectedBrand = referenceData.brands.find(b => b.id === formData.brand_id);
                          return selectedBrand?.logo ? (
                            <img 
                              src={getImageUrl(selectedBrand.logo, 'product-brand-names')} 
                              alt={selectedBrand.name}
                              className="w-5 h-5 object-contain rounded mr-2"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center mr-2">
                              <span className="text-xs text-gray-500">🏷️</span>
                            </div>
                          );
                        })()}
                        <span>{referenceData.brands.find(b => b.id === formData.brand_id)?.name || 'Select Brand'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        {referenceData.brands.length === 0 ? 'Loading brands...' : 'Select Brand'}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Brand dropdown */}
                  {showBrandDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {referenceData.brands
                        .filter(brand => brand.is_active !== false)
                        .map(brand => (
                          <button
                            key={brand.id}
                            type="button"
                            onClick={() => {
                              handleFieldChange('brand_id', brand.id);
                              setShowBrandDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            {brand.logo ? (
                              <img 
                                src={getImageUrl(brand.logo, 'product-brand-names')} 
                                alt={brand.name}
                                className="w-5 h-5 object-contain rounded mr-3"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">🏷️</span>
                              </div>
                            )}
                            {brand.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="manufacturer-dropdown-container">
                <label htmlFor="manufacturer_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer
                </label>
                <div className="relative">
                  <button
                    type="button"
                    id="manufacturer_id"
                    onClick={() => setShowManufacturerDropdown(!showManufacturerDropdown)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={referenceData.manufacturers.length === 0}
                  >
                    {formData.manufacturer_id ? (
                      <div className="flex items-center">
                        {(() => {
                          const selectedManufacturer = referenceData.manufacturers.find(m => m.id === formData.manufacturer_id);
                          return selectedManufacturer?.logo ? (
                            <img 
                              src={getImageUrl(selectedManufacturer.logo, 'product-manufacturers')} 
                              alt={selectedManufacturer.name}
                              className="w-5 h-5 object-contain rounded mr-2"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center mr-2">
                              <span className="text-xs text-gray-500">🏭</span>
                            </div>
                          );
                        })()}
                        <span>{referenceData.manufacturers.find(m => m.id === formData.manufacturer_id)?.name || 'Select Manufacturer'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        {referenceData.manufacturers.length === 0 ? 'Loading manufacturers...' : 'Select Manufacturer'}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Manufacturer dropdown */}
                  {showManufacturerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {referenceData.manufacturers
                        .filter(manufacturer => manufacturer.is_active !== false)
                        .map(manufacturer => (
                          <button
                            key={manufacturer.id}
                            type="button"
                            onClick={() => {
                              handleFieldChange('manufacturer_id', manufacturer.id);
                              setShowManufacturerDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            {manufacturer.logo ? (
                              <img 
                                src={getImageUrl(manufacturer.logo, 'product-manufacturers')} 
                                alt={manufacturer.name}
                                className="w-5 h-5 object-contain rounded mr-3"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">🏭</span>
                              </div>
                            )}
                            {manufacturer.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="model-dropdown-container">
                <label htmlFor="model_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <div className="relative">
                  <button
                    type="button"
                    id="model_id"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={referenceData.models.length === 0}
                  >
                    {formData.model_id ? (
                      <div className="flex items-center">
                        {(() => {
                          const selectedModel = referenceData.models.find(m => m.id === formData.model_id);
                          return selectedModel?.logo ? (
                            <img 
                              src={getImageUrl(selectedModel.logo, 'product-models')} 
                              alt={selectedModel.name}
                              className="w-5 h-5 object-contain rounded mr-2"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center mr-2">
                              <span className="text-xs text-gray-500">📱</span>
                            </div>
                          );
                        })()}
                        <span>{referenceData.models.find(m => m.id === formData.model_id)?.name || 'Select Model'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        {referenceData.models.length === 0 ? 'Loading models...' : 'Select Model'}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Model dropdown */}
                  {showModelDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {referenceData.models
                        .filter(model => model.is_active !== false)
                        .map(model => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              handleFieldChange('model_id', model.id);
                              setShowModelDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            {model.logo ? (
                              <img 
                                src={getImageUrl(model.logo, 'product-models')} 
                                alt={model.name}
                                className="w-5 h-5 object-contain rounded mr-3"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                                <span className="text-xs text-gray-400">📱</span>
                              </div>
                            )}
                            {model.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="color_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="relative color-dropdown-container">
                  <button
                    type="button"
                    id="color_id"
                    onClick={() => setShowColorDropdown(!showColorDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={referenceData.colors.length === 0}
                  >
                    {formData.color_id ? (
                      <div className="flex items-center">
                        <span 
                          className="inline-block w-4 h-4 rounded-full mr-2 border border-gray-300" 
                          style={{ backgroundColor: referenceData.colors.find(c => c.id === formData.color_id)?.hex_code || '#ccc' }}
                        ></span>
                        {referenceData.colors.find(c => c.id === formData.color_id)?.name || 'Select Color'}
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        {referenceData.colors.length === 0 ? 'Loading colors...' : 'Select Color'}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Color dropdown */}
                  {showColorDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {referenceData.colors
                        .filter(color => color.is_active !== false) // Show active colors (default to true if not specified)
                        .map(color => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => {
                              handleFieldChange('color_id', color.id);
                              setShowColorDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            <span 
                              className="inline-block w-4 h-4 rounded-full mr-3 border border-gray-300" 
                              style={{ backgroundColor: color.hex_code || '#ccc' }}
                            ></span>
                            {color.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="store_location_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Store Location
                </label>
                <select
                  id="store_location_id"
                  value={formData.store_location_id ?? ''}
                  onChange={(e) => handleFieldChange('store_location_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={referenceData.storeLocations.length === 0}
                >
                  <option value="">
                    {referenceData.storeLocations.length === 0 ? 'Loading store locations...' : 'Select Store Location'}
                  </option>
                  {referenceData.storeLocations
                    .filter(location => location.is_active !== false) // Show active store locations (default to true if not specified)
                    .map(location => (
                      <option key={location.id} value={location.id}>
                        📍 {location.store_name} - {location.location_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

                                {/* Unit and Packaging */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">Unit & Packaging</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="unit_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  id="unit_id"
                  value={formData.unit_id ?? ''}
                  onChange={(e) => handleFieldChange('unit_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={referenceData.packagings.length === 0}
                >
                  <option value="">
                    {referenceData.packagings.length === 0 ? 'Loading units...' : 'Select Unit'}
                  </option>
                  {referenceData.packagings.map(packaging => (
                    <option key={packaging.id} value={packaging.id}>
                      {packaging.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="default_packaging_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Packaging
                </label>
                <select
                  id="default_packaging_id"
                  value={formData.default_packaging_id ?? ''}
                  onChange={(e) => handleFieldChange('default_packaging_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={referenceData.packagings.length === 0}
                >
                  <option value="">
                    {referenceData.packagings.length === 0 ? 'Loading packagings...' : 'Select Packaging'}
                  </option>
                  {referenceData.packagings.map(packaging => (
                    <option key={packaging.id} value={packaging.id}>
                      {packaging.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="default_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Quantity
                </label>
                <input
                  type="number"
                  id="default_quantity"
                  value={formData.default_quantity || ''}
                  onChange={(e) => handleFieldChange('default_quantity', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min="0"
                  step="0.01"
                />

              </div>
            </div>
          </div>

                                {/* Pricing */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="average_cost" className="block text-sm font-medium text-gray-700 mb-1">
                  Average Cost
                </label>
                <input
                  type="number"
                  id="average_cost"
                  value={formData.average_cost || ''}
                  onChange={(e) => handleFieldChange('average_cost', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price
                </label>
                <input
                  type="number"
                  id="selling_price"
                  value={formData.selling_price || ''}
                  onChange={(e) => handleFieldChange('selling_price', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

                                {/* Financial Accounts */}
          <div className="mb-4">

            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">Financial Accounts</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="income_account_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Income Account
                </label>
                <select
                  id="income_account_id"
                  value={formData.income_account_id ?? ''}
                  onChange={(e) => handleFieldChange('income_account_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={referenceData.accounts.length === 0}
                >
                  <option value="">
                    {referenceData.accounts.length === 0 ? 'Loading accounts...' : 'Select Account'}
                  </option>
                  {referenceData.accounts
                    .map(account => {
                      return (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label htmlFor="cogs_account_id" className="block text-sm font-medium text-gray-700 mb-1">
                  COGS Account
                </label>
                <select
                  id="cogs_account_id"
                  value={formData.cogs_account_id ?? ''}
                  onChange={(e) => handleFieldChange('cogs_account_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={referenceData.accounts.length === 0}
                >
                  <option value="">
                    {referenceData.accounts.length === 0 ? 'Loading accounts...' : 'Select Account'}
                  </option>
                  {referenceData.accounts
                    .map(account => {
                      return (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label htmlFor="asset_account_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Account
                </label>
                <select
                  id="asset_account_id"
                  value={formData.asset_account_id ?? ''}
                  onChange={(e) => handleFieldChange('asset_account_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={referenceData.accounts.length === 0}
                >
                  <option value="">
                    {referenceData.accounts.length === 0 ? 'Loading accounts...' : 'Select Account'}
                  </option>
                  {referenceData.accounts
                    .map(account => {
                      return (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
          </div>

                                {/* VAT/Tax Settings */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">VAT/Tax Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchases_tax_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Purchases Tax
                </label>
                <select
                  id="purchases_tax_id"
                  value={formData.purchases_tax_id ?? ''}
                  onChange={(e) => handleFieldChange('purchases_tax_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={referenceData.taxCodes.length === 0}
                >
                  <option value="">
                    {referenceData.taxCodes.length === 0 ? 'Loading tax codes...' : 'Select Purchases Tax'}
                  </option>
                  {referenceData.taxCodes.map(taxCode => (
                    <option key={taxCode.id} value={taxCode.id}>
                      {taxCode.name} ({taxCode.rate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sales_tax_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Tax
                </label>
                <select
                  id="sales_tax_id"
                  value={formData.sales_tax_id ?? ''}
                  onChange={(e) => handleFieldChange('sales_tax_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={referenceData.taxCodes.length === 0}
                >
                  <option value="">
                    {referenceData.taxCodes.length === 0 ? 'Loading tax codes...' : 'Select Sales Tax'}
                  </option>
                  {referenceData.taxCodes.map(taxCode => (
                    <option key={taxCode.id} value={taxCode.id}>
                      {taxCode.name} ({taxCode.rate}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

                                {/* Store Assignment */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">Store Assignment</h3>
            <div className="space-y-3">
              {/* Store Selection */}
              <div className="space-y-2">
                {referenceData?.stores?.filter(store => store && store.id)?.map(store => (
                  <div key={store.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`store-${store.id}`}
                      checked={formData.store_ids?.includes(store.id) || false}
                      onChange={(e) => {
                        const storeId = store.id;
                        const currentStores = formData.store_ids || [];
                        
                        if (e.target.checked) {
                          // Add store to assigned stores
                          setFormData(prev => ({
                            ...prev,
                            store_ids: [...currentStores, storeId]
                          }));
                        } else {
                          // Remove store from assigned stores
                          setFormData(prev => ({
                            ...prev,
                            store_ids: currentStores.filter(id => id !== storeId)
                          }));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`store-${store.id}`} className="flex-1 cursor-pointer">
                      <span className="font-medium text-gray-900">{store.name}</span>
                    </label>
                  </div>
                ))}
                
                {(!referenceData?.stores || referenceData.stores.length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    <p>No stores available</p>
                    <p className="text-sm">Please create stores first in the Store Management module</p>
                  </div>
                )}
              </div>
              
            </div>
          </div>

                                {/* Price Settings */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">Price Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price_categories" className="block text-sm font-medium text-gray-700 mb-1">
                  Price Categories
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {referenceData?.priceCategories && referenceData.priceCategories.length > 0 ? (
                    referenceData.priceCategories.filter(priceCategory => priceCategory && priceCategory.id)?.map(priceCategory => (
                      <label key={priceCategory.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.price_category_ids?.includes(priceCategory.id) || false}
                          onChange={(e) => {
                            const currentIds = formData.price_category_ids || [];
                            if (e.target.checked) {
                              handleFieldChange('price_category_ids', [...currentIds, priceCategory.id]);
                            } else {
                              handleFieldChange('price_category_ids', currentIds.filter(id => id !== priceCategory.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {priceCategory.name} ({priceCategory.code})
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          priceCategory.price_change_type === 'increase' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {priceCategory.price_change_type === 'increase' ? '+' : '-'}{priceCategory.percentage_change}%
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No price categories available</p>
                  )}
                </div>
                
                {/* Tax Inclusive Toggle */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.price_tax_inclusive || false}
                      onChange={(e) => handleFieldChange('price_tax_inclusive', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Default Tax Inclusive</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

                                {/* Expiry Tracking */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">Expiry Tracking</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                      type="checkbox"
                      checked={formData.expiry_notification_days !== undefined && formData.expiry_notification_days !== null}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFieldChange('expiry_notification_days', formData.expiry_notification_days || 30);
                        } else {
                          handleFieldChange('expiry_notification_days', undefined);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Enable Expiry Tracking</span>
                  </div>
                </label>
              </div>

              {formData.expiry_notification_days !== undefined && formData.expiry_notification_days !== null && (
                <div>
                  <label htmlFor="expiry_notification_days" className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Days Before Expiry
                  </label>
                  <input
                    type="number"
                    id="expiry_notification_days"
                    value={formData.expiry_notification_days || ''}
                    onChange={(e) => handleFieldChange('expiry_notification_days', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="30"
                    min="1"
                    max="365"
                    step="1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Inventory Management */}
          {shouldShowField('inventory_fields') && (
            <div className="mb-4">
              <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3">
                Inventory Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="min_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Quantity
                  </label>
                  <input
                    type="number"
                    id="min_quantity"
                    value={formData.min_quantity || ''}
                    onChange={(e) => handleFieldChange('min_quantity', parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label htmlFor="max_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Quantity
                  </label>
                  <input
                    type="number"
                    id="max_quantity"
                    value={formData.max_quantity || ''}
                    onChange={(e) => handleFieldChange('max_quantity', parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label htmlFor="reorder_point" className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    id="reorder_point"
                    value={formData.reorder_point || ''}
                    onChange={(e) => handleFieldChange('reorder_point', parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.track_serial_number}
                    onChange={(e) => handleFieldChange('track_serial_number', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Track Serial Numbers</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Product is Active</span>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
