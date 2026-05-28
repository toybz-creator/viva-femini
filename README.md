# VivaFemini Interview Task Submission

This repository is an interview task submission for VivaFemini.

The project is a comprehensive female wellness application designed to track symptoms, manage health logs, and provide data-driven analytics for cycle predictions and wellness insights.

## Project Structure

- `backend/`: NestJS API that handles data persistence, analytics computation, and caching.
- `frontend/`: Next.js 14 (App Router) application providing a modern, responsive user interface.
- `shared/`: Shared TypeScript interfaces and utility logic used by both the frontend and backend.

## System Architecture

This submission follows a decoupled client-server architecture, ensuring scalability and maintainability.

### Frontend (FE)
- **Framework**: Next.js 14+ with App Router.
- **State Management**: 
  - **Tanstack Query (React Query)**: Manages server state, caching, and synchronization.
  - **Zustand**: Handles global UI state.
- **Styling**: Tailwind CSS with **ShadCn UI** components for a consistent, accessible design system.
- **Data Fetching**: Axios-based API client integrated with Tanstack Query hooks.
- **Features**: Responsive mobile-first design, skeletal loading states, and toast notifications.

### Backend (BE)
- **Framework**: NestJS (Node.js) with a modular architecture.
- **Language**: TypeScript.
- **API Documentation**: Integrated Swagger UI available at `/api/docs`.
- **Validation**: Strict DTO validation using `class-validator` and `class-transformer`.
- **Security**: CORS configuration and bearer token authentication support.

### Database (DB)
- **Primary Storage**: **MongoDB** via Mongoose ODM.
- **Data Models**: Includes Schemas for Users, Tracking Logs, Symptoms, Wellness Tips, and Articles.
- **Persistence**: Handles all user-generated tracking data and application content.

### Caching
- **Provider**: **Redis** via `ioredis`.
- **Strategy**: 
  - Caches heavy dashboard aggregates and analytics reports to reduce DB load.
  - Caches seeded static content (articles, tips) for high-performance retrieval.
  - Cache invalidation occurs automatically when relevant tracking logs are updated.

---

## Getting Started Locally

Follow these steps to set up the project on your local machine.

### Prerequisites

- **Node.js**: v18 or higher.
- **npm**: v9 or higher.
- **MongoDB**: A running instance (local or Atlas).
- **Redis**: A running instance (local or cloud).

### 1. Clone the Repository

```bash
git clone <repository-url>
cd viva-femini
```

### 2. Install Dependencies

You can install all dependencies from the root using npm workspaces:

```bash
# Install all dependencies and link shared package
npm install

# Build shared package (Required for FE and BE)
npm run build:shared
```

Alternatively, you can still install dependencies in each project:

```bash
# Build shared package
cd shared && npm install && npm run build
cd ..

# Install Backend dependencies
cd backend && npm install
cd ..

# Install Frontend dependencies
cd frontend && npm install
cd ..
```

### 3. Configure Environment Variables

Create `.env` files in both `backend` and `frontend` directories.

#### Backend (`backend/.env`)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/viva-femini
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_USERNAME=
# REDIS_PASSWORD=
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development
DEFAULT_USER_TOKEN = 'jane-doe-default-auth-token';
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_TOKEN=jane-doe-default-auth-token
```

### 4. Running the Application

For the best experience, start the services in the following order:

1. **Start the Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```
   *The backend will automatically seed initial data if the database is empty.*

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   *The app will be available at [http://localhost:3001](http://localhost:3001) (or the port specified by Next.js).*

---

## Scripts & Tools

- **Backend Docs**: Visit `http://localhost:3000/api/docs` when the backend is running.
- **Testing**:
  - Backend: `cd backend && npm test`
  - Shared: `cd shared && npm test`

