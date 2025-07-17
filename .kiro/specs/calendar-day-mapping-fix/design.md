# Design Document - Calendar Day Mapping Fix

## Overview

This design addresses two critical issues specifically in the admin calendar component (`components/admincomponents/calendar.tsx`):

1. **Day offset bug**: Clicking on a day shows the modal for the previous day
2. **Day order**: Calendar should start with Monday instead of Sunday

Note: Other calendar components (`admin/clases` and `app/calendar`) already work correctly and start with Monday, so changes should be isolated to the admin calendar component only.

The root cause is a mismatch between how `date-fns` functions handle week start days and how the admin calendar grid is structured.

## Architecture

### Current Problem Analysis

The calendar currently uses:

- `startOfWeek()` and `endOfWeek()` from date-fns (defaults to Sunday as first day)
- `getDay()` returns 0-6 where 0=Sunday, 6=Saturday
- Calendar grid displays days but has incorrect mapping

### Solution Architecture

We need to:

1. Configure date-fns functions to use Monday as week start
2. Update day name arrays to match Monday-first order
3. Ensure consistent day-of-week calculations throughout

## Components and Interfaces

### Calendar Component Changes

**File**: `components/admincomponents/calendar.tsx`

#### Day Names Array

```typescript
// Current (Sunday first)
const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// New (Monday first)
const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
```

#### Date-fns Configuration

```typescript
import { es } from "date-fns/locale";

// Configure all date-fns functions to use Monday as week start
const weekStartsOn = 1; // Monday = 1, Sunday = 0

// Update functions:
startOfWeek(date, { weekStartsOn: 1 });
endOfWeek(date, { weekStartsOn: 1 });
```

#### Day Mapping Functions

```typescript
// Current day mapping (0=Sunday)
const dayMapping: DayOfWeek[] = [
  "dom",
  "lun",
  "mar",
  "mie",
  "jue",
  "vie",
  "sab",
];

// New day mapping (0=Monday for our grid)
const dayMapping: DayOfWeek[] = [
  "lun",
  "mar",
  "mie",
  "jue",
  "vie",
  "sab",
  "dom",
];
```

### No API Changes Required

Since other calendar components already work correctly, the API (`app/api/classes/by-date/route.ts`) and utility functions (`lib/utils.ts`) should remain unchanged. The issue is isolated to the admin calendar component's configuration of date-fns functions.

## Data Models

### Day Mapping Model

```typescript
type DayOfWeek = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

interface DayMapping {
  index: number; // 0-6, where 0=Monday
  shortName: string; // "Lun", "Mar", etc.
  fullName: string; // "Lunes", "Martes", etc.
  dayOfWeek: DayOfWeek; // "lun", "mar", etc.
}
```

### Calendar Grid Model

```typescript
interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  dayOfWeekIndex: number; // 0-6 where 0=Monday
}
```

## Error Handling

### Day Mapping Validation

- Validate that day indices are within 0-6 range
- Ensure day name arrays have exactly 7 elements
- Add fallback for invalid day calculations

### Date Boundary Handling

- Handle month transitions correctly with Monday-first weeks
- Ensure proper date calculations across different timezones
- Validate date string formats before processing

## Testing Strategy

### Unit Tests

1. **Day Mapping Tests**

   - Test `getDayOfWeekMondayFirst()` function
   - Verify day name array indices match expected days
   - Test date-fns configuration with `weekStartsOn: 1`

2. **Calendar Grid Tests**

   - Test that first column represents Monday
   - Test that last column represents Sunday
   - Verify correct day-date alignment

3. **API Tests**
   - Test class generation uses correct day mapping
   - Verify generated classes appear on correct calendar days

### Integration Tests

1. **Calendar Click Tests**

   - Click Monday → Modal shows "Lunes"
   - Click Tuesday → Modal shows "Martes"
   - Continue for all days of week

2. **Cross-Component Tests**
   - Verify calendar display matches API day calculations
   - Test date formatting consistency across components

### Visual Tests

1. **Calendar Header**

   - Verify order: "Lun, Mar, Mié, Jue, Vie, Sáb, Dom"
   - Check alignment with calendar grid

2. **Modal Display**
   - Test modal titles show correct day names
   - Verify date formatting in modal content

## Implementation Notes

### Migration Strategy

1. Update utility functions first
2. Update API day mapping
3. Update calendar component
4. Test thoroughly before deployment

### Backward Compatibility

- Existing class data should work without changes
- Date strings remain in YYYY-MM-DD format
- API responses maintain same structure

### Performance Considerations

- Day mapping calculations are O(1) operations
- No significant performance impact expected
- Calendar rendering performance should remain the same

## Dependencies

### External Libraries

- `date-fns`: Configure with `weekStartsOn: 1`
- `date-fns/locale/es`: Spanish locale for date formatting

### Internal Dependencies

- `lib/utils.ts`: Date utility functions
- `lib/types.ts`: Type definitions for DayOfWeek
- Calendar component and related UI components
