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
* **Routes**: Auth, Expenses, Groups, Group Expenses, Friends, Budgets, Bugs
* **Integrations**: GitHub API (issues creator), Node DNS resolver

### 2. Frontend (`/frontend`)
* **Framework**: React Native + Expo (cross-platform target for Web, iOS, and Android)
* **State Management**: Zustand (reactive, lightweight, persistent stores)
* **HTTP Client**: Axios (configured with authorization headers and 401 interceptors)
* **Navigation**: React Navigation (custom animated Bottom Tab Bar + native stack)
* **Animations**: React Native `Animated` API (parallax backgrounds, fade-ins, tab transitions)

---

## 🌟 Key Features

### 👤 Authentication & Verification ✉️
* Secure sign up & login.
* **Email Verification (OTP)**: Registration is verified via a 6-digit OTP code.
* **Domain Check (MX Records)**: Performs real-time DNS MX record resolution before sending an OTP to ensure the domain is valid.
* **Password Complexity Rules**: Enforces strict password criteria (8+ characters, uppercase, lowercase, numbers, and special characters) with real-time strength indicators.
* JWT auto-login on startup (persisted across sessions).
* Auto-logout on token expiration (intercepted 401 errors).

### 🎨 Profile Customization
* Secure "Edit Profile" toggle that locks fields until activated.
* Choose a cute preset emoji avatar or upload a custom photo from your device's library (using `expo-image-picker` with compression).
* Custom initials fallback display when no photo is set.

### 👥 Friend System & Requests ✉️
* Search and add friends by their email ID.
* Interactive real-time Heart Badge on the header for pending incoming requests.
* Actionable Friend Requests panel (Accept / Deny requests).
* Silent background polling optimization to prevent loading state flickers.

### 💳 Personal & Group Expenses
* Create, read, update, and delete personal transactions.
* Full details display showing category badge, merchant, description, date, and tags.
* Quick category filter chips and merchant search bar.
* Filter expenses by date ranges (All time, This Week, This Month).
* **Multi-Payer Splits**: Create complex transactions split unequally or equally between group members.
* **Debt Simplification**: Greedy debt consolidation algorithm that simplifies group balances to minimize transaction overhead (e.g. A owes B, B owes C simplifies directly).
* Direct settle up option to clear net simplified balances between members.

### 🎨 UI & Design System
* **Premium Dark Mode** — custom `#060D10` background with a signature neon-green (`#00EE87`) accent palette.
* **Parallax Background** — animated `BackgroundVector` shifts subtly as the user scrolls, creating depth.
* **Screen Edge Gradients** — fixed top and bottom `LinearGradient` overlays that fade content into the background.
* **Custom Tab Bar** — fully custom animated bottom navigator with a sliding active indicator and haptic feedback.
* **Custom Alert Modal** — globally intercepts React Native's native `Alert.alert` calls to display a premium glassmorphic modal mimicking system alerts but with Splitty's custom dark green-accented theme.
* **Floating Action Buttons** — spring-animated `AddExpenseFloatingButton` and `bugBtnFloating` positioned dynamically above the floating bottom navbar using safe area insets.

### 📅 Date & Time Picker
* Custom `DateTimePickerModal` with a full interactive calendar grid.
* Year navigation arrows to jump between years without scrolling through months.
* Dynamic calendar grid (5 or 6 rows) based on month layout.
* **Google Calendar-style Time Picker**: High-fidelity interactive radial clock face dial selector featuring hours/minutes input toggles, concentric 24-hour rings, 5-minute ticks, rotational haptic ticks, and automatic mode switching.

### 🐛 Bug Reporter & GitHub Issues Integration
* Floating "Report Bug" button on the Profile screen.
* Opens a modal where users can enter a Title, multiline Description, and rate severity using a custom **5-Exclamation Criticality Bar** (Green -> Yellow -> Orange -> Red color-coded indicators).
* Automatically posts bug reports as repository issues using the GitHub REST API.
* Fallback to printing formatted report cards directly to the backend terminal if GitHub environment keys are not configured.

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
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/splitty?schema=public"
   JWT_SECRET="your-super-secret-key"
   
   # GitHub Integration (Optional - for creating Bug Issues)
   GITHUB_TOKEN="your_personal_access_token"
   GITHUB_REPO_OWNER="arin-goyal"
   GITHUB_REPO_NAME="Splitty"
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
│       ├── routes/         # Express API routes (auth, expenses, groups, friends, budgets, bugs)
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
        │   ├── CustomAlertModal.tsx
        │   ├── CustomTabBar.tsx
        │   ├── DateTimePickerModal.tsx
        │   ├── GlobalModals.tsx
        │   ├── ReportBugModal.tsx
        │   ├── ScreenEdgeGradients.tsx
        │   ├── ScreenWrapper.tsx
        │   ├── TabSlider.tsx
        │   ├── TopHeader.tsx
        │   └── WarningBadge.tsx
        ├── navigation/     # Tab and stack navigators configuration
        ├── screens/        # Auth, Dashboard, Expenses, Groups, Profile, AI Chat, and Detail screens
        ├── services/       # Axios API interceptor configurations
        ├── store/          # Zustand global stores (authStore, appStore, alertStore)
        ├── theme/          # Color palette and design tokens
        └── types/          # TypeScript interface contracts for models
```
