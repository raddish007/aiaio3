// Client-side utilities for prompt generation
// This file contains data that's safe to use on the client-side

export interface ThemeCategory {
  [category: string]: string[];
}

export interface TemplateSafeZones {
  [templateType: string]: string[];
}

// Theme categories data (client-safe)
export const THEME_CATEGORIES: ThemeCategory = {
  animals: ['dogs', 'cats', 'farm', 'forest'],
  educational: ['space', 'ocean'],
  nature: ['forest', 'ocean']
};

// Template safe zones data (client-safe)
export const TEMPLATE_SAFE_ZONES: TemplateSafeZones = {
  'name-video': ['left_safe', 'right_safe', 'center_safe', 'intro_safe', 'outro_safe', 'all_ok'],
  'lullaby': ['slideshow', 'center_safe', 'intro_safe', 'outro_safe'],
  'educational': ['left_safe', 'right_safe', 'center_safe', 'intro_safe', 'outro_safe', 'slideshow', 'all_ok']
};

// Available templates
export const AVAILABLE_TEMPLATES = ['name-video', 'lullaby', 'educational'];

// Client-safe functions
export function getThemeCategories(): ThemeCategory {
  return THEME_CATEGORIES;
}

export function getSafeZonesForTemplate(templateType: string): string[] {
  return TEMPLATE_SAFE_ZONES[templateType] || [];
}

export function getAvailableTemplates(): string[] {
  return AVAILABLE_TEMPLATES;
}
