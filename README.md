# Orbit — AI Agent Platform

Orbit is a production-grade, deployable AI agent platform where users create customized AI bots that remember instructions, chat in real-time, connect to tools (Gmail, Slack), and run automated background routines on a recurring schedule with full run history and safety controls.

---

## 🌟 Architecture Diagram

```
+-----------------------------------------------------------------------+
|                            ORBIT FRONTEND                             |
|  Next.js 15 (App Router) + Tailwind CSS + shadcn/ui + TanStack Query |
+-----------------------------------+-----------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|  CLERK AUTHENTICATION |                       | GROQ AI MODEL API     |
|  @clerk/nextjs        |                       | Llama 3.3 70B via     |
|  clerkMiddleware      |                       | Vercel AI SDK         |
+-----------------------+                       +-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
| NEON POSTGRES DB      |                       | COMPOSIO TOOL API     |
| Drizzle ORM Schema    |                       | Gmail & Slack OAuth   |
| Scoped by userId      |                       | Connected Accounts    |
+-----------------------+                       +-----------------------+
            ^                                               ^
            |                                               |
            +-----------------------+-----------------------+
                                    |
                                    v
                        +-----------------------+
                        | INNGEST BACKGROUND    |
                        | Routine Dispatcher    |
                        | Routine Runner        |
                        | Approval Decision Gate|
                        +-----------------------+
```

---

## 🚀 Free-Tier Services & Credentials Setup

Orbit is engineered to run completely on **FREE tiers**. Follow these quick signup steps to acquire your credentials:

### 1. Clerk (Authentication)
* **Signup**: [https://clerk.com](https://clerk.com)
* **Free Plan**: Up to 10,000 monthly active users.
* **Steps**:
  1. Create an application named `Orbit`.
  2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from **API Keys**.

### 2. Groq (AI LLM Provider)
* **Signup**: [https://console.groq.com](https://console.groq.com)
* **Free Plan**: Free fast LLM inference.
* **Steps**:
  1. Navigate to **API Keys** -> **Create API Key**.
  2. Copy key as `GROQ_API_KEY`.

### 3. Composio (Tool Integration Platform)
* **Signup**: [https://app.composio.dev](https://app.composio.dev)
* **Free Plan**: Developer tier for app integrations.
* **Steps**:
  1. Go to **Settings** -> **API Keys**.
  2. Copy key as `COMPOSIO_API_KEY`.

### 4. Neon Postgres (Database)
* **Signup**: [https://neon.tech](https://neon.tech)
* **Free Plan**: 0.5 GiB serverless PostgreSQL.
* **Steps**:
  1. Create a project named `orbit-db`.
  2. Copy the Connection String into `DATABASE_URL`.

### 5. Inngest (Background Jobs & Scheduler)
* **Signup**: [https://www.inngest.com](https://www.inngest.com)
* **Free Plan**: 50,000 runs/month free.
* **Steps**:
  1. Create an app named `Orbit`.
  2. Copy `INNGEST_EVENT_KEY` & `INNGEST_SIGNING_KEY` from settings (or use `local` during dev).

---

## 🛠️ Composio Setup Guide (Gmail & Slack)

To allow agents to access Gmail & Slack on behalf of users:

1. Log into your [Composio Dashboard](https://app.composio.dev).
2. Navigate to **Integrations** -> **Gmail**:
   - Enable **OAuth 2.0 Auth Config**.
   - Set Redirect URI to:
     - Local: `http://localhost:3000/api/connections/callback`
     - Production: `https://<your-vercel-domain>.vercel.app/api/connections/callback`
   - Requested Scopes:
     - Gmail Readonly: `https://www.googleapis.com/auth/gmail.readonly`
     - Gmail Send: `https://www.googleapis.com/auth/gmail.send`
3. Navigate to **Integrations** -> **Slack**:
   - Enable OAuth 2.0 Auth Config.
   - Requested Scopes: `channels:read`, `chat:write`, `channels:history`.

---

## 💻 Local Development Setup

```bash
# 1. Clone & Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Fill in your keys in .env.local

# 4. Generate & Push DB schema
npm run db:push

# 5. Start Inngest local dev server (in a separate terminal)
npx inngest-cli@latest dev

# 6. Start Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view Orbit.

---

## 🚢 Deployment to Vercel

1. Push code to GitHub.
2. Import repository in [Vercel](https://vercel.com).
3. Add environment variables in Vercel settings:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `GROQ_API_KEY`
   - `COMPOSIO_API_KEY`
   - `DATABASE_URL`
   - `INNGEST_EVENT_KEY` & `INNGEST_SIGNING_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy! Sync Inngest by connecting your Vercel deployment URL (`/api/inngest`) in the Inngest Dashboard.
