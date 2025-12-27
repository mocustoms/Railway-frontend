import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ContentContainer from '../components/ContentContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { User as UserIcon, Camera, Lock, UserCircle, Save, X, Mail, Phone, MapPin, Shield, Store, Calendar, CheckCircle, Clock } from 'lucide-react';
import { User } from '../types';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getImageUrl } from '../utils/imageUtils';
import { apiService } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const ProfileSettings: React.FC = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'security' | 'stores'>('personal');

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Fetch fresh profile data from API to ensure we have all fields (phone, address, profile_picture)
  const { data: freshProfileData, isLoading: isLoadingProfile } = useQuery<User>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await apiService.get<User>('/auth/profile');
      return response.data!;
    },
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 0, // Always fetch fresh data when component mounts
  });

  // Initialize form data from fresh profile data or user context
  useEffect(() => {
    // Prefer fresh profile data from API, fallback to user context
    const userData: User | null = freshProfileData || user;
    
    if (userData) {
      setProfileData({
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
      });

      // Set profile picture preview if exists
      if (userData.profile_picture) {
        const imageUrl = getImageUrl(userData.profile_picture, 'users');
        setProfilePicturePreview(imageUrl);
      } else {
        setProfilePicturePreview('');
      }
    }
  }, [user, freshProfileData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      return await authService.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
        address: data.address || undefined,
      });
    },
    onSuccess: (updatedUser) => {
      // Update user in context
      setUser?.(updatedUser);
      
      // Update form data with the response to reflect saved values
      setProfileData({
        firstName: updatedUser.first_name || '',
        lastName: updatedUser.last_name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        address: updatedUser.address || '',
      });
      
      toast.success('Profile updated successfully');
      
      // Invalidate and refetch profile data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update profile';
      toast.error(message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await authService.changePassword(data.currentPassword, data.newPassword);
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to change password';
      toast.error(message);
    },
  });

  // Upload profile picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: async (file: File) => {
      return await authService.uploadProfilePicture(file);
    },
    onSuccess: async (data) => {
      // Update user in context with new profile picture
      if (user) {
        const updatedUser = { ...user, profile_picture: data.profilePicture };
        setUser?.(updatedUser);
        
        // Update profile picture preview with the new URL
        if (data.profilePicture) {
          const imageUrl = getImageUrl(data.profilePicture, 'users');
          setProfilePicturePreview(imageUrl);
        }
      }
      
      toast.success('Profile picture uploaded successfully');
      setProfilePicture(null);
      
      // Invalidate and refetch profile data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user'] });
      await queryClient.refetchQueries({ queryKey: ['user-profile'] });
      
      // Also update the user in AuthContext from the refetched data
      const freshData = await queryClient.fetchQuery<User>({
        queryKey: ['user-profile'],
        queryFn: async () => {
          const response = await apiService.get<User>('/auth/profile');
          return response.data!;
        },
      });
      
      if (freshData && setUser) {
        setUser(freshData);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to upload profile picture';
      toast.error(message);
    },
  });

  // Handle profile form submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  // Handle password form submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  // Handle profile picture selection
  const handlePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image file size must be less than 5MB');
      return;
    }

    setProfilePicture(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePicturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle profile picture upload
  const handlePictureUpload = async () => {
    if (!profilePicture) {
      toast.error('Please select an image first');
      return;
    }

    setIsUploadingPicture(true);
    try {
      await uploadPictureMutation.mutateAsync(profilePicture);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Handle remove profile picture
  const handleRemovePicture = () => {
    setProfilePicture(null);
    if (user?.profile_picture) {
      // Reset to original profile picture
      const imageUrl = getImageUrl(user.profile_picture, 'users');
      setProfilePicturePreview(imageUrl);
    } else {
      setProfilePicturePreview('');
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.first_name?.[0] || '';
    const lastName = user.last_name?.[0] || '';
    return `${firstName}${lastName}`.toUpperCase() || 'U';
  };

  if (!user) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please log in to view your profile</p>
        </div>
      </ContentContainer>
    );
  }

  if (isLoadingProfile) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your personal information and account settings</p>
          </div>
        </div>

        {/* Profile Picture Section */}
        <Card>
          <div className="flex items-center space-x-6">
            <div className="relative">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200">
                  <span className="text-2xl font-semibold text-blue-600">{getUserInitials()}</span>
                </div>
              )}
              <label
                htmlFor="profile-picture-input"
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4 text-white" />
                <input
                  id="profile-picture-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePictureSelect}
                />
              </label>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{user.first_name} {user.last_name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">Role: <span className="capitalize">{user.role}</span></p>
              {profilePicture && (
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handlePictureUpload}
                    loading={isUploadingPicture}
                  >
                    <Camera className="w-4 h-4" />
                    Upload Picture
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemovePicture}
                    disabled={isUploadingPicture}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('personal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'personal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>Personal Information</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Contact Information</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Security</span>
              </div>
            </button>
            {freshProfileData?.assignedStores && freshProfileData.assignedStores.length > 0 && (
              <button
                onClick={() => setActiveTab('stores')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Store className="w-4 h-4" />
                  <span>Store Assignments</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {/* Account Status & Role */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>Account Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Role</h4>
                    </div>
                    <StatusBadge status={user.role} />
                    <p className="text-sm text-gray-600 mt-1 capitalize">{user.role}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Account Status</h4>
                    </div>
                    <StatusBadge 
                      status={user.is_active ? 'active' : 'inactive'} 
                      variant={user.is_active ? 'success' : 'error'}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {user.is_active ? 'Your account is active' : 'Your account is inactive'}
                    </p>
                  </div>
                </div>
                {user.last_login && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Last login: {new Date(user.last_login).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Personal Details Form */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  <span>Personal Details</span>
                </h3>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Username"
                        value={user.username}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="submit"
                      loading={updateProfileMutation.isPending}
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* Contact Information Tab */}
          {activeTab === 'contact' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>Contact Information</span>
              </h3>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="submit"
                    loading={updateProfileMutation.isPending}
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <span>Change Password</span>
              </h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="submit"
                    loading={changePasswordMutation.isPending}
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Store Assignments Tab */}
          {activeTab === 'stores' && freshProfileData?.assignedStores && freshProfileData.assignedStores.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Store className="h-5 w-5 text-blue-600" />
                <span>Store Assignments</span>
              </h3>
              <div className="space-y-3">
                {freshProfileData.assignedStores.map((assignment: any, index: number) => (
                  <div
                    key={assignment.id || index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {assignment.Store?.name || 'Store'}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{assignment.Store?.location || 'N/A'}</span>
                          </span>
                          {assignment.Store?.store_type && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                              {assignment.Store.store_type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <StatusBadge
                          status={assignment.role}
                          variant="info"
                        />
                        {assignment.is_active ? (
                          <StatusBadge status="active" variant="success" size="sm" />
                        ) : (
                          <StatusBadge status="inactive" variant="error" size="sm" />
                        )}
                      </div>
                    </div>
                    {assignment.assigned_at && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </ContentContainer>
  );
};

export default ProfileSettings;

