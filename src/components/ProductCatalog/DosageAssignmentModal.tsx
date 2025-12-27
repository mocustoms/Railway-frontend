import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Calculator, Pill } from 'lucide-react';
import { Product } from '../../types';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

interface DosageAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

interface DosageEntry {
  id?: string;
  name: string;
  max_dose: string;
  frequency: string;
  duration: string;
  indication: string;
  age_min?: number;
  age_max?: number;
  weight_min?: number;
  weight_max?: number;
  notes: string;
  sort_order: number;
  isNew?: boolean;
}

interface DosageCalculation {
  patientAge: number;
  patientWeight: number;
  recommendedDosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

const DosageAssignmentModal: React.FC<DosageAssignmentModalProps> = ({
  open,
  onOpenChange,
  product
}) => {
  // State
  const [dosages, setDosages] = useState<DosageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientAge, setPatientAge] = useState<number>(0);
  const [patientWeight, setPatientWeight] = useState<number>(0);
  const [dosageCalculation, setDosageCalculation] = useState<DosageCalculation | null>(null);
  const [newDosage, setNewDosage] = useState<DosageEntry>({
    name: '',
    max_dose: '',
    frequency: '',
    duration: '',
    indication: '',
    age_min: undefined,
    age_max: undefined,
    weight_min: undefined,
    weight_max: undefined,
    notes: '',
    sort_order: 0
  });

  // Fetch existing dosages for this product
  const fetchProductDosages = useCallback(async () => {
    if (!product?.id) return;
    
    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/pharmaceutical/dosages/${product.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const dosageList = data.data?.map((dosage: any) => ({
          id: dosage.id,
          name: dosage.name || '',
          max_dose: dosage.max_dose || '',
          frequency: dosage.frequency || '',
          duration: dosage.duration || '',
          indication: dosage.indication || '',
          age_min: dosage.age_min ? parseFloat(dosage.age_min) : undefined,
          age_max: dosage.age_max ? parseFloat(dosage.age_max) : undefined,
          weight_min: dosage.weight_min ? parseFloat(dosage.weight_min) : undefined,
          weight_max: dosage.weight_max ? parseFloat(dosage.weight_max) : undefined,
          notes: dosage.notes || '',
          sort_order: dosage.sort_order || 0
        })) || [];
        setDosages(dosageList);
             } else {
         const errorText = await response.text();
         setError(`Failed to fetch dosages: ${response.status} ${response.statusText}`);
         toast.error('Failed to fetch product dosages');
       }
         } catch (error) {
       setError(`Error fetching dosages: ${error instanceof Error ? error.message : 'Unknown error'}`);
       toast.error('Error fetching product dosages');
     } finally {
       setLoading(false);
     }
  }, [product?.id]);

  // Load dosages when product changes
  useEffect(() => {
    if (open && product?.id) {
      fetchProductDosages();
    }
  }, [open, product?.id, fetchProductDosages]);

     // Add new dosage to the list
   const addDosage = () => {
     // Check if required fields are filled
     if (!newDosage.name || !newDosage.max_dose || !newDosage.frequency) {
       toast.error('Please fill in all required fields (Name, Max Dose, Frequency)');
       return;
     }
     
     const newDosageEntry: DosageEntry = {
       ...newDosage,
       id: `temp-${Date.now()}`,
       sort_order: dosages.length,
       isNew: true
     };
     
     setDosages(prev => [...prev, newDosageEntry]);
     
     // Reset form
     setNewDosage({
       name: '',
       max_dose: '',
       frequency: '',
       duration: '',
       indication: '',
       age_min: undefined,
       age_max: undefined,
       weight_min: undefined,
       weight_max: undefined,
       notes: '',
       sort_order: 0
     });
     
     toast.success('Dosage added successfully!');
   };

  // Remove dosage from the list
  const removeDosage = (id: string) => {
    setDosages(prev => prev.filter(dosage => dosage.id !== id));
  };

  // Update dosage in the list
  const updateDosage = (id: string, field: keyof DosageEntry, value: any) => {
    setDosages(prev => prev.map(dosage => 
      dosage.id === id ? { ...dosage, [field]: value } : dosage
    ));
  };

  // Calculate recommended dosage based on patient criteria
  const calculateDosage = () => {
    if (!patientAge || !patientWeight) {
      toast.error('Please enter both patient age and weight');
      return;
    }

    // Find the best matching dosage based on age and weight criteria
    const matchingDosages = dosages.filter(dosage => {
      const ageMatch = (!dosage.age_min || patientAge >= dosage.age_min) && 
                      (!dosage.age_max || patientAge <= dosage.age_max);
      const weightMatch = (!dosage.weight_min || patientWeight >= dosage.weight_min) && 
                         (!dosage.weight_max || patientWeight <= dosage.weight_max);
      return ageMatch && weightMatch;
    });

    if (matchingDosages.length === 0) {
      toast.error('No matching dosage found for the given age and weight criteria');
      return;
    }

    // Use the first matching dosage (or could implement more sophisticated selection)
    const bestMatch = matchingDosages[0];
    setDosageCalculation({
      patientAge,
      patientWeight,
      recommendedDosage: bestMatch.max_dose,
      frequency: bestMatch.frequency,
      duration: bestMatch.duration,
      notes: bestMatch.notes
    });

    toast.success('Dosage calculation completed');
  };

  // Save all dosages to the backend
  const saveDosages = async () => {
    if (!product?.id) {
      toast.error('No product selected');
      return;
    }

    if (dosages.length === 0) {
      toast.error('No dosages to save');
      return;
    }

    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
             const csrfToken = authService.getCSRFToken();
       
       const headers: HeadersInit = {
         'Content-Type': 'application/json'
       };
       
       if (csrfToken) {
         headers['X-CSRF-Token'] = csrfToken;
       }
       
       const requestBody = {
         product_id: product.id,
         adjustments: '', // General adjustments field
         dosages: dosages.map(dosage => ({
           name: dosage.name,
           max_dose: dosage.max_dose,
           frequency: dosage.frequency,
           duration: dosage.duration,
           indication: dosage.indication,
           age_min: dosage.age_min,
           age_max: dosage.age_max,
           weight_min: dosage.weight_min,
           weight_max: dosage.weight_max,
           notes: dosage.notes
         }))
       };
       
       const response = await fetch(`${baseUrl}/pharmaceutical/info`, {
         method: 'POST',
         headers,
         credentials: 'include',
         body: JSON.stringify(requestBody)
       });
       
       if (response.ok) {
         const data = await response.json();
         toast.success('Dosages saved successfully');
        
        // Update dosages with server IDs
        if (data.data?.dosages) {
          const updatedDosages = data.data.dosages.map((dosage: any) => ({
            id: dosage.id,
            name: dosage.name || '',
            max_dose: dosage.max_dose || '',
            frequency: dosage.frequency || '',
            duration: dosage.duration || '',
            indication: dosage.indication || '',
            age_min: dosage.age_min ? parseFloat(dosage.age_min) : undefined,
            age_max: dosage.age_max ? parseFloat(dosage.age_max) : undefined,
            weight_min: dosage.weight_min ? parseFloat(dosage.weight_min) : undefined,
            weight_max: dosage.weight_max ? parseFloat(dosage.weight_max) : undefined,
            notes: dosage.notes || '',
            sort_order: dosage.sort_order || 0
          }));
          setDosages(updatedDosages);
        }
             } else {
         const errorText = await response.text();
         toast.error('Failed to save dosages');
       }
    } catch (error) {
      toast.error('Failed to save dosages');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Dosage Management for {product?.name}
              </h2>
              <p className="text-sm text-gray-600">
                Manage dosages and calculate recommendations based on patient criteria
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Loading State */}
          {loading && (
            <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-blue-800">Loading dosages...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Dosages</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    <p className="mt-1">This might be due to authentication issues. Please try refreshing the page.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Add New Dosage Form */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Dosage</h3>
             
             {/* Workflow Instructions */}
             <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
               <h4 className="font-medium text-blue-900 mb-2">📋 How to Use:</h4>
               <div className="text-sm text-blue-800 space-y-1">
                 <p>1. <strong>Fill out the form below</strong> with dosage details</p>
                 <p>2. <strong>Click "Add to List"</strong> to add the dosage to your temporary list</p>
                 <p>3. <strong>Repeat steps 1-2</strong> for additional dosages</p>
                 <p>4. <strong>Click "Save All to Database"</strong> when you're ready to save everything</p>
               </div>
             </div>
             
             {/* Status Indicator */}
             <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
               <div className="flex items-center justify-between text-sm">
                 <span className="text-blue-800">
                   <strong>Current Status:</strong> {dosages.length} dosage{dosages.length !== 1 ? 's' : ''} in list
                 </span>
                 <span className="text-blue-600 font-medium">
                   {dosages.filter(d => d.isNew).length} new • {dosages.filter(d => !d.isNew).length} existing
                 </span>
               </div>
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage Name *
                </label>
                <input
                  type="text"
                  value={newDosage.name}
                  onChange={(e) => setNewDosage(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Adult, Pediatric, Severe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Dose *
                </label>
                <input
                  type="text"
                  value={newDosage.max_dose}
                  onChange={(e) => setNewDosage(prev => ({ ...prev, max_dose: e.target.value }))}
                  placeholder="e.g., 500mg, 10mg/kg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <input
                  type="text"
                  value={newDosage.frequency}
                  onChange={(e) => setNewDosage(prev => ({ ...prev, frequency: e.target.value }))}
                  placeholder="e.g., Every 6 hours, Twice daily"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={newDosage.duration}
                  onChange={(e) => setNewDosage(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 7 days, Until symptoms resolve"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Indication
                </label>
                <input
                  type="text"
                  value={newDosage.indication}
                  onChange={(e) => setNewDosage(prev => ({ ...prev, indication: e.target.value }))}
                  placeholder="e.g., Mild infection, Severe pain"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age Range (years)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={newDosage.age_min || ''}
                    onChange={(e) => setNewDosage(prev => ({ ...prev, age_min: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={newDosage.age_max || ''}
                    onChange={(e) => setNewDosage(prev => ({ ...prev, age_max: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight Range (kg)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={newDosage.weight_min || ''}
                    onChange={(e) => setNewDosage(prev => ({ ...prev, weight_min: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={newDosage.weight_max || ''}
                    onChange={(e) => setNewDosage(prev => ({ ...prev, weight_max: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newDosage.notes}
                  onChange={(e) => setNewDosage(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions, contraindications, etc."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={addDosage}
                disabled={!newDosage.name || !newDosage.max_dose || !newDosage.frequency}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to List
              </button>
              
              {/* Save Button - Prominent placement near Add button */}
              {dosages.length > 0 && (
                <button
                  onClick={saveDosages}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 font-medium shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      💾 Save All ({dosages.length} dosage{dosages.length !== 1 ? 's' : ''})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Dosage Calculator */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Dosage Calculator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Age (years)
                </label>
                <input
                  type="number"
                  value={patientAge || ''}
                  onChange={(e) => setPatientAge(e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="Enter age"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Weight (kg)
                </label>
                <input
                  type="number"
                  value={patientWeight || ''}
                  onChange={(e) => setPatientWeight(e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="Enter weight"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={calculateDosage}
                  disabled={!patientAge || !patientWeight || dosages.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Calculate Dosage
                </button>
              </div>
            </div>

            {dosageCalculation && (
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-2">Recommended Dosage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Dosage:</span> {dosageCalculation.recommendedDosage}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Frequency:</span> {dosageCalculation.frequency}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span> {dosageCalculation.duration}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Notes:</span> {dosageCalculation.notes}
                  </div>
                </div>
              </div>
            )}
          </div>

                     {/* Current Dosages List */}
           <div className="bg-white rounded-lg border border-gray-200">
             <div className="px-6 py-4 border-b border-gray-200">
               <div className="flex items-center justify-between">
                 <h3 className="text-lg font-medium text-gray-900">Current Dosages</h3>
                 <div className="text-sm text-gray-600">
                   <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
                     {dosages.filter(d => !d.isNew).length} Saved
                   </span>
                   <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                     {dosages.filter(d => d.isNew).length} Pending
                   </span>
                 </div>
               </div>
             </div>
            
            {dosages.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Pill className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No dosages configured</p>
                <p className="text-sm">Add dosages above to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max Dose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indication
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                                         {dosages.map((dosage, index) => (
                       <tr key={dosage.id} className={`hover:bg-gray-50 ${dosage.isNew ? 'bg-yellow-50' : ''}`}>
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center space-x-2">
                             {dosage.isNew && (
                               <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                 NEW
                               </span>
                             )}
                             <input
                               type="text"
                               value={dosage.name}
                               onChange={(e) => updateDosage(dosage.id!, 'name', e.target.value)}
                               className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                             />
                           </div>
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={dosage.max_dose}
                            onChange={(e) => updateDosage(dosage.id!, 'max_dose', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={dosage.frequency}
                            onChange={(e) => updateDosage(dosage.id!, 'frequency', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={dosage.duration}
                            onChange={(e) => updateDosage(dosage.id!, 'duration', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={dosage.indication}
                            onChange={(e) => updateDosage(dosage.id!, 'indication', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dosage.age_min && dosage.age_max 
                            ? `${dosage.age_min}-${dosage.age_max} years`
                            : dosage.age_min 
                              ? `≥${dosage.age_min} years`
                              : dosage.age_max 
                                ? `≤${dosage.age_max} years`
                                : 'Any age'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dosage.weight_min && dosage.weight_max 
                            ? `${dosage.weight_min}-${dosage.weight_max} kg`
                            : dosage.weight_min 
                              ? `≥${dosage.weight_min} kg`
                              : dosage.weight_max 
                                ? `≤${dosage.weight_max} kg`
                                : 'Any weight'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeDosage(dosage.id!)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                            title="Remove dosage"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Always Visible */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Debug Info:</span> Dosages: {dosages.length}, Loading: {loading ? 'Yes' : 'No'}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={saveDosages}
              disabled={loading || dosages.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {loading ? 'Saving...' : `Save All to Database (${dosages.length} dosage${dosages.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DosageAssignmentModal;
