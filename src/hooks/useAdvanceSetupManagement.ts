import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ADVANCE_SETUP_MODULES, 
  ADVANCE_SETUP_CATEGORIES, 
  AdvanceSetupModule 
} from '../data/advanceSetupModules';
import { useDebounce } from './useDebounce';
import { useKeyboardNavigation } from './useKeyboardNavigation';

export const useAdvanceSetupManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter modules based on search term, category, and priority
  const filteredModules = useMemo(() => {
    return ADVANCE_SETUP_MODULES.filter(module => {
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
      ...ADVANCE_SETUP_MODULES.map(module => module.title),
      ...ADVANCE_SETUP_MODULES.flatMap(module => module.tags),
      ...ADVANCE_SETUP_MODULES.flatMap(module => module.features)
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

  const handleModuleClick = useCallback((module: AdvanceSetupModule) => {
    navigate(module.path);
  }, [navigate]);

  const handleQuickSetup = useCallback((moduleId: string) => {
    // TODO: Implement quick setup functionality
    }, []);

  const handleModuleStatus = useCallback((moduleId: string) => {
    // TODO: Implement module status functionality
    }, []);

  const handleConfiguration = useCallback((moduleId: string) => {
    // TODO: Implement configuration functionality
    }, []);

  // Category filter options
  const categoryOptions = useMemo(() => {
    return ADVANCE_SETUP_CATEGORIES.map(category => ({
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
    const total = ADVANCE_SETUP_MODULES.length;
    const required = ADVANCE_SETUP_MODULES.filter(m => m.isRequired).length;
    const highPriority = ADVANCE_SETUP_MODULES.filter(m => m.priority === 'high').length;
    const activeModules = ADVANCE_SETUP_MODULES.filter(m => m.status === 'active').length;
    const categories = new Set(ADVANCE_SETUP_MODULES.map(m => m.category)).size;

    return {
      total,
      required,
      highPriority,
      activeModules,
      categories
    };
  }, []);

  // Setup progress
  const setupProgress = useMemo(() => {
    const requiredModules = ADVANCE_SETUP_MODULES.filter(m => m.isRequired);
    const completedRequired = requiredModules.filter(m => m.status === 'active').length;
    const progressPercentage = requiredModules.length > 0 
      ? Math.round((completedRequired / requiredModules.length) * 100)
      : 0;

    return {
      required: requiredModules.length,
      completed: completedRequired,
      percentage: progressPercentage
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
    setupProgress,

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
    handleQuickSetup,
    handleModuleStatus,
    handleConfiguration
  };
};