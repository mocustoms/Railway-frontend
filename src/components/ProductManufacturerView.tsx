import React from 'react';
import { X, Edit, Globe, Mail, Phone, MapPin, Factory, Calendar, User } from 'lucide-react';
import { ProductManufacturer } from '../types';
import Modal from './Modal';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatters';

interface ProductManufacturerViewProps {
  manufacturer: ProductManufacturer;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
  getLogoUrl: (logoPath: string, lastModified?: string) => string;
}

const ProductManufacturerView: React.FC<ProductManufacturerViewProps> = ({
  manufacturer,
  onClose,
  onEdit,
  canEdit,
  getLogoUrl
}) => {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Manufacturer Details
        </h2>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>

        <div className="space-y-6">
          {/* Header with Logo and Basic Info */}
          <div className="flex items-start space-x-4">
            {manufacturer.logo ? (
              <img
                src={getLogoUrl(manufacturer.logo, manufacturer.updated_at)}
                alt={`${manufacturer.name} logo`}
                className="w-24 h-24 rounded-lg object-cover border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <Factory className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{manufacturer.name}</h3>
              <p className="text-lg text-gray-600">{manufacturer.code}</p>
              <div className="mt-2">
                                 <StatusBadge 
                   status={manufacturer.is_active ? 'active' : 'inactive'} 
                 />
              </div>
            </div>
          </div>

          {/* Description */}
          {manufacturer.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                {manufacturer.description}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
              <div className="space-y-3">
                {manufacturer.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a
                      href={manufacturer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate"
                    >
                      {manufacturer.website}
                    </a>
                  </div>
                )}
                {manufacturer.contact_email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${manufacturer.contact_email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {manufacturer.contact_email}
                    </a>
                  </div>
                )}
                {manufacturer.contact_phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a
                      href={`tel:${manufacturer.contact_phone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {manufacturer.contact_phone}
                    </a>
                  </div>
                )}
                {manufacturer.country && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{manufacturer.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {manufacturer.address && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Address</h4>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-900">{manufacturer.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Audit Information */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Audit Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm text-gray-900">
                    {manufacturer.created_at ? formatDate(manufacturer.created_at) : 'N/A'}
                  </span>
                </div>
                {manufacturer.created_by_name && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Created by:</span>
                    <span className="text-sm text-gray-900">
                      {manufacturer.created_by_name}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Updated:</span>
                  <span className="text-sm text-gray-900">
                    {manufacturer.updated_at ? formatDate(manufacturer.updated_at) : 'N/A'}
                  </span>
                </div>
                {manufacturer.updated_by_name && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Updated by:</span>
                    <span className="text-sm text-gray-900">
                      {manufacturer.updated_by_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
};

export default ProductManufacturerView;
