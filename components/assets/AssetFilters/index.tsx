import React from 'react';
import { AssetFilters as FiltersType, FilterPreset } from '@/lib/assets/asset-types';
import { ASSET_TYPES, TEMPLATES, ASSET_STATUSES } from '@/lib/assets/asset-constants';

interface AssetFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  presets?: FilterPreset[];
  onPresetSelect?: (preset: FilterPreset) => void;
  onSavePreset?: (filters: FiltersType, name: string) => void;
  showPresets?: boolean;
}

export function AssetFilters({
  filters,
  onFiltersChange,
  searchTerm,
  onSearchChange,
  presets = [],
  onPresetSelect,
  onSavePreset,
  showPresets = false,
}: AssetFiltersProps) {
  const handleFilterChange = (key: keyof FiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      status: 'all',
      type: 'all',
      template: 'all',
      search: '',
    });
    onSearchChange('');
  };

  const hasActiveFilters = filters.status !== 'all' || 
                          filters.type !== 'all' || 
                          filters.template !== 'all' || 
                          filters.search !== '';

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {ASSET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type-filter"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {ASSET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Template Filter */}
          <div>
            <label htmlFor="template-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <select
              id="template-filter"
              value={filters.template}
              onChange={(e) => handleFilterChange('template', e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Templates</option>
              {TEMPLATES.map((template) => (
                <option key={template} value={template}>
                  {template.charAt(0).toUpperCase() + template.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                Clear all filters
              </button>
            )}
            {showPresets && onSavePreset && hasActiveFilters && (
              <button
                onClick={() => {
                  const name = prompt('Enter preset name:');
                  if (name && name.trim()) {
                    onSavePreset(filters, name.trim());
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                Save as preset
              </button>
            )}
          </div>

          {/* Active Filters Count */}
          {hasActiveFilters && (
            <span className="text-sm text-gray-500">
              {[
                filters.status !== 'all' && 'Status',
                filters.type !== 'all' && 'Type',
                filters.template !== 'all' && 'Template',
                filters.search && 'Search'
              ].filter(Boolean).length} filter(s) active
            </span>
          )}
        </div>

        {/* Preset Buttons */}
        {showPresets && presets.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onPresetSelect?.(preset)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
