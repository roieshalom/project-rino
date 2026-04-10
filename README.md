# ספר המתכונים 🫒

A personal Hebrew recipe collection. Share any recipe URL from your phone directly into the app.

---

## Setup (one time)

### 1. Supabase — create the database table

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open the **SQL Editor** and run this:

```sql
create table recipes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  description text,
  image text,
  ingredients jsonb default '[]',
  steps jsonb default '[]',
  time text,
  servings text,
  category text,
  source_url text,
  source_name text,
  raw_text text,
  parse_status text default 'schema'
);
```

3. Go to **Project Settings → API**
4. Copy **Project URL** and **anon public key** — you'll need these next

---

### 2. Vercel — deploy the site

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project** and import this repo
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click **Deploy**

That's it. Vercel auto-deploys on every push to main.

---

### 3. Install on your phone (Android)

1. Open your live site in Chrome
2. Tap the three-dot menu → **Add to Home Screen**
3. Now when you share any recipe URL, your app will appear in the share sheet

> **Note:** The Web Share Target API works on Android Chrome. On iOS it's more limited — sharing works but requires a shortcut workaround.

---

## How sharing works

`Mobile browser → Share → ספר המתכונים → scrapes recipe → saves to DB → shows you the result`

If the site has structured recipe data (most big food sites do), you get full ingredients + steps.
If not, we save the raw page text so you can clean it up later.

---

## Local development

```bash
npm install
cp .env.local.example .env.local
# fill in your Supabase keys
npm run dev
```
