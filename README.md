# E-Commerce Backend - Cosmetic Shop

This is the backend repository for the E-Commerce web application for a cosmetic shop. Built using the **MERN Stack (MongoDB, Express, React, Node.js)**, this backend provides RESTful APIs to manage users, products, orders, reviews, and admin functionalities.

## Features

### User Features
- Users can register and log in.
- Users can browse products.
- Customers can create orders containing multiple products.
- Customers can track their order status.
- Customers can post reviews on products.
- Customers can view reviews posted by other users.
- Customers can save multiple addresses and reuse them during checkout.

### Admin Features
- Admins can create and manage products with multiple images.
- Admins can create new admin accounts.
- Admins can manage user accounts (block/unblock users).
- Admins can manage product reviews (hide inappropriate reviews).
- Admins can view all user orders.
- Admins can change order statuses.
- Admins can access customer order history.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens), bcrypt
- **Storage:** Supabase Storage
- **Environment Variables:** dotenv

## Installation

### Prerequisites
- Node.js installed
- MongoDB database setup

### Steps to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/savinduamalka/cosmetics-e-commerce-backend.git
   cd cosmetics-e-commerce-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. The backend will be running at:
   ```
http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create a product (Admin only)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Orders
- `POST /api/orders` - Create an order
- `GET /api/orders/user/:id` - Get user orders
- `GET /api/orders` - Get all orders (Admin only)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Reviews
- `POST /api/reviews` - Add a review
- `GET /api/reviews` - Get all reviews
- `PUT /api/reviews/:id/hide` - Hide review (Admin only)

### User Management
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/block` - Block/unblock user (Admin only)
- `POST /api/admins` - Create new admin (Admin only)

### Address Management
- `POST /api/addresses` - Add a new address
- `GET /api/addresses/user/:id` - Get saved addresses

## License
This project is licensed under the MIT License.

