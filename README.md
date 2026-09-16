# ROAM & REV - Premium Motorcycle & Travel E-Commerce Platform

A production-style e-commerce website for motorcycle gear, travel equipment, and specialized accessories for **Yamaha MT-15** and **Bajaj Pulsar NS200**, along with universal touring gear.

Built with **HTML5, Vanilla CSS3, Vanilla ES6 JavaScript, Node.js, Express.js, and MongoDB (with resilient persistent fallback)**.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v16+)
- **NPM** (v8+)
- *(Optional)* **MongoDB** (If MongoDB is running, Mongoose connects automatically. If not installed/running, the backend seamlessly activates the built-in persistent local store with zero configuration required!)

### 2. Install & Start Server
In the `/project` root folder:

```bash
# Install dependencies
npm install

# Start production server
npm start
```

Server runs on: **`http://localhost:5000`**

---

## 🔑 Demo User Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Customer (Rider)** | `rider@roamrev.com` | `rider123` | Cart, Wishlist, Multi-Step Checkout, Profile, Live Shipment Tracking |
| **Store Admin** | `admin@roamrev.com` | `admin123` | KPI Analytics, Products CRUD, Stock Management, Order Status Fulfillment, Coupon Engine |

*Both login screens include 1-click **"Instant Demo Authentication"** buttons for effortless testing.*

---

## 📁 Project Structure

```text
/project
 ├── frontend/
 │   ├── index.html          # Cinematic Hero, Shop by Bike (MT-15/NS200), Categories, Featured
 │   ├── shop.html           # Full catalog with dynamic sidebar filters, search & sorting
 │   ├── product.html        # Multi-angle gallery with hover zoom, specs tables, reviews engine
 │   ├── cart.html           # Shopping cart with coupon codes & free shipping progress
 │   ├── checkout.html       # 5-step checkout (Contact, Shipping, Delivery, UPI/Card/COD, Receipt)
 │   ├── wishlist.html       # Saved items with 1-click move to cart
 │   ├── login.html          # Authentication with demo quick-fill helpers
 │   ├── register.html       # Customer registration with input validation
 │   ├── profile.html        # Customer profile editor & default address management
 │   ├── orders.html         # Historical orders with interactive 5-stage shipment timeline
 │   ├── admin.html          # Admin KPI dashboard, product CRUD modal, and order manager
 │   ├── css/
 │   │   ├── main.css        # Design tokens, dark obsidian theme, 8px grid, typography
 │   │   ├── components.css  # Sticky navbar, product cards, buttons, badges, modals, toasts
 │   │   ├── shop.css        # Sidebar filters, price range slider, product grid
 │   │   ├── product.css     # Gallery magnifier zoom, specs table, reviews layout
 │   │   ├── cart.css        # Cart tables, promo input, order summary sidebar
 │   │   ├── checkout.css    # Step wizard, UPI QR simulation, payment methods
 │   │   ├── account.css     # Profile tabs, order cards, milestone shipment tracker
 │   │   └── admin.css       # KPI metric cards, data tables, CRUD modal styles
 │   └── js/
 │       ├── api.js          # Centralized REST client with automatic JWT header handling
 │       ├── auth.js         # User state management & role authorization
 │       ├── cart.js         # Reactive cart state with guest storage & server sync
 │       ├── wishlist.js     # Reactive wishlist with counter synchronization
 │       ├── ui.js           # Global toast notifications, live search suggestions, card renderer
 │       ├── home.js         # Interactive bike selector switcher (MT-15, NS200, Universal)
 │       ├── shop.js         # Multi-facet filters, sorting, URL parameter syncing, pagination
 │       ├── product.js      # Image switcher, magnifier zoom, tabbed specs, review submissions
 │       ├── checkout.js     # Multi-step checkout wizard, validation, order placement
 │       ├── account.js      # Profile address saving, orders list, milestone timeline tracker
 │       └── admin.js        # KPI analytics loader, product CRUD forms, order status updates
 │
 ├── backend/
 │   ├── server.js           # Express app, static serving, REST routes mounting, auto-seed
 │   ├── config/
 │   │   ├── db.js           # Dual-mode Mongoose & persistent local JSON store manager
 │   │   └── seedData.js     # 24 realistic products with INR pricing, specs, and real images
 │   ├── models/
 │   │   ├── User.js         # User schema with bcrypt password hashing
 │   │   ├── Product.js      # Product schema with bikeCompatibility tags & specs
 │   │   ├── Category.js     # Category definitions with item counting
 │   │   ├── Order.js        # Order model with status history timeline
 │   │   ├── Cart.js         # User cart model
 │   │   ├── Review.js       # Customer ratings & reviews
 │   │   └── Coupon.js       # Promotional discount coupons
 │   ├── routes/             # REST endpoints (/api/auth, /api/products, /api/cart, etc.)
 │   ├── controllers/        # Business logic for all store operations
 │   └── middleware/         # JWT verification, admin authorization, error handling
 ├── package.json
 └── README.md
```

---

## ⚡ Core Highlights & Feature Matrix

### 1. Dedicated "Shop By Bike" Engine
- High-precision compatibility tagging for **Yamaha MT-15** and **Bajaj Pulsar NS200**.
- Certified fitment badges (`✓ MT-15 Fit`, `✓ NS200 Fit`, `Universal Fit`) on product cards, quick views, and detail pages.
- Products with uncertain fitment do NOT falsely claim compatibility.

### 2. Multi-Facet Live Filtering & Search
- Live debounced autocomplete search across product names, categories, brands, tags, and bikes.
- Filters: Bike compatibility, Category, Price Range Slider (₹499 - ₹10,000), Stock availability.
- Dynamic sorting: Recommended, Price Low to High, Price High to Low, Rating, Newest, Discount.
- Active filter pill badges with 1-click removal.

### 3. Interactive Product Details
- Multi-angle thumbnail gallery with high-res hover magnifier zoom.
- Technical specifications table (Material, Dimensions, Weight, Capacity, Warranty, Package contents).
- Customer review engine with verified rider badges and a live review submission form.
- Direct "Buy Now" shortcut straight to checkout.

### 4. Cart & Coupon Engine
- Real-time calculations: Subtotal, Discount, Delivery fee, GST, Grand Total.
- Working promo coupons:
  - `ADVENTURE10`: 10% off on all orders.
  - `REV15`: 15% off on orders above ₹2,499.
  - `FIRST500`: Flat ₹500 discount on orders above ₹2,999.
- Free Express Delivery progress meter.

### 5. Multi-Step Checkout
- 5-step wizard: Contact Info ➔ Shipping Address ➔ Delivery Options ➔ Payment Method ➔ Order Confirmation.
- Simulated payment options:
  - **Instant UPI**: Dynamic QR code simulator + VPA input.
  - **Credit/Debit Card**: Card number formatting with live preview.
  - **Cash on Delivery (COD)**.
- Confirmation screen with unique Order Number and BlueDart Air Cargo Tracking code.

### 6. Order History & Live 5-Stage Shipment Tracker
- Track order milestones: `Confirmed` ➔ `Processing` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`.
- Pulsing active status node with timestamped dispatch notes.

### 7. Full Admin Management Dashboard
- Real-time KPIs: Total Revenue (INR), Total Orders, Active SKUs, Registered Customers.
- Low-stock inventory alert banners.
- Product inventory table with "Add New Product" and "Edit Product" modal dialogs.
- Order management with live status updater dropdown.
- Coupon activation and creation tools.

---

## 📡 REST API Summary

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new customer | Public |
| `POST` | `/api/auth/login` | Login and receive JWT token | Public |
| `GET` | `/api/auth/profile` | Retrieve user profile & addresses | Bearer Token |
| `PUT` | `/api/auth/profile` | Update profile information | Bearer Token |
| `GET` | `/api/products` | Query products (search, filter, sort, page) | Public |
| `GET` | `/api/products/:id` | Get product details, reviews, related items | Public |
| `POST` | `/api/products` | Add new product SKU | Admin |
| `PUT` | `/api/products/:id` | Update product SKU | Admin |
| `DELETE`| `/api/products/:id` | Delete product SKU | Admin |
| `GET` | `/api/categories` | Get categories with product counts | Public |
| `GET` | `/api/cart` | Get user cart items | Bearer Token |
| `POST` | `/api/cart` | Add product to cart | Bearer Token |
| `PUT` | `/api/cart` | Update cart item quantity | Bearer Token |
| `DELETE`| `/api/cart/:productId` | Remove item from cart | Bearer Token |
| `POST` | `/api/orders` | Place new order | Optional Auth |
| `GET` | `/api/orders/myorders` | Retrieve authenticated user's orders | Bearer Token |
| `GET` | `/api/orders/:id` | Retrieve single order by ID or orderNumber | Bearer Token |
| `GET` | `/api/orders` | Retrieve all orders | Admin |
| `PUT` | `/api/orders/:id/status`| Update order fulfillment status | Admin |
| `POST` | `/api/reviews` | Submit product review | Optional Auth |
| `POST` | `/api/coupons/validate` | Validate coupon code against order amount | Public |
| `GET` | `/api/admin/stats` | Retrieve sales analytics & inventory KPIs | Admin |

---

© 2026 ROAM & REV Moto & Overland Outfitters. All rights reserved.
