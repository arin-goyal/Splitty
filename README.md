# Splitty 💸

Splitty is a modern, minimal, and fully featured expense tracking and bill splitting application (similar to Splitwise), designed to work seamlessly on both Web and Mobile devices. Built as an MVP with a robust Express backend and a responsive Expo (React Native) frontend, it lays down the complete foundation for future AI expense management features.

---

## 🏗️ Architecture & Tech Stack

This project is structured as a monorepo consisting of two primary components:

### 1. Backend (`/backend`)
* **Core**: Node.js, Express, TypeScript
* **Database**: PostgreSQL (relational storage for users, groups, expenses, splits)
* **ORM**: Prisma (type-safe database queries and migrations)
* **Auth**: JWT (secure tokens stored client-side)

### 2. Frontend (`/frontend`)
* **Framework**: React Native + Expo (cross-platform target for Web, iOS, and Android)
* **State Management**: Zustand (reactive, lightweight, persistent stores)
* **HTTP Client**: Axios (configured with authorization headers and 401 interceptors)
* **Navigation**: React Navigation (Bottom tab bar + native stack navigation)

---

## 🌟 Key Features

### 👤 Authentication
* Secure sign up & login.
* JWT auto-login on startup (persisted across sessions).
* Auto-logout on token expiration (intercepted 401 errors).

### 👥 Friend System & Requests ✉️
* Search and add friends by their email ID.
* Interactive real-time Heart Badge on the header for pending incoming requests.
* Actionable Friend Requests panel (Accept / Deny requests).
* Silent background polling optimization to prevent loading state flickers.
* High-fidelity glassmorphic background blur overlays for modal cards.

### 🤖 AI Chat Integration 💬
* Dedicated AI Chat Screen to serve as a platform for future AI expense insights and conversational bill tracking.

### 💳 Personal Expenses
* Create, read, update, and delete personal transactions.
* Full details display showing category badge, merchant, description, date, and tags.
* Quick category filter chips and merchant search bar.
* Filter expenses by date ranges (All time, This Week, This Month).

### 👥 Group Expenses & Split bills
* Create groups with custom emoji icons.
* Invite group members dynamically by searching user email addresses.
* Promote or demote group admins, and remove members.
* Split group expenses **equally** among all members.
* Display real-time aggregated balance sheets (showing who owes whom).
* Settle individual splits directly with a single click.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [PostgreSQL](https://www.postgresql.org/) database running locally or in the cloud.

---

### Step 1: Database & Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment:
   Create a `.env` file in the `backend` folder and add your database URL and JWT secret:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/splitty?schema=public"
   JWT_SECRET="your-super-secret-key"
   ```
4. Run migrations to create tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with initial categories (Food, Shopping, Transport):
   ```bash
   npm run seed
   ```
6. Start the Express development server:
   ```bash
   npm run dev
   ```

---

### Step 2: Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application for the Web:
   ```bash
   npm run web
   ```
This compiles the native views for the web browser and launches the app at **`http://localhost:8081`**.

---

## 📂 Project Structure

```
Splitty/
├── backend/
│   ├── prisma/             # Schema definitions and database seeds
│   └── src/
│       ├── middleware/     # Auth token verification middlewares
│       ├── routes/         # Express API routes (auth, expenses, groups)
│       └── utils/          # Hashing utilities
└── frontend/
    ├── App.tsx             # Root component & session initializer
    └── src/
        ├── components/     # Common visual UI elements
        ├── navigation/     # Tab and stack navigators configuration
        ├── screens/        # Auth, Dashboard, Expenses, Groups, and Details screens
        ├── services/       # Axios API interceptor configurations
        ├── store/          # Zustand global stores (authStore, appStore)
        └── types/          # TypeScript interface contracts for models
```
