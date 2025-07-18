# Design Document

## Overview

The Admin Banner System will replace the current StaticCarousel component with a dynamic, admin-configurable banner management system. The system consists of three main components: an admin interface for banner management, a data layer for banner storage and state management, and a user-facing carousel component that displays active banners.

The design leverages existing patterns and components from the current system, ensuring consistency and maintainability while providing powerful new functionality for content management.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Interface                          │
├─────────────────────────────────────────────────────────────┤
│  Banner Management Page  │  Banner Modal  │  Banner Card    │
│  - List all banners      │  - Create/Edit │  - Preview      │
│  - Toggle active status  │  - Real-time   │  - Quick actions│
│  - Reorder banners       │    preview     │  - Status toggle│
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│           BlackSheep Store (Zustand)                       │
│  - Banner state management                                  │
│  - CRUD operations                                          │
│  - Persistence layer                                       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 User Interface                              │
├─────────────────────────────────────────────────────────────┤
│              Banner Carousel                               │
│  - Display active banners only                             │
│  - Responsive design                                        │
│  - Touch-friendly navigation                               │
│  - Maintains existing UX                                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Admin Creates/Edits Banner** → Store Updates → User Carousel Reflects Changes
2. **Admin Toggles Status** → Store Updates → Banner Appears/Disappears in Carousel
3. **Admin Reorders** → Store Updates → Carousel Order Changes
4. **User Interacts** → Navigation to Banner URL

## Components and Interfaces

### Data Models

```typescript
interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string; // Lucide icon name
  buttonTitle?: string;
  buttonUrl?: string;
  badge?: boolean;
  badgeText?: string;
  backgroundColor: string; // Tailwind class
  textColor: string;
  subtitleColor?: string;
  buttonColor?: string;
  textButtonColor?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  icon: string;
  buttonTitle: string;
  buttonUrl: string;
  badge: boolean;
  badgeText: string;
  backgroundStyle: string;
  textColor: string;
  subtitleColor: string;
  buttonColor: string;
  textButtonColor: string;
}
```

### Predefined Styles

```typescript
const backgroundStyles = {
  gradient_blue: "bg-gradient-to-r from-blue-500 to-blue-700",
  gradient_green: "bg-gradient-to-r from-green-500 to-green-700",
  gradient_purple: "bg-gradient-to-r from-purple-500 to-purple-700",
  gradient_orange: "bg-gradient-to-r from-orange-500 to-orange-700",
  gradient_red: "bg-gradient-to-r from-red-500 to-red-700",
  solid_dark: "bg-gray-900",
  solid_primary: "bg-primary",
  pattern_dots:
    "bg-gray-900 bg-[radial-gradient(white_1px,transparent_1px)] bg-[size:20px_20px]",
};

const textColors = {
  white: "text-white",
  black: "text-black",
  gray_light: "text-gray-100",
  gray_dark: "text-gray-900",
  primary: "text-primary",
};

const buttonColors = {
  white: "bg-white hover:bg-gray-100",
  primary: "bg-primary hover:bg-primary/90",
  secondary: "bg-secondary hover:bg-secondary/90",
  lime: "bg-lime-500 hover:bg-lime-600",
  transparent: "bg-transparent border border-white hover:bg-white/10",
};
```

### Store Integration

```typescript
interface BlackSheepStore {
  // Existing properties...
  banners: Banner[];

  // Banner management actions
  addBanner: (banner: Omit<Banner, "id" | "createdAt" | "updatedAt">) => void;
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  toggleBanner: (id: string) => void;
  reorderBanners: (banners: Banner[]) => void;
  getActiveBanners: () => Banner[];
}
```

## Components Architecture

### Admin Components

#### 1. Banner Management Page (`app/admin/configuraciones/banners/page.tsx`)

- **Purpose**: Main interface for banner management
- **Features**:
  - List all banners with status indicators
  - Quick toggle active/inactive
  - Create new banner button
  - Drag & drop reordering
  - Delete confirmation
- **Layout**: Card-based layout similar to existing admin pages

#### 2. Banner Modal (`components/admincomponents/banner-modal.tsx`)

- **Purpose**: Create and edit banner interface
- **Features**:
  - Form with all banner properties
  - Real-time preview
  - Style selection dropdowns
  - Icon picker
  - Validation and error handling
- **Design**: Modal dialog using existing UI components

#### 3. Banner Card (`components/admincomponents/banner-card.tsx`)

- **Purpose**: Individual banner display in admin list
- **Features**:
  - Banner preview
  - Quick actions (edit, toggle, delete)
  - Status indicator
  - Drag handle for reordering
- **Design**: Card component with action buttons

#### 4. Banner Manager (`components/admincomponents/banner-manager.tsx`)

- **Purpose**: Container component for banner management logic
- **Features**:
  - State management
  - CRUD operations
  - Drag & drop handling
  - Modal state management

### User-Facing Components

#### 1. Banner Carousel (`components/banner-carousel.tsx`)

- **Purpose**: Replace StaticCarousel with dynamic banner display
- **Features**:
  - Display only active banners
  - Respect admin-defined order
  - Responsive design
  - Touch-friendly scrolling
  - Button click handling
- **Design**: Maintains existing carousel UX

#### 2. Banner Item (`components/banner-item.tsx`)

- **Purpose**: Individual banner rendering
- **Features**:
  - Dynamic styling based on banner config
  - Icon rendering
  - Badge display
  - Button rendering
  - Accessibility features

## Data Models

### Banner Entity

```typescript
interface Banner {
  id: string; // Unique identifier
  title: string; // Main banner text (required)
  subtitle?: string; // Secondary text (optional)
  icon?: string; // Lucide icon name (optional)
  buttonTitle?: string; // CTA button text (optional)
  buttonUrl?: string; // CTA button URL (optional)
  badge?: boolean; // Show badge indicator
  badgeText?: string; // Badge text content
  backgroundColor: string; // Tailwind background class
  textColor: string; // Tailwind text color class
  subtitleColor?: string; // Subtitle color override
  buttonColor?: string; // Button background color
  textButtonColor?: string; // Button text color
  isActive: boolean; // Visibility flag
  order: number; // Display order (0-6)
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last modification timestamp
}
```

### Form Validation Rules

- **Title**: Required, 1-50 characters
- **Subtitle**: Optional, max 100 characters
- **Button URL**: Optional, valid URL format when provided
- **Badge Text**: Optional, max 20 characters
- **Order**: Automatic assignment, 0-6 range
- **Colors**: Must be from predefined options
- **Total Banners**: Maximum 7 banners allowed

## Error Handling

### Validation Errors

- **Client-side**: Real-time validation with immediate feedback
- **Form submission**: Comprehensive validation before save
- **URL validation**: Check valid URL format for button links
- **Character limits**: Enforce text length restrictions

### System Errors

- **Store errors**: Graceful handling of state management failures
- **Network errors**: Retry mechanisms for data persistence
- **Component errors**: Error boundaries to prevent crashes
- **Fallback states**: Default content when banner data unavailable

### User Feedback

- **Success messages**: Confirmation of successful operations
- **Error messages**: Clear, actionable error descriptions
- **Loading states**: Visual feedback during operations
- **Empty states**: Helpful messaging when no banners exist

## Testing Strategy

### Unit Tests

- **Banner CRUD operations**: Test all store methods
- **Form validation**: Test all validation rules
- **Component rendering**: Test banner display logic
- **Style application**: Test dynamic styling

### Integration Tests

- **Admin workflow**: Complete banner creation/editing flow
- **User experience**: Banner display and interaction
- **Store integration**: Data persistence and retrieval
- **Navigation**: Button click handling and routing

### E2E Tests

- **Admin banner management**: Full admin workflow
- **User banner interaction**: Complete user experience
- **Responsive behavior**: Mobile and desktop testing
- **Cross-browser compatibility**: Major browser testing

### Performance Tests

- **Carousel rendering**: Large number of banners
- **Image loading**: Banner background performance
- **State updates**: Store operation performance
- **Memory usage**: Component lifecycle management

## Migration Strategy

### Phase 1: Infrastructure

1. Add Banner interface to types
2. Extend BlackSheep store with banner methods
3. Create initial banner data structure
4. Set up admin navigation

### Phase 2: Admin Interface

1. Create banner management page
2. Implement banner modal
3. Add CRUD functionality
4. Implement drag & drop reordering

### Phase 3: User Interface

1. Create new BannerCarousel component
2. Replace StaticCarousel usage
3. Implement responsive design
4. Add accessibility features

### Phase 4: Data Migration

1. Convert existing staticCarouselSlides to Banner format
2. Set up default banners
3. Remove old StaticCarousel component
4. Clean up unused code

### Backward Compatibility

- Maintain existing carousel UX during transition
- Preserve current styling and behavior
- Gradual rollout with feature flags if needed
- Fallback to static content if banner system fails
