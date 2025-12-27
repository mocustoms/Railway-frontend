import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
  remember: yup.boolean().optional()
}).required();

interface LoginFormData {
  username: string;
  password: string;
  remember?: boolean;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { login, isLoading, isAuthenticated, user } = useAuth();

  // Clear cache when login page loads (in case user navigated here directly)
  useEffect(() => {
    // Only clear if user is not authenticated
    if (!isAuthenticated) {
      queryClient.clear();
      queryClient.removeQueries();
    }
  }, [isAuthenticated, queryClient]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Check if there's a return URL from ProtectedRoute
      const from = (location.state as any)?.from?.pathname;
      
      // If user doesn't have a company, redirect to company registration
      if (user && !user.companyId) {
        navigate('/register-company');
      } else if (from && from !== '/login' && from !== '/register') {
        // Redirect back to the original page they were trying to access
        navigate(from, { replace: true });
      } else {
        // Default to app-main on first login
        navigate('/app-main', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, navigate, location]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      // Wait a moment for state to update, then check user from context
      setTimeout(() => {
        // Check user from authService directly (it's already stored)
        const storedUser = authService.getCurrentUser();
        
        // Check if there's a return URL from ProtectedRoute
        const from = (location.state as any)?.from?.pathname;
        
        if (storedUser && !storedUser.companyId) {
          toast.success('Login successful! Please complete your company registration.');
          navigate('/register-company');
        } else if (from && from !== '/login' && from !== '/register') {
          // Redirect back to the original page they were trying to access
          toast.success('Login successful! Redirecting...');
          navigate(from, { replace: true });
        } else {
          // Default to app-main on first login
          toast.success('Login successful! Redirecting...');
          navigate('/app-main', { replace: true });
        }
      }, 100);
    } catch (error: any) {
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.message) {
        switch (error.message.toLowerCase()) {
          case 'invalid credentials': errorMessage = 'Invalid username or password. Please try again.'; break;
          case 'account is deactivated': errorMessage = 'Your account has been deactivated. Please contact support.'; break;
          case 'account is not approved': errorMessage = 'Your account is pending approval. Please contact your administrator.'; break;
          case 'username is required': errorMessage = 'Please enter your username.'; break;
          case 'password is required': errorMessage = 'Please enter your password.'; break;
          default: errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gray-100">
      {/* Main Container */}
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Main Content */}
        <div className="flex min-h-[600px]">
          {/* Left Panel - Login Form */}
          <div className="flex-1 bg-white p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
                <p className="text-gray-600 text-lg">Welcome back! Please enter your details.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    {...register('username')}
                    type="text"
                    id="username"
                    placeholder="Enter your username"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.username ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm">{errors.username.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Enter your password"
                      disabled={isLoading}
                      className={`w-full px-4 pr-12 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        errors.password ? 'border-red-300' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                  )}
                </div>

                {/* Form Options */}
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                    <input
                      {...register('remember')}
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:underline transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-base font-semibold transition-all duration-200 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center pt-6 text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors duration-200"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel - Image Background */}
          <div className="flex-1 relative overflow-hidden">
            {/* Background Image */}
            <img 
              src={`${process.env.PUBLIC_URL || ''}/person_using_pos.png`}
              alt="Person using POS system"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // Fallback to direct path if PUBLIC_URL doesn't work
                if (e.currentTarget.src !== '/person_using_pos.png') {
                  e.currentTarget.src = '/person_using_pos.png';
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 