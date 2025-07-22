# Design Document - Admin Calendar Cancellation Fix

## Overview

This design addresses the broken cancellation functionality in the admin calendar component. The main issues are:

1. **Bulk cancellation button doesn't work** - Button exists but no functionality
2. **Individual cancellation doesn't work** - Cancel buttons don't perform actions
3. **No reactive updates** - UI doesn't refresh after cancellations
4. **Mock data limitations** - System works with mock data, needs to handle this properly

The solution focuses on making cancellations work and ensuring immediate UI updates within the current session.

## Architecture

### Current Problem Analysis

The calendar modal has:

- Non-functional bulk cancel button
- Non-functional individual cancel buttons
- No state management for reactive updates
- Disconnect between cancellation actions and UI state

### Solution Architecture

We need to:

1. **Implement cancellation logic** - Connect buttons to actual cancellation functions
2. **Add state management** - Track cancelled classes and update UI reactively
3. **Handle mock data** - Ensure cancellations work within current session even with mocks
4. **Optimize for admin workflow** - Fast, clear feedback on actions

## Components and Interfaces

### Calendar Modal Component

**File**: `components/admincomponents/calendar.tsx` (modal section)

#### State Management

```typescript
interface CalendarState {
  classes: ClassData[];
  cancelledClasses: Set<string>; // Track cancelled class IDs
  isLoading: boolean;
  error: string | null;
}

// Add to component state
const [cancelledClasses, setCancelledClasses] = useState<Set<string>>(
  new Set()
);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### Cancellation Functions

```typescript
// Bulk cancellation
const handleBulkCancel = async (date: string) => {
  setIsLoading(true);
  setError(null);

  try {
    const classesForDay = classes.filter((c) => c.date === date);
    const classIds = classesForDay.map((c) => c.id);

    // Call API or update mock data
    await cancelClasses(classIds);

    // Update local state immediately
    setCancelledClasses((prev) => {
      const newSet = new Set(prev);
      classIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  } catch (err) {
    setError("Error al cancelar las clases");
  } finally {
    setIsLoading(false);
  }
};

// Individual cancellation
const handleIndividualCancel = async (classId: string) => {
  setIsLoading(true);
  setError(null);

  try {
    await cancelClass(classId);

    // Update local state immediately
    setCancelledClasses((prev) => new Set([...prev, classId]));
  } catch (err) {
    setError("Error al cancelar la clase");
  } finally {
    setIsLoading(false);
  }
};
```

### API Integration

**File**: `app/api/classes/cancel/route.ts` (new endpoint)

```typescript
// POST /api/classes/cancel
interface CancelRequest {
  classIds: string[];
  reason?: string;
}

interface CancelResponse {
  success: boolean;
  cancelledIds: string[];
  errors?: string[];
}
```

### Mock Data Handling

Since the system uses mock data, we need to:

1. **Session-based cancellations** - Track cancelled classes in component state
2. **Filter cancelled classes** - Don't show cancelled classes in UI
3. **Persist during session** - Keep cancellation state while modal is open

```typescript
// Filter out cancelled classes for display
const visibleClasses = classes.filter((c) => !cancelledClasses.has(c.id));

// Update calendar grid to reflect changes
const getClassCountForDay = (date: string) => {
  const dayClasses = classes.filter((c) => c.date === date);
  const activeDayClasses = dayClasses.filter(
    (c) => !cancelledClasses.has(c.id)
  );
  return activeDayClasses.length;
};
```

## Data Models

### Class Cancellation Model

```typescript
interface ClassCancellation {
  classId: string;
  cancelledAt: Date;
  cancelledBy: string; // admin user
  reason?: string;
  type: "individual" | "bulk";
}

interface CancelledClassState {
  id: string;
  originalClass: ClassData;
  cancellation: ClassCancellation;
}
```

### UI State Model

```typescript
interface ModalState {
  isOpen: boolean;
  selectedDate: string | null;
  classes: ClassData[];
  cancelledClasses: Set<string>;
  isLoading: boolean;
  error: string | null;
}
```

## Error Handling

### Cancellation Errors

```typescript
enum CancellationError {
  NETWORK_ERROR = "Error de conexión",
  CLASS_NOT_FOUND = "Clase no encontrada",
  ALREADY_CANCELLED = "La clase ya está cancelada",
  HAS_RESERVATIONS = "La clase tiene reservas activas",
  GENERIC_ERROR = "Error al cancelar la clase",
}
```

### Error Display

- **Toast notifications** for quick feedback
- **Inline errors** in modal for specific issues
- **Retry mechanisms** for network failures
- **Clear error messages** in Spanish

## Testing Strategy

### Unit Tests

1. **Cancellation Functions**

   - Test bulk cancellation logic
   - Test individual cancellation logic
   - Test error handling scenarios

2. **State Management**

   - Test cancelled class tracking
   - Test UI state updates
   - Test filter logic for visible classes

3. **Mock Data Integration**
   - Test session-based cancellations
   - Test state persistence during modal usage

### Integration Tests

1. **Modal Interactions**

   - Test bulk cancel button functionality
   - Test individual cancel buttons
   - Test modal state updates after cancellations

2. **Calendar Updates**
   - Test calendar grid reflects cancellations
   - Test class count updates
   - Test visual feedback for cancelled classes

### User Experience Tests

1. **Reactive Updates**

   - Verify immediate UI updates after cancellation
   - Test loading states during operations
   - Test error message display

2. **Admin Workflow**
   - Test complete cancellation workflow
   - Verify no page refresh needed
   - Test multiple cancellations in sequence

## Implementation Notes

### Priority Order

1. **Fix individual cancellation** - Most common use case
2. **Fix bulk cancellation** - Emergency situations
3. **Add reactive updates** - Improve UX
4. **Add error handling** - Production readiness

### Mock Data Strategy

Since the system uses mock data:

- Track cancellations in component state only
- Don't persist to backend (yet)
- Focus on UI reactivity and user experience
- Prepare for real API integration later

### Performance Considerations

- **Minimal re-renders** - Use Set for cancelled classes tracking
- **Optimistic updates** - Update UI immediately, handle errors separately
- **Efficient filtering** - Cache filtered results when possible

## Dependencies

### External Libraries

- React state management (useState, useEffect)
- Date manipulation (date-fns)
- UI feedback (toast notifications)

### Internal Dependencies

- Calendar component state
- Class data models
- Mock data utilities
- Error handling utilities
