# 🌍 EthioTutor - Enterprise EdTech SaaS

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![LiveKit](https://img.shields.io/badge/LiveKit-00FF00?style=for-the-badge)

EthioTutor is a highly scalable, multi-tier SaaS tutoring marketplace designed to revolutionize online education in Ethiopia. Built for high concurrency (1M+ users), the platform seamlessly connects students and tutors through live, interactive WebRTC video classrooms with integrated digital wallets and automated scheduling.

---

## ✨ Core Features

### 🔐 Advanced IAM (Identity & Access Management)
- **Role-Based Access Control (RBAC):** Super Admin, Admin, Moderator, Tutor, and Student roles.
- **Tier-Gating (SaaS Subscriptions):** Users are partitioned by a `tenant_id` (e.g., BASIC, PRO, PREMIUM) which dictates feature access limits.

### 💳 Digital Wallets & Escrow
- ACID-compliant financial ledger.
- Money is securely moved to a `locked_balance` during bookings and automatically released to tutors upon class completion.
- Integration with **Chapa** for Telebirr and CBE transactions.

### 📅 Smart Scheduling Engine
- Atomic transaction booking to prevent overbooking.
- Automated capacity management and status tracking.

### 🎥 Live Interactive Classrooms
- Real-time video and collaborative whiteboards powered by **LiveKit**.
- Auto-generated access tokens strictly tied to valid enrollments.

---

## 🏗️ System Architecture

This project is structured as a **Monorepo** containing decoupled Frontend and Backend applications to ensure independent scaling and deployment.

```text
ethiotutor/
├── nextjs-version/       # Frontend UI (Next.js 14, Shadcn UI, Tailwind CSS)
└── express_backend/      # Backend API (Express.js, Prisma ORM, Domain-Driven Design)
```

---

## 🧠 Tech Stack

**Frontend:** Next.js, React, Tailwind CSS, Shadcn UI, Zustand/Context API  
**Backend:** Node.js, Express.js, TypeScript, Domain-Driven Design (DDD)  
**Database:** MySQL 8.0, Prisma ORM  
**Infrastructure:** Docker, Redis (Caching), Nginx, AWS S3 / DigitalOcean Spaces (Media)

---

## 🗄️ Database Schema

The database is a highly optimized 14-table relational schema using **UUIDv7** for horizontal scalability.

It uses a **Shared Database, Shared Schema** model where all queries are strictly filtered by the `tenant_id` (Subscription Tier).

**Core Domains:**
- Identity → users, roles
- Profiles → tutor_profiles, student_profiles
- Catalog → subjects, grades
- Scheduling → time_slots, bookings, sessions
- Finance → wallets, transactions

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)
- Docker (Optional, recommended)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ethiotutor.git
cd ethiotutor
```

---

### 2. Setup the Backend (Express + Prisma)

```bash
cd express_backend

# Install dependencies
npm install

# Setup Environment Variables
cp .env.example .env
# Edit .env and add your DATABASE_URL

# Generate Prisma Client & Push Schema
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

Backend will run on:
```
http://localhost:4000
```

---

### 3. Setup the Frontend (Next.js)

```bash
cd nextjs-version

# Install dependencies
npm install

# Setup Environment Variables
cp .env.local.example .env.local
# Ensure NEXT_PUBLIC_API_URL is set

# Start the development server
npm run dev
```

Frontend will run on:
```
http://localhost:3000
```

---

## 🔒 Environment Variables Reference

### Backend (`express_backend/.env`)
```env
PORT=4000
DATABASE_URL="mysql://root:password@localhost:3306/ethiotutor"
JWT_SECRET="your_super_secret_key"
CHAPA_SECRET_KEY="CHASECK_TEST-..."
LIVEKIT_API_KEY="..."
LIVEKIT_API_SECRET="..."
```

### Frontend (`nextjs-version/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
```

---

## 📜 License
This project is proprietary and confidential. Unauthorized copying, distribution, or modification of this repository is strictly prohibited.

---
