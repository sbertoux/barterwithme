# BarterWithMe

**Trade what you have. Get what you need.**

[barterwithme.org](https://barterwithme.org) — a privacy-first, community-owned barter marketplace. Trade goods and services directly with people in your community. No money, no middlemen, no surveillance.

- No ads, no data sales, no investors
- Your zip code is converted to a region and never stored
- All communication stays in-app until you choose to share contact info
- Open source — anyone can run their own instance

---

## Tech stack

| Layer    | Tool                                      |
|----------|-------------------------------------------|
| Frontend | [Next.js 15](https://nextjs.org) (App Router, TypeScript) |
| Database | [Supabase](https://supabase.com) (Postgres + Auth + Storage + RLS) |
| Hosting  | [Vercel](https://vercel.com)              |
| Email    | [Resend](https://resend.com)              |
| Styles   | [Tailwind CSS v4](https://tailwindcss.com) |

---

## Self-hosting

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (or any Node.js host)
- A [Resend](https://resend.com) account (optional — for email notifications)

### 1. Clone and install

```bash
git clone https://github.com/sbertoux/barterwithme.git
cd barterwithme
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your_key          # optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run database migrations

In the Supabase SQL editor, run each file in `supabase/migrations/` in order (001, 002, … 015).

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

```bash
npx vercel deploy
```

Add the same environment variables in your Vercel project settings under **Settings → Environment Variables**.

---

## License

MIT — use it, fork it, run your own community.
