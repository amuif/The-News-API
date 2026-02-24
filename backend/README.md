# 📰 News API -- Backend Assessment

A production-ready RESTful API built with **Node.js, TypeScript, Hono,
Prisma, and PostgreSQL**.

This system allows: - Authors to publish and manage articles\
- Readers to consume published content\
- An Analytics Engine to process high-frequency reads into daily reports

------------------------------------------------------------------------

# 🚀 Tech Stack

  Technology              Why It Was Chosen
  ----------------------- ------------------------------------------------
  **Node.js**             Stable, scalable backend runtime
  **TypeScript**          Type safety and maintainability
  **Hono**                Lightweight, fast, modern web framework
  **Prisma**              Type-safe ORM with powerful query capabilities
  **PostgreSQL**          Reliable relational database
  **JWT**                 Stateless authentication
  **bcrypt**              Secure password hashing
  **Zod**                 Centralized request validation
  **node-cron**           Background job processing for analytics

------------------------------------------------------------------------

# 🏗 Architecture Overview

    Client
       ↓
    Hono API
       ↓
    Prisma ORM
       ↓
    PostgreSQL
       ↓
    Daily Analytics Cron Job

------------------------------------------------------------------------

# ⚙️ Local Setup Instructions

## 1️⃣ Clone the Repository

``` bash
git clone git@github.com:amuif/The-News-API.git
cd The-News-API
```

------------------------------------------------------------------------

## 2️⃣ Install Dependencies

``` bash
npm install
```

------------------------------------------------------------------------

## 3️⃣ Create Environment Variables

Create a `.env` file in the root directory:

    DATABASE_URL="postgresql://newsApi_user:12345@localhost:5434/newsApi?schema=public"
    JWT_SECRET="k5kWEySX9RnvNDG5dt6fUDew4DdxDNiPG6xZXdl2GPE="
    NODE_ENV=development

### Environment Variables

  Variable       Description
  -------------- ------------------------------------
  DATABASE_URL   PostgreSQL connection string
  JWT_SECRET     Secret key used to sign JWT tokens
  NODE_ENV       Application environment

------------------------------------------------------------------------

## 4️⃣ Start PostgreSQL (Docker)

``` bash
docker compose up -d
```

------------------------------------------------------------------------

## 5️⃣ Run Database Migrations

``` bash
npx prisma migrate dev
```

------------------------------------------------------------------------

## 6️⃣ Start Development Server

``` bash
npm run dev
```

Server will start at:

    http://localhost:3000

------------------------------------------------------------------------

# 🔐 Authentication

-   Users register via `/auth/signup`
-   Users login via `/auth/login`
-   JWT must be sent in:

```{=html}
<!-- -->
```
    Authorization: Bearer <token>

------------------------------------------------------------------------

# 📊 Analytics Engine

-   Raw reads are stored in `ReadLog`
-   A daily cron job aggregates reads per article (GMT timezone)
-   Results are upserted into `DailyAnalytics`
-   Author dashboard computes `totalViews` from aggregated data

------------------------------------------------------------------------

# 🛡 Security Features

-   Role-Based Access Control (RBAC)
-   Soft-delete enforcement using Prisma `$extends`
-   Centralized request validation with Zod
-   Standardized error responses
-   Non-blocking read tracking
-   Refresh spam protection (30-second deduplication window)

------------------------------------------------------------------------

# 🏁 Final Notes

-   All required user stories have been implemented.
-   Code follows production-ready architecture principles.
-   Repository is public and ready for review.
