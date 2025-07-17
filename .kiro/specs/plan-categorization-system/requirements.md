# Requirements Document

## Introduction

This feature enhances the user experience by categorizing membership plans into logical groups based on their duration. Currently, users see a long list of plans without clear organization, making it difficult to compare options. The categorization will group plans into "Monthly Plans" (short-term) and "Extended Plans" (long-term) to improve navigation and decision-making in both the authentication flow and plan renewal process.

## Requirements

### Requirement 1

**User Story:** As a new user during registration, I want to see plans organized by duration categories, so that I can easily compare short-term vs long-term options.

#### Acceptance Criteria

1. WHEN viewing plan selection in auth flow THEN plans SHALL be grouped into "Planes Mensuales" and "Planes Extendidos" categories
2. WHEN plans are categorized THEN "Planes Mensuales" SHALL include quincenal (0.5 months) and mensual (1 month) plans
3. WHEN plans are categorized THEN "Planes Extendidos" SHALL include trimestral (3 months), semestral (6 months), and anual (12 months) plans
4. WHEN categories are displayed THEN each category SHALL have a clear visual separator (divider)
5. WHEN categories are displayed THEN each category SHALL have a descriptive header label

### Requirement 2

**User Story:** As an existing user renewing my plan, I want to see plans organized by categories, so that I can quickly find the type of commitment I'm looking for.

#### Acceptance Criteria

1. WHEN viewing plan renewal page THEN plans SHALL be grouped into the same categories as auth flow
2. WHEN renewing a plan THEN the current plan's category SHALL be visually highlighted or indicated
3. WHEN switching between categories THEN the user SHALL be able to easily compare options within each group
4. WHEN selecting a plan THEN the existing renewal functionality SHALL work without changes

### Requirement 3

**User Story:** As an administrator, I want to filter plans by duration categories in the admin panel, so that I can manage plans more efficiently.

#### Acceptance Criteria

1. WHEN viewing admin plans page THEN there SHALL be filter options for "Mensual", "Trimestral", "Semestral", and "Anual"
2. WHEN applying duration filters THEN only plans matching the selected duration range SHALL be displayed
3. WHEN no filter is selected THEN all plans SHALL be visible (current behavior)
4. WHEN creating or editing plans THEN the existing functionality SHALL remain unchanged

### Requirement 4

**User Story:** As a developer, I want the categorization to be maintainable and extensible, so that new duration types can be easily added in the future.

#### Acceptance Criteria

1. WHEN implementing categorization THEN it SHALL be based on the existing `durationInMonths` field
2. WHEN categorizing plans THEN the logic SHALL be centralized in utility functions
3. WHEN adding new duration types THEN only the categorization logic SHALL need updates
4. WHEN categorizing plans THEN existing plan data structure SHALL remain unchanged
5. WHEN implementing categories THEN no breaking changes SHALL be introduced to existing APIs
