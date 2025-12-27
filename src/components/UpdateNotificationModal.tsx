import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  updateDetails: {
    version: string;
    buildTimestamp: string;
    changes?: string[];
  };
}

const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full border-2 border-blue-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center p-6 bg-blue-50 rounded-t-lg">
            <div className="flex-shrink-0 text-blue-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">There is an update available</h3>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onAccept}
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotificationModal;

