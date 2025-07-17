# Design Document

## Overview

The Plan Categorization System enhances user experience by organizing membership plans into logical duration-based categories. This design maintains backward compatibility while adding visual organization to improve plan selection in both authentication and renewal flows.

## Architecture

### Core Components

1. **Plan Categorization Logic** (`lib/utils.ts`)

   - Centralized categorization functions
   - Duration-based grouping logic
   - Extensible category definitions

2. **Enhanced UI Components**

   - Updated `PlanSelectionStep` component (auth flow)
   - Updated `RenewPlanPage` component (renewal flow)
   - Enhanced `PlansManager` component (admin filtering)

3. **Category Definitions**
   - **Planes Mensuales**: 0.5 months (quincenal), 1 month (mensual)
   - **Planes Extendidos**: 3 months (trimestral), 6 months (semestral), 12 months (anual)

## Components and Interfaces

### Plan Categorization Utilities

```typescript
// Plan category types
export type PlanCategory = "monthly" | "extended";

export interface PlanCategoryInfo {
  key: PlanCategory;
  label: string;
  description: string;
  durations: number[];
}

// Categorization functions
export function categorizePlan(durationInMonths: number): PlanCategory;
export function getPlanCategories(): PlanCategoryInfo[];
export function groupPlansByCategory(
  plans: MembershipPlan[]
): Record<PlanCategory, MembershipPlan[]>;
```

### Enhanced UI Components

#### Auth Flow - Plan Selection Step

- Group plans by category with visual separators
- Category headers with descriptive labels
- Maintain existing selection functionality

#### Renewal Flow - Plan Selection

- Same categorization as auth flow
- Highlight current plan's category
- Preserve existing renewal logic

#### Admin Panel - Plans Manager

- Add duration-based filters
- Maintain existing CRUD operations
- Optional category display in plan cards

## Data Models

### Existing Plan Structure (No Changes)

```typescript
interface MembershipPlan {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  price: number;
  durationInMonths: number; // Used for categorization
  classLimit: number;
  disciplineAccess: "all" | "limited";
  allowedDisciplines: string[];
  canFreeze: boolean;
  freezeDurationDays: number;
  autoRenews: boolean;
  isActive: boolean;
}
```

### New Category Configuration

```typescript
const PLAN_CATEGORIES: PlanCategoryInfo[] = [
  {
    key: "monthly",
    label: "Planes Mensuales",
    description: "Planes de corto plazo y flexibles",
    durations: [0.5, 1], // quincenal, mensual
  },
  {
    key: "extended",
    label: "Planes Extendidos",
    description: "Planes de largo plazo con mejor valor",
    durations: [3, 6, 12], // trimestral, semestral, anual
  },
];
```

## Error Handling

### Categorization Fallbacks

- Unknown durations default to 'extended' category
- Empty categories are hidden from UI
- Graceful degradation if categorization fails

### UI Error States

- Show all plans ungrouped if categorization fails
- Maintain existing error handling for plan loading
- Log categorization errors for debugging

## Testing Strategy

### Unit Tests

- Plan categorization logic
- Category grouping functions
- Edge cases (empty plans, invalid durations)

### Integration Tests

- Auth flow with categorized plans
- Renewal flow with categorized plans
- Admin filtering functionality

### Visual Tests

- Category headers and separators
- Plan grouping display
- Responsive design on mobile

## Implementation Phases

### Phase 1: Core Categorization Logic

1. Add categorization utilities to `lib/utils.ts`
2. Create category configuration
3. Add unit tests for categorization

### Phase 2: Auth Flow Enhancement

1. Update `PlanSelectionStep` component
2. Add category headers and separators
3. Test auth flow with categorized plans

### Phase 3: Renewal Flow Enhancement

1. Update `RenewPlanPage` component
2. Implement category grouping
3. Test renewal flow functionality

### Phase 4: Admin Panel Enhancement

1. Add duration filters to `PlansManager`
2. Implement filter logic
3. Test admin plan management

### Phase 5: Polish and Testing

1. Visual refinements
2. Comprehensive testing
3. Documentation updates

## Visual Design

### Category Headers

```jsx
<div className="mb-4">
  <h3 className="text-lg font-semibold text-white mb-2">{category.label}</h3>
  <p className="text-sm text-zinc-400 mb-4">{category.description}</p>
</div>
```

### Category Separators

```jsx
<div className="my-6">
  <div className="border-t border-zinc-700"></div>
</div>
```

### Admin Filters

```jsx
<Select value={durationFilter} onValueChange={setDurationFilter}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Filtrar por duración" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todas las duraciones</SelectItem>
    <SelectItem value="monthly">Planes Mensuales</SelectItem>
    <SelectItem value="extended">Planes Extendidos</SelectItem>
  </SelectContent>
</Select>
```

## Performance Considerations

### Categorization Performance

- Categorization logic is O(1) per plan
- Grouping is O(n) where n is number of plans
- Results can be memoized if needed

### UI Performance

- Category grouping happens at render time
- No additional API calls required
- Existing plan loading performance maintained

## Backward Compatibility

### API Compatibility

- No changes to existing API endpoints
- Plan data structure remains unchanged
- Existing plan CRUD operations unaffected

### Component Compatibility

- Existing plan selection logic preserved
- Renewal functionality unchanged
- Admin management features maintained

## Future Extensibility

### New Categories

- Easy to add new categories by updating configuration
- Duration ranges can be modified without code changes
- Category labels and descriptions are configurable

### Advanced Features

- Plan recommendations based on category
- Category-specific pricing displays
- Usage analytics by category

## Migration Strategy

### Zero-Downtime Deployment

- Categorization is purely client-side
- No database migrations required
- Gradual rollout possible with feature flags

### Rollback Plan

- Remove categorization UI components
- Revert to original plan listing
- No data loss or corruption risk
