# Splitty 💸

Splitty is a modern, minimal, and fully featured expense tracking and bill splitting application (similar to Splitwise), designed to work seamlessly on both Web and Mobile devices. Built with a robust Express backend and a polished Expo (React Native) frontend, it features a premium dark-mode UI with glassmorphic modals, fluid animations, and a growing AI integration layer.

---

## 🏗️ Architecture & Tech Stack

This project is structured as a monorepo consisting of two primary components:

### 1. Backend (`/backend`)
* **Core**: Node.js, Express, TypeScript
* **Database**: PostgreSQL (relational storage for users, groups, expenses, splits)
* **ORM**: Prisma (type-safe database queries and migrations)
* **Auth**: JWT (secure tokens stored client-side)
* **Routes**: Auth, Expenses, Groups, Group Expenses, Friends, Budgets

### 2. Frontend (`/frontend`)
* **Framework**: React Native + Expo (cross-platform target for Web, iOS, and Android)
* **State Management**: Zustand (reactive, lightweight, persistent stores)
* **HTTP Client**: Axios (configured with authorization headers and 401 interceptors)
* **Navigation**: React Navigation (custom animated Bottom Tab Bar + native stack)
* **Animations**: React Native `Animated` API (parallax backgrounds, fade-ins, tab transitions)

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
* Dedicated AI Chat Screen as a platform for future AI expense insights and conversational bill tracking.

### 💳 Personal Expenses
* Create, read, update, and delete personal transactions.
* Full details display showing category badge, merchant, description, date, and tags.
* Quick category filter chips and merchant search bar.
* Filter expenses by date ranges (All time, This Week, This Month).
* Expenses list scrolls behind the transparent top header for an immersive layered effect.

### 👥 Group Expenses & Split Bills
* Create groups with custom emoji icons.
* Invite group members dynamically by searching user email addresses.
* Promote or demote group admins, and remove members.
* Split group expenses **equally** among all members.
* Display real-time aggregated balance sheets (showing who owes whom).
* Settle individual splits directly with a single click.

### 🎨 UI & Design System
* **Premium Dark Mode** — custom `#060D10` background with a signature neon-green (`#00EE87`) accent palette.
* **Parallax Background** — animated `BackgroundVector` shifts subtly as the user scrolls, creating depth.
* **Screen Edge Gradients** — fixed top and bottom `LinearGradient` overlays that fade content into the background, making scrollable content appear to slide *behind* the header.
* **Custom Tab Bar** — fully custom animated bottom navigator with a sliding active indicator and haptic feedback.
* **Glassmorphic Modals** — `CreateGroupModal`, `AddFriendModal`, and `FriendRequestsModal` use background blur for a frosted-glass feel.
* **Floating Action Button** — spring-animated `AddExpenseFloatingButton` with a pulsing glow ring.
* **`TabSlider` Component** — reusable animated pill-tab switcher with configurable pill color, used in the `DateTimePickerModal`.
* **`WarningBadge` Component** — contextual inline warning badges.
* **`Button` Component** — reusable styled button with primary/secondary/ghost variants.

### 📅 Date & Time Picker
* Custom `DateTimePickerModal` with a full interactive calendar grid.
* Year navigation arrows to jump between years without scrolling through months.
* Dynamic calendar grid (5 or 6 rows) based on month layout — no wasted whitespace.
* **Google Calendar-style time picker** — smooth scroll drum-roll wheels for hours and minutes (snaps to 5-minute intervals).
* Haptic feedback fires on every hour mark and every 5-minute mark while scrolling the time drum.
* Defaults to the device's current local time on open.

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

4. Or start for iOS/Android via Expo Go:
   ```bash
   npx expo start
   ```

---

## 📂 Project Structure

```
Splitty/
├── backend/
│   ├── prisma/             # Schema definitions and database seeds
│   └── src/
│       ├── middleware/     # Auth token verification middlewares
│       ├── routes/         # Express API routes (auth, expenses, groups, friends, budgets)
│       └── utils/          # Hashing utilities
└── frontend/
    ├── App.tsx             # Root component & session initializer
    └── src/
        ├── components/     # Reusable UI components
        │   ├── dashboard/  # RecentActivity, BalanceSummary, etc.
        │   ├── AddExpenseFloatingButton.tsx
        │   ├── BackgroundVector.tsx
        │   ├── Button.tsx
        │   ├── CreateGroupModal.tsx
        │   ├── CustomTabBar.tsx
        │   ├── DateTimePickerModal.tsx
        │   ├── GlobalModals.tsx
        │   ├── ScreenEdgeGradients.tsx
        │   ├── ScreenWrapper.tsx
        │   ├── TabSlider.tsx
        │   ├── TopHeader.tsx
        │   └── WarningBadge.tsx
        ├── navigation/     # Tab and stack navigators configuration
        ├── screens/        # Auth, Dashboard, Expenses, Groups, Profile, AI Chat, and Detail screens
        ├── services/       # Axios API interceptor configurations
        ├── store/          # Zustand global stores (authStore, appStore, friendStore)
        ├── theme/          # Color palette and design tokens
        └── types/          # TypeScript interface contracts for models
```
