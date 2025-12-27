import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Calculator, Package, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { Product, ProductRawMaterial } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useCompanySetupManagement } from '../../hooks/useCompanySetupManagement';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

interface RawMaterialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

interface RawMaterialEntry {
  id?: string;
  raw_material_id: string;
  quantity_per_unit: number;
  unit: string;
  raw_material?: Product;
  isNew?: boolean;
}

interface ProductionCalculation {
  totalMaterialCost: number;
  totalQuantity: number;
  costPerUnit: number;
  materialsBreakdown: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost: number;
    totalCost: number;
  }>;
}

const RawMaterialsModal: React.FC<RawMaterialsModalProps> = ({
  open,
  onOpenChange,
  product
}) => {
  const { company } = useCompanySetupManagement();
  
  // State
  const [rawMaterials, setRawMaterials] = useState<RawMaterialEntry[]>([]);
  const [availableRawMaterials, setAvailableRawMaterials] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [productionCalculation, setProductionCalculation] = useState<ProductionCalculation | null>(null);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<string>('');
  const [quantityPerUnit, setQuantityPerUnit] = useState<number>(1);
  const [unit, setUnit] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Fetch available raw materials
  const fetchAvailableRawMaterials = useCallback(async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/manufacturing/available-raw-materials`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableRawMaterials(data.data || []);
      } else {
        const errorText = await response.text();
        toast.error('Failed to fetch available raw materials');
      }
    } catch (error) {
      toast.error('Error fetching available raw materials');
    }
  }, []);

  // Fetch existing raw materials for this product
  const fetchProductRawMaterials = useCallback(async () => {
    if (!product?.id) return;
    
    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/manufacturing/raw-materials/${product.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const materials = data.data?.map((item: any) => ({
          id: item.id,
          raw_material_id: item.raw_material_id,
          quantity_per_unit: parseFloat(item.quantity_per_unit),
          unit: item.unit,
          raw_material: item.rawMaterial
        })) || [];
        setRawMaterials(materials);
      } else {
        const errorText = await response.text();
        toast.error('Failed to fetch product raw materials');
      }
    } catch (error) {
      toast.error('Error fetching product raw materials');
    } finally {
      setLoading(false);
    }
  }, [product?.id]);

  // Load data when modal opens
  useEffect(() => {
    if (open && product) {
      fetchAvailableRawMaterials();
      fetchProductRawMaterials();
    }
  }, [open, product, fetchAvailableRawMaterials, fetchProductRawMaterials]);

  // Calculate production costs
  const calculateProductionCosts = useCallback(() => {
    if (rawMaterials.length === 0 || productionQuantity <= 0) {
      setProductionCalculation(null);
      return;
    }

    const materialsBreakdown = rawMaterials.map(material => {
      const rawMaterial = availableRawMaterials.find(rm => rm.id === material.raw_material_id);
      const cost = rawMaterial?.average_cost || 0;
      const totalCost = cost * material.quantity_per_unit * productionQuantity;
      
      return {
        name: rawMaterial?.name || 'Unknown Material',
        quantity: material.quantity_per_unit * productionQuantity,
        unit: material.unit,
        cost: cost,
        totalCost: totalCost
      };
    });

    const totalMaterialCost = materialsBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
    const costPerUnit = totalMaterialCost / productionQuantity;

    setProductionCalculation({
      totalMaterialCost,
      totalQuantity: productionQuantity,
      costPerUnit,
      materialsBreakdown
    });
  }, [rawMaterials, availableRawMaterials, productionQuantity]);

  // Update calculation when dependencies change
  useEffect(() => {
    calculateProductionCosts();
  }, [calculateProductionCosts]);

  // Add new raw material
  const addRawMaterial = () => {
    if (!selectedRawMaterial || quantityPerUnit <= 0 || !unit) {
      toast.error('Please fill in all fields');
      return;
    }

    const newMaterial: RawMaterialEntry = {
      raw_material_id: selectedRawMaterial,
      quantity_per_unit: quantityPerUnit,
      unit: unit,
      isNew: true
    };

    setRawMaterials(prev => [...prev, newMaterial]);
    
    // Reset form
    setSelectedRawMaterial('');
    setQuantityPerUnit(1);
    setUnit('');
    setSearchTerm('');
  };

  // Clear search and selection
  const clearSelection = () => {
    setSelectedRawMaterial('');
    setSearchTerm('');
    setUnit(''); // Also reset the unit when clearing selection
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.raw-material-search')) {
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Remove raw material
  const removeRawMaterial = (index: number) => {
    setRawMaterials(prev => prev.filter((_, i) => i !== index));
  };

  // Save raw materials
  const saveRawMaterials = async () => {
    if (!product?.id || rawMaterials.length === 0) {
      toast.error('No raw materials to save');
      return;
    }

    try {
      setLoading(true);
      
      // Save each raw material
      for (const material of rawMaterials) {
        if (material.isNew) {
          // Create new raw material
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
          const csrfToken = authService.getCSRFToken();
          const response = await fetch(`${baseUrl}/manufacturing/raw-materials`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken || ''
            },
            credentials: 'include',
            body: JSON.stringify({
              manufactured_product_id: product.id,
              raw_material_id: material.raw_material_id,
              quantity_per_unit: material.quantity_per_unit,
              unit: material.unit
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save raw material: ${material.raw_material_id} - ${response.status} ${response.statusText}`);
          }
        }
      }

      toast.success('Raw materials saved successfully');
      fetchProductRawMaterials(); // Refresh the list
    } catch (error) {
      toast.error('Failed to save raw materials');
    } finally {
      setLoading(false);
    }
  };

  // Get filtered raw materials based on search term
  const filteredRawMaterials = availableRawMaterials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get available units for a raw material
  const getAvailableUnits = (rawMaterialId: string): string[] => {
    const material = availableRawMaterials.find(rm => rm.id === rawMaterialId);
    if (material?.default_packaging_id) {
      return [String(material.default_quantity || '1'), 'kg', 'g', 'l', 'ml', 'pcs', 'units'];
    }
    return ['kg', 'g', 'l', 'ml', 'pcs', 'units'];
  };

  // Get default unit for a raw material
  const getDefaultUnit = (rawMaterialId: string): string => {
    const material = availableRawMaterials.find(rm => rm.id === rawMaterialId);
    // Priority: default_packaging > unit > fallback
    if (material?.default_packaging_id && material?.default_quantity) {
      return String(material.default_quantity);
    }
    // If no default packaging, try to get from unit field
    if (material?.unit) {
      return String(material.unit);
    }
    // Fallback to kg for most raw materials
    return 'kg';
  };

  // Get material info for display
  const getSelectedMaterialInfo = () => {
    if (!selectedRawMaterial) return null;
    return availableRawMaterials.find(rm => rm.id === selectedRawMaterial);
  };

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Raw Materials for {product.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage raw materials and calculate production costs
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Raw Material Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Raw Material
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({availableRawMaterials.length} available)
                  </span>
                </h3>
                
                {availableRawMaterials.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Raw Materials Available
                    </h3>
                    <p className="text-gray-600">
                      You need to create raw material products first before you can assign them.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Raw Material
                        <span className="text-xs text-gray-500 ml-1">(Click to search)</span>
                      </label>
                      <div className="relative raw-material-search">
                        <div className="flex">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder={selectedRawMaterial ? "Selected material" : "Search raw materials..."}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onFocus={() => setIsSearchFocused(true)}
                              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                              className={`w-full border rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 rounded-r-none transition-colors ${
                                selectedRawMaterial 
                                  ? 'border-green-300 bg-green-50' 
                                  : isSearchFocused
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {selectedRawMaterial && (
                            <button
                              onClick={clearSelection}
                              className="px-3 py-2 bg-green-100 border border-l-0 border-green-300 rounded-r-md hover:bg-green-200 transition-colors text-green-700"
                              title="Clear selection"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                        
                        {/* Show selected material info */}
                        {selectedRawMaterial && (
                          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mt-1">
                            <div className="font-medium">Selected: {searchTerm}</div>
                            {getSelectedMaterialInfo()?.average_cost && (
                              <div className="text-xs text-green-600 mt-1">
                                Cost: {formatCurrency(getSelectedMaterialInfo()?.average_cost || 0, company?.defaultCurrency?.code)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!selectedRawMaterial && (searchTerm || isSearchFocused) && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto transition-all duration-200 ease-in-out">
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
                              {loading ? 'Loading...' : searchTerm ? `${filteredRawMaterials.length} result${filteredRawMaterials.length !== 1 ? 's' : ''}` : `All ${availableRawMaterials.length} materials`}
                            </div>
                            {(searchTerm ? filteredRawMaterials : availableRawMaterials).length > 0 ? (
                              (searchTerm ? filteredRawMaterials : availableRawMaterials).map(material => (
                                <div
                                  key={material.id}
                                  onClick={() => {
                                    setSelectedRawMaterial(material.id);
                                    setSearchTerm(material.name);
                                    // Auto-fill the unit when material is selected
                                    const defaultUnit = getDefaultUnit(material.id);
                                    setUnit(defaultUnit);
                                  }}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 group"
                                  title="Click to select"
                                >
                                  <div className="font-medium text-gray-900">{material.name}</div>
                                  <div className="text-sm text-gray-500">{material.code}</div>
                                  <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to select
                                  </div>
                                </div>
                              ))
                            ) : searchTerm ? (
                              <div className="px-3 py-2 text-gray-500 text-sm">No raw materials found</div>
                            ) : availableRawMaterials.length === 0 ? (
                              <div className="px-3 py-2 text-gray-500 text-sm">No raw materials available</div>
                            ) : (
                              <div className="px-3 py-2 text-gray-500 text-sm">Type to search raw materials...</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity per Unit
                        {selectedRawMaterial && getSelectedMaterialInfo()?.default_quantity && (
                          <span className="text-xs text-blue-600 ml-1">
                            (Default: {getSelectedMaterialInfo()?.default_quantity})
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={quantityPerUnit}
                        onChange={(e) => setQuantityPerUnit(parseFloat(e.target.value) || 0)}
                        placeholder={selectedRawMaterial && getSelectedMaterialInfo()?.default_quantity ? 
                          `Default: ${getSelectedMaterialInfo()?.default_quantity}` : 
                          "Enter quantity"
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                        {selectedRawMaterial && (
                          <span className="text-xs text-green-600 ml-1">
                            (Auto-filled for {getSelectedMaterialInfo()?.name})
                          </span>
                        )}
                      </label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          selectedRawMaterial ? 'border-green-300 bg-green-50' : 'border-gray-300'
                        }`}
                        disabled={!selectedRawMaterial}
                      >
                        <option value="">
                          {selectedRawMaterial ? 'Auto-filled unit' : 'Select Unit'}
                        </option>
                        {selectedRawMaterial && getAvailableUnits(selectedRawMaterial).map(unitOption => {
                          const isDefault = unitOption === getDefaultUnit(selectedRawMaterial);
                          return (
                            <option key={unitOption} value={unitOption}>
                              {unitOption} {isDefault ? '(Recommended)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={addRawMaterial}
                        disabled={!selectedRawMaterial || quantityPerUnit <= 0 || !unit}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Raw Materials List */}
              {rawMaterials.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Raw Materials</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Material
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity per Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost per Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rawMaterials.map((material, index) => {
                          const rawMaterial = availableRawMaterials.find(rm => rm.id === material.raw_material_id);
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {rawMaterial?.name || 'Unknown'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {rawMaterial?.code || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatNumber(material.quantity_per_unit)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.unit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {rawMaterial?.average_cost ? formatCurrency(rawMaterial.average_cost, company?.defaultCurrency?.code) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => removeRawMaterial(index)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                  title="Remove material"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Production Calculator */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Production Calculator
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Input Section */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Number of Products to Manufacture
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productionQuantity}
                      onChange={(e) => setProductionQuantity(parseInt(e.target.value) || 1)}
                      className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  {/* Results Section */}
                  <div>
                    {productionCalculation ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-blue-900">Total Material Cost:</span>
                          <span className="text-lg font-bold text-blue-900">
                            {formatCurrency(productionCalculation.totalMaterialCost, company?.defaultCurrency?.code)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-blue-900">Cost per Unit:</span>
                          <span className="text-lg font-bold text-blue-900">
                            {formatCurrency(productionCalculation.costPerUnit, company?.defaultCurrency?.code)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-blue-700">
                        Add raw materials to see production costs
                      </div>
                    )}
                  </div>
                </div>

                {/* Materials Breakdown */}
                {productionCalculation && productionCalculation.materialsBreakdown.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Materials Breakdown:</h4>
                    <div className="bg-white rounded border border-blue-200 p-3">
                      {productionCalculation.materialsBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm py-1">
                          <span className="text-blue-800">
                            {item.name} ({formatNumber(item.quantity)} {item.unit})
                          </span>
                          <span className="text-blue-900 font-medium">
                            {formatCurrency(item.totalCost, company?.defaultCurrency?.code)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* No Raw Materials Message */}
              {rawMaterials.length === 0 && (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Raw Materials Added
                  </h3>
                  <p className="text-gray-600">
                    Start by adding raw materials above to calculate production costs.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {rawMaterials.length > 0 ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                {rawMaterials.length} raw material(s) configured
              </span>
            ) : (
              <span className="flex items-center text-yellow-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                No raw materials configured
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            {rawMaterials.length > 0 && (
              <button
                onClick={saveRawMaterials}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Raw Materials'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawMaterialsModal;
