import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Predefined colors
  const predefinedColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#FFD700',
    '#FF6347', '#32CD32', '#4169E1', '#8A2BE2', '#FF1493', '#00CED1', '#FF4500', '#9370DB',
    '#3CB371', '#FF69B4', '#1E90FF', '#DDA0DD', '#98FB98', '#F0E68C', '#CD853F', '#DC143C'
  ];

  useEffect(() => {
    setSelectedColor(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleColorSelect = (newColor: string) => {
    setSelectedColor(newColor);
    onChange(newColor);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      onChange(newColor);
    }
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {/* Color Display */}
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          style={{ backgroundColor: selectedColor }}
          onClick={() => setIsOpen(!isOpen)}
          title="Click to open color picker"
        />
        <input
          type="text"
          value={selectedColor}
          onChange={handleInputChange}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="#000000"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Color Palette */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[280px]">
          <div className="grid grid-cols-8 gap-2 mb-3">
            {predefinedColors.map((predefinedColor) => (
              <button
                key={predefinedColor}
                type="button"
                className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                  selectedColor.toUpperCase() === predefinedColor.toUpperCase()
                    ? 'border-blue-500 scale-110'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: predefinedColor }}
                onClick={() => handleColorSelect(predefinedColor)}
                title={predefinedColor}
              />
            ))}
          </div>
          
          {/* Custom Color Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Custom:</label>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
