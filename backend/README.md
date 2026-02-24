# 📰 The News API — Backend Assessment

A production-ready RESTful API built with **Node.js, TypeScript, Hono, Prisma, and PostgreSQL**.

This system allows:

- Authors to publish and manage content
- Readers to consume articles
- An Analytics Engine to process high-frequency engagement data into daily reports

---

# 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Hono
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** JWT
- **Password Hashing:** bcrypt
- **Background Jobs:** node-cron

---

# 🏗 Architecture Overview
Client
↓
Hono REST API
↓
Prisma ORM
↓
PostgreSQL (Neon)
↓
Analytics Cron Job (Daily Aggregation)

---
