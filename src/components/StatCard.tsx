import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  growth?: number;
  iconBgColor: string;
  iconColor: string;
  formatValue?: (value: string | number) => string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  growth,
  iconBgColor,
  iconColor,
  formatValue = (val) => val.toString()
}) => {
  const getGrowthIcon = (growthValue: number) => {
    if (growthValue > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (growthValue < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getGrowthColor = (growthValue: number) => {
    if (growthValue > 0) return 'text-green-600 bg-green-50';
    if (growthValue < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 stat-card-animation">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-gray-900 leading-tight">{formatValue(value)}</p>
          </div>
          
          {/* Icon container with gradient background */}
          <div 
            className="relative p-4 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ 
              background: `linear-gradient(135deg, ${iconBgColor} 0%, ${iconColor}20 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
            <Icon 
              className="h-6 w-6 relative z-10 transition-transform duration-300" 
              style={{ color: iconColor }} 
            />
          </div>
        </div>

        {/* Growth indicator */}
        {growth !== undefined && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit transition-all duration-300 ${getGrowthColor(growth)}`}>
            {getGrowthIcon(growth)}
            <span className="text-sm font-semibold">
              {growth > 0 ? '+' : ''}{growth}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last period</span>
          </div>
        )}
      </div>

      {/* Bottom accent bar */}
      <div 
        className="h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, ${iconColor} 0%, ${iconColor}80 100%)`
        }}
      ></div>
    </div>
  );
};

export default StatCard;