# xshop.ai Admin UI

A modern React + TypeScript admin dashboard for managing the xshop.ai e-commerce platform. Built with the same design system and theme as the customer-ui for consistent user experience.

## Features

- 🔐 **Authentication & Authorization** - Secure admin login with JWT tokens
- 📊 **Dashboard Overview** - Real-time stats and key metrics
- 👥 **User Management** - Manage customers and admin users
- 🛍️ **Product Management** - Create, edit, and manage products
- 📦 **Inventory Control** - Track stock levels and movements
- 🛒 **Order Management** - Process and track customer orders
- ⭐ **Review Moderation** - Approve/reject customer reviews
- 📈 **Analytics & Reports** - Comprehensive business insights
- 🌙 **Dark Mode Support** - Toggle between light and dark themes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Redux Toolkit + Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Routing**: React Router v6
- **Build Tool**: Create React App

## Installation & Setup

### Prerequisites

- Node.js 16+ and npm
- Running backend services (admin-service on port 3010)

### 1. Install Dependencies

```bash
cd admin-ui
npm install
```

### 2. Environment Configuration

Create a `.env` file in the admin-ui root:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ADMIN_API_URL=http://localhost:3010
```

### 3. Start Development Server

```bash
npm start
```

The admin UI will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## Key Features

### Dashboard Statistics

- Real-time metrics display with StatCard components
- Growth indicators with color-coded trends
- Quick action buttons for common tasks
- Recent activity feeds

### Responsive Design

- Mobile-first approach with Tailwind responsive classes
- Collapsible sidebar for mobile devices
- Touch-friendly interface elements
- Adaptive layout grids

### Dark Mode

- System preference detection
- Manual theme toggle
- Persistent theme storage
- Consistent dark variants across all components

### Admin Features

- **Users**: Manage customer and admin accounts
- **Products**: Full CRUD operations for product catalog
- **Inventory**: Track stock levels and movements
- **Orders**: Process and fulfill customer orders
- **Reviews**: Moderate and manage customer reviews
- **Analytics**: Business insights and reporting

## Authentication

The admin UI uses JWT token authentication:

- Login with admin credentials
- Token stored in localStorage
- Protected routes require valid authentication
- Automatic logout on token expiration

## Backend Integration

Connects to these services:

- **Admin Service** (port 3010): Main admin operations
- **Auth Service** (port 3001): Authentication
- **User/Product/Order Services**: Various backend APIs

## Demo Credentials

For testing purposes, use any of these admin accounts:

- **Alex Support**: `alex.support@example.com` / `SupportPass654!`
- **Emma Vendor**: `emma.vendor@example.com` / `VendorPass321!`

## License

This project is part of the xshop.ai platform.
xshop.ai Web UI for admin users
