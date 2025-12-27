import React from 'react';

interface FlaticonIconProps {
  icon: string; // Flaticon class name (e.g., 'fi-rr-building')
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

const FlaticonIcon: React.FC<FlaticonIconProps> = ({ 
  icon, 
  size, 
  className = '', 
  style = {},
  color
}) => {
  // Extract size from className if provided (e.g., 'h-5 w-5' -> 20px)
  let iconSize = size;
  if (!iconSize && className) {
    const sizeMatch = className.match(/h-(\d+)/);
    if (sizeMatch) {
      iconSize = parseInt(sizeMatch[1]) * 4; // Tailwind h-5 = 20px (5 * 4)
    }
  }
  iconSize = iconSize || 24;

  const iconStyle: React.CSSProperties = {
    fontSize: `${iconSize}px`,
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    display: 'inline-block',
    lineHeight: 1,
    ...style,
    ...(color && { color })
  };

  // Remove size-related classes from className to avoid conflicts
  const cleanClassName = className
    .replace(/\bh-\d+\b/g, '')
    .replace(/\bw-\d+\b/g, '')
    .trim();

  return (
    <i 
      className={`${icon} ${cleanClassName}`.trim()}
      style={iconStyle}
    />
  );
};

export default FlaticonIcon;

