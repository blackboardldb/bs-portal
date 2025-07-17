# Implementation Plan

- [x] 1. Create individual instructor API endpoints

  - Create `/api/instructors/[id]/route.ts` with PUT and DELETE methods
  - Implement proper error handling and validation using InstructorService
  - Add authentication checks for admin-only operations
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 2. Create status toggle API endpoint

  - Create `/api/instructors/[id]/status/route.ts` with PATCH method
  - Implement optimized status toggle logic in InstructorService
  - Return updated instructor data with new status
  - _Requirements: 4.3_

- [x] 3. Add missing store methods for instructor operations

  - Implement `toggleInstructorStatus` method in blacksheep-store
  - Enhance `deleteInstructorById` method to call proper API endpoint
  - Ensure `updateInstructorById` method works with new PUT endpoint
  - Add proper error handling and loading states
  - _Requirements: 1.1, 2.2, 3.2_

- [x] 4. Implement clickable status badge functionality

  - Make status badge clickable in instructor table
  - Add loading state during status toggle operation
  - Implement optimistic UI updates with rollback on failure
  - Add success/error toast notifications
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Implement delete confirmation dialog

  - Create confirmation dialog component for instructor deletion
  - Add proper warning message about permanent deletion
  - Implement confirm/cancel actions with proper state management
  - Handle deletion errors with specific error messages
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 6. Fix edit modal functionality

  - Ensure edit modal properly saves changes using PUT endpoint
  - Fix form validation and error display
  - Implement proper cancel behavior without saving changes
  - Add loading states and success/error feedback
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Add validation for instructor deletion

  - Implement check for instructors with associated classes
  - Prevent deletion of instructors assigned to active classes
  - Return appropriate error messages for blocked deletions
  - _Requirements: 4.4_

- [ ] 8. Write unit tests for new API endpoints

  - Test PUT `/api/instructors/[id]` endpoint with valid and invalid data
  - Test DELETE `/api/instructors/[id]` endpoint with various scenarios
  - Test PATCH `/api/instructors/[id]/status` endpoint for status toggle
  - Test error cases and validation failures
  - _Requirements: 2.2, 3.2, 1.1_

- [ ] 9. Write integration tests for UI functionality
  - Test status toggle flow from UI click to database update
  - Test delete confirmation flow with success and error scenarios
  - Test edit modal save/cancel functionality
  - Test error handling and toast notifications
  - _Requirements: 1.1, 2.1, 3.1_
