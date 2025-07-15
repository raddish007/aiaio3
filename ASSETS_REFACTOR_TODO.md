# Assets Page Refactoring Todo List

## 🎉 PROGRESS UPDATE: Phase 1 & 2 Complete! 
✅ **Phase 1: Domain Logic** - All types, constants, API functions, and utilities extracted  
✅ **Phase 2: Custom Hooks** - All data management, upload, review, and filter hooks implemented  
🚧 **Phase 3: Core Components** - Layout, toolbar, stats, filters, and table components created  

**Current Achievement**: Successfully extracted 7 custom hooks, 4 core components, and complete domain logic from the monolithic 2,824-line file. The refactor is progressing excellently with clean, modular architecture.

---

## 📋 Project Overview
Refactor the massive 2,824-line `pages/admin/assets.tsx` file into a modular, maintainable architecture.

**Current State**: Monolithic component with mixed responsibilities
**Target State**: Modular architecture with single-responsibility components

---

## 🎯 Phase 1: Extract Domain Logic (Week 1)

### ✅ Setup and Planning
- [ ] Create refactoring branch: `feature/assets-refactor`
- [ ] Backup current assets.tsx file
- [ ] Create project structure directories

### 📚 Type Definitions and Constants
- [ ] **Create `lib/assets/asset-types.ts`**
  - [ ] Extract Asset interface from current file
  - [ ] Create AssetStatus enum ('pending' | 'approved' | 'rejected')
  - [ ] Create AssetType enum ('image' | 'audio' | 'video' | 'prompt')
  - [ ] Create Template enum ('lullaby' | 'name-video' | 'letter-hunt' | 'general')
  - [ ] Create SafeZone enum for review zones
  - [ ] Create Filter interfaces
  - [ ] Create Form interfaces (UploadForm, ReviewForm, EditForm, etc.)

- [ ] **Create `lib/assets/asset-constants.ts`**
  - [ ] Export assets per page constant (50)
  - [ ] Export allowed file extensions by type
  - [ ] Export max file sizes by type
  - [ ] Export default form values
  - [ ] Export validation messages

### 🔧 API Layer
- [ ] **Create `lib/assets/asset-api.ts`**
  - [ ] Extract `fetchAssets` function with filters and pagination
  - [ ] Extract `fetchPendingAssets` function
  - [ ] Extract `uploadAsset` function
  - [ ] Extract `bulkUploadAssets` function
  - [ ] Extract `approveAsset` function
  - [ ] Extract `rejectAsset` function
  - [ ] Extract `updateAsset` function
  - [ ] Extract `deleteAsset` function
  - [ ] Extract `generateAsset` function
  - [ ] Extract user fetching functions
  - [ ] Add proper error handling and types

### 🛠️ Utilities and Validation
- [ ] **Create `lib/assets/asset-utils.ts`**
  - [ ] Extract file type detection logic
  - [ ] Extract file validation functions
  - [ ] Extract metadata extraction functions
  - [ ] Extract search/filter logic
  - [ ] Extract pagination calculations
  - [ ] Extract keyboard shortcut handlers

- [ ] **Create `lib/assets/asset-validation.ts`**
  - [ ] Create upload form validation schema
  - [ ] Create edit form validation schema
  - [ ] Create review form validation schema
  - [ ] Create bulk upload validation schema
  - [ ] Export validation functions

---

## 🪝 Phase 2: Create Custom Hooks (Week 2)

### 📊 Data Management Hooks
- [ ] **Create `hooks/assets/useAssets.ts`**
  - [ ] Manage assets state and loading
  - [ ] Handle filtering and search
  - [ ] Implement pagination
  - [ ] Add refetch functionality
  - [ ] Include error handling
  - [ ] Add optimistic updates

- [ ] **Create `hooks/assets/useAssetStats.ts`**
  - [ ] Fetch and manage statistics
  - [ ] Calculate pending assets count
  - [ ] Handle stats refresh
  - [ ] Add caching for stats

### 📤 Upload Management Hooks
- [ ] **Create `hooks/assets/useAssetUpload.ts`**
  - [ ] Handle single file uploads
  - [ ] Manage upload progress
  - [ ] Handle file validation
  - [ ] Manage form state
  - [ ] Add drag & drop support

- [ ] **Create `hooks/assets/useBulkUpload.ts`**
  - [ ] Handle multiple file uploads
  - [ ] Manage bulk upload progress
  - [ ] Handle batch validation
  - [ ] Manage bulk form state
  - [ ] Add progress tracking per file

### 🔍 Review and Modal Hooks
- [ ] **Create `hooks/assets/useAssetReview.ts`**
  - [ ] Handle approval workflow
  - [ ] Manage rejection workflow
  - [ ] Handle review form state
  - [ ] Implement next/previous asset navigation
  - [ ] Add keyboard shortcuts (A for approve, R for reject, Escape to close)

- [ ] **Create `hooks/assets/useAssetModal.ts`**
  - [ ] Manage modal open/close state
  - [ ] Handle asset selection
  - [ ] Implement modal navigation
  - [ ] Add modal keyboard shortcuts
  - [ ] Handle modal form state

### 🔍 Filter and Search Hooks
- [ ] **Create `hooks/assets/useAssetFilters.ts`**
  - [ ] Manage filter state
  - [ ] Handle search debouncing
  - [ ] Sync filters with URL parameters
  - [ ] Add filter presets
  - [ ] Handle filter reset

---

## 🎨 Phase 3: Build Core Components (Week 3)

### 🏗️ Layout Components
- [ ] **Create `components/assets/AssetsLayout.tsx`**
  - [ ] Main layout wrapper
  - [ ] Include AdminHeader
  - [ ] Add proper spacing and responsive design
  - [ ] Include error boundaries

- [ ] **Create `components/assets/AssetToolbar.tsx`**
  - [ ] View toggle buttons (All/Review/Viewer)
  - [ ] Upload buttons (Single/Bulk)
  - [ ] Bulk action buttons
  - [ ] Action button states

### 📊 Statistics Components
- [ ] **Create `components/assets/AssetStats/index.tsx`**
  - [ ] Stats grid container
  - [ ] Loading skeleton
  - [ ] Error states

- [ ] **Create `components/assets/AssetStats/StatCard.tsx`**
  - [ ] Individual stat card
  - [ ] Icon and count display
  - [ ] Hover animations
  - [ ] Clickable for filtering

### 🗃️ Grid and Card Components
- [ ] **Create `components/assets/AssetGrid/index.tsx`**
  - [ ] Grid container with responsive layout
  - [ ] Loading states
  - [ ] Empty states
  - [ ] Infinite scroll preparation

- [ ] **Create `components/assets/AssetGrid/AssetCard.tsx`**
  - [ ] Individual asset card display
  - [ ] Media thumbnail/preview
  - [ ] Asset metadata display
  - [ ] Status badges
  - [ ] Action buttons based on view mode
  - [ ] Hover effects and animations

- [ ] **Create `components/assets/AssetGrid/AssetPagination.tsx`**
  - [ ] Pagination controls
  - [ ] Page size selector
  - [ ] Results count display
  - [ ] Keyboard navigation support

### 🔍 Filter Components
- [ ] **Create `components/assets/AssetFilters/index.tsx`**
  - [ ] Filter container layout
  - [ ] Responsive filter layout
  - [ ] Filter reset button

- [ ] **Create `components/assets/AssetFilters/StatusFilter.tsx`**
  - [ ] Status dropdown (All/Pending/Approved/Rejected)
  - [ ] Badge counts per status

- [ ] **Create `components/assets/AssetFilters/TypeFilter.tsx`**
  - [ ] Type dropdown (All/Image/Audio/Video/Prompt)
  - [ ] Icons for each type

- [ ] **Create `components/assets/AssetFilters/TemplateFilter.tsx`**
  - [ ] Template dropdown
  - [ ] Template-specific filtering

- [ ] **Create `components/assets/AssetFilters/SearchFilter.tsx`**
  - [ ] Search input with debouncing
  - [ ] Search suggestions
  - [ ] Clear search button

- [ ] **Create `components/assets/AssetFilters/ViewToggle.tsx`**
  - [ ] View mode toggle (All/Review/Viewer)
  - [ ] Active state styling

---

## 🔧 Phase 4: Modal System (Week 4)

### 📋 Asset Detail Modal
- [ ] **Create `components/assets/AssetModals/AssetDetailModal/index.tsx`**
  - [ ] Modal container and layout
  - [ ] Tabbed interface (View/Edit/Review)
  - [ ] Modal navigation (Next/Previous)
  - [ ] Keyboard shortcuts
  - [ ] Close modal handling

- [ ] **Create `components/assets/AssetModals/AssetDetailModal/AssetViewer.tsx`**
  - [ ] Media display (image/audio/video)
  - [ ] Metadata display
  - [ ] Full-screen view option
  - [ ] Download functionality

- [ ] **Create `components/assets/AssetModals/AssetDetailModal/AssetForm.tsx`**
  - [ ] Edit form for asset metadata
  - [ ] Form validation
  - [ ] Save/Cancel actions
  - [ ] Dynamic fields based on asset type

- [ ] **Create `components/assets/AssetModals/AssetDetailModal/ReviewPanel.tsx`**
  - [ ] Review form (safe zones, notes)
  - [ ] Approve/Reject buttons
  - [ ] Review history display
  - [ ] Reviewer information

- [ ] **Create `components/assets/AssetModals/AssetDetailModal/MetadataPanel.tsx`**
  - [ ] Structured metadata display
  - [ ] Editable metadata fields
  - [ ] Metadata validation
  - [ ] Advanced metadata toggle

### 📤 Upload Modals
- [ ] **Create `components/assets/AssetModals/UploadModal/index.tsx`**
  - [ ] Upload modal container
  - [ ] Step-by-step upload process
  - [ ] Progress indication
  - [ ] Error handling

- [ ] **Create `components/assets/AssetModals/UploadModal/FileDropzone.tsx`**
  - [ ] Drag and drop area
  - [ ] File browser trigger
  - [ ] File validation feedback
  - [ ] Upload preview

- [ ] **Create `components/assets/AssetModals/UploadModal/UploadForm.tsx`**
  - [ ] Upload metadata form
  - [ ] Dynamic fields based on file type
  - [ ] Form validation
  - [ ] Auto-population of metadata

- [ ] **Create `components/assets/AssetModals/UploadModal/FilePreview.tsx`**
  - [ ] File preview display
  - [ ] File information
  - [ ] Remove file option
  - [ ] Edit file metadata

### 🗂️ Bulk Upload Modal
- [ ] **Create `components/assets/AssetModals/BulkUploadModal/index.tsx`**
  - [ ] Bulk upload container
  - [ ] Batch progress tracking
  - [ ] Bulk operation controls

- [ ] **Create `components/assets/AssetModals/BulkUploadModal/BulkDropzone.tsx`**
  - [ ] Multiple file drop area
  - [ ] File type filtering
  - [ ] Bulk file validation

- [ ] **Create `components/assets/AssetModals/BulkUploadModal/BulkForm.tsx`**
  - [ ] Common metadata form
  - [ ] Bulk operation settings
  - [ ] Template application

- [ ] **Create `components/assets/AssetModals/BulkUploadModal/FileList.tsx`**
  - [ ] Selected files list
  - [ ] Individual file editing
  - [ ] Remove files option
  - [ ] Upload progress per file

---

## ⚡ Phase 5: Advanced Features (Week 5)

### 🔄 Bulk Operations
- [ ] **Create `components/assets/BulkActions/`**
  - [ ] Bulk select functionality
  - [ ] Bulk approve/reject
  - [ ] Bulk delete
  - [ ] Bulk metadata update
  - [ ] Bulk tag assignment

### 🔍 Enhanced Search
- [ ] **Implement Advanced Search**
  - [ ] Fuzzy search implementation
  - [ ] Search within metadata
  - [ ] Search suggestions/autocomplete
  - [ ] Search history
  - [ ] Saved search queries

### 📊 Analytics and Insights
- [ ] **Create `components/assets/Analytics/`**
  - [ ] Asset usage analytics
  - [ ] Upload trends
  - [ ] Review performance metrics
  - [ ] Asset popularity tracking

### 📥 Import/Export
- [ ] **Create Import/Export Features**
  - [ ] CSV export of asset metadata
  - [ ] Bulk metadata import
  - [ ] Asset backup/restore
  - [ ] Migration tools

---

## 🚀 Phase 6: Performance & UX (Week 6)

### ⚡ Performance Optimizations
- [ ] **Implement Virtual Scrolling**
  - [ ] Large list virtualization
  - [ ] Lazy loading of asset cards
  - [ ] Image lazy loading
  - [ ] Infinite scroll option

- [ ] **Add Caching Strategy**
  - [ ] Asset list caching
  - [ ] Image/thumbnail caching
  - [ ] Metadata caching
  - [ ] Search results caching

### 🎨 UX Improvements
- [ ] **Add Progressive Loading**
  - [ ] Skeleton loading states
  - [ ] Progressive image loading
  - [ ] Graceful error handling
  - [ ] Offline support preparation

- [ ] **Implement Optimistic Updates**
  - [ ] Immediate UI feedback
  - [ ] Rollback on errors
  - [ ] Success animations
  - [ ] Error recovery

### 📱 Responsive Design
- [ ] **Mobile Optimization**
  - [ ] Mobile-friendly modals
  - [ ] Touch-friendly controls
  - [ ] Responsive grid layout
  - [ ] Mobile upload UX

---

## 🧪 Phase 7: Testing & Integration (Week 7)

### 🧪 Testing
- [ ] **Unit Tests**
  - [ ] Test custom hooks
  - [ ] Test utility functions
  - [ ] Test API functions
  - [ ] Test components

- [ ] **Integration Tests**
  - [ ] Test upload workflows
  - [ ] Test review workflows
  - [ ] Test filter combinations
  - [ ] Test modal interactions

### 🔄 Integration
- [ ] **Replace Original Component**
  - [ ] Feature flag implementation
  - [ ] Gradual rollout
  - [ ] Monitor performance
  - [ ] User feedback collection

- [ ] **Clean Up**
  - [ ] Remove old code
  - [ ] Update documentation
  - [ ] Update type definitions
  - [ ] Remove unused dependencies

---

## 📋 Final Checklist

### ✅ Code Quality
- [ ] All components under 200 lines
- [ ] Proper TypeScript types
- [ ] ESLint passing
- [ ] Prettier formatting
- [ ] No console.log statements

### 📚 Documentation
- [ ] Component documentation
- [ ] Hook documentation
- [ ] API documentation
- [ ] Migration guide
- [ ] Usage examples

### 🎯 Success Metrics
- [ ] Original 2,824 lines reduced to ~150-200 lines in main component
- [ ] All functionality preserved
- [ ] Performance improved (loading times, memory usage)
- [ ] Developer experience improved
- [ ] No breaking changes to existing workflows

---

## 🎉 Success Criteria

**DONE when:**
- [ ] Main assets page is under 200 lines
- [ ] All 24+ functions are properly separated
- [ ] All 20+ state variables are managed by hooks
- [ ] All UI sections are independent components
- [ ] Upload, review, and view workflows work seamlessly
- [ ] Performance is equal or better than original
- [ ] All existing features are preserved
- [ ] Code is maintainable and testable

---

**Estimated Total Effort:** 7 weeks
**Lines of Code Reduction:** 2,824 → ~150-200 (93% reduction)
**Component Count:** 1 → ~30 focused components
**Maintainability Score:** Low → High
