import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Password validation function (copied from original register.js)
const validatePassword = (password: string) => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password strength indicator (copied from original register.js)
const getPasswordStrength = (password: string) => {
  let score = 0;
  const feedback: string[] = [];
  
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (password.length >= 12) score++;
  
  let strength = 'weak';
  if (score >= 4) strength = 'medium';
  if (score >= 5) strength = 'strong';
  
  if (password.length < 8) feedback.push('Make it longer');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
  if (!/\d/.test(password)) feedback.push('Add numbers');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) feedback.push('Add special characters');
  
  return { score, strength, feedback };
};

const registerSchema = yup.object({
  firstName: yup.string().required('First name is required').matches(/^[a-zA-Z\s]{2,50}$/, 'First name must be 2-50 characters long and contain only letters and spaces'),
  lastName: yup.string().required('Last name is required').matches(/^[a-zA-Z\s]{2,50}$/, 'Last name must be 2-50 characters long and contain only letters and spaces'),
  username: yup.string().required('Username is required').matches(/^[a-zA-Z0-9_]{3,20}$/, 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'),
  email: yup.string().required('Email is required').email('Please provide a valid email address'),
  password: yup.string().required('Password is required'),
  confirmPassword: yup.string().required('Please confirm your password').oneOf([yup.ref('password')], 'Passwords must match')
}).required();

interface RegisterFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; strength: string; feedback: string[] } | null>(null);
  const navigate = useNavigate();
  const { register: registerUser, isLoading, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/app-main');
    }
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const watchedPassword = watch('password');

  React.useEffect(() => {
    if (watchedPassword) {
      setPasswordStrength(getPasswordStrength(watchedPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [watchedPassword]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Validate password
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        toast.error('Password does not meet security requirements');
        return;
      }

      // Check password strength
      const strength = getPasswordStrength(data.password);
      if (strength.strength === 'weak') {
        toast.error('Password is too weak');
        return;
      }

      const response = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      
      // Check if company registration is required
      if (response.requiresCompanyRegistration) {
        toast.success('Account created! Please register your company to continue.');
        setTimeout(() => {
          navigate('/register-company');
        }, 1500);
      } else {
        toast.success('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.message) {
        switch (error.message.toLowerCase()) {
          case 'username already exists': errorMessage = 'Username is already taken. Please choose a different one.'; break;
          case 'email already exists': errorMessage = 'Email is already registered. Please use a different email.'; break;
          case 'all fields are required': errorMessage = 'Please fill in all required fields.'; break;
          case 'password does not meet security requirements': errorMessage = 'Password does not meet security requirements.'; break;
          case 'password is too weak': errorMessage = 'Password is too weak. Please choose a stronger password.'; break;
          case 'please provide a valid email address': errorMessage = 'Please provide a valid email address.'; break;
          case 'username must be 3-20 characters long and contain only letters, numbers, and underscores': errorMessage = 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.'; break;
          case 'names must be 2-50 characters long and contain only letters and spaces': errorMessage = 'Names must be 2-50 characters long and contain only letters and spaces.'; break;
          default: errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gray-100">
      {/* Main Container */}
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Main Content */}
        <div className="flex min-h-[700px]">
          {/* Left Panel - Registration Form */}
          <div className="flex-1 bg-white p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                <p className="text-gray-600 text-lg">Join TenZen today and start managing your business efficiently.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* First Name */}
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    id="firstName"
                    placeholder="Enter your first name"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.firstName ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    placeholder="Enter your last name"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.lastName ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    {...register('username')}
                    type="text"
                    id="username"
                    placeholder="Choose a username"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.username ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm">{errors.username.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
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
                      placeholder="Create a password"
                      autoComplete="new-password"
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
                  
                  {/* Password Strength Indicator */}
                  {passwordStrength && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                      passwordStrength.strength === 'weak' ? 'bg-red-50 text-red-700 border border-red-200' :
                      passwordStrength.strength === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Password Strength: {passwordStrength.strength}</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`w-2 h-2 rounded-full ${
                                level <= passwordStrength.score
                                  ? passwordStrength.strength === 'weak' ? 'bg-red-400' :
                                    passwordStrength.strength === 'medium' ? 'bg-yellow-400' :
                                    'bg-green-400'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div>
                          <strong>Suggestions:</strong>
                          <ul className="mt-1 ml-4 list-disc">
                            {passwordStrength.feedback.slice(0, 3).map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      disabled={isLoading}
                      className={`w-full px-4 pr-12 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        errors.confirmPassword ? 'border-red-300' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-base font-semibold transition-all duration-200 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-6 text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel - Image Background */}
          <div className="flex-1 relative overflow-hidden">
            {/* Background Image */}
            <img 
              src={`${process.env.PUBLIC_URL || ''}/creating_an_account.png`}
              alt="Creating an account"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // Fallback to direct path if PUBLIC_URL doesn't work
                if (e.currentTarget.src !== '/creating_an_account.png') {
                  e.currentTarget.src = '/creating_an_account.png';
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;