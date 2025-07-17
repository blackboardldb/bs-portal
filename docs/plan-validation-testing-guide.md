# Plan Status Validation Testing Guide

## Overview

This guide explains how the plan status validation works and how to test different scenarios.

## Plan Status Logic Priority

The `getPlanStatus` function follows this priority order:

1. **No membership** → `expired`
2. **Pending renewal** → `pending`
3. **Explicit pending status** → `pending`
4. **Automatic expiration conditions** → `expired` (HIGHEST PRIORITY)
   - Date has passed
   - No classes remaining
5. **Admin explicit expired status** → `expired` (only if not automatically expired)
6. **Default** → `active`

## Testing Scenarios

### Scenario 1: Normal Active Plan

```javascript
const user = {
  membership: {
    status: "active",
    currentPeriodEnd: "2025-12-31", // Future date
    centerStats: {
      currentMonth: {
        remainingClasses: 5, // Has classes
      },
    },
  },
};
// Result: "active" ✅
```

### Scenario 2: Classes Consumed (Automatic Expiration)

```javascript
const user = {
  membership: {
    status: "active", // Admin hasn't changed it
    currentPeriodEnd: "2025-12-31", // Future date
    centerStats: {
      currentMonth: {
        remainingClasses: 0, // ❌ No classes left
      },
    },
  },
};
// Result: "expired" ✅ (automatic expiration takes priority)
```

### Scenario 3: Admin Manual Expiration

```javascript
const user = {
  membership: {
    status: "expired", // ❌ Admin marked as expired
    currentPeriodEnd: "2025-12-31", // Future date
    centerStats: {
      currentMonth: {
        remainingClasses: 5, // Still has classes
      },
    },
  },
};
// Result: "expired" ✅ (admin override respected)
```

### Scenario 4: Admin Override Prevention

```javascript
const user = {
  membership: {
    status: "active", // Admin tries to keep active
    currentPeriodEnd: "2025-01-10", // ❌ Date passed
    centerStats: {
      currentMonth: {
        remainingClasses: 5, // Has classes but date expired
      },
    },
  },
};
// Result: "expired" ✅ (automatic expiration prevents admin error)
```

## Benefits of This Logic

### 1. **Prevents Admin Errors**

- Admins can't accidentally mark expired plans as active
- System automatically detects real expiration conditions

### 2. **Respects Admin Decisions**

- Admins can expire plans early for business reasons
- Manual expiration is respected when not conflicting with reality

### 3. **Consistent User Experience**

- Users can't register for classes when truly expired
- Clear messaging about expiration reasons

### 4. **Automatic State Management**

- Plans expire automatically when conditions are met
- No manual intervention needed for normal expiration

## Testing Commands

```bash
# Run plan status tests
npm test -- __tests__/utils/plan-status.test.ts

# Run integration tests
npm test -- __tests__/integration/plan-categorization-integration.test.ts
```

## Mock Data Testing

To test different scenarios, modify the user's membership in `lib/mock-data.ts`:

```javascript
// Test expired by admin
export const antoniaOvejeroProfile = {
  // ...
  membership: {
    status: "expired", // Admin marked as expired
    currentPeriodEnd: "2025-12-31", // Future date
    centerStats: {
      currentMonth: {
        remainingClasses: 5, // Still has classes
      },
    },
  },
};

// Test expired by classes
export const antoniaOvejeroProfile = {
  // ...
  membership: {
    status: "active", // Normal status
    currentPeriodEnd: "2025-12-31", // Future date
    centerStats: {
      currentMonth: {
        remainingClasses: 0, // No classes left
      },
    },
  },
};
```

## Expected Behaviors

### When Plan is Expired (any reason):

- ❌ Cannot register for classes
- ✅ Shows "Plan expirado" banner in calendar
- ✅ Shows "Renovar" button in home
- ✅ Redirects to renewal flow

### When Plan is Pending:

- ❌ Cannot register for classes
- ✅ Shows "Plan pendiente de validación" banner
- ✅ Shows WhatsApp contact button

### When Plan is Active:

- ✅ Can register for classes
- ✅ Shows progress bar and stats
- ✅ Shows "Gestionar clases" button
