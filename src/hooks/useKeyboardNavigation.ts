import { useState, useCallback, useEffect } from 'react';

interface UseKeyboardNavigationProps<T> {
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * Custom hook for keyboard navigation in dropdown/suggestion lists
 * @param items - Array of items to navigate through
 * @param onSelect - Callback when an item is selected
 * @param onClose - Callback when navigation should close
 * @param isOpen - Whether the navigation is currently open
 * @returns Object with current index and navigation handlers
 */
export const useKeyboardNavigation = <T>({
  items,
  onSelect,
  onClose,
  isOpen
}: UseKeyboardNavigationProps<T>) => {
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen || items.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setCurrentIndex((prev) => 
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          setCurrentIndex((prev) => 
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;

        case 'Enter':
          event.preventDefault();
          if (currentIndex >= 0 && currentIndex < items.length) {
            onSelect(items[currentIndex]);
          }
          break;

        case 'Escape':
          event.preventDefault();
          onClose();
          break;

        case 'Tab':
          onClose();
          break;
      }
    },
    [isOpen, items, currentIndex, onSelect, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(-1);
    }
  }, [isOpen]);

  return {
    currentIndex,
    setCurrentIndex
  };
};