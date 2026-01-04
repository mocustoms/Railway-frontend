import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import UpdateNotificationModal from './components/UpdateNotificationModal';
import { useAppUpdate } from './hooks/useAppUpdate';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterCompany from './pages/RegisterCompany';
import WelcomeInitialization from './pages/WelcomeInitialization';
import SelectInitializationData from './pages/SelectInitializationData';
import ManualStepByStepInitialization from './pages/ManualStepByStepInitialization';
import ManualConfigurationSteps from './pages/ManualConfigurationSteps';
import CompanyInitialization from './components/CompanyInitialization';
import AppMain from './pages/AppMain';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';

import ProductCategories from './pages/ProductCategories';

import StoreLocations from './pages/StoreLocations';

import ProductColors from './pages/ProductColors';
import ProductModels from './pages/ProductModels';
import Accounts from './pages/Accounts';
import AccountsHome from './pages/AccountsHome';
import AccountsDashboard from './pages/AccountsDashboard';
import AccountReports from './pages/AccountReports';
import AccountTypes from './pages/AccountTypes';
import ChartOfAccounts from './pages/ChartOfAccounts';
import AccountsModuleLayout from './components/AccountsModuleLayout';
import AdvanceSetup from './pages/AdvanceSetup';
import CompanySetup from './pages/CompanySetup';
import LinkedAccounts from './pages/LinkedAccounts';
import StoreSetup from './pages/StoreSetup';
import ImportStores from './pages/ImportStores';
import CurrencySetup from './pages/CurrencySetup';
import ExchangeRateSetup from './pages/ExchangeRateSetup';
import FinancialYear from './pages/FinancialYear';
import Administrative from './pages/Administrative';
import DatabaseSettings from './pages/DatabaseSettings';
import SchedulerManagement from './pages/SchedulerManagement';
import InventoryManagement from './pages/InventoryManagement';
import Users from './pages/Users';
import UserManagement from './pages/UserManagement';
import ProfileSettings from './pages/ProfileSettings';
import Reports from './pages/Reports';
import TaxCodes from './pages/TaxCodes';
import PaymentTypes from './pages/PaymentTypes';
import PaymentMethods from './pages/PaymentMethods';
import BankDetails from './pages/BankDetails';
import CustomerDeposits from './pages/CustomerDeposits';
import OpeningBalances from './pages/OpeningBalances';
import RecordLedgerEntries from './pages/RecordLedgerEntries';

// TODO: Import missing product management modules when converted
import ProductBrandNames from './pages/ProductBrandNames';
import ProductManufacturers from './pages/ProductManufacturers';
import Packaging from './pages/Packaging';
import PriceCategories from './pages/PriceCategories';
import ProductCatalog from './pages/ProductCatalog';
import ImportProducts from './pages/ImportProducts';
import ImportCustomers from './pages/ImportCustomers';
import ImportCustomerDeposits from './pages/ImportCustomerDeposits';
import DataImportation from './pages/DataImportation';
import AdjustmentReasons from './pages/AdjustmentReasons';
import StockAdjustment from './pages/StockAdjustment';
import PhysicalInventory from './pages/PhysicalInventory';
import StoreRequests from './pages/StoreRequests';
import StoreIssues from './pages/StoreIssues';
import StoreReceipts from './pages/StoreReceipts';
import StockBalanceReport from './pages/StockBalanceReport';
import StockBalanceAsOfDateReport from './pages/StockBalanceAsOfDateReport';
import CustomerListReport from './pages/CustomerListReport';
import CustomerBirthdaysReport from './pages/CustomerBirthdaysReport';
import RevenueReport from './pages/RevenueReport';
import SalesDetailsReport from './pages/SalesDetailsReport';
import TrialBalanceReport from './pages/TrialBalanceReport';
import Sales from './pages/Sales';
import SalesAgents from './pages/SalesAgents';
import ReturnReasons from './pages/ReturnReasons';
import ProformaInvoices from './pages/ProformaInvoices';
import SalesOrders from './pages/SalesOrders';
import SalesInvoices from './pages/SalesInvoices';
import SalesReceipts from './pages/SalesReceipts';
import CustomerGroups from './pages/CustomerGroups';
import LoyaltyCards from './pages/LoyaltyCards';
import Customers from './pages/Customers';
import StoreSelection from './pages/StoreSelection';
import POS from './pages/POS';
import Purchases from './pages/Purchases';
import VendorGroups from './pages/VendorGroups';
import Vendors from './pages/Vendors';
import PurchasingOrder from './pages/PurchasingOrder';
import PurchaseInvoice from './pages/PurchaseInvoice';
import InvoicePayments from './pages/InvoicePayments';
import ReturnsOutReasons from './pages/ReturnsOutReasons';
import ReturnsOut from './pages/ReturnsOut';

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

// AppContent component to use hooks
const AppContent: React.FC = () => {
  const { isUpdateAvailable, updateDetails, acceptUpdate, dismissUpdate } = useAppUpdate();

  return (
    <>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-company" element={<RegisterCompany />} />
              <Route 
                path="/welcome-initialization" 
                element={
                  <ProtectedRoute>
                    <WelcomeInitialization />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/select-initialization-data" 
                element={
                  <ProtectedRoute>
                    <SelectInitializationData />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manual-step-initialization" 
                element={
                  <ProtectedRoute>
                    <ManualStepByStepInitialization />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manual-configuration-steps" 
                element={
                  <ProtectedRoute>
                    <ManualConfigurationSteps />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/initialize-company" 
                element={
                  <ProtectedRoute>
                    <CompanyInitialization />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Routes with Layout */}
              <Route
                path="/app-main"
                element={
                  <ProtectedRoute>
                    <AppMain />
                  </ProtectedRoute>
                }
              />
              
              {/* Accounts Module Routes - Independent Module */}
              <Route
                path="/app-accounts"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <AccountsDashboard />
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/home"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <AccountsHome />
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/account-types"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <AccountTypes />
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/chart-of-accounts"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <ChartOfAccounts />
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/opening-balances"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <OpeningBalances />
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/record-ledger-entries"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <RecordLedgerEntries />
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/record-expenses"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <div className="content-container">
                        <div className="text-center py-12">
                          <h1 className="text-2xl font-bold text-gray-900 mb-2">Record Expenses</h1>
                          <p className="text-gray-600">This feature is coming soon.</p>
                        </div>
                      </div>
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/transfer-money"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <div className="content-container">
                        <div className="text-center py-12">
                          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transfer Money</h1>
                          <p className="text-gray-600">This feature is coming soon.</p>
                        </div>
                      </div>
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/account-reports"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <AccountReports />
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/app-accounts/trial-balance"
                element={
                  <ProtectedRoute>
                    <AccountsModuleLayout>
                      <TrialBalanceReport />
                    </AccountsModuleLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* POS Routes - Full Screen (No Sidebar) */}
              <Route
                path="/pos/select-store"
                element={
                  <ProtectedRoute>
                    <StoreSelection />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/pos/:storeId"
                element={
                  <ProtectedRoute>
                    <POS />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Products />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Sales />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/sales/agents"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SalesAgents />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/sales/customer-groups"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CustomerGroups />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/sales/loyalty-cards"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LoyaltyCards />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sales/return-reasons"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReturnReasons />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sales/proforma-invoices"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProformaInvoices />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales/sales-orders"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SalesOrders />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales/sales-invoices"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SalesInvoices />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales/receipts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SalesReceipts />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sales/customers"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Customers />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Purchases Routes */}
              <Route
                path="/purchases"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Purchases />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/purchases/vendor-groups"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <VendorGroups />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/purchases/vendors"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Vendors />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/purchases/purchasing-order"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PurchasingOrder />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/purchases/invoice"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PurchaseInvoice />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/purchases/invoice-payments"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InvoicePayments />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/purchases/returns-out-reasons"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReturnsOutReasons />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/purchases/returns-out"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReturnsOut />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
        <Route
          path="/data-importation"
          element={
            <ProtectedRoute>
              <Layout>
                <DataImportation />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/import-products"
          element={
            <ProtectedRoute>
              <Layout>
                <ImportProducts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/import-customers"
          element={
            <ProtectedRoute>
              <Layout>
                <ImportCustomers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/import-customer-deposits"
          element={
            <ProtectedRoute>
              <Layout>
                <ImportCustomerDeposits />
              </Layout>
            </ProtectedRoute>
          }
        />

              <Route
                path="/product-categories"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProductCategories />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/product-catalog"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProductCatalog />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/store-locations"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StoreLocations />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/product-colors"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProductColors />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/product-models"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProductModels />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* TODO: Add routes for missing product management modules when converted */}
              <Route
                path="/product-brand-names"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProductBrandNames />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/product-manufacturers"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProductManufacturers />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/price-categories"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PriceCategories />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/packaging"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Packaging />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/accounts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Accounts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/accounts/account-types"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AccountTypes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/accounts/chart-of-accounts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ChartOfAccounts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/accounts/opening-balances"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <OpeningBalances />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/accounts/record-ledger-entries"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RecordLedgerEntries />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/advance-setup"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AdvanceSetup />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/company-setup"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CompanySetup />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Advance Setup Sub-routes */}
              <Route
                path="/advance-setup/store"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StoreSetup />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/advance-setup/store/import"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ImportStores />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/advance-setup/currency"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CurrencySetup />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/advance-setup/exchange-rates"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ExchangeRateSetup />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/advance-setup/financial-year"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <FinancialYear />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/linked-accounts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LinkedAccounts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Legacy route for backward compatibility */}
              <Route
                path="/accounts/linked-accounts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LinkedAccounts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/administrative"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Administrative />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/database-settings"
                element={
                  <ProtectedRoute requiredRole="system_admin">
                    <Layout>
                      <DatabaseSettings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/scheduler-management"
                element={
                  <ProtectedRoute requiredRole="system_admin">
                    <Layout>
                      <SchedulerManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/tax-codes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TaxCodes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/payment-types"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PaymentTypes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/payment-methods"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PaymentMethods />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/bank-details"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BankDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/customer-deposits"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CustomerDeposits />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/inventory-management"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InventoryManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/inventory/adjustment-reasons"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AdjustmentReasons />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/inventory-management/stock-adjustments"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StockAdjustment />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/inventory-management/physical-inventory"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PhysicalInventory />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/inventory/store-requests"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StoreRequests />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/inventory/store-issues"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StoreIssues />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/inventory/store-receipts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StoreReceipts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/users/management"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/profile/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfileSettings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
        <Route
          path="/reports/stock-and-inventory"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/sales"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/sales/customer-list"
          element={
            <ProtectedRoute>
              <Layout>
                <CustomerListReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/sales/customer-birthdays"
          element={
            <ProtectedRoute>
              <Layout>
                <CustomerBirthdaysReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/sales/revenue"
          element={
            <ProtectedRoute>
              <Layout>
                <RevenueReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/sales/sales-details"
          element={
            <ProtectedRoute>
              <Layout>
                <SalesDetailsReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/account-reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/trial-balance"
          element={
            <ProtectedRoute>
              <Layout>
                <TrialBalanceReport />
              </Layout>
            </ProtectedRoute>
          }
        />
              
              <Route
                path="/reports/stock-balance"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StockBalanceReport />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/reports/stock-balance-as-of-date"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StockBalanceAsOfDateReport />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/reports/sales/customer-list"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CustomerListReport />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Default Route - Redirect to App Main */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/app-main" replace />
                  </ProtectedRoute>
                }
              />
              
              {/* Catch all route - Redirect to App Main */}
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <Navigate to="/app-main" replace />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
        
        {/* Update Notification Modal */}
        {updateDetails && (
          <UpdateNotificationModal
            isOpen={isUpdateAvailable}
            onClose={dismissUpdate}
            onAccept={acceptUpdate}
            updateDetails={updateDetails}
          />
        )}
      </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
