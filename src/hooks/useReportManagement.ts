import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { REPORT_MODULES, REPORT_CATEGORIES, ReportModule } from '../data/reportModules';
import { useDebounce } from './useDebounce';
import { useKeyboardNavigation } from './useKeyboardNavigation';

export const useReportManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter reports based on search term and category
  const filteredReports = useMemo(() => {
    return REPORT_MODULES.filter(report => {
      const matchesSearch = searchTerm === '' || 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        report.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [debouncedSearchTerm, selectedCategory]);

  // Generate search suggestions
  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];

    const allTerms = [
      ...REPORT_MODULES.map(report => report.title),
      ...REPORT_MODULES.flatMap(report => report.tags),
      ...REPORT_MODULES.flatMap(report => report.features)
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

  const handleReportClick = useCallback((report: ReportModule) => {
    navigate(report.path);
  }, [navigate]);

  const handleQuickExport = useCallback((reportId: string) => {
    // TODO: Implement quick export functionality

  }, []);

  const handleScheduleReport = useCallback((reportId: string) => {
    // TODO: Implement schedule report functionality

  }, []);

  const handleAdvancedFilters = useCallback((reportId: string) => {
    // TODO: Implement advanced filters functionality

  }, []);

  // Category filter options
  const categoryOptions = useMemo(() => {
    return REPORT_CATEGORIES.map(category => ({
      value: category.value,
      label: category.label,
      color: category.color
    }));
  }, []);

  return {
    // State
    searchTerm,
    selectedCategory,
    showSuggestions,
    filteredReports,
    suggestions,
    currentIndex,
    categoryOptions,

    // Event handlers
    setSearchTerm,
    setSelectedCategory,
    setShowSuggestions,
    handleSearchChange,
    handleSuggestionClick,
    clearSearch,
    handleCategoryChange,
    handleReportClick,
    handleQuickExport,
    handleScheduleReport,
    handleAdvancedFilters
  };
};