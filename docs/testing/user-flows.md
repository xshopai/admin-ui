# User Flows Documentation — xshopai Admin UI

This document describes all primary and secondary user flows in the admin-ui application. Each flow includes step-by-step user journeys and expected behavior.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Dashboard](#2-dashboard)
3. [User Management](#3-user-management)
4. [Product Management](#4-product-management)
5. [Inventory Management](#5-inventory-management)
6. [Order Management](#6-order-management)
7. [Returns Management](#7-returns-management)
8. [Reviews Management](#8-reviews-management)
9. [Settings](#9-settings)
10. [Navigation & Layout](#10-navigation--layout)
11. [Error Handling](#11-error-handling)

---

## 1. Authentication

### 1.1 Login Flow (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/login` | Login page loads with email and password fields |
| 2 | Enter valid admin email and password | Fields accept input |
| 3 | Click "Sign in" button | Loading spinner appears on button |
| 4 | Wait for authentication | Redirect to `/dashboard` on success |

### 1.2 Invalid Login (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Enter invalid credentials | Fields accept input |
| 2 | Click "Sign in" | Error message displayed: "Invalid email or password" |
| 3 | Remain on login page | URL stays at `/login` |

### 1.3 Logout Flow (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Sign out" button in header | Logout API called |
| 2 | Tokens cleared from localStorage | User redirected to `/login` |

### 1.4 Session Persistence (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Login successfully | Token stored in localStorage |
| 2 | Refresh the page | Token verified via API; user remains on protected page |

---

## 2. Dashboard

### 2.1 View Dashboard (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Login or navigate to `/dashboard` | Dashboard page loads |
| 2 | View Key Business Metrics | Revenue, Orders, Customers cards visible |
| 3 | View Store Overview | Total Products, Avg Rating, Active Users, Completed Orders |
| 4 | View Attention Required | Pending Orders, Low Stock Items, Pending Reviews |
| 5 | View Recent Activity | Recent Orders and Recent Users lists |
| 6 | View Quick Actions | Buttons for Add User, Add Product, Process Orders, Review Management |

### 2.2 Time Range Selection (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click time range dropdown | Options: Last 7 Days, 30 Days, 90 Days, Last Year |
| 2 | Select a range | Dashboard data updates (placeholder) |

### 2.3 Export (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Export" button | Export options displayed |

---

## 3. User Management

### 3.1 View User List (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/users` | Users table loads with all users |
| 2 | View user data | Name, email, role, status columns visible |
| 3 | View stats cards | Total Users, Active Users displayed |

### 3.2 Search Users (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Type in search field | Table filters in real-time by name/email |

### 3.3 Filter Users (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Filters" button | Filter panel expands |
| 2 | Select role or status filter | Table updates to show filtered results |

### 3.4 Add New User (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Add New User" button | Navigate to `/users/add` |
| 2 | Fill in user form | Form accepts input |
| 3 | Submit form | User created, redirect to users list |

### 3.5 Edit User (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click edit button on user row | Navigate to `/users/edit/:id` |
| 2 | Modify user details | Form pre-populated with existing data |
| 3 | Submit changes | User updated, redirect to users list |

---

## 4. Product Management

### 4.1 View Product List (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/products` | Products table loads with all products |
| 2 | View product data | Name, SKU, price, status, stock columns visible |
| 3 | View stats cards | Total Products, Active, With Variants, Filtered counts |

### 4.2 Search Products (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Type in search field | Table filters by product name |

### 4.3 Filter Products (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Filters" button | Filter panel with Category and Status dropdowns |
| 2 | Select filters | Table updates to show matching products |

### 4.4 Add New Product (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Add New Product" button | Navigate to `/products/add` |
| 2 | Fill in product form | Form accepts input for all product fields |
| 3 | Submit form | Product created, redirect to products list |

---

## 5. Inventory Management

### 5.1 View Inventory (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/inventory` | Inventory table loads with stock data |
| 2 | View inventory data | Product name, SKU, stock levels, status columns |
| 3 | View stats | Total Items, Low Stock, Out of Stock counts |

### 5.2 Search Inventory (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Type in search field | Table filters by product name or SKU |

### 5.3 Filter by Status (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Select status from dropdown | Table shows items matching selected status |

### 5.4 Low Stock Only Toggle (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Low Stock Only" button | Table shows only low stock items |

---

## 6. Order Management

### 6.1 View Orders List (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/orders` | Orders table loads with all orders |
| 2 | View order data | Order number, customer, amount, status, payment, date |
| 3 | View stats cards | Total Orders, Revenue, Pending, Processing, etc. |

### 6.2 Search Orders (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Type in search field | Table filters by order number, customer name/email |

### 6.3 Filter Orders (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Filters" button | Filter panel with Order Status and Payment Status |
| 2 | Select filters | Table updates to show matching orders |

### 6.4 View Order Details (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click order number link | Navigate to `/orders/:id` detail page |

---

## 7. Returns Management

### 7.1 View Returns Dashboard (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/returns` | Returns management page loads |
| 2 | View returns table | Return number, order, customer, status, refund amount |
| 3 | View stats cards | Total Returns, Requested, Approved, Refund Processed |

### 7.2 Search Returns (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Type in search field | Table filters by return/order number or customer |

### 7.3 Filter by Status (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Select status from dropdown | Table shows returns with selected status |

---

## 8. Reviews Management

### 8.1 View Reviews List (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/reviews` | Reviews table loads with all reviews |
| 2 | View review data | Rating, title, customer, product, status columns |
| 3 | View stats cards | Total Reviews, Pending, Approved, Average Rating |

### 8.2 Search Reviews (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Type in search field | Table filters by review title/comment/customer |

### 8.3 Filter Reviews (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Filters" button | Filter panel with Status and Rating dropdowns |
| 2 | Select filters | Table updates to show matching reviews |

---

## 9. Settings

### 9.1 View Settings (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/settings` | Settings page loads with all sections |
| 2 | View Profile & Account | Email (disabled) and Role fields visible |
| 3 | View Appearance | Theme toggle button visible |
| 4 | View Notifications | 5 notification toggle switches visible |
| 5 | View About | Version, Build Date, Environment info |

### 9.2 Toggle Theme (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Click "Toggle to Dark/Light Mode" | Theme switches; button text updates |

### 9.3 Save Notification Preferences (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Toggle notification switches | Checkboxes update state |
| 2 | Click "Save Notification Preferences" | Success message: "Settings saved successfully!" |

---

## 10. Navigation & Layout

### 10.1 Sidebar Navigation (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | View desktop sidebar | All navigation links visible: Dashboard, Users, Products, Inventory, Orders, Returns, Reviews, Settings |
| 2 | Click a navigation link | Page navigates to corresponding route |
| 3 | Current page highlighted | Active link has distinct styling |

### 10.2 Header Bar (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | View header | Page title, notification bell, theme toggle, user info visible |
| 2 | View user info | Display name and email shown |
| 3 | Click sign out button | User logged out, redirected to login |

### 10.3 Root Redirect (Secondary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to `/` | Automatically redirected to `/dashboard` |

---

## 11. Error Handling

### 11.1 404 Not Found (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Navigate to unknown route | 404 page displayed with "Page not found" message |
| 2 | View 404 indicator | "404" badge visible |
| 3 | Click "Go to Dashboard" | Redirects to dashboard (or login if not authenticated) |
| 4 | Click "Go Back" | Navigates to previous page |

### 11.2 Protected Routes (Primary)

| Step | Action | Expected Behavior |
|------|--------|-------------------|
| 1 | Access protected route without auth | Redirected to `/login` |
| 2 | Token verification fails | Auth state cleared, redirected to login |
