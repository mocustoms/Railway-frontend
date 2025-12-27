import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  MessageSquare
} from 'lucide-react';
import { User as UserType } from '../types';
import Button from './Button';
import Textarea from './Textarea';
import { formatUserFullName, getUserInitials } from '../data/userManagementConfig';

interface UserApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  user: UserType;
  action: 'approve' | 'reject';
  isLoading?: boolean;
}

const UserApprovalModal: React.FC<UserApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  action,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (action === 'reject' && !reason.trim()) {
      return; // Validation will be handled by the form
    }
    onConfirm(action === 'reject' ? reason : undefined);
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const isApprove = action === 'approve';
  const isReject = action === 'reject';

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className={`px-6 py-4 ${isApprove ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isApprove ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isApprove ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isApprove ? 'Approve User' : 'Reject User'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isApprove 
                    ? 'Are you sure you want to approve this user?' 
                    : 'Are you sure you want to reject this user?'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">
                  {getUserInitials(user)}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {formatUserFullName(user)}
                </h4>
                <p className="text-sm text-gray-600">@{user.username}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {isApprove ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Approve User Account</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      This will approve the user account and allow them to access the system. 
                      The user will be notified of the approval.
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      User will be able to:
                    </span>
                  </div>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Log into the system</li>
                    <li>• Access assigned stores</li>
                    <li>• Perform role-based operations</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Reject User Account</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      This will reject the user account. Please provide a reason for the rejection.
                      The user will be notified of the rejection.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      User will not be able to:
                    </span>
                  </div>
                  <ul className="text-sm text-red-700 mt-2 space-y-1">
                    <li>• Log into the system</li>
                    <li>• Access any stores</li>
                    <li>• Perform any operations</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this user..."
                    rows={3}
                    className={!reason.trim() && isReject ? 'border-red-300' : ''}
                  />
                  {!reason.trim() && isReject && (
                    <p className="text-sm text-red-600 mt-1">
                      Please provide a reason for rejection
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (isReject && !reason.trim())}
              className={`flex items-center space-x-2 ${
                isApprove 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isApprove ? 'Approving...' : 'Rejecting...'}</span>
                </>
              ) : (
                <>
                  {isApprove ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve User</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Reject User</span>
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserApprovalModal;
