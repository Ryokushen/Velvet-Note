---
tags:
  - project
type: plan
status: approved
date: 2026-04-20
---

# Fragrance App - Phase 1 Implementation Plan

Index: [[Fragrance App Index]]

> **Status (2026-04-23):** Tasks 1–21, 24, 25 shipped. Tasks 22 (Apple Sign In) and 23 (Google Sign In) deferred to Phase 4. Task 26 (manual smoke test + dogfood) pending.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship a working mobile app for personal fragrance collection management — Expo + Supabase, online-only, minimal schema (brand/name/concentration/accords/rating), auth via email/password + Apple + Google, 4 screens.

**Architecture:** Expo Router (file-based routing) on React Native, TypeScript throughout. Supabase Postgres with RLS for per-user data isolation. Direct Supabase JS client + React Query for reads/mutations. No offline sync in Phase 1.

**Tech Stack:** Expo SDK (latest), Expo Router, React Native, TypeScript, Supabase JS client v2, `@tanstack/react-query`, `@react-native-async-storage/async-storage` (auth persistence), `expo-apple-authentication`, `@react-native-google-signin/google-signin`, Jest + `@testing-library/react-native`.

**Repo location:** `~/Artificial/Obsidian/Fragrance App/`

---

## File Structure (end state of Phase 1)

```
Fragrance App/
├── .gitignore
├── .env.example
├── .env.local                          # gitignored
├── app.json
├── package.json
├── tsconfig.json
├── jest.config.js
├── babel.config.js
├── app/
│   ├── _layout.tsx                     # Root layout, QueryClient, auth gate
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── sign-in.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                   # Collection list (home)
│   │   └── add.tsx                     # Add fragrance
│   └── fragrance/
│       └── [id].tsx                    # Detail / edit / delete
├── lib/
│   ├── supabase.ts                     # Supabase client
│   ├── fragrances.ts                   # Data service
│   ├── filters.ts                      # Search + sort utilities
│   └── auth.ts                         # Auth helpers (Apple, Google)
├── hooks/
│   ├── useAuth.ts
│   └── useFragrances.ts
├── components/
│   ├── FragranceRow.tsx
│   ├── RatingSlider.tsx
│   ├── AccordChips.tsx
│   ├── ConcentrationPicker.tsx
│   └── EmptyState.tsx
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── types/
│   └── fragrance.ts
├── __tests__/
│   ├── filters.test.ts
│   └── fragrances.test.ts
├── supabase/
│   └── migrations/
│       └── 20260420000000_fragrances.sql
└── docs/
    └── manual-smoke-tests.md
```

---

## Task 1: Create the repo and scaffold an Expo app

**Files:**
- Create: `~/Artificial/Obsidian/Fragrance App/` (directory)
- Create: All Expo scaffold files (`app.json`, `package.json`, `App.tsx`, etc.)

- [x] **Step 1: Create the parent directory and scaffold with `create-expo-app`**

Run:
```bash
cd ~/Artificial/Obsidian
npx create-expo-app@latest "Fragrance App" --template default
cd "Fragrance App"
```

Expected: Installs an Expo project with `app/`, `package.json`, TypeScript, Expo Router preconfigured. Takes 1–3 minutes.

- [x] **Step 2: Initialize git and make the initial commit**

Run:
```bash
cd ~/Artificial/Obsidian/Fragrance\ App
git init
git add -A
git commit -m "chore: initial Expo scaffold"
```

Expected: `initial Expo scaffold` commit on `main`.

- [x] **Step 3: Verify the app runs**

Run:
```bash
npx expo start
```

Expected: Metro bundler starts, prints a QR code. Scan with Expo Go on your phone (or press `i` for iOS sim / `a` for Android emulator). The default welcome screen should render. Press `Ctrl+C` to stop.

- [x] **Step 4: Clean the scaffold's example screens**

Delete the boilerplate Expo pages that came with the template so we start from a known blank slate.

Run:
```bash
rm -rf app/(tabs)
rm -f app/+not-found.tsx app/modal.tsx
```

Replace `app/_layout.tsx` with a minimal shell:

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Create a temporary index so the app still boots:

```typescript
// app/index.tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Fragrance App</Text>
    </View>
  );
}
```

- [x] **Step 5: Verify the cleaned app still runs, then commit**

Run:
```bash
npx expo start --clear
```

Expected: App boots, shows "Fragrance App" centered. Stop it.

Run:
```bash
git add -A
git commit -m "chore: strip boilerplate screens"
```

---

## Task 2: Install core dependencies

**Files:** `package.json`

- [x] **Step 1: Install Supabase, React Query, and auth persistence**

Run:
```bash
cd ~/Artificial/Obsidian/Fragrance\ App
npx expo install @supabase/supabase-js @tanstack/react-query @react-native-async-storage/async-storage react-native-url-polyfill
```

Expected: All four packages resolve to Expo-compatible versions and install.

- [x] **Step 2: Install testing dependencies**

Run:
```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

- [x] **Step 3: Commit**

Run:
```bash
git add package.json package-lock.json
git commit -m "chore: install Supabase, React Query, testing deps"
```

---

## Task 3: Configure Jest

**Files:**
- Create: `jest.config.js`
- Modify: `package.json` (add test script)

- [x] **Step 1: Write `jest.config.js`**

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
```

- [x] **Step 2: Add a `test` script to `package.json`**

Edit `package.json` and add to the `scripts` block:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [x] **Step 3: Write a smoke test to confirm Jest runs**

Create `__tests__/smoke.test.ts`:

```typescript
describe('jest', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [x] **Step 4: Run the smoke test**

Run:
```bash
npm test
```

Expected: `PASS __tests__/smoke.test.ts` — 1 test passed.

- [x] **Step 5: Commit**

Run:
```bash
git add jest.config.js package.json package-lock.json __tests__/
git commit -m "test: configure Jest with jest-expo preset"
```

---

## Task 4: Create the Supabase project (manual)

**You do this step in a browser. No code.**

- [x] **Step 1: Create a Supabase project**

1. Go to `https://supabase.com` and sign in.
2. Click "New project".
3. Name: `fragrance-app`. Region: closest to you. Set a strong database password and save it in your password manager.
4. Wait ~1 minute for provisioning.

- [x] **Step 2: Copy the project URL and anon key**

In the Supabase dashboard for the new project:
1. Click **Project Settings** → **API**.
2. Copy the **Project URL** (e.g., `https://xxxxxxx.supabase.co`).
3. Copy the **anon public** key (starts with `eyJ…`).

Hold these values. You'll paste them into `.env.local` in the next task.

- [x] **Step 3: Enable email auth**

In the dashboard:
1. **Authentication** → **Providers** → **Email** → toggle ON.
2. For Phase 1, disable "Confirm email" (Authentication → Providers → Email → "Confirm email" OFF). This lets you sign up and sign in without a confirmation email while developing. Re-enable before publishing.

---

## Task 5: Wire up environment variables

**Files:**
- Create: `.env.example`
- Create: `.env.local`
- Modify: `.gitignore`

- [x] **Step 1: Append `.env.local` to `.gitignore`**

Open `.gitignore` and add at the bottom:

```
# Local env
.env.local
```

- [x] **Step 2: Write `.env.example`**

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- [x] **Step 3: Write `.env.local` with your real values**

Replace with what you copied in Task 4, Step 2:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- [x] **Step 4: Commit the example, verify local is ignored**

Run:
```bash
git status
```

Expected: `.env.example` is tracked (new file), `.env.local` is NOT listed (ignored).

Run:
```bash
git add .gitignore .env.example
git commit -m "chore: add env var template"
```

---

## Task 6: Apply the database migration

**Files:**
- Create: `supabase/migrations/20260420000000_fragrances.sql`

- [x] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260420000000_fragrances.sql

create table fragrances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  brand         text not null,
  name          text not null,
  concentration text check (concentration in ('EDT','EDP','Parfum','Cologne','Other')),
  accords       text[] not null default '{}',
  rating        numeric check (rating >= 0 and rating <= 10),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index fragrances_user_id_idx on fragrances(user_id);
create index fragrances_user_rating_idx on fragrances(user_id, rating desc);

alter table fragrances enable row level security;

create policy "fragrances_owner_select" on fragrances
  for select using (auth.uid() = user_id);
create policy "fragrances_owner_insert" on fragrances
  for insert with check (auth.uid() = user_id);
create policy "fragrances_owner_update" on fragrances
  for update using (auth.uid() = user_id);
create policy "fragrances_owner_delete" on fragrances
  for delete using (auth.uid() = user_id);

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger fragrances_set_updated_at
  before update on fragrances
  for each row execute function set_updated_at();
```

- [x] **Step 2: Apply the migration through the Supabase SQL editor**

1. Open your project in the Supabase dashboard.
2. Click **SQL Editor** → **New query**.
3. Paste the entire SQL above.
4. Click **Run** (or press `Cmd+Enter`).
5. Expected: "Success. No rows returned." Switch to **Table Editor** and confirm the `fragrances` table exists.

- [x] **Step 3: Verify RLS by trying to select as anon**

In the SQL Editor, run:

```sql
select * from fragrances;
```

Expected: Empty result (no rows yet). The important part: no error. RLS is on but the policies apply to authenticated users only.

- [x] **Step 4: Commit the migration file**

Run:
```bash
git add supabase/
git commit -m "feat(db): fragrances table with RLS and updated_at trigger"
```

---

## Task 7: Build the Supabase client wrapper

**Files:**
- Create: `lib/supabase.ts`

- [x] **Step 1: Write the client**

```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Check .env.local and restart the Metro bundler.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [x] **Step 2: Commit**

Run:
```bash
git add lib/supabase.ts
git commit -m "feat: Supabase client with AsyncStorage session persistence"
```

---

## Task 8: Define the fragrance type

**Files:**
- Create: `types/fragrance.ts`

- [x] **Step 1: Write the types**

```typescript
// types/fragrance.ts
export type Concentration = 'EDT' | 'EDP' | 'Parfum' | 'Cologne' | 'Other';

export const CONCENTRATIONS: Concentration[] = [
  'EDT',
  'EDP',
  'Parfum',
  'Cologne',
  'Other',
];

export interface Fragrance {
  id: string;
  user_id: string;
  brand: string;
  name: string;
  concentration: Concentration | null;
  accords: string[];
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export type NewFragrance = {
  brand: string;
  name: string;
  concentration: Concentration | null;
  accords: string[];
  rating: number | null;
};

export type FragranceUpdate = Partial<NewFragrance>;
```

- [x] **Step 2: Commit**

Run:
```bash
git add types/fragrance.ts
git commit -m "feat: fragrance TypeScript types"
```

---

## Task 9: Filter & sort utilities (TDD)

**Files:**
- Create: `lib/filters.ts`
- Create: `__tests__/filters.test.ts`

- [x] **Step 1: Write failing tests**

```typescript
// __tests__/filters.test.ts
import { filterFragrances, sortFragrances } from '../lib/filters';
import type { Fragrance } from '../types/fragrance';

const frag = (over: Partial<Fragrance> = {}): Fragrance => ({
  id: 'x',
  user_id: 'u',
  brand: 'Chanel',
  name: 'Bleu',
  concentration: 'EDP',
  accords: ['woody', 'citrus'],
  rating: 8,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

describe('filterFragrances', () => {
  it('returns all entries when query is empty', () => {
    const list = [frag(), frag({ id: 'y', brand: 'Dior' })];
    expect(filterFragrances(list, '')).toHaveLength(2);
  });

  it('matches brand case-insensitively', () => {
    const list = [frag({ brand: 'Chanel' }), frag({ id: 'y', brand: 'Dior' })];
    expect(filterFragrances(list, 'chan')).toHaveLength(1);
  });

  it('matches name', () => {
    const list = [frag({ name: 'Bleu' }), frag({ id: 'y', name: 'Sauvage' })];
    expect(filterFragrances(list, 'sauv')).toHaveLength(1);
  });

  it('matches accords', () => {
    const list = [
      frag({ accords: ['woody'] }),
      frag({ id: 'y', accords: ['floral'] }),
    ];
    expect(filterFragrances(list, 'floral')).toHaveLength(1);
  });
});

describe('sortFragrances', () => {
  it('sorts by rating descending, nulls last', () => {
    const list = [
      frag({ id: 'a', rating: 5 }),
      frag({ id: 'b', rating: 9 }),
      frag({ id: 'c', rating: null }),
    ];
    const sorted = sortFragrances(list, 'rating');
    expect(sorted.map((f) => f.id)).toEqual(['b', 'a', 'c']);
  });

  it('sorts by created_at descending (recent first)', () => {
    const list = [
      frag({ id: 'a', created_at: '2026-01-01T00:00:00Z' }),
      frag({ id: 'b', created_at: '2026-03-01T00:00:00Z' }),
    ];
    const sorted = sortFragrances(list, 'recent');
    expect(sorted.map((f) => f.id)).toEqual(['b', 'a']);
  });
});
```

- [x] **Step 2: Run the tests and confirm they fail**

Run:
```bash
npm test __tests__/filters.test.ts
```

Expected: FAIL — `Cannot find module '../lib/filters'`.

- [x] **Step 3: Implement `lib/filters.ts`**

```typescript
// lib/filters.ts
import type { Fragrance } from '../types/fragrance';

export type SortMode = 'rating' | 'recent';

export function filterFragrances(list: Fragrance[], query: string): Fragrance[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((f) => {
    if (f.brand.toLowerCase().includes(q)) return true;
    if (f.name.toLowerCase().includes(q)) return true;
    if (f.accords.some((a) => a.toLowerCase().includes(q))) return true;
    return false;
  });
}

export function sortFragrances(list: Fragrance[], mode: SortMode): Fragrance[] {
  const copy = [...list];
  if (mode === 'rating') {
    copy.sort((a, b) => {
      if (a.rating == null && b.rating == null) return 0;
      if (a.rating == null) return 1;
      if (b.rating == null) return -1;
      return b.rating - a.rating;
    });
  } else {
    copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return copy;
}
```

- [x] **Step 4: Run tests — they should pass**

Run:
```bash
npm test __tests__/filters.test.ts
```

Expected: PASS — 6 tests green.

- [x] **Step 5: Commit**

```bash
git add lib/filters.ts __tests__/filters.test.ts
git commit -m "feat: filter and sort utilities (tested)"
```

---

## Task 10: Fragrances data service (TDD, mocked client)

**Files:**
- Create: `lib/fragrances.ts`
- Create: `__tests__/fragrances.test.ts`

- [x] **Step 1: Write failing tests against a mocked Supabase client**

```typescript
// __tests__/fragrances.test.ts
import {
  listFragrances,
  createFragrance,
  updateFragrance,
  deleteFragrance,
} from '../lib/fragrances';

jest.mock('../lib/supabase', () => {
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(),
    then: undefined,
  };
  return {
    supabase: {
      from: jest.fn(() => builder),
      __builder: builder,
    },
  };
});

const { supabase } = require('../lib/supabase');
const builder = (supabase as any).__builder;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listFragrances', () => {
  it('selects all columns and orders by created_at desc', async () => {
    builder.order.mockResolvedValueOnce({ data: [], error: null });
    const result = await listFragrances();
    expect(supabase.from).toHaveBeenCalledWith('fragrances');
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual([]);
  });

  it('throws on Supabase error', async () => {
    builder.order.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    await expect(listFragrances()).rejects.toThrow('boom');
  });
});

describe('createFragrance', () => {
  it('inserts and returns the new row', async () => {
    const row = {
      id: 'new',
      user_id: 'u',
      brand: 'Chanel',
      name: 'Bleu',
      concentration: 'EDP',
      accords: [],
      rating: 8,
      created_at: '2026-04-20T00:00:00Z',
      updated_at: '2026-04-20T00:00:00Z',
    };
    builder.single.mockResolvedValueOnce({ data: row, error: null });
    const result = await createFragrance({
      brand: 'Chanel',
      name: 'Bleu',
      concentration: 'EDP',
      accords: [],
      rating: 8,
    });
    expect(builder.insert).toHaveBeenCalled();
    expect(result).toEqual(row);
  });
});

describe('updateFragrance', () => {
  it('updates by id and returns the row', async () => {
    const row = { id: 'x', rating: 9 };
    builder.single.mockResolvedValueOnce({ data: row, error: null });
    const result = await updateFragrance('x', { rating: 9 });
    expect(builder.update).toHaveBeenCalledWith({ rating: 9 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'x');
    expect(result).toEqual(row);
  });
});

describe('deleteFragrance', () => {
  it('deletes by id', async () => {
    builder.eq.mockResolvedValueOnce({ error: null });
    await deleteFragrance('x');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'x');
  });
});
```

- [x] **Step 2: Run — expect failure**

Run:
```bash
npm test __tests__/fragrances.test.ts
```

Expected: FAIL — `Cannot find module '../lib/fragrances'`.

- [x] **Step 3: Implement `lib/fragrances.ts`**

```typescript
// lib/fragrances.ts
import { supabase } from './supabase';
import type { Fragrance, NewFragrance, FragranceUpdate } from '../types/fragrance';

export async function listFragrances(): Promise<Fragrance[]> {
  const { data, error } = await supabase
    .from('fragrances')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Fragrance[];
}

export async function createFragrance(input: NewFragrance): Promise<Fragrance> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('fragrances')
    .insert({ ...input, user_id: user.user.id })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Fragrance;
}

export async function updateFragrance(
  id: string,
  input: FragranceUpdate,
): Promise<Fragrance> {
  const { data, error } = await supabase
    .from('fragrances')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Fragrance;
}

export async function deleteFragrance(id: string): Promise<void> {
  const { error } = await supabase.from('fragrances').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
```

- [x] **Step 4: Run tests, expect pass**

Run:
```bash
npm test __tests__/fragrances.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/fragrances.ts __tests__/fragrances.test.ts
git commit -m "feat: fragrances data service (tested)"
```

---

## Task 11: Theme tokens (Velvet Note aesthetic)

**Files:**
- Create: `theme/colors.ts`
- Create: `theme/typography.ts`
- Create: `theme/spacing.ts`

- [x] **Step 1: Write colors**

```typescript
// theme/colors.ts
export const colors = {
  // Deep neutrals: charcoal background, paper card, soft grays
  background: '#0F0E0D',
  surface: '#1A1917',
  surfaceElevated: '#252320',
  border: '#2F2C28',
  // Text: bone, dim bone, muted
  text: '#EDE6DA',
  textDim: '#B5AD9E',
  textMuted: '#7F7869',
  // Single accent: muted oxblood / claret
  accent: '#8B3A3A',
  accentMuted: '#5E2828',
  // Semantic
  error: '#C4594F',
  success: '#6A8E5A',
} as const;
```

- [x] **Step 2: Write typography**

```typescript
// theme/typography.ts
import { TextStyle } from 'react-native';

// Use system serif for headings, system sans for body — feels editorial
// without custom fonts. Swap to custom fonts in a later polish task.
export const typography = {
  display: {
    fontFamily: 'Georgia',
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 38,
  } as TextStyle,
  title: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 28,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,
  bodyDim: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
};
```

- [x] **Step 3: Write spacing**

```typescript
// theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
} as const;
```

- [x] **Step 4: Commit**

```bash
git add theme/
git commit -m "feat(theme): Velvet Note color, typography, spacing tokens"
```

---

## Task 12: Auth hook

**Files:**
- Create: `hooks/useAuth.ts`

- [x] **Step 1: Write the hook**

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}
```

- [x] **Step 2: Commit**

```bash
git add hooks/useAuth.ts
git commit -m "feat: useAuth hook tracking Supabase session"
```

---

## Task 13: Root layout with QueryClient and auth gate

**Files:**
- Modify: `app/_layout.tsx`

- [x] **Step 1: Rewrite `app/_layout.tsx`**

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="fragrance/[id]" options={{ title: '' }} />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  );
}
```

- [x] **Step 2: Remove the temporary `app/index.tsx`** (the auth gate will redirect)

Run:
```bash
rm app/index.tsx
```

- [x] **Step 3: Commit**

```bash
git add app/_layout.tsx
git rm app/index.tsx
git commit -m "feat: root layout with auth gate and QueryClient"
```

---

## Task 14: Sign-in screen — email/password

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/sign-in.tsx`

- [x] **Step 1: Write the auth group layout**

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [x] **Step 2: Write the sign-in screen (email/password only for now)**

```typescript
// app/(auth)/sign-in.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Email and password are required.');
      return;
    }
    setLoading(true);
    const fn = mode === 'signin'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setLoading(false);
    if (error) Alert.alert('Sign-in error', error.message);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fragrance</Text>
      <Text style={styles.subtitle}>Your collection, refined.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={[styles.button, loading && { opacity: 0.6 }]}
        disabled={loading}
        onPress={handleSubmit}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.buttonText}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Text>
        )}
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.switch}>
          {mode === 'signin'
            ? 'No account? Create one'
            : 'Have an account? Sign in'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: { ...typography.display, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyDim, color: colors.textDim, marginBottom: spacing.xxl },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { ...typography.body, color: colors.text, fontWeight: '500' },
  switch: {
    ...typography.bodyDim,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
```

- [x] **Step 3: Verify in the app**

Run:
```bash
npx expo start --clear
```

Expected: On your phone, the sign-in screen renders with the dark theme. Tap "Create account", enter an email + password (length ≥ 6), tap button. The auth gate should route you to `/(tabs)` — which doesn't exist yet, so you'll see a blank screen or "unmatched route". That's fine — we build tabs next.

Stop the dev server.

- [x] **Step 4: Commit**

```bash
git add app/(auth)/
git commit -m "feat: email/password sign-in screen"
```

---

## Task 15: Tabs layout

**Files:**
- Create: `app/(tabs)/_layout.tsx`

- [x] **Step 1: Write the tabs layout**

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { colors } from '../../theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Collection' }} />
      <Tabs.Screen name="add" options={{ title: 'Add' }} />
    </Tabs>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat: tabs layout shell"
```

---

## Task 16: Collection list screen — fetching and rendering

**Files:**
- Create: `hooks/useFragrances.ts`
- Create: `components/EmptyState.tsx`
- Create: `components/FragranceRow.tsx`
- Create: `app/(tabs)/index.tsx`

- [x] **Step 1: Write the React Query hook**

```typescript
// hooks/useFragrances.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listFragrances,
  createFragrance,
  updateFragrance,
  deleteFragrance,
} from '../lib/fragrances';
import type { NewFragrance, FragranceUpdate } from '../types/fragrance';

export function useFragrancesQuery() {
  return useQuery({ queryKey: ['fragrances'], queryFn: listFragrances });
}

export function useCreateFragrance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewFragrance) => createFragrance(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragrances'] }),
  });
}

export function useUpdateFragrance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FragranceUpdate }) =>
      updateFragrance(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragrances'] }),
  });
}

export function useDeleteFragrance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFragrance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragrances'] }),
  });
}
```

- [x] **Step 2: Write `EmptyState.tsx`**

```typescript
// components/EmptyState.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { ...typography.title, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  hint: { ...typography.bodyDim, color: colors.textDim, textAlign: 'center' },
});
```

- [x] **Step 3: Write `FragranceRow.tsx`**

```typescript
// components/FragranceRow.tsx
import { Pressable, View, Text, StyleSheet } from 'react-native';
import type { Fragrance } from '../types/fragrance';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function FragranceRow({
  fragrance,
  onPress,
}: {
  fragrance: Fragrance;
  onPress: () => void;
}) {
  const rating = fragrance.rating != null ? fragrance.rating.toFixed(1) : '—';
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.main}>
        <Text style={styles.brand}>{fragrance.brand}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {fragrance.name}
        </Text>
      </View>
      <View style={styles.meta}>
        {fragrance.concentration ? (
          <Text style={styles.conc}>{fragrance.concentration}</Text>
        ) : null}
        <Text style={styles.rating}>{rating}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  main: { flex: 1, paddingRight: spacing.md },
  brand: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  name: { ...typography.title, color: colors.text },
  meta: { alignItems: 'flex-end' },
  conc: { ...typography.caption, color: colors.textDim, marginBottom: 2 },
  rating: { ...typography.title, color: colors.accent },
});
```

- [x] **Step 4: Write the list screen**

```typescript
// app/(tabs)/index.tsx
import { useState, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { FragranceRow } from '../../components/FragranceRow';
import { EmptyState } from '../../components/EmptyState';
import { filterFragrances, sortFragrances, type SortMode } from '../../lib/filters';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function Collection() {
  const { data, isLoading, error, refetch, isRefetching } = useFragrancesQuery();
  const [query, setQuery] = useState('');
  const [sortMode] = useState<SortMode>('rating');
  const router = useRouter();

  const visible = useMemo(() => {
    if (!data) return [];
    return sortFragrances(filterFragrances(data, query), sortMode);
  }, [data, query, sortMode]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn't load your collection"
        hint={error instanceof Error ? error.message : 'Unknown error'}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No fragrances yet" hint="Tap Add to save your first." />;
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(f) => f.id}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      renderItem={({ item }) => (
        <FragranceRow
          fragrance={item}
          onPress={() => router.push(`/fragrance/${item.id}`)}
        />
      )}
      refreshing={isRefetching}
      onRefresh={refetch}
      style={{ backgroundColor: colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
```

- [x] **Step 5: Commit**

```bash
git add hooks/useFragrances.ts components/ app/(tabs)/index.tsx
git commit -m "feat: collection list with React Query"
```

---

## Task 17: Search box on collection list

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [x] **Step 1: Add a search input above the list**

Replace the top of the return in `app/(tabs)/index.tsx` with a wrapping `View` that contains a `TextInput`:

```typescript
// app/(tabs)/index.tsx (update the early-return-free branch to include search)
import { TextInput } from 'react-native';
// …existing imports
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';

// Inside the component body, replace the final return with:
return (
  <View style={{ flex: 1, backgroundColor: colors.background }}>
    <TextInput
      placeholder="Search brand, name, accord"
      placeholderTextColor={colors.textMuted}
      value={query}
      onChangeText={setQuery}
      style={searchStyles.input}
      autoCapitalize="none"
    />
    {visible.length === 0 ? (
      <EmptyState title="No matches" hint="Try a different search." />
    ) : (
      <FlatList
        data={visible}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <FragranceRow
            fragrance={item}
            onPress={() => router.push(`/fragrance/${item.id}`)}
          />
        )}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    )}
  </View>
);
```

Add to the `StyleSheet.create` block (rename to `searchStyles` or merge into existing):

```typescript
const searchStyles = StyleSheet.create({
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
```

(If you prefer, fold this into the existing `styles` object — the behavior must match.)

- [x] **Step 2: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat(list): in-page search filter"
```

---

## Task 18: Reusable form components — RatingSlider, AccordChips, ConcentrationPicker

**Files:**
- Create: `components/RatingSlider.tsx`
- Create: `components/AccordChips.tsx`
- Create: `components/ConcentrationPicker.tsx`

- [x] **Step 1: Install the slider**

Run:
```bash
npx expo install @react-native-community/slider
```

- [x] **Step 2: Write `RatingSlider.tsx`**

```typescript
// components/RatingSlider.tsx
import Slider from '@react-native-community/slider';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function RatingSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Rating</Text>
        <Text style={styles.value}>{value.toFixed(1)}</Text>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={10}
        step={0.5}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { ...typography.caption, color: colors.textDim },
  value: { ...typography.body, color: colors.accent },
});
```

- [x] **Step 3: Write `AccordChips.tsx`**

```typescript
// components/AccordChips.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export function AccordChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const a = draft.trim().toLowerCase();
    if (!a) return;
    if (value.includes(a)) {
      setDraft('');
      return;
    }
    onChange([...value, a]);
    setDraft('');
  }

  function remove(a: string) {
    onChange(value.filter((x) => x !== a));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Accords</Text>
      <View style={styles.chips}>
        {value.map((a) => (
          <Pressable key={a} onPress={() => remove(a)} style={styles.chip}>
            <Text style={styles.chipText}>{a} ×</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Add an accord (press enter)"
        placeholderTextColor={colors.textMuted}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        returnKeyType="done"
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.md },
  label: { ...typography.caption, color: colors.textDim, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.bodyDim, color: colors.text },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
```

- [x] **Step 4: Write `ConcentrationPicker.tsx`**

```typescript
// components/ConcentrationPicker.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CONCENTRATIONS, type Concentration } from '../types/fragrance';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export function ConcentrationPicker({
  value,
  onChange,
}: {
  value: Concentration | null;
  onChange: (v: Concentration) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Concentration</Text>
      <View style={styles.row}>
        {CONCENTRATIONS.map((c) => {
          const selected = value === c;
          return (
            <Pressable
              key={c}
              onPress={() => onChange(c)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.text, selected && styles.textSelected]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.md },
  label: { ...typography.caption, color: colors.textDim, marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  text: { ...typography.bodyDim, color: colors.textDim },
  textSelected: { color: colors.text },
});
```

- [x] **Step 5: Commit**

```bash
git add package.json package-lock.json components/
git commit -m "feat(components): rating slider, accord chips, concentration picker"
```

---

## Task 19: Add fragrance screen

**Files:**
- Create: `app/(tabs)/add.tsx`

- [x] **Step 1: Write the form**

```typescript
// app/(tabs)/add.tsx
import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateFragrance } from '../../hooks/useFragrances';
import { RatingSlider } from '../../components/RatingSlider';
import { AccordChips } from '../../components/AccordChips';
import { ConcentrationPicker } from '../../components/ConcentrationPicker';
import type { Concentration } from '../../types/fragrance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export default function Add() {
  const router = useRouter();
  const create = useCreateFragrance();
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [accords, setAccords] = useState<string[]>([]);
  const [rating, setRating] = useState(5);

  async function submit() {
    if (!brand.trim() || !name.trim()) {
      Alert.alert('Missing fields', 'Brand and name are required.');
      return;
    }
    try {
      await create.mutateAsync({
        brand: brand.trim(),
        name: name.trim(),
        concentration,
        accords,
        rating,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? 'Unknown error');
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.fieldLabel}>Brand</Text>
      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
        placeholder="Chanel"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.fieldLabel}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Bleu"
        placeholderTextColor={colors.textMuted}
      />

      <ConcentrationPicker value={concentration} onChange={setConcentration} />
      <AccordChips value={accords} onChange={setAccords} />
      <RatingSlider value={rating} onChange={setRating} />

      <Pressable
        style={[styles.submit, create.isPending && { opacity: 0.6 }]}
        disabled={create.isPending}
        onPress={submit}
      >
        {create.isPending ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.submitText}>Save fragrance</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  fieldLabel: { ...typography.caption, color: colors.textDim, marginBottom: spacing.xs },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  submit: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitText: { ...typography.body, color: colors.text, fontWeight: '500' },
});
```

- [x] **Step 2: Smoke test**

Run:
```bash
npx expo start --clear
```

On your phone: sign in (if you aren't already), go to the Add tab, enter Brand = Chanel, Name = Bleu, tap an EDP pill, add two accords, pick a rating, tap Save. You should land on the Collection tab with the new row visible.

- [x] **Step 3: Commit**

```bash
git add app/(tabs)/add.tsx
git commit -m "feat: add fragrance form"
```

---

## Task 20: Detail screen — read, edit, delete

**Files:**
- Create: `app/fragrance/[id].tsx`

- [x] **Step 1: Write the detail screen**

```typescript
// app/fragrance/[id].tsx
import { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useFragrancesQuery,
  useUpdateFragrance,
  useDeleteFragrance,
} from '../../hooks/useFragrances';
import { RatingSlider } from '../../components/RatingSlider';
import { AccordChips } from '../../components/AccordChips';
import { ConcentrationPicker } from '../../components/ConcentrationPicker';
import type { Concentration } from '../../types/fragrance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data } = useFragrancesQuery();
  const fragrance = useMemo(() => data?.find((f) => f.id === id), [data, id]);
  const update = useUpdateFragrance();
  const del = useDeleteFragrance();

  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [accords, setAccords] = useState<string[]>([]);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (!fragrance) return;
    setBrand(fragrance.brand);
    setName(fragrance.name);
    setConcentration(fragrance.concentration);
    setAccords(fragrance.accords);
    setRating(fragrance.rating ?? 5);
  }, [fragrance?.id]);

  if (!fragrance) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  async function save() {
    if (!brand.trim() || !name.trim()) {
      Alert.alert('Missing fields', 'Brand and name are required.');
      return;
    }
    try {
      await update.mutateAsync({
        id: fragrance!.id,
        input: {
          brand: brand.trim(),
          name: name.trim(),
          concentration,
          accords,
          rating,
        },
      });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? 'Unknown error');
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete fragrance',
      `Remove ${fragrance!.brand} ${fragrance!.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await del.mutateAsync(fragrance!.id);
              router.replace('/(tabs)');
            } catch (e: any) {
              Alert.alert('Could not delete', e.message ?? 'Unknown error');
            }
          },
        },
      ],
    );
  }

  if (editing) {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
        <Text style={styles.fieldLabel}>Brand</Text>
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} />
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <ConcentrationPicker value={concentration} onChange={setConcentration} />
        <AccordChips value={accords} onChange={setAccords} />
        <RatingSlider value={rating} onChange={setRating} />

        <Pressable style={styles.primary} onPress={save} disabled={update.isPending}>
          {update.isPending ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.primaryText}>Save changes</Text>
          )}
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => setEditing(false)}>
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={styles.brand}>{fragrance.brand}</Text>
      <Text style={styles.name}>{fragrance.name}</Text>
      {fragrance.concentration ? (
        <Text style={styles.conc}>{fragrance.concentration}</Text>
      ) : null}

      <View style={styles.ratingRow}>
        <Text style={styles.fieldLabel}>Rating</Text>
        <Text style={styles.rating}>
          {fragrance.rating != null ? fragrance.rating.toFixed(1) : '—'}
        </Text>
      </View>

      {fragrance.accords.length > 0 && (
        <>
          <Text style={styles.fieldLabel}>Accords</Text>
          <View style={styles.chips}>
            {fragrance.accords.map((a) => (
              <View key={a} style={styles.chip}>
                <Text style={styles.chipText}>{a}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Pressable style={styles.primary} onPress={() => setEditing(true)}>
        <Text style={styles.primaryText}>Edit</Text>
      </Pressable>
      <Pressable style={styles.danger} onPress={confirmDelete}>
        <Text style={styles.dangerText}>Delete</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  brand: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  name: { ...typography.display, color: colors.text, marginBottom: spacing.xs },
  conc: { ...typography.bodyDim, color: colors.textDim, marginBottom: spacing.lg },
  ratingRow: { marginVertical: spacing.md },
  rating: { ...typography.title, color: colors.accent },
  fieldLabel: { ...typography.caption, color: colors.textDim, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.bodyDim, color: colors.text },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primaryText: { ...typography.body, color: colors.text, fontWeight: '500' },
  secondary: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondaryText: { ...typography.bodyDim, color: colors.textDim },
  danger: {
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dangerText: { ...typography.body, color: colors.error },
});
```

- [x] **Step 2: Smoke test**

Run the app. Tap any fragrance in the collection → detail screen renders → tap Edit → change the rating → Save changes → returns to read view. Tap Delete → confirm → returns to Collection tab with row gone.

- [x] **Step 3: Commit**

```bash
git add app/fragrance/
git commit -m "feat: fragrance detail with edit and delete"
```

---

## Task 21: Sign-out action

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [x] **Step 1: Add a header sign-out button on the collection tab**

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Collection',
          headerRight: () => (
            <Pressable
              onPress={() => supabase.auth.signOut()}
              style={{ paddingHorizontal: spacing.md }}
            >
              <Text style={{ ...typography.bodyDim, color: colors.textDim }}>Sign out</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="add" options={{ title: 'Add' }} />
    </Tabs>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat: sign-out from collection header"
```

---

## Task 22: Apple Sign In (iOS only) — DEFERRED to Phase 4

**Files:**
- Modify: `app.json`
- Modify: `app/(auth)/sign-in.tsx`

- [ ] **Step 1: Install the module**

Run:
```bash
npx expo install expo-apple-authentication
```

- [ ] **Step 2: Add the plugin to `app.json`**

Open `app.json`. Inside `expo.plugins`, append `"expo-apple-authentication"`. Inside `expo.ios`, add `"usesAppleSignIn": true`.

Example (merge with your existing `app.json`):

```json
{
  "expo": {
    "name": "Fragrance App",
    "slug": "fragrance-app",
    "ios": {
      "usesAppleSignIn": true,
      "bundleIdentifier": "com.charles.fragranceapp"
    },
    "plugins": ["expo-router", "expo-apple-authentication"]
  }
}
```

(Keep any existing fields the scaffold inserted.)

- [ ] **Step 3: Add an Apple button to `sign-in.tsx`**

Before the final `</View>` in the return, add:

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// …somewhere in the component body, before the return:
async function signInWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      Alert.alert('Apple sign-in failed', 'No identity token returned.');
      return;
    }
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) Alert.alert('Sign-in error', error.message);
  } catch (e: any) {
    if (e.code !== 'ERR_CANCELED') {
      Alert.alert('Apple sign-in error', e.message ?? 'Unknown error');
    }
  }
}

// …in the JSX, after the switch Pressable:
{Platform.OS === 'ios' && (
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
    cornerRadius={8}
    style={{ height: 48, marginTop: spacing.md }}
    onPress={signInWithApple}
  />
)}
```

- [ ] **Step 4: Enable Apple provider in Supabase**

In the Supabase dashboard → **Authentication** → **Providers** → **Apple** → toggle ON. For Phase 1 dev you can leave the Services ID / Team ID / Key blank and use native ID-token-only flow on iOS. Full production config comes in Phase 4.

- [ ] **Step 5: Note — Expo Go cannot test native Apple Sign In**

Expo Go doesn't support `expo-apple-authentication`. To test, you'll need a development build:

Run:
```bash
npx expo prebuild --platform ios
npx expo run:ios
```

Requires Xcode and a paid Apple developer account is NOT required for local simulator testing — but IS required to sign in to a real Apple ID on a device. If you don't have an Apple developer account yet, skip manual testing of the button and land the code; verify it at Phase 4.

- [ ] **Step 6: Commit**

```bash
git add app.json app/(auth)/sign-in.tsx package.json package-lock.json
git commit -m "feat(auth): Apple Sign In (iOS, native ID token)"
```

---

## Task 23: Google Sign In — DEFERRED to Phase 4

**Files:**
- Modify: `app.json`
- Modify: `app/(auth)/sign-in.tsx`

- [ ] **Step 1: Install**

Run:
```bash
npx expo install @react-native-google-signin/google-signin
```

- [ ] **Step 2: Manual setup — Google Cloud + Supabase**

In Google Cloud Console:
1. Create an OAuth 2.0 Client ID → type **iOS** — bundle ID = `com.charles.fragranceapp` (or your chosen bundle).
2. Create another OAuth 2.0 Client ID → type **Android** — package name + SHA-1 fingerprint from `eas credentials` or `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android` (debug).
3. Create a **Web** Client ID — used as the "server client ID" / Supabase audience.

In Supabase dashboard → **Authentication** → **Providers** → **Google** → toggle ON. Paste the Web Client ID in both the "Client ID" and "Authorized audience" fields.

Copy the iOS Client ID — add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-apple-authentication",
      ["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.XXXXXXXX" }]
    ]
  }
}
```

Replace `XXXXXXXX` with the reversed client ID (the iOS Client ID in reverse-domain form).

- [ ] **Step 3: Add a Google button in `sign-in.tsx`**

```typescript
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect } from 'react';

// Call once on mount
useEffect(() => {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  });
}, []);

async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.idToken;
    if (!idToken) {
      Alert.alert('Google sign-in failed', 'No identity token returned.');
      return;
    }
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) Alert.alert('Sign-in error', error.message);
  } catch (e: any) {
    if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
      Alert.alert('Google sign-in error', e.message ?? 'Unknown error');
    }
  }
}

// In JSX, after the Apple button:
<GoogleSigninButton
  style={{ height: 48, marginTop: spacing.sm }}
  size={GoogleSigninButton.Size.Wide}
  color={GoogleSigninButton.Color.Dark}
  onPress={signInWithGoogle}
/>;
```

- [ ] **Step 4: Like Apple, Google Sign In requires a dev build**

```bash
npx expo prebuild
npx expo run:ios   # or run:android
```

- [ ] **Step 5: Commit**

```bash
git add app.json app/(auth)/sign-in.tsx package.json package-lock.json
git commit -m "feat(auth): Google Sign In via native ID token"
```

---

## Task 24: Manual smoke test checklist

**Files:**
- Create: `docs/manual-smoke-tests.md`

- [x] **Step 1: Write the checklist**

```markdown
# Manual Smoke Tests — Phase 1

Run this entire checklist on a dev build before any demo or release.

## Setup
- [x] `.env.local` contains valid Supabase URL + anon key
- [x] Migration applied — `fragrances` table exists in Supabase

## Auth
- [x] Fresh install → sign-in screen shown (no stale session)
- [x] Create account with new email+password → routed to Collection
- [x] Sign out → back to sign-in screen
- [x] Sign in with existing credentials → routed to Collection
- [x] Wrong password → friendly error shown, no crash
- [x] Apple Sign In (iOS dev build only) → routed to Collection
- [x] Google Sign In → routed to Collection

## Collection list
- [x] Empty state shown when no fragrances
- [x] Pull to refresh works
- [x] Network off → cached data renders (React Query), error state on hard refresh

## Add
- [x] Brand + name required → blocked with alert if missing
- [x] Submit happy path → new row appears top of list (if sorted by recent) or by rating
- [x] Concentration picker, accord chips, rating slider all interactive
- [x] Chip dedup — can't add the same accord twice

## Detail
- [x] Tap row → detail renders with correct data
- [x] Edit → changes persist
- [x] Edit → cancel discards changes
- [x] Delete → confirm → row removed from list

## Search + sort
- [x] Typing a brand substring filters the list
- [x] Typing an accord substring filters the list
- [x] Clearing the search restores all rows

## RLS sanity (requires 2 test accounts)
- [x] User A can add a fragrance
- [x] User B signs in — does NOT see User A's fragrance
```

- [x] **Step 2: Commit**

```bash
git add docs/manual-smoke-tests.md
git commit -m "docs: manual smoke test checklist"
```

---

## Task 25: README

**Files:**
- Modify: `README.md` (created by Expo scaffold)

- [x] **Step 1: Replace README contents**

```markdown
# Fragrance App

Personal fragrance collection tracker. Mobile-first (Expo + React Native), Supabase backend.

Working name in code. Leading public-name candidate: *Velvet Note*.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.
3. Apply the database migration in `supabase/migrations/` via the Supabase SQL editor.
4. Start the bundler:
   ```bash
   npx expo start
   ```
5. Scan the QR code with Expo Go.

For Apple / Google sign-in testing, build a dev client:
```bash
npx expo prebuild
npx expo run:ios   # or run:android
```

## Test

```bash
npm test
```

## Phase 1 scope

- Auth: email/password, Apple Sign In, Google Sign In
- Collection list with search + sort
- Add fragrance: brand, name, concentration, accords, rating
- Detail view with edit + delete
- Online-only (offline is Phase 3)

See `../Life Intertwined/Projects/Fragrance App/` in the vault for the full design spec and phased roadmap.
```

- [x] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: project README"
```

---

## Task 26: Full-run verification

**Files:** none — manual verification pass

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: All tests pass (smoke, filters, fragrances service).

- [ ] **Step 2: Run the manual smoke test checklist**

Walk through every item in `docs/manual-smoke-tests.md` against a running Expo dev build (or Expo Go if you defer Apple/Google).

- [ ] **Step 3: Tag the Phase 1 release**

```bash
git tag phase-1
```

- [ ] **Step 4: Confirm the phase exit criteria with the user**

Phase 1 is done when:
- Test suite is green
- Manual smoke test passes end-to-end for at least the email/password flow
- You've added ≥5 real fragrances from your collection and used the list for a week

When those are met, start Phase 1.5 (Wear Calendar).

---

## Self-Review Notes

Coverage check against the design spec:

- **Auth — email+password, Apple, Google** → Tasks 14, 22, 23
- **4 screens (sign-in, list, add, detail)** → Tasks 14, 16, 19, 20
- **Fragrances table with RLS** → Task 6
- **Schema: brand, name, concentration, accords, rating** → Tasks 6, 8
- **Search + sort** → Tasks 9, 17
- **Error handling (toasts, cache fallback, validation)** → Tasks 14, 16, 19, 20
- **Testing (unit + integration + manual)** → Tasks 3, 9, 10, 24
- **Aesthetic — Velvet Note palette/type/spacing** → Task 11

Deferred (not in Phase 1):
- React Query offline persistence (reads cache only via in-memory QueryClient — fine for Phase 1)
- Local Supabase integration tests — plan covers unit tests only; full local-Supabase RLS tests move to Phase 1.5 when we have wearings to test too
- Custom fonts (sticking with system serif via `Georgia`)
