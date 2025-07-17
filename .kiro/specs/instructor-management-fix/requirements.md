# Requirements Document

## Introduction

The instructor management system currently has incomplete functionality. Instructors have active/inactive status but users cannot change this status directly from the interface. Additionally, there's a delete button that doesn't work because the corresponding API endpoint doesn't exist. This feature will complete the instructor management CRUD operations and improve the user experience by allowing direct status management.

## Requirements

### Requirement 1

**User Story:** As an admin, I want to toggle instructor status between active and inactive directly from the instructor list, so that I can quickly manage instructor availability without opening the edit modal.

#### Acceptance Criteria

1. WHEN an admin clicks on an instructor's status badge THEN the system SHALL toggle the status between active and inactive
2. WHEN the status is changed THEN the system SHALL immediately update the display to reflect the new status
3. WHEN the status change is successful THEN the system SHALL show a success toast notification
4. WHEN the status change fails THEN the system SHALL show an error toast and revert the display

### Requirement 2

**User Story:** As an admin, I want to delete instructors that are no longer needed, so that I can keep the instructor list clean and organized.

#### Acceptance Criteria

1. WHEN an admin clicks the delete button for an instructor THEN the system SHALL show a confirmation dialog
2. WHEN the admin confirms deletion THEN the system SHALL permanently remove the instructor from the database
3. WHEN deletion is successful THEN the system SHALL refresh the instructor list and show a success toast
4. WHEN deletion fails THEN the system SHALL show an error toast and keep the instructor in the list
5. WHEN an admin cancels the deletion THEN the system SHALL close the dialog without making changes

### Requirement 3

**User Story:** As an admin, I want to update instructor information through the edit modal, so that I can keep instructor details current and accurate.

#### Acceptance Criteria

1. WHEN an admin clicks the edit button THEN the system SHALL open a modal with the instructor's current information
2. WHEN the admin saves changes THEN the system SHALL update the instructor in the database
3. WHEN the update is successful THEN the system SHALL refresh the instructor list and show a success toast
4. WHEN the update fails THEN the system SHALL show an error toast and keep the original data
5. WHEN the admin cancels editing THEN the system SHALL close the modal without saving changes

### Requirement 4

**User Story:** As a system, I need proper API endpoints for instructor management operations, so that the frontend can perform all necessary CRUD operations.

#### Acceptance Criteria

1. WHEN a PUT request is made to `/api/instructors/[id]` THEN the system SHALL update the specified instructor
2. WHEN a DELETE request is made to `/api/instructors/[id]` THEN the system SHALL delete the specified instructor
3. WHEN a PATCH request is made to `/api/instructors/[id]/status` THEN the system SHALL toggle the instructor's active status
4. IF an instructor has associated classes THEN the system SHALL prevent deletion and return an appropriate error
5. WHEN any operation fails THEN the system SHALL return standardized error responses
