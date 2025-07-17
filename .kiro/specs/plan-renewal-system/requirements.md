# Requirements Document

## Introduction

This feature implements a comprehensive plan renewal system for students in the fitness application. The system manages three distinct plan states (active, expired, pending) and provides appropriate user experiences for each state. Students must renew their plans when they expire by date or when they consume all available classes/credits, with renewals requiring admin approval through a pending validation process.

## Requirements

### Requirement 1

**User Story:** As a student, I want to be automatically notified when my plan expires or I run out of classes, so that I can renew my plan to continue using the service.

#### Acceptance Criteria

1. WHEN a student's plan end date is reached THEN the system SHALL display the plan as "expired" status
2. WHEN a student's remaining classes reach zero THEN the system SHALL display the plan as "expired" status
3. WHEN a plan is expired THEN the student SHALL see a "Renueva tu plan" message with a renewal button
4. WHEN a plan is expired THEN the student SHALL NOT be able to register for new classes
5. WHEN viewing the calendar with an expired plan THEN the system SHALL display "Pronto podrás reservar clases" instead of class registration options

### Requirement 2

**User Story:** As a student, I want to renew my expired plan through the renewal page, so that I can continue attending classes after admin approval.

#### Acceptance Criteria

1. WHEN a student clicks the renewal button THEN the system SHALL navigate to `/app/renovar-plan`
2. WHEN on the renewal page THEN the student SHALL be able to select a new plan and payment method
3. WHEN a student completes the renewal process THEN the system SHALL set their plan status to "pending"
4. WHEN a renewal is submitted THEN the system SHALL store the renewal request for admin review
5. WHEN a renewal is completed THEN the student SHALL be redirected to the main app with pending status

### Requirement 3

**User Story:** As a student with a pending plan validation, I want to see clear information about my pending status and how to get help, so that I know what to expect and how to contact support if needed.

#### Acceptance Criteria

1. WHEN a student has a pending plan status THEN the plan details section SHALL display "Pendiente validación" badge
2. WHEN a plan is pending THEN the system SHALL show message "Escríbenos para validar tu plan o avisa a tu coach de forma presencial"
3. WHEN a plan is pending THEN the system SHALL provide a contact link for support
4. WHEN viewing calendar with pending plan THEN the system SHALL display "Pronto podrás reservar tus clases"
5. WHEN a plan is pending THEN the student SHALL NOT be able to register for classes

### Requirement 4

**User Story:** As a new student who just registered, I want to understand that my plan needs validation before I can use it, so that I have clear expectations about the approval process.

#### Acceptance Criteria

1. WHEN a new student completes registration THEN their initial plan status SHALL be set to "pending"
2. WHEN a new student views their dashboard THEN they SHALL see the same pending validation messages as renewal users
3. WHEN a new student tries to access the calendar THEN they SHALL see "Pronto podrás reservar tus clases"
4. WHEN a new student has pending status THEN they SHALL see contact information for validation support

### Requirement 5

**User Story:** As a student, I want the system to prevent me from registering for classes when my plan is not active, so that I don't encounter errors or confusion during the registration process.

#### Acceptance Criteria

1. WHEN a student's plan status is "expired" THEN all class registration buttons SHALL be disabled or hidden
2. WHEN a student's plan status is "pending" THEN all class registration buttons SHALL be disabled or hidden
3. WHEN a student tries to register with non-active plan THEN the system SHALL display appropriate status message instead
4. WHEN a student's plan becomes active THEN class registration functionality SHALL be restored
5. WHEN viewing class lists with non-active plan THEN classes SHALL be visible but not actionable

### Requirement 6

**User Story:** As a student, I want to see accurate plan information and remaining classes in my dashboard, so that I can track my usage and plan accordingly.

#### Acceptance Criteria

1. WHEN viewing plan details THEN the system SHALL display current plan status (active/expired/pending)
2. WHEN plan is active THEN the system SHALL show remaining classes count
3. WHEN plan is expired THEN the system SHALL show expiration reason (date expired or classes consumed)
4. WHEN plan is pending THEN the system SHALL show pending validation status and expected timeline
5. WHEN plan information changes THEN the dashboard SHALL update to reflect current status immediately
