import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  visible?: boolean; // New property to control visibility
  defaultVisible?: boolean; // New property for default visibility
  sortable?: boolean; // New property to control if column is sortable
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  showColumnControls?: boolean; // New prop to enable column controls
  onSort?: (key: string, direction: 'asc' | 'desc') => void; // New prop for sort callback
  sortable?: boolean; // New prop to enable sorting globally
  initialSortState?: SortState; // New prop to initialize sort state
  maxHeight?: number; // New prop to control max height of the table
  getRowClassName?: (item: T, index: number) => string; // New prop for custom row styling
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc';
}

function DataTable<T>({ 
  data, 
  columns, 
  onRowClick, 
  emptyMessage = "No data available",
  className = "",
  showColumnControls = false,
  onSort,
  sortable = false,
  initialSortState,
  maxHeight,
  getRowClassName
}: DataTableProps<T>) {
  // Initialize column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const initialVisible = new Set<string>();
    columns.forEach(column => {
      if (column.visible !== false && column.defaultVisible !== false) {
        initialVisible.add(column.key);
      }
    });
    return initialVisible;
  });

  // Add state for dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Add sort state
  const [sortState, setSortState] = useState<SortState>(initialSortState || { key: null, direction: 'asc' });

  // Keep sort state synchronized with parent component
  useEffect(() => {
    if (initialSortState) {
      setSortState(initialSortState);
    }
  }, [initialSortState]);

  // Close dropdown when clicking outside and handle scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      if (isDropdownOpen) {
        // Check if the scroll event is coming from within the dropdown
        const target = event.target as Element;
        if (dropdownRef.current && !dropdownRef.current.contains(target)) {
          setIsDropdownOpen(false);
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (isDropdownOpen) {
        // Check if the wheel event is coming from within the dropdown
        const target = event.target as Element;
        if (dropdownRef.current && dropdownRef.current.contains(target)) {
          // Prevent background scrolling when scrolling within dropdown
          event.preventDefault();
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Close dropdown when scrolling outside of it
      window.addEventListener('scroll', handleScroll, true);
      // Prevent background scrolling when scrolling within dropdown
      document.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isDropdownOpen]);

  // Filter columns based on visibility
  const visibleColumnsList = columns.filter(column => visibleColumns.has(column.key));

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const toggleAllColumns = () => {
    if (visibleColumns.size === columns.length) {
      // Hide all optional columns (keep required ones)
      setVisibleColumns(new Set(columns.filter(col => col.visible === true).map(col => col.key)));
    } else {
      // Show all columns
      setVisibleColumns(new Set(columns.map(col => col.key)));
    }
    // Close dropdown after action
    setIsDropdownOpen(false);
  };

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.key === columnKey);
    if (!column || column.sortable === false) return;

    const newDirection: 'asc' | 'desc' = sortState.key === columnKey && sortState.direction === 'asc' ? 'desc' : 'asc';
    const newSortState: SortState = { key: columnKey, direction: newDirection };
    
    setSortState(newSortState);
    
    // Call the onSort callback if provided
    if (onSort) {
      onSort(columnKey, newDirection);
    }
  };

  // Get sort indicator for a column
  const getSortIndicator = (columnKey: string) => {
    if (!sortable) return null;
    
    const column = columns.find(col => col.key === columnKey);
    if (!column || column.sortable === false) return null;

    if (sortState.key !== columnKey) {
      return <ChevronUp size={14} className="text-gray-300 sort-indicator" />;
    }

    return sortState.direction === 'asc' ? 
      <ChevronUp size={14} className="text-blue-600 sort-indicator asc" /> : 
      <ChevronDown size={14} className="text-blue-600 sort-indicator desc" />;
  };

  // Check if a column is sortable
  const isColumnSortable = (columnKey: string) => {
    if (!sortable) return false;
    const column = columns.find(col => col.key === columnKey);
    return column && column.sortable !== false;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Column Controls */}
      {showColumnControls && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Columns:</span>
              <span className="text-sm text-gray-500">
                {visibleColumns.size} of {columns.length} visible
              </span>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MoreHorizontal size={16} className="mr-1" />
                More Columns
              </button>
              
              {/* Dropdown Menu */}
              <div className={`absolute w-64 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] transition-all duration-200 ${
                isDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`} style={{
                top: '100%',
                right: 0,
                marginTop: '8px',
                maxHeight: '300px'
              }}>
                <div className="py-2">
                  {/* Toggle All Button */}
                  <button
                    onClick={toggleAllColumns}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                  >
                    {visibleColumns.size === columns.length ? 'Hide All Optional' : 'Show All'}
                  </button>
                  
                  {/* Scrollable Column List */}
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {/* Individual Column Toggles */}
                    {columns.map((column) => (
                      <button
                        key={column.key}
                        onClick={() => toggleColumnVisibility(column.key)}
                        disabled={column.visible === true} // Required columns can't be hidden
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                          column.visible === true ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                        }`}
                      >
                        <span className="truncate">{column.header}</span>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {visibleColumns.has(column.key) ? (
                            <Eye size={14} className="text-green-600" />
                          ) : (
                            <EyeOff size={14} className="text-gray-400" />
                          )}
                          {column.visible === true && (
                            <span className="text-xs text-gray-400">Required</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`overflow-x-auto ${maxHeight ? 'table-scroll-container' : ''}`} style={maxHeight ? { maxHeight } : {}}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-50 ${maxHeight ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {visibleColumnsList.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.className || ''
                  } ${
                    isColumnSortable(column.key) 
                      ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-150' 
                      : ''
                  } ${maxHeight ? 'bg-gray-50 shadow-sm' : ''}`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.header}</span>
                    {isColumnSortable(column.key) && (
                      <div className="ml-2">
                        {getSortIndicator(column.key)}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnsList.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={`table-row-enter ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${getRowClassName ? getRowClassName(item, index) : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {visibleColumnsList.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                    >
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;