# Implementation Plan

- [x] 1. Set up data structures and type definitions

  - Create Banner interface in lib/types.ts with all required properties
  - Add predefined style constants for backgrounds, colors, and buttons
  - Create form validation schemas using existing validation patterns
  - _Requirements: 1.4, 1.5, 7.1, 7.2, 7.3_

- [x] 2. Extend BlackSheep store with banner management

  - Add banners array to BlackSheepStore interface in lib/blacksheep-store.ts
  - Implement addBanner, updateBanner, deleteBanner, toggleBanner methods
  - Add reorderBanners and getActiveBanners utility methods
  - Create initial banner data migration from existing staticCarouselSlides
  - _Requirements: 8.3, 8.4, 1.3, 2.2_

- [x] 3. Create banner management admin page

  - Create app/admin/configuraciones/banners/page.tsx with banner list interface
  - Implement banner listing with status indicators and quick actions
  - Add create banner button and empty state handling
  - Integrate with existing admin layout and navigation patterns
  - _Requirements: 1.1, 1.2, 8.1, 8.2_

- [x] 4. Implement banner creation and editing modal

  - Create components/admincomponents/banner-modal.tsx with form interface
  - Add all form fields: title, subtitle, icon, button, badge, styling options
  - Implement real-time preview functionality within the modal
  - Add form validation with error handling and user feedback
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 4.1, 4.2, 4.3_

- [x] 5. Create banner card component for admin list

  - Create components/admincomponents/banner-card.tsx for individual banner display
  - Add preview rendering with actual banner styling
  - Implement quick action buttons (edit, toggle active, delete)
  - Add drag handle for reordering functionality
  - _Requirements: 3.1, 3.2, 5.1, 5.2_

- [x] 6. Implement banner management container component

  - Create components/admincomponents/banner-manager.tsx as main logic container
  - Add drag and drop reordering using existing patterns
  - Implement modal state management for create/edit operations
  - Add confirmation dialogs for delete operations
  - _Requirements: 3.3, 5.1, 5.2, 5.3_

- [x] 7. Create new user-facing banner carousel

  - Create components/banner-carousel.tsx to replace StaticCarousel
  - Implement responsive carousel layout with touch-friendly scrolling
  - Add banner filtering to show only active banners in correct order
  - Maintain existing carousel UX and styling patterns
  - _Requirements: 6.1, 6.4, 3.4, 3.5_

- [x] 8. Create individual banner item component

  - Create components/banner-item.tsx for rendering individual banners
  - Implement dynamic styling based on banner configuration
  - Add icon rendering using Lucide icons
  - Add badge display and button click handling with navigation
  - _Requirements: 6.2, 6.3, 7.5, 6.1_

- [x] 9. Add banner management to admin configuration

  - Update app/admin/configuraciones/page.tsx to include banner management card
  - Add navigation link to banner management page
  - Follow existing admin configuration page patterns
  - Ensure consistent styling with other configuration options
  - _Requirements: 8.1, 8.2_

- [x] 10. Replace StaticCarousel with new BannerCarousel

  - Update components imports in pages that use StaticCarousel
  - Replace StaticCarousel component usage with BannerCarousel
  - Ensure proper data flow from store to new carousel component
  - Test that existing carousel functionality is maintained
  - _Requirements: 6.1, 6.5_

- [x] 11. Implement banner data migration and cleanup

  - Create migration function to convert staticCarouselSlides to Banner format
  - Set up default banners in store initialization
  - Remove StaticCarousel component and related unused code
  - Clean up staticCarouselSlides data from mock-data.ts
  - _Requirements: 8.4_

- [x] 12. Add comprehensive error handling and validation

  - Implement client-side form validation with real-time feedback
  - Add error boundaries for banner components
  - Create fallback states for when banner data is unavailable
  - Add success/error toast notifications for admin operations
  - _Requirements: 8.5, 4.4, 6.5_

- [ ] 13. Create unit tests for banner functionality

  - Write tests for Banner CRUD operations in store
  - Test form validation rules and error handling
  - Test banner component rendering with different configurations
  - Test dynamic styling application and predefined style options
  - _Requirements: 1.4, 1.5, 2.3, 7.4_

- [ ] 14. Add integration tests for banner workflows

  - Test complete admin banner creation and editing workflow
  - Test banner visibility toggling and user carousel updates
  - Test banner reordering and order persistence
  - Test user interaction with banner buttons and navigation
  - _Requirements: 3.1, 3.2, 3.4, 6.2_

- [x] 15. Implement responsive design and accessibility
  - Ensure banner carousel works properly on mobile devices
  - Add proper ARIA labels and keyboard navigation support
  - Test color contrast for accessibility compliance
  - Implement touch-friendly interactions for mobile users
  - _Requirements: 6.4, 7.4_
