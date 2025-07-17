# Design Document

## Overview

This design addresses the missing instructor management functionality by implementing complete CRUD operations through API endpoints and enhancing the UI to support direct status toggling and proper deletion workflows. The solution maintains consistency with the existing architecture while adding the missing pieces.

## Architecture

The solution follows the existing layered architecture:

```
UI Layer (React Components)
    ↓
Store Layer (Zustand)
    ↓
API Layer (Next.js Route Handlers)
    ↓
Service Layer (InstructorService)
    ↓
Repository Layer (Data Provider)
```

## Components and Interfaces

### API Endpoints

#### 1. Individual Instructor Operations

- **Route**: `/api/instructors/[id]/route.ts`
- **Methods**:
  - `PUT` - Update instructor
  - `DELETE` - Delete instructor
- **Authentication**: Admin only
- **Validation**: Uses InstructorService validation

#### 2. Status Toggle Endpoint

- **Route**: `/api/instructors/[id]/status/route.ts`
- **Methods**:
  - `PATCH` - Toggle active status
- **Purpose**: Optimized endpoint for quick status changes
- **Response**: Returns updated instructor with new status

### UI Components

#### 1. Status Badge Enhancement

- **Component**: Status badge in instructor table
- **Behavior**: Clickable to toggle status
- **Visual Feedback**: Loading state during API call
- **Error Handling**: Revert on failure with toast notification

#### 2. Delete Confirmation Dialog

- **Component**: Confirmation dialog for deletion
- **Content**: Warning about permanent deletion
- **Actions**: Confirm/Cancel buttons
- **Error Handling**: Show specific error messages (e.g., "has active classes")

#### 3. Edit Modal Enhancement

- **Component**: Existing InstructorForm
- **Behavior**: Proper save/cancel handling
- **Validation**: Client-side and server-side validation
- **Error Handling**: Field-specific error display

### Store Methods Enhancement

#### 1. Status Toggle Method

```typescript
toggleInstructorStatus: (id: string) => Promise<boolean>;
```

#### 2. Delete Method Enhancement

```typescript
deleteInstructorById: (id: string) => Promise<boolean>;
```

#### 3. Update Method Enhancement

```typescript
updateInstructorById: (id: string, data: Partial<Instructor>) =>
  Promise<Instructor | null>;
```

## Data Models

### Instructor Status Update

```typescript
interface InstructorStatusUpdate {
  isActive: boolean;
  updatedAt: string;
}
```

### Delete Validation Response

```typescript
interface DeleteValidationError {
  canDelete: false;
  reason: string;
  associatedClasses?: number;
}
```

## Error Handling

### 1. Status Toggle Errors

- **Network Error**: Show retry option
- **Validation Error**: Display specific message
- **Permission Error**: Redirect to login

### 2. Delete Operation Errors

- **Has Active Classes**: Prevent deletion with informative message
- **Network Error**: Show retry option
- **Not Found**: Remove from UI and show notification

### 3. Update Operation Errors

- **Validation Errors**: Show field-specific messages
- **Duplicate Email**: Highlight email field with error
- **Network Error**: Keep modal open with retry option

## Testing Strategy

### 1. Unit Tests

- **API Endpoints**: Test all CRUD operations
- **Service Methods**: Test validation and business logic
- **Store Methods**: Test state management and API integration

### 2. Integration Tests

- **Status Toggle Flow**: UI → Store → API → Database
- **Delete Flow**: Confirmation → API → UI Update
- **Update Flow**: Form → Validation → API → UI Refresh

### 3. Error Scenario Tests

- **Network Failures**: Test offline behavior
- **Validation Failures**: Test error display
- **Permission Failures**: Test access control

## Implementation Considerations

### 1. Backward Compatibility

- Existing instructor creation/listing functionality remains unchanged
- New endpoints follow existing API patterns
- Store interface maintains existing method signatures

### 2. Performance Optimizations

- Status toggle uses PATCH for minimal data transfer
- Delete confirmation prevents accidental API calls
- UI updates optimistically with rollback on failure

### 3. User Experience

- Immediate visual feedback for all operations
- Clear error messages with actionable guidance
- Consistent loading states across all operations

### 4. Security Considerations

- All endpoints require admin authentication
- Input validation on both client and server
- Soft delete option for instructors with class history

## API Response Formats

### Success Responses

```typescript
// Status toggle
{ success: true, data: { id: string, isActive: boolean } }

// Delete
{ success: true, message: "Instructor deleted successfully" }

// Update
{ success: true, data: Instructor }
```

### Error Responses

```typescript
// Validation error
{ success: false, error: "Validation failed", details: ValidationError[] }

// Cannot delete
{ success: false, error: "Cannot delete instructor with active classes" }

// Not found
{ success: false, error: "Instructor not found" }
```
