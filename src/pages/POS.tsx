import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeService } from '../services/storeService';
import { salesInvoiceService } from '../services/salesInvoiceService';
import { SalesInvoiceItemFormData, Product, SalesInvoice, Company } from '../types';
import { Customer } from '../services/customerService';
import customerService from '../services/customerService';
import customerGroupService from '../services/customerGroupService';
import { linkedAccountService } from '../services/linkedAccountService';
import loyaltyCardService from '../services/loyaltyCardService';
import { salesAgentService } from '../services/salesAgentService';
import { apiService } from '../services/api';
import { financialYearService } from '../services/financialYearService';
import { priceCategoryService } from '../services/priceCategoryService';
import { paymentTypeService } from '../services/paymentTypeService';
import { taxCodeService } from '../services/taxCodeService';
import { Bell, User, CheckCircle, ArrowLeft, ShoppingCart, Home } from 'lucide-react';
import MenuPanel from '../components/POS/MenuPanel';
import OrderDetailsPanel from '../components/POS/OrderDetailsPanel';
import Modal from '../components/Modal';
import CustomerForm from '../components/CustomerForm';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/ImageWithFallback';
// Image handling is now done via ImageWithFallback component

// Order interface removed - not needed for retail POS

const POS: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cartItems, setCartItems] = useState<(SalesInvoiceItemFormData & { 
    productName?: string; 
    productCode?: string;
    productImage?: string;
    originalTaxPercentage?: number;
    originalSalesTaxId?: string | null;
  })[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSalesAgent, setSelectedSalesAgent] = useState<string>('');
  const [selectedPriceCategory, setSelectedPriceCategory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [salesProfile, setSalesProfile] = useState<'cash' | 'credit'>('cash');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<SalesInvoice | null>(null);
  const [transactionDateError, setTransactionDateError] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [selectedPaymentTypeId, setSelectedPaymentTypeId] = useState<string>('');
  const [selectedPaymentTypeName, setSelectedPaymentTypeName] = useState<string>('');
  
  // Add Customer Modal state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [loyaltyCards, setLoyaltyCards] = useState<any[]>([]);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch store details
  const { data: store, isLoading } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => storeService.getStore(storeId!),
    enabled: !!storeId,
  });

  // Fetch price categories
  const { data: priceCategoriesData } = useQuery({
    queryKey: ['price-categories', 'active'],
    queryFn: () => priceCategoryService.getPriceCategories({ page: 1, limit: 1000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const priceCategories = (priceCategoriesData?.priceCategories || []).filter(
    (pc: any) => pc.is_active
  );

  // Auto-select store's default price category when store is loaded
  useEffect(() => {
    if (store?.default_price_category_id) {
      // Always set to store's default when store changes, or if no category is selected
      setSelectedPriceCategory(store.default_price_category_id);
    } else {
      // Clear selection if store has no default
      setSelectedPriceCategory('');
    }
  }, [store?.default_price_category_id]);

  // Fetch company data to get default currency
  const { data: companyData } = useQuery<Company | null>({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await apiService.get<Company>('/company');
      return response.success && response.data ? response.data : null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch current financial year for date validation
  const { data: currentFinancialYear } = useQuery({
    queryKey: ['currentFinancialYear'],
    queryFn: () => financialYearService.getCurrentFinancialYear(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch sales agents
  const { data: salesAgentsData } = useQuery({
    queryKey: ['sales-agents', 'active'],
    queryFn: () => salesAgentService.getSalesAgents(1, 1000, { search: '', status: 'active' }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const salesAgents = useMemo(() => {
    return (salesAgentsData?.data || []).map((agent: any) => ({
      id: agent.id,
      agentNumber: agent.agentNumber,
      fullName: agent.fullName
    }));
  }, [salesAgentsData]);

  // Fetch sales tax codes for tax code matching (similar to Sales Invoice form)
  const { data: taxCodesData } = useQuery({
    queryKey: ['sales-tax-codes', 'active'],
    queryFn: () => taxCodeService.getTaxCodes(1, 1000),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const salesTaxCodes = useMemo(() => {
    return (taxCodesData?.taxCodes || []).filter((tc: any) => !tc.is_wht && tc.is_active);
  }, [taxCodesData]);

  // Load customer groups and loyalty cards for Add Customer modal
  useEffect(() => {
    const loadCustomerFormData = async () => {
      try {
        const groupsResp = await customerGroupService.getCustomerGroups(
          1, 
          1000, 
          { search: '', status: 'active' } as any, 
          { key: 'group_name', direction: 'asc' } as any
        );
        setCustomerGroups(groupsResp.data || []);
      } catch (error) {
        // Error loading customer groups - silently handle
      }
      
      try {
        const cardsResp = await loyaltyCardService.getLoyaltyCardConfigs({ 
          page: 1, 
          limit: 1000, 
          status: 'active' 
        });
        setLoyaltyCards(cardsResp.data || []);
      } catch (error) {
        // Error loading loyalty cards - silently handle
      }
    };

    loadCustomerFormData();
  }, []);

  // Handle create new customer
  const handleCreateCustomer = useCallback(async (data: any) => {
    try {
      setIsCreatingCustomer(true);
      const newCustomer = await customerService.createCustomer(data);
      
      // Auto-select the newly created customer
      setSelectedCustomer(newCustomer);
      
      // Close modal
      setShowAddCustomerModal(false);
      
      toast.success('Customer created successfully and selected');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create customer');
    } finally {
      setIsCreatingCustomer(false);
    }
  }, []);

  // Get default currency symbol from company (not store)
  const currencySymbol = companyData?.defaultCurrency?.symbol || '$';
  
  // Get store type - default to retail_shop if not available
  const storeType = store?.store_type || 'retail_shop';

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    // Calculate subtotal (line totals before tax, discount already applied to lineTotal)
    // For accurate subtotal, we need to sum: (unitPrice * quantity) - discountAmount for each item
    const subtotal = cartItems.reduce((sum, item) => {
      const itemSubtotal = (item.unitPrice || 0) * (item.quantity || 0) - (item.discountAmount || 0);
      return sum + itemSubtotal;
    }, 0);
    
    const discountAmount = cartItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    
    // Tax is calculated per item, so sum all item tax amounts
    const taxAmount = cartItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    
    // Calculate weighted average tax percentage based on each item's tax percentage and subtotal contribution
    let weightedTaxPercentage = 0;
    if (subtotal > 0) {
      const totalWeightedTax = cartItems.reduce((sum, item) => {
        const itemSubtotal = (item.unitPrice || 0) * (item.quantity || 0) - (item.discountAmount || 0);
        const itemWeight = itemSubtotal / subtotal; // Weight of this item in the total subtotal
        const itemTaxPercentage = item.taxPercentage || 0;
        return sum + (itemTaxPercentage * itemWeight);
      }, 0);
      weightedTaxPercentage = totalWeightedTax;
    }
    
    const totalAmount = subtotal - discountAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      taxPercentage: weightedTaxPercentage
    };
  }, [cartItems]);

  // Handle product selection from menu
  const handleProductSelect = useCallback((product: Product, quantity: number) => {
    const availableStock = product.currentQuantity || 0;
    
    if (availableStock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} units available in stock`);
      return;
    }

    // Check if product already in cart
    const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedItems = [...cartItems];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = Math.min((existingItem.quantity || 0) + quantity, availableStock);
      
      // Recalculate tax per item based on new quantity
      const unitPrice = existingItem.unitPrice || product.selling_price || 0;
      const discountPercentage = existingItem.discountPercentage || 0;
      const taxPercentage = existingItem.taxPercentage || 0;
      const priceTaxInclusive = existingItem.price_tax_inclusive || false;
      
      // Recalculate discount based on new quantity
      const lineSubtotal = unitPrice * newQuantity;
      const discountAmount = (lineSubtotal * discountPercentage) / 100;
      const amountAfterDiscount = lineSubtotal - discountAmount;
      
      // Recalculate tax amount based on amount after discount
      const taxAmount = priceTaxInclusive
        ? (amountAfterDiscount * taxPercentage) / (100 + taxPercentage)
        : (amountAfterDiscount * taxPercentage) / 100;
      
      const lineTotal = amountAfterDiscount + taxAmount;

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        discountAmount,
        amountAfterDiscount,
        taxAmount, // Update tax amount based on new quantity
        lineTotal,
        // Preserve original tax values if they exist, otherwise set them from current values
        originalTaxPercentage: existingItem.originalTaxPercentage ?? existingItem.taxPercentage,
        originalSalesTaxId: existingItem.originalSalesTaxId ?? existingItem.salesTaxId
      };
      setCartItems(updatedItems);
      toast.success(`${product.name} quantity updated`);
    } else {
      // Add new item to cart
      const unitPrice = product.selling_price || 0;
      const taxRate = typeof product.salesTax?.rate === 'string' 
        ? parseFloat(product.salesTax.rate) 
        : (product.salesTax?.rate as number) || 0;
      const taxPercentage = taxRate;
      const taxAmount = product.price_tax_inclusive 
        ? (unitPrice * quantity * taxPercentage) / (100 + taxPercentage)
        : (unitPrice * quantity * taxPercentage) / 100;
      
      const lineTotal = (unitPrice * quantity) + taxAmount;

      // Match tax code: First try product's sales_tax_id, then match by tax percentage
      let matchedSalesTaxId: string | null = product.sales_tax_id || product.salesTax?.id || null;
      
      // If product doesn't have sales_tax_id but has tax percentage, try to match by rate
      if (!matchedSalesTaxId && taxPercentage > 0 && salesTaxCodes.length > 0) {
        const matchingTaxCode = salesTaxCodes.find((tc: any) => {
          const tcRate = tc.rate ? (typeof tc.rate === 'number' ? tc.rate : parseFloat(tc.rate || '0')) : 0;
          return Math.abs(tcRate - taxPercentage) < 0.01; // Allow small floating point differences
        });
        if (matchingTaxCode) {
          matchedSalesTaxId = matchingTaxCode.id;
        }
      }

      const newItem: SalesInvoiceItemFormData & { 
        productName?: string; 
        productCode?: string; 
        productImage?: string;
        originalTaxPercentage?: number;
        originalSalesTaxId?: string | null;
      } = {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        productImage: product.image || undefined,
        quantity,
        unitPrice,
        discountPercentage: 0,
        discountAmount: 0,
        taxPercentage,
        taxAmount,
        salesTaxId: matchedSalesTaxId, // Use matched tax code ID
        originalTaxPercentage: taxPercentage, // Store original tax percentage
        originalSalesTaxId: matchedSalesTaxId, // Store original tax code ID
        whtTaxId: null,
        whtAmount: 0,
        price_tax_inclusive: product.price_tax_inclusive || false,
        currencyId: null,
        exchangeRate: 1,
        equivalentAmount: 0,
        amountAfterDiscount: unitPrice * quantity,
        amountAfterWht: unitPrice * quantity,
        lineTotal,
        notes: '',
        serialNumbers: [],
        batchNumber: undefined,
        expiryDate: undefined
      };

      setCartItems([...cartItems, newItem]);
      toast.success(`${product.name} added to order`);
    }
  }, [cartItems, salesTaxCodes]);

  // Handle remove item
  const handleRemoveItem = useCallback((index: number) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
    toast.success('Item removed from order');
  }, [cartItems]);

  // Handle quantity update
  const handleUpdateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      setCartItems(prevItems => {
        const updatedItems = prevItems.filter((_, i) => i !== index);
        toast.success('Item removed from order');
        return updatedItems;
      });
      return;
    }

    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      const item = updatedItems[index];
      
      // Recalculate tax per item based on new quantity
      const unitPrice = item.unitPrice || 0;
      const discountPercentage = item.discountPercentage || 0;
      const taxPercentage = item.taxPercentage || 0;
      const priceTaxInclusive = item.price_tax_inclusive || false;
      
      // Recalculate discount based on new quantity
      const lineSubtotal = unitPrice * quantity;
      const discountAmount = (lineSubtotal * discountPercentage) / 100;
      const amountAfterDiscount = lineSubtotal - discountAmount;
      
      // Recalculate tax amount based on amount after discount
      const taxAmount = priceTaxInclusive
        ? (amountAfterDiscount * taxPercentage) / (100 + taxPercentage)
        : (amountAfterDiscount * taxPercentage) / 100;
      
      const lineTotal = amountAfterDiscount + taxAmount;

      updatedItems[index] = {
        ...item,
        quantity,
        discountAmount,
        amountAfterDiscount,
        taxAmount, // Update tax amount based on new quantity
        lineTotal,
        // Preserve original tax values
        originalTaxPercentage: item.originalTaxPercentage ?? item.taxPercentage,
        originalSalesTaxId: item.originalSalesTaxId ?? item.salesTaxId
      };
      return updatedItems;
    });
  }, []);

  // Handle discount update
  const handleUpdateDiscount = useCallback((index: number, discountPercentage: number, discountAmount: number) => {
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      const item = updatedItems[index];
      
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      const taxPercentage = item.taxPercentage || 0;
      const priceTaxInclusive = item.price_tax_inclusive || false;
      
      // Recalculate tax amount based on amount after discount
      const lineSubtotal = unitPrice * quantity;
      const amountAfterDiscount = lineSubtotal - discountAmount;
      
      const taxAmount = priceTaxInclusive
        ? (amountAfterDiscount * taxPercentage) / (100 + taxPercentage)
        : (amountAfterDiscount * taxPercentage) / 100;
      
      const lineTotal = amountAfterDiscount + taxAmount;

      updatedItems[index] = {
        ...item,
        discountPercentage,
        discountAmount,
        amountAfterDiscount,
        taxAmount,
        lineTotal,
        // Preserve original tax values
        originalTaxPercentage: item.originalTaxPercentage ?? item.taxPercentage,
        originalSalesTaxId: item.originalSalesTaxId ?? item.salesTaxId
      };
      return updatedItems;
    });
  }, []);

  // Handle price update
  const handleUpdatePrice = useCallback((index: number, unitPrice: number) => {
    if (unitPrice < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      const item = updatedItems[index];
      
      const quantity = item.quantity || 0;
      const discountPercentage = item.discountPercentage || 0;
      const taxPercentage = item.taxPercentage || 0;
      const priceTaxInclusive = item.price_tax_inclusive || false;
      
      // Recalculate discount based on new price
      const lineSubtotal = unitPrice * quantity;
      const discountAmount = (lineSubtotal * discountPercentage) / 100;
      const amountAfterDiscount = lineSubtotal - discountAmount;
      
      // Recalculate tax amount based on amount after discount
      const taxAmount = priceTaxInclusive
        ? (amountAfterDiscount * taxPercentage) / (100 + taxPercentage)
        : (amountAfterDiscount * taxPercentage) / 100;
      
      const lineTotal = amountAfterDiscount + taxAmount;

      updatedItems[index] = {
        ...item,
        unitPrice,
        discountAmount,
        amountAfterDiscount,
        taxAmount,
        lineTotal,
        // Preserve original tax values
        originalTaxPercentage: item.originalTaxPercentage ?? item.taxPercentage,
        originalSalesTaxId: item.originalSalesTaxId ?? item.salesTaxId
      };
      return updatedItems;
    });
  }, []);

  // Handle remove VAT
  const handleRemoveVAT = useCallback((index: number) => {
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      const item = updatedItems[index];
      
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      const discountPercentage = item.discountPercentage || 0;
      
      // Store original tax values if not already stored
      const originalTaxPercentage = item.originalTaxPercentage ?? item.taxPercentage;
      const originalSalesTaxId = item.originalSalesTaxId ?? item.salesTaxId;
      
      // Recalculate discount based on current price
      const lineSubtotal = unitPrice * quantity;
      const discountAmount = (lineSubtotal * discountPercentage) / 100;
      const amountAfterDiscount = lineSubtotal - discountAmount;
      
      // Remove VAT - set tax to 0
      const taxAmount = 0;
      const lineTotal = amountAfterDiscount; // No tax added

      updatedItems[index] = {
        ...item,
        taxPercentage: 0,
        taxAmount: 0,
        salesTaxId: null, // Clear tax code reference
        originalTaxPercentage, // Preserve original tax percentage
        originalSalesTaxId, // Preserve original tax code ID
        amountAfterDiscount,
        lineTotal
      };
      return updatedItems;
    });
    toast.success('VAT removed from item');
  }, []);

  // Handle add VAT back
  const handleAddVAT = useCallback((index: number) => {
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      const item = updatedItems[index];
      
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      const discountPercentage = item.discountPercentage || 0;
      const priceTaxInclusive = item.price_tax_inclusive || false;
      
      // Get original tax values, or use 0 if not available
      const originalTaxPercentage = item.originalTaxPercentage ?? 0;
      const originalSalesTaxId = item.originalSalesTaxId ?? null;
      
      if (originalTaxPercentage === 0) {
        toast.error('No original VAT found for this item');
        return updatedItems;
      }
      
      // Recalculate discount based on current price
      const lineSubtotal = unitPrice * quantity;
      const discountAmount = (lineSubtotal * discountPercentage) / 100;
      const amountAfterDiscount = lineSubtotal - discountAmount;
      
      // Restore VAT - calculate tax amount based on original tax percentage
      const taxAmount = priceTaxInclusive
        ? (amountAfterDiscount * originalTaxPercentage) / (100 + originalTaxPercentage)
        : (amountAfterDiscount * originalTaxPercentage) / 100;
      
      const lineTotal = amountAfterDiscount + taxAmount;

      updatedItems[index] = {
        ...item,
        taxPercentage: originalTaxPercentage,
        taxAmount,
        salesTaxId: originalSalesTaxId, // Restore original tax code ID
        amountAfterDiscount,
        lineTotal
      };
      return updatedItems;
    });
    toast.success('VAT restored to item');
  }, []);

  // Validate transaction date against financial year
  const validateTransactionDate = useCallback((date: string): boolean => {
    if (!date || !currentFinancialYear) {
      return true; // Skip validation if no date or financial year
    }

    const transactionDateStr = date.split('T')[0]; // Get YYYY-MM-DD part only
    const startDateStr = currentFinancialYear.startDate.split('T')[0];
    const endDateStr = currentFinancialYear.endDate.split('T')[0];

    if (transactionDateStr < startDateStr || transactionDateStr > endDateStr) {
      setTransactionDateError(
        `Transaction date must be within the active financial year range (${startDateStr} to ${endDateStr}).`
      );
      return false;
    }

    setTransactionDateError('');
    return true;
  }, [currentFinancialYear]);

  // Handle transaction date change with validation
  const handleTransactionDateChange = useCallback((date: string) => {
    setTransactionDate(date);
    validateTransactionDate(date);
  }, [validateTransactionDate]);

  // Helper function to get Cash customer from linked accounts
  // Uses the receivables account from Linked Accounts for the Cash Customer's account receivable
  const getCashCustomerFromLinkedAccounts = useCallback(async (): Promise<Customer | null> => {
    try {
      const linkedAccounts = await linkedAccountService.getLinkedAccounts();
      const cashCustomerLinked = linkedAccounts.find(
        la => la.accountType === 'cash_customer' && la.customerId && la.customer
      );
      if (cashCustomerLinked?.customerId && cashCustomerLinked.customer) {
        // Get receivables account from Linked Accounts to use as the customer's receivable account
        const receivablesAccount = linkedAccounts.find(
          la => la.accountType === 'receivables' && la.accountId
        );
        
        // Return the customer from linked account with receivables account set
        return {
          id: cashCustomerLinked.customer.id,
          customer_id: cashCustomerLinked.customer.customer_id,
          full_name: cashCustomerLinked.customer.full_name,
          customer_group_id: '', // Will be fetched if needed
          default_receivable_account_id: receivablesAccount?.accountId || undefined
        } as Customer;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // Helper function to get receivable account for a customer
  // Priority: 1. Customer's default_receivable_account_id, 2. Customer Group's account_receivable_id, 3. Linked Accounts receivables
  const getReceivableAccountForCustomer = useCallback(async (customer: Customer): Promise<string | null> => {
    try {
      // 1. Check customer's default_receivable_account_id
      if (customer.default_receivable_account_id) {
        return customer.default_receivable_account_id;
      }

      // 2. Check customer's group
      if (customer.customer_group_id) {
        try {
          const group = await customerGroupService.getCustomerGroupById(customer.customer_group_id);
          if (group?.account_receivable_id) {
            return group.account_receivable_id;
          }
        } catch (groupError) {
          // Continue without customer group
        }
      }

      // 3. Check linked accounts
      try {
        const linkedAccounts = await linkedAccountService.getLinkedAccounts();
        const receivablesAccount = linkedAccounts.find(
          la => la.accountType === 'receivables' && la.accountId
        );
        if (receivablesAccount?.accountId) {
          return receivablesAccount.accountId;
        }
      } catch (linkedAccountError) {
        // Continue without linked accounts
      }

      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // Get or create Cash customer
  // Priority: 1. Linked Accounts cash_customer, 2. Existing "Cash" customer, 3. Create new "Cash" customer
  const getOrCreateCashCustomer = useCallback(async (): Promise<Customer> => {
    try {
      // 1. First, check linked accounts for cash customer
      const linkedCashCustomer = await getCashCustomerFromLinkedAccounts();
      if (linkedCashCustomer) {
        // Fetch full customer details to get all fields
        const fullCustomer = await customerService.getCustomers({
          page: 1,
          limit: 1,
          search: linkedCashCustomer.id,
          status: 'all'
        });
        if (fullCustomer.data.length > 0) {
          return fullCustomer.data[0];
        }
        // If fetch fails, return the linked customer data we have
        return linkedCashCustomer;
      }

      // 2. Try to find existing "Cash" customer
      const searchResponse = await customerService.getCustomers({
        page: 1,
        limit: 10,
        search: 'Cash',
        status: 'all'
      });

      // Look for exact match
      const cashCustomer = searchResponse.data.find(
        (c: Customer) => c.full_name?.toLowerCase().trim() === 'cash'
      );

      if (cashCustomer) {
        return cashCustomer;
      }

      // 3. If not found, create a new Cash customer
      // Get customer groups to find a default group
      const groupsResp = await customerGroupService.getCustomerGroups(
        1,
        100,
        { search: '', status: 'active' } as any,
        { key: 'group_name', direction: 'asc' } as any
      );
      const defaultGroup = groupsResp.data?.[0]; // Use first available group

      if (!defaultGroup || !defaultGroup.id) {
        throw new Error('No customer groups found. Please create a customer group first.');
      }

      const newCashCustomer = await customerService.createCustomer({
        customer_group_id: defaultGroup.id,
        full_name: 'Cash',
        is_active: true
      });

      return newCashCustomer;
    } catch (error: any) {
      // If creation fails, try to find any customer with "Cash" in the name
      const searchResponse = await customerService.getCustomers({
        page: 1,
        limit: 10,
        search: 'Cash',
        status: 'all'
      });
      if (searchResponse.data.length > 0) {
        return searchResponse.data[0];
      }
      throw new Error('Failed to get or create Cash customer');
    }
  }, [getCashCustomerFromLinkedAccounts]);

  // Handle process payment with payment type and amount (for cash sales)
  const handleProcessPaymentWithPayment = useCallback(async (paymentTypeId: string, amount: number) => {
    // Prevent duplicate submissions
    if (isProcessing) {
      return;
    }

    if (!storeId || cartItems.length === 0) {
      toast.error('Please add items to order');
      return;
    }

    // Validate transaction date before processing
    if (!validateTransactionDate(transactionDate)) {
      toast.error(transactionDateError || 'Invalid transaction date');
      return;
    }

    // Validate currency
    const currencyId = companyData?.defaultCurrencyId || companyData?.defaultCurrency?.id;
    if (!currencyId) {
      toast.error('Default currency is not configured. Please configure a default currency for your company.');
      return;
    }

    // Validate payment type
    if (!paymentTypeId) {
      toast.error('Payment type is required');
      return;
    }

    setIsProcessing(true);

    try {
      // Get customer - use selected customer or Cash customer
      let finalCustomer: Customer;
      if (selectedCustomer) {
        finalCustomer = selectedCustomer;
      } else {
        // Get or create Cash customer
        try {
          finalCustomer = await getOrCreateCashCustomer();
        } catch (customerError: any) {
          throw new Error(`Failed to get customer: ${customerError?.message || 'Unknown error'}`);
        }
      }

      // Get receivable account for the customer
      const receivableAccountId = await getReceivableAccountForCustomer(finalCustomer);
      if (!receivableAccountId) {
        throw new Error(
          'No receivable account found. Please configure: ' +
          '1. Customer default receivable account, OR ' +
          '2. Customer group receivable account, OR ' +
          '3. Linked Accounts receivables account'
        );
      }

      // Get discount allowed account from linked accounts
      let discountAllowedAccountId: string | undefined = undefined;
      try {
        const linkedAccounts = await linkedAccountService.getLinkedAccounts();
        const discountAllowedAccount = linkedAccounts.find(
          la => la.accountType === 'discounts_allowed' && la.accountId
        );
        if (discountAllowedAccount?.accountId) {
          discountAllowedAccountId = discountAllowedAccount.accountId;
        }
      } catch (linkedAccountError) {
        // Continue without discount account - discount entry won't be posted if not set
      }

      // Step 1: Create Sales Invoice
      const invoiceData = {
        invoiceDate: transactionDate,
        storeId,
        customerId: finalCustomer.id,
        salesAgentId: selectedSalesAgent || undefined,
        priceCategoryId: selectedPriceCategory || undefined,
        accountReceivableId: receivableAccountId, // Set receivable account
        discountAllowedAccountId: discountAllowedAccountId, // Set discount allowed account
        currencyId: currencyId, // Already validated above
        exchangeRateValue: 1,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercentage: item.discountPercentage || 0,
          discountAmount: item.discountAmount || 0,
          taxPercentage: item.taxPercentage || 0,
          taxAmount: item.taxAmount || 0,
          salesTaxId: item.salesTaxId || null,
          whtTaxId: item.whtTaxId || null,
          whtAmount: item.whtAmount || 0,
          price_tax_inclusive: item.price_tax_inclusive || false,
          currencyId: item.currencyId || null,
          exchangeRate: item.exchangeRate || 1,
          equivalentAmount: item.equivalentAmount || 0,
          amountAfterDiscount: item.amountAfterDiscount || 0,
          amountAfterWht: item.amountAfterWht || 0,
          lineTotal: item.lineTotal || 0,
          notes: item.notes || '',
          serialNumbers: item.serialNumbers || [],
          batchNumber: item.batchNumber || undefined,
          expiryDate: item.expiryDate || undefined
        }))
      };

      const createdInvoice = await salesInvoiceService.createSalesInvoice(invoiceData);

      // Immediately clear cart items to prevent duplicate submissions
      // This happens after invoice creation but before approval to ensure we have the invoice ID
      setCartItems([]);

      // Step 2: Approve the invoice
      if (createdInvoice.id) {
        try {
          await salesInvoiceService.approveInvoice(createdInvoice.id);
        } catch (approveError: any) {
          throw new Error(`Failed to approve invoice: ${approveError?.response?.data?.message || approveError?.message || 'Unknown error'}`);
        }
      }

      // Step 3: Reload invoice to get updated status after approval
      let updatedInvoice = createdInvoice;
      if (createdInvoice.id) {
        try {
          updatedInvoice = await salesInvoiceService.getSalesInvoice(createdInvoice.id);
        } catch (reloadError) {
          // Continue with original invoice
        }
      }

      // Step 4: Record full payment with payment type and amount
      if (updatedInvoice.id) {
        // Use the invoice's total amount for full payment (not the amount entered which might include change)
        const fullPaymentAmount = updatedInvoice.totalAmount || amount;
        try {
          await salesInvoiceService.recordPayment(updatedInvoice.id, {
            paymentAmount: fullPaymentAmount, // Full payment amount (invoice total)
            paymentTypeId,
            currencyId: currencyId,
            exchangeRate: 1,
            transactionDate: transactionDate
          });
        } catch (paymentError: any) {
          throw new Error(`Failed to record payment: ${paymentError?.response?.data?.message || paymentError?.message || 'Unknown error'}`);
        }
      }
      
      // Success - reload invoice one more time to get final state
      if (updatedInvoice.id) {
        try {
          updatedInvoice = await salesInvoiceService.getSalesInvoice(updatedInvoice.id);
        } catch (reloadError) {
          // Continue with previous invoice
        }
      }
      
      // Success - show completion
      // Note: Cart items already cleared after invoice creation to prevent duplicates
      setCompletedInvoice(updatedInvoice);
      setSelectedCustomer(null);
      setSelectedSalesAgent('');
      setPaidAmount(0);
      setSelectedPaymentTypeId('');
      setSelectedPaymentTypeName('');
      
      toast.success('Transaction processed successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || error?.response?.data?.error || 'Failed to process transaction';
      const errorDetails = error?.response?.data?.details || error?.response?.data?.errors;
      
      let fullErrorMessage = errorMessage;
      if (errorDetails) {
        if (Array.isArray(errorDetails)) {
          fullErrorMessage += `: ${errorDetails.join(', ')}`;
        } else if (typeof errorDetails === 'string') {
          fullErrorMessage += `: ${errorDetails}`;
        }
      }
      
      toast.error(fullErrorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [storeId, selectedCustomer, selectedSalesAgent, selectedPriceCategory, cartItems, companyData, transactionDate, validateTransactionDate, transactionDateError, getOrCreateCashCustomer, getReceivableAccountForCustomer, isProcessing]);

  // Handle process payment (for credit sales or cash sales with payment info)
  const handleProcessPayment = useCallback(async () => {
    // Prevent duplicate submissions
    if (isProcessing) {
      return;
    }

    if (!storeId || cartItems.length === 0) {
      toast.error('Please add items to order');
      return;
    }

    // For cash sales, require payment to be entered first
    if (salesProfile === 'cash' && (paidAmount === 0 || !selectedPaymentTypeId)) {
      toast.error('Please enter payment amount first');
      return;
    }

    // For credit sales, require a customer to be selected (not Cash customer)
    if (salesProfile === 'credit' && !selectedCustomer) {
      toast.error('Please select a customer for credit sales');
      return;
    }

    // Validate transaction date before processing
    if (!validateTransactionDate(transactionDate)) {
      toast.error(transactionDateError || 'Invalid transaction date');
      return;
    }

    setIsProcessing(true);

    try {
      // For cash sales, use the stored payment info
      if (salesProfile === 'cash' && paidAmount > 0 && selectedPaymentTypeId) {
        await handleProcessPaymentWithPayment(selectedPaymentTypeId, paidAmount);
        return;
      }

      // For credit sales, customer must be selected (already validated above)
      // For cash sales fallback, use selected customer or Cash customer
      let finalCustomer: Customer;
      if (selectedCustomer) {
        finalCustomer = selectedCustomer;
      } else {
        // Get or create Cash customer (fallback for cash sales)
        finalCustomer = await getOrCreateCashCustomer();
      }

      // Get receivable account for the customer
      const receivableAccountId = await getReceivableAccountForCustomer(finalCustomer);
      if (!receivableAccountId) {
        throw new Error(
          'No receivable account found. Please configure: ' +
          '1. Customer default receivable account, OR ' +
          '2. Customer group receivable account, OR ' +
          '3. Linked Accounts receivables account'
        );
      }

      // Get discount allowed account from linked accounts
      let discountAllowedAccountId: string | undefined = undefined;
      try {
        const linkedAccounts = await linkedAccountService.getLinkedAccounts();
        const discountAllowedAccount = linkedAccounts.find(
          la => la.accountType === 'discounts_allowed' && la.accountId
        );
        if (discountAllowedAccount?.accountId) {
          discountAllowedAccountId = discountAllowedAccount.accountId;
        }
      } catch (linkedAccountError) {
        // Continue without discount account - discount entry won't be posted if not set
      }

      // Step 1: Create Sales Invoice
      const invoiceData = {
        invoiceDate: transactionDate,
        storeId,
        customerId: finalCustomer.id,
        salesAgentId: selectedSalesAgent || undefined,
        priceCategoryId: selectedPriceCategory || undefined,
        accountReceivableId: receivableAccountId, // Set receivable account
        discountAllowedAccountId: discountAllowedAccountId, // Set discount allowed account
        currencyId: companyData?.defaultCurrencyId || companyData?.defaultCurrency?.id || '',
        exchangeRateValue: 1,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercentage: item.discountPercentage || 0,
          discountAmount: item.discountAmount || 0,
          taxPercentage: item.taxPercentage || 0,
          taxAmount: item.taxAmount || 0,
          salesTaxId: item.salesTaxId || null,
          whtTaxId: item.whtTaxId || null,
          whtAmount: item.whtAmount || 0,
          price_tax_inclusive: item.price_tax_inclusive || false,
          currencyId: item.currencyId || null,
          exchangeRate: item.exchangeRate || 1,
          equivalentAmount: item.equivalentAmount || 0,
          amountAfterDiscount: item.amountAfterDiscount || 0,
          amountAfterWht: item.amountAfterWht || 0,
          lineTotal: item.lineTotal || 0,
          notes: item.notes || '',
          serialNumbers: item.serialNumbers || [],
          batchNumber: item.batchNumber || undefined,
          expiryDate: item.expiryDate || undefined
        }))
      };

      const createdInvoice = await salesInvoiceService.createSalesInvoice(invoiceData);
      
      // Immediately clear cart items to prevent duplicate submissions
      // This happens after invoice creation but before approval to ensure we have the invoice ID
      setCartItems([]);
      
      // Step 2: Approve the invoice (for credit sales)
      if (createdInvoice.id) {
        try {
          await salesInvoiceService.approveInvoice(createdInvoice.id);
        } catch (approveError: any) {
          throw new Error(`Failed to approve invoice: ${approveError?.response?.data?.message || approveError?.message || 'Unknown error'}`);
        }
      }

      // Step 3: Reload invoice to get updated status after approval
      let updatedInvoice = createdInvoice;
      if (createdInvoice.id) {
        try {
          updatedInvoice = await salesInvoiceService.getSalesInvoice(createdInvoice.id);
        } catch (reloadError) {
          // Continue with original invoice
        }
      }
      
      // Step 4: For credit sales, no payment is recorded (payment will be recorded later)
      // For cash sales, payment is already recorded in handleProcessPaymentWithPayment
      
      // Success - show completion
      // Note: Cart items already cleared after invoice creation to prevent duplicates
      setCompletedInvoice(updatedInvoice);
      setSelectedCustomer(null);
      setSelectedSalesAgent(''); // Reset sales agent
      setPaidAmount(0);
      setSelectedPaymentTypeId('');
      setSelectedPaymentTypeName('');
      // Keep selectedPriceCategory as it might be the store default
      
      toast.success('Transaction processed successfully!');
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast.error(error?.response?.data?.message || 'Failed to process transaction');
    } finally {
      setIsProcessing(false);
    }
  }, [storeId, selectedCustomer, selectedSalesAgent, selectedPriceCategory, cartItems, companyData, transactionDate, validateTransactionDate, transactionDateError, getOrCreateCashCustomer, getReceivableAccountForCustomer, salesProfile, paidAmount, selectedPaymentTypeId, handleProcessPaymentWithPayment, isProcessing]);

  // Handle new transaction (reset)
  const handleNewTransaction = useCallback(() => {
    setCompletedInvoice(null);
    setCartItems([]);
    setSelectedCustomer(null);
    setSelectedSalesAgent(''); // Reset sales agent
    setPaidAmount(0);
    setSelectedPaymentTypeId('');
    setSelectedPaymentTypeName('');
    // Reset price category to store default if available (already handled by useEffect)
    setTransactionDate(new Date().toISOString().split('T')[0]); // Reset to today
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 font-semibold mb-2">Store not found</p>
          <button
            onClick={() => navigate('/pos/select-store')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select Store
          </button>
        </div>
      </div>
    );
  }

  // Render POS based on store type
  // For now, we're building for retail_shop
  if (storeType !== 'retail_shop') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">POS Not Available</h2>
          <p className="text-gray-600 mb-4">
            POS system for <span className="font-medium capitalize">{storeType.replace(/_/g, ' ')}</span> store type is currently under development.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Currently, POS is only available for Retail Shop stores.
          </p>
          <button
            onClick={() => navigate('/pos/select-store')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select Different Store
          </button>
        </div>
      </div>
    );
  }

  // Show completion screen
  if (completedInvoice) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Completed!</h2>
            <p className="text-gray-600 mb-4">
              Invoice: {completedInvoice.invoiceRefNumber}
            </p>
            <div className="bg-gradient-to-br from-gray-50/80 to-white rounded-lg p-4 mb-6 shadow-inner border border-gray-200/30">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-blue-600">
                  {currencySymbol}{completedInvoice.totalAmount?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={handleNewTransaction}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Transaction
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col overflow-hidden">
          {/* Top Navigation Bar */}
          <div className="bg-gradient-to-r from-white via-gray-50/30 to-white border-b border-gray-200/50 px-6 py-4 flex-shrink-0 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Logo and Store Info */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app-main')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go to Home"
            >
              <Home className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/pos/select-store')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Store Selection"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              {/* Company Logo */}
              {companyData?.logo ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                  <ImageWithFallback
                    src={companyData.logo}
                    alt={`${companyData.name || 'Company'} Logo`}
                    module="companies"
                    size="lg"
                    className="w-full h-full object-cover"
                    fallbackIcon="building"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500">Store:</span>
                  {isLoading ? (
                    <span className="text-xl font-bold text-gray-400">Loading...</span>
                  ) : (
                    <h1 className="text-xl font-bold text-gray-900">{store?.name || 'No Store Selected'}</h1>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  Cashier: {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <button className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1 px-1 transition-colors">
              POS
            </button>
            <button className="text-gray-600 hover:text-gray-900 font-medium px-1 transition-colors">
              History
            </button>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Profile Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Profile:
              </label>
              <select
                value={salesProfile}
                onChange={(e) => setSalesProfile(e.target.value as 'cash' | 'credit')}
                className="px-3 py-1.5 bg-white/80 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 text-sm transition-all shadow-sm hover:shadow-md backdrop-blur-sm min-w-[140px]"
              >
                <option value="cash">Cash Sales</option>
                <option value="credit">Credit Sales</option>
              </select>
            </div>

            {/* Price Category */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Price Category:
              </label>
              <select
                value={selectedPriceCategory}
                onChange={(e) => setSelectedPriceCategory(e.target.value)}
                className="px-3 py-1.5 bg-white/80 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 text-sm transition-all shadow-sm hover:shadow-md backdrop-blur-sm min-w-[180px]"
              >
                <option value="">Default</option>
                {priceCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Date */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Date:
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={transactionDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleTransactionDateChange(e.target.value)}
                  min={currentFinancialYear?.startDate ? currentFinancialYear.startDate.split('T')[0] : undefined}
                  max={currentFinancialYear?.endDate ? currentFinancialYear.endDate.split('T')[0] : undefined}
                  className={`px-3 py-1.5 bg-white/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 text-sm transition-all shadow-sm hover:shadow-md backdrop-blur-sm ${
                    transactionDateError ? 'border-red-500' : 'border-gray-200/50'
                  }`}
                  required
                />
                {transactionDateError && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-red-50 border border-red-200 rounded-lg p-2 shadow-lg z-50">
                    <p className="text-xs text-red-600">{transactionDateError}</p>
                  </div>
                )}
              </div>
              {/* Current Time */}
              <div className="px-3 py-1.5 bg-white/80 border border-gray-200/50 rounded-lg text-sm font-mono font-semibold text-gray-900 shadow-sm backdrop-blur-sm min-w-[80px] text-center">
                {currentTime}
              </div>
            </div>
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="User Profile"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Panel Layout for Retail POS */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Product Menu */}
        <div className="flex-1 overflow-hidden">
          <MenuPanel
            storeId={storeId!}
            onProductSelect={handleProductSelect}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedPriceCategory={selectedPriceCategory}
            priceCategories={priceCategories}
          />
        </div>

        {/* Right Panel - Cart & Checkout */}
        <div className="w-[600px] flex-shrink-0">
            <OrderDetailsPanel
            items={cartItems}
            customer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateDiscount={handleUpdateDiscount}
              onUpdatePrice={handleUpdatePrice}
              onRemoveVAT={handleRemoveVAT}
              onAddVAT={handleAddVAT}
              onRemoveItem={handleRemoveItem}
                subtotal={cartTotals.subtotal}
                taxAmount={cartTotals.taxAmount}
                taxPercentage={cartTotals.taxPercentage}
                discountAmount={cartTotals.discountAmount}
                totalAmount={cartTotals.totalAmount}
                currencySymbol={currencySymbol}
            onProcessTransaction={handleProcessPayment}
            isProcessing={isProcessing}
            onCreateCustomer={() => setShowAddCustomerModal(true)}
            salesAgents={salesAgents}
            selectedSalesAgent={selectedSalesAgent}
            onSalesAgentChange={setSelectedSalesAgent}
            storeName={store?.name}
            salesProfile={salesProfile}
            onPaymentConfirm={async (paymentTypeId, amount) => {
              // Store payment info without processing transaction yet
              setPaidAmount(amount);
              setSelectedPaymentTypeId(paymentTypeId);
              
              // Get payment type name for display
              try {
                const paymentType = await paymentTypeService.getPaymentType(paymentTypeId);
                setSelectedPaymentTypeName(paymentType.name);
              } catch (error) {
                setSelectedPaymentTypeName('');
              }
            }}
            paidAmount={paidAmount}
            paymentTypeName={selectedPaymentTypeName}
          />
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add New Customer"
        size="lg"
      >
        <CustomerForm
          initialValues={undefined}
          customerGroups={customerGroups}
          loyaltyCards={loyaltyCards}
          onSubmit={handleCreateCustomer}
          onCancel={() => setShowAddCustomerModal(false)}
          isLoading={isCreatingCustomer}
        />
      </Modal>
    </div>
  );
};

export default POS;
