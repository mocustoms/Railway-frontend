import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Play, 
  Square, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Loader,
  ArrowLeft,
  FileText,
  Gift,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { schedulerService, SchedulerStatus } from '../services/schedulerService';
import Card from '../components/Card';
import Button from '../components/Button';
import ContentContainer from '../components/ContentContainer';
import toast from 'react-hot-toast';

const SchedulerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Check if user is system admin
  const isSystemAdmin = user?.isSystemAdmin || false;

  const [schedulers, setSchedulers] = useState<{
    scheduledInvoiceGenerator: SchedulerStatus | null;
    birthdayBonusScheduler: SchedulerStatus | null;
  }>({
    scheduledInvoiceGenerator: null,
    birthdayBonusScheduler: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{
    invoiceGenerator?: string;
    birthdayBonus?: string;
  }>({});

  // Load scheduler status
  useEffect(() => {
    if (!isAuthenticated || !isSystemAdmin) {
      toast.error('Access denied. Only system administrators can access this page.');
      navigate('/');
      return;
    }

    loadStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isSystemAdmin, navigate]);

  const loadStatus = async () => {
    try {
      const response = await schedulerService.getStatus();
      if (response.success) {
        setSchedulers(response.schedulers);
      } else {
        toast.error(response.message || 'Failed to load scheduler status');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load scheduler status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrigger = async (type: 'invoice' | 'birthday') => {
    try {
      setActionLoading({ [type === 'invoice' ? 'invoiceGenerator' : 'birthdayBonus']: 'trigger' });
      const response = type === 'invoice' 
        ? await schedulerService.triggerInvoiceGenerator()
        : await schedulerService.triggerBirthdayBonus();
      
      if (response.success) {
        toast.success(response.message || 'Scheduler executed successfully');
        await loadStatus(); // Refresh status
      } else {
        toast.error(response.message || 'Failed to trigger scheduler');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to trigger scheduler');
    } finally {
      setActionLoading({});
    }
  };

  const handleRestart = async (type: 'invoice' | 'birthday') => {
    try {
      setActionLoading({ [type === 'invoice' ? 'invoiceGenerator' : 'birthdayBonus']: 'restart' });
      const response = type === 'invoice' 
        ? await schedulerService.restartInvoiceGenerator()
        : await schedulerService.restartBirthdayBonus();
      
      if (response.success) {
        toast.success(response.message || 'Scheduler restarted successfully');
        await loadStatus(); // Refresh status
      } else {
        toast.error(response.message || 'Failed to restart scheduler');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restart scheduler');
    } finally {
      setActionLoading({});
    }
  };

  const handleStop = async (type: 'invoice' | 'birthday') => {
    try {
      setActionLoading({ [type === 'invoice' ? 'invoiceGenerator' : 'birthdayBonus']: 'stop' });
      const response = type === 'invoice' 
        ? await schedulerService.stopInvoiceGenerator()
        : await schedulerService.stopBirthdayBonus();
      
      if (response.success) {
        toast.success(response.message || 'Scheduler stopped successfully');
        await loadStatus(); // Refresh status
      } else {
        toast.error(response.message || 'Failed to stop scheduler');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to stop scheduler');
    } finally {
      setActionLoading({});
    }
  };

  if (!isAuthenticated || !isSystemAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ContentContainer>
    );
  }

  const renderSchedulerCard = (
    scheduler: SchedulerStatus | null,
    type: 'invoice' | 'birthday',
    icon: React.ReactNode,
    color: string
  ) => {
    if (!scheduler) return null;

    const isLoading = actionLoading[type === 'invoice' ? 'invoiceGenerator' : 'birthdayBonus'];
    const isRunning = scheduler.isRunning;

    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-lg ${color}`}>
                {icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{scheduler.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{scheduler.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Activity className="w-3 h-3" />
                  Running
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <Square className="w-3 h-3" />
                  Stopped
                </span>
              )}
            </div>
          </div>

          {/* Schedule Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Schedule: {scheduler.schedule}</span>
          </div>

          {/* Status Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Activity className="w-4 h-4" />
            <span>Status: {scheduler.taskStatus}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrigger(type)}
              disabled={!!isLoading}
              className="flex items-center gap-2"
            >
              {isLoading === 'trigger' ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Trigger Now
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestart(type)}
              disabled={!!isLoading}
              className="flex items-center gap-2"
            >
              {isLoading === 'restart' ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Restart
                </>
              )}
            </Button>

            {isRunning && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStop(type)}
                disabled={!!isLoading}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                {isLoading === 'stop' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Stop
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <ContentContainer>
      <div className="scheduler-management">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-7 h-7 text-blue-600" />
                Scheduler Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage automated tasks for invoice generation and birthday bonuses
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatus}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">About Schedulers</p>
              <p className="text-sm text-blue-700 mt-1">
                Schedulers run automatically in the background. You can manually trigger them, restart them, or stop them if needed. 
                They will continue running even if individual executions fail, ensuring reliability.
              </p>
            </div>
          </div>
        </div>

        {/* Schedulers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scheduled Invoice Generator */}
          {renderSchedulerCard(
            schedulers.scheduledInvoiceGenerator,
            'invoice',
            <FileText className="w-6 h-6 text-white" />,
            'bg-blue-600'
          )}

          {/* Birthday Bonus Scheduler */}
          {renderSchedulerCard(
            schedulers.birthdayBonusScheduler,
            'birthday',
            <Gift className="w-6 h-6 text-white" />,
            'bg-purple-600'
          )}
        </div>
      </div>
    </ContentContainer>
  );
};

export default SchedulerManagement;

