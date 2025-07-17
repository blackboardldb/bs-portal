# Implementation Plan

- [x] 1. Update day names array to start with Monday

  - Change the `dayNames` array in calendar component from Sunday-first to Monday-first order
  - Update array to: `["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]`
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Configure date-fns functions to use Monday as week start

  - Import and configure `weekStartsOn: 1` option for date-fns functions
  - Update `startOfWeek()` and `endOfWeek()` calls to use Monday as first day
  - Update `getDaysInMonth()` function to use Monday-first week calculation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.3_

- [x] 3. Test calendar day mapping functionality

  - Create test cases to verify clicking each day shows correct modal title
  - Test that calendar header displays days in correct Monday-first order
  - Verify calendar grid alignment matches header labels
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Verify calendar visual layout and functionality
  - Test that first column represents Monday and last column represents Sunday
  - Verify that clicking on each day opens modal with correct day name
  - Check that classes appear on correct days after the mapping fix
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.4_
