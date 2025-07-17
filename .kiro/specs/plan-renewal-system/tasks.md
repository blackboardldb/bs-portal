# Implementation Plan

- [x] 1. Update core utility functions for plan status management

  - Enhance `getPlanStatus` function in `lib/utils.ts` to handle pending renewal state
  - Update `canUserRegisterForClasses` function to use the enhanced plan status logic
  - Add comprehensive date and class limit validation logic
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 2. Enhance data types and interfaces for pending renewals

  - Update `PendingRenewalRequest` interface in `lib/types.ts` with complete renewal data structure
  - Ensure `FitCenterMembership` interface properly includes `pendingRenewal` field
  - Add type definitions for renewal status and payment methods
  - _Requirements: 2.4, 3.1, 4.1_

- [x] 3. Update HomePage component with status-specific rendering

  - Modify `components/HomePage.tsx` to handle three plan states (active, expired, pending)
  - Implement conditional rendering for plan details section based on status
  - Add pending validation badge and contact information display
  - Update classes section to show appropriate messages for each status
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4_

- [x] 4. Implement plan renewal page functionality

  - Fix and enhance `app/app/renovar-plan/page.tsx` with proper plan selection logic
  - Add comprehensive form validation for plan and payment method selection
  - Implement renewal request submission that sets user status to pending
  - Add proper error handling and loading states for the renewal process
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Update calendar component to restrict class registration

  - Modify calendar page `app/app/calendar/page.tsx` to check plan status before allowing registration
  - Implement status-specific messages in calendar view
  - Disable registration functionality for expired and pending plan states
  - Add appropriate user feedback for non-active plan states
  - _Requirements: 1.5, 3.4, 5.1, 5.2, 5.3_

- [x] 6. Enhance store management for renewal requests

  - Update `lib/blacksheep-store.ts` to handle pending renewal state management
  - Implement `requestPlanRenewal` function to create and store renewal requests
  - Add state management for renewal request status and user plan updates
  - Ensure proper state synchronization across components
  - _Requirements: 2.4, 4.1, 6.5_

- [x] 7. Add comprehensive error handling and user feedback

  - Implement error boundaries and fallback states for all renewal-related components
  - Add toast notifications for successful renewal submissions and errors
  - Create loading states for renewal process and plan status checks
  - Add user-friendly error messages with recovery options
  - _Requirements: 2.5, 3.3, 5.4_

- [x] 8. Create unit tests for plan status logic

  - Write tests for `getPlanStatus` function covering all status scenarios
  - Test `canUserRegisterForClasses` function with different user states
  - Add tests for date validation and class limit calculations
  - Verify edge cases for plan expiration and renewal logic
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 9. Implement integration tests for renewal workflow
  - Create end-to-end tests for the complete renewal process
  - Test state transitions from expired to pending to active
  - Verify UI updates reflect current plan status accurately
  - Test error scenarios and recovery mechanisms
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
