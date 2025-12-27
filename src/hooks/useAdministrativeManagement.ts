import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ADMINISTRATIVE_MODULES, 
  ADMINISTRATIVE_CATEGORIES, 
  AdministrativeModule 
} from '../data/administrativeModules';
import { useDebounce } from './useDebounce';
import { useKeyboardNavigation } from './useKeyboardNavigation';

export const useAdministrativeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter modules based on search term, category, and priority
  const filteredModules = useMemo(() => {
    return ADMINISTRATIVE_MODULES.filter(module => {
      const matchesSearch = searchTerm === '' || 
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        module.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
      const matchesPriority = selectedPriority === 'all' || module.priority === selectedPriority;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [debouncedSearchTerm, selectedCategory, selectedPriority]);

  // Generate search suggestions
  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];

    const allTerms = [
      ...ADMINISTRATIVE_MODULES.map(module => module.title),
      ...ADMINISTRATIVE_MODULES.flatMap(module => module.tags),
      ...ADMINISTRATIVE_MODULES.flatMap(module => module.features)
    ];

    const uniqueTerms = [...new Set(allTerms)];
    
    return uniqueTerms
      .filter(term => term.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5)
      .map(term => ({
        text: term,
        type: 'suggestion' as const
      }));
  }, [searchTerm]);

  // Keyboard navigation for suggestions
  const { currentIndex } = useKeyboardNavigation({
    items: suggestions,
    onSelect: (suggestion) => handleSuggestionClick(suggestion.text),
    onClose: () => setShowSuggestions(false),
    isOpen: showSuggestions
  });

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setShowSuggestions(false);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handlePriorityChange = useCallback((priority: string) => {
    setSelectedPriority(priority);
  }, []);

  const handleModuleClick = useCallback((module: AdministrativeModule) => {
    navigate(module.path);
  }, [navigate]);

  const handleQuickAccess = useCallback((moduleId: string) => {
    // TODO: Implement quick access functionality
    }, []);

  const handleModuleStatus = useCallback((moduleId: string) => {
    // TODO: Implement module status functionality
    }, []);

  const handleConfiguration = useCallback((moduleId: string) => {
    // TODO: Implement configuration functionality
    }, []);

  // Category filter options
  const categoryOptions = useMemo(() => {
    return ADMINISTRATIVE_CATEGORIES.map(category => ({
      value: category.value,
      label: category.label,
      color: category.color
    }));
  }, []);

  // Priority filter options
  const priorityOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Priorities', color: '#6b7280' },
      { value: 'high', label: 'High Priority', color: '#ef4444' },
      { value: 'medium', label: 'Medium Priority', color: '#f59e0b' },
      { value: 'low', label: 'Low Priority', color: '#10b981' }
    ];
  }, []);

  // Statistics
  const statistics = useMemo(() => {
    const total = ADMINISTRATIVE_MODULES.length;
    const highPriority = ADMINISTRATIVE_MODULES.filter(m => m.priority === 'high').length;
    const activeModules = ADMINISTRATIVE_MODULES.filter(m => m.status === 'active').length;
    const categories = new Set(ADMINISTRATIVE_MODULES.map(m => m.category)).size;

    return {
      total,
      highPriority,
      activeModules,
      categories
    };
  }, []);

  return {
    // State
    searchTerm,
    selectedCategory,
    selectedPriority,
    showSuggestions,
    filteredModules,
    suggestions,
    currentIndex,
    categoryOptions,
    priorityOptions,
    statistics,

    // Event handlers
    setSearchTerm,
    setSelectedCategory,
    setSelectedPriority,
    setShowSuggestions,
    handleSearchChange,
    handleSuggestionClick,
    clearSearch,
    handleCategoryChange,
    handlePriorityChange,
    handleModuleClick,
    handleQuickAccess,
    handleModuleStatus,
    handleConfiguration
  };
};