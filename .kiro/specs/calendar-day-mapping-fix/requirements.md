# Requirements Document

## Introduction

The calendar component has two critical issues with day mapping and display order that affect user experience. Users are experiencing incorrect day labels when clicking on calendar days, and the visual order of days doesn't follow the expected convention. This feature will fix these day mapping and display issues to ensure the calendar functions correctly and follows standard calendar conventions.

## Requirements

### Requirement 1

**User Story:** As an admin user, I want the calendar days to display the correct day names when I click on them, so that I can accurately identify which day I'm viewing classes for.

#### Acceptance Criteria

1. WHEN I click on a Monday cell in the calendar THEN the modal should show "Lunes" as the day name
2. WHEN I click on a Tuesday cell in the calendar THEN the modal should show "Martes" as the day name
3. WHEN I click on a Wednesday cell in the calendar THEN the modal should show "Miércoles" as the day name
4. WHEN I click on a Thursday cell in the calendar THEN the modal should show "Jueves" as the day name
5. WHEN I click on a Friday cell in the calendar THEN the modal should show "Viernes" as the day name
6. WHEN I click on a Saturday cell in the calendar THEN the modal should show "Sábado" as the day name
7. WHEN I click on a Sunday cell in the calendar THEN the modal should show "Domingo" as the day name

### Requirement 2

**User Story:** As an admin user, I want the calendar header to display days in the correct order starting with Monday, so that the calendar follows European/Latin American calendar conventions.

#### Acceptance Criteria

1. WHEN I view the calendar header THEN the days should be displayed in this order: "Lun, Mar, Mié, Jue, Vie, Sáb, Dom"
2. WHEN I view the calendar grid THEN the first column should represent Monday
3. WHEN I view the calendar grid THEN the last column should represent Sunday
4. WHEN I view any week in the calendar THEN the days should align correctly with their respective headers

### Requirement 3

**User Story:** As an admin user, I want the day-of-week mapping to be consistent between the calendar display and the date formatting functions, so that there are no discrepancies in day identification.

#### Acceptance Criteria

1. WHEN the system generates day names for display THEN it should use consistent day-of-week mapping throughout the application
2. WHEN date-fns functions are used THEN they should align with the custom day mapping used in the calendar
3. WHEN the calendar calculates which day of the week a date falls on THEN it should match the visual representation in the grid
4. IF there are conflicts between different day mapping systems THEN the calendar should use a single, consistent mapping approach
