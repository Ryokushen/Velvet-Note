# Today Wear Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Today tab that shows the active fragrance being worn today, supports a same-day wear stack, and lets the user quickly increment/decrement compliments and save a journal note.

**Architecture:** Reuse the existing `wears` table as the source of truth. Add `wears.is_active` plus a Supabase RPC that enforces one active wear per user/day, then build a client-derived Today view from `useWearsQuery()` and `useFragrancesQuery()`.

**Tech Stack:** Expo Router, React Native, TypeScript, React Query, Supabase Postgres/RPC, Jest + React Native Testing Library.

---

## File Structure

- Create `supabase/migrations/20260425030000_today_active_wear.sql`: add `wears.is_active`, a partial unique index, and `set_active_wear(wear_id uuid)` RPC.
- Modify `types/wear.ts`: add optional `is_active?: boolean`.
- Modify `lib/wears.ts`: add `setActiveWear(wearId: string)`.
- Modify `hooks/useWears.ts`: add `useSetActiveWear()` and invalidate wear queries.
- Create `lib/todayWear.ts`: pure helpers for local date, selecting today's stack, selecting active wear, and clamping compliments.
- Create `app/(tabs)/today.tsx`: Today tab UI.
- Modify `app/(tabs)/_layout.tsx`: add the Today tab between Wears and Insights.
- Modify `app/fragrance/[id].tsx`: after logging today's wear, mark the created row active.
- Modify `app/(tabs)/calendar.tsx`: after creating a wear for today's date, mark it active.
- Create/update tests:
  - Create `__tests__/todayWear.test.ts`
  - Create `__tests__/TodayTab.test.tsx`
  - Extend `__tests__/JournalMigration.test.ts`
  - Extend `__tests__/calendarWearEntry.test.tsx`

---

### Task 1: Data Foundation And Pure Today Helpers

**Files:**
- Create: `supabase/migrations/20260425030000_today_active_wear.sql`
- Modify: `types/wear.ts`
- Create: `lib/todayWear.ts`
- Test: `__tests__/todayWear.test.ts`
- Test: `__tests__/JournalMigration.test.ts`

- [ ] **Step 1: Write failing pure-helper tests**

Create `__tests__/todayWear.test.ts`:

```ts
import {
  clampComplimentCount,
  selectTodayWearState,
  todayLocalDate,
} from '../lib/todayWear';
import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

const fragrances: Fragrance[] = [
  {
    id: 'f1',
    user_id: 'u1',
    brand: 'Rasasi',
    name: 'Hawas for Him',
    concentration: 'EDP',
    accords: ['fresh'],
    rating: 8,
    catalog_id: null,
    image_url: 'https://example.com/hawas.jpg',
    catalog_description: null,
    catalog_source: null,
    catalog_release_year: null,
    catalog_notes_top: null,
    catalog_notes_middle: null,
    catalog_notes_base: null,
    catalog_perfumers: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'f2',
    user_id: 'u1',
    brand: 'Diptyque',
    name: 'Tam Dao',
    concentration: 'EDT',
    accords: ['woody'],
    rating: 8,
    catalog_id: null,
    image_url: null,
    catalog_description: null,
    catalog_source: null,
    catalog_release_year: null,
    catalog_notes_top: null,
    catalog_notes_middle: null,
    catalog_notes_base: null,
    catalog_perfumers: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
];

const wears: Wear[] = [
  {
    id: 'morning',
    user_id: 'u1',
    fragrance_id: 'f2',
    worn_on: '2026-04-25',
    notes: 'Office morning',
    compliment_count: 1,
    is_active: false,
    created_at: '2026-04-25T09:00:00Z',
    updated_at: '2026-04-25T09:00:00Z',
  },
  {
    id: 'night',
    user_id: 'u1',
    fragrance_id: 'f1',
    worn_on: '2026-04-25',
    notes: 'Dinner',
    compliment_count: 2,
    is_active: true,
    time_of_day: 'night',
    created_at: '2026-04-25T20:00:00Z',
    updated_at: '2026-04-25T20:00:00Z',
  },
  {
    id: 'yesterday',
    user_id: 'u1',
    fragrance_id: 'f1',
    worn_on: '2026-04-24',
    notes: null,
    compliment_count: 5,
    is_active: true,
    created_at: '2026-04-24T20:00:00Z',
    updated_at: '2026-04-24T20:00:00Z',
  },
];

describe('todayWear helpers', () => {
  it('returns a YYYY-MM-DD local date key', () => {
    expect(todayLocalDate(new Date('2026-04-25T12:00:00'))).toBe('2026-04-25');
  });

  it('selects today stack and prefers the active wear', () => {
    const state = selectTodayWearState(wears, fragrances, '2026-04-25');

    expect(state.stack.map((row) => row.wear.id)).toEqual(['night', 'morning']);
    expect(state.active?.wear.id).toBe('night');
    expect(state.active?.fragrance?.name).toBe('Hawas for Him');
  });

  it('falls back to newest today wear when none are active', () => {
    const inactive = wears.map((wear) => ({ ...wear, is_active: false }));
    const state = selectTodayWearState(inactive, fragrances, '2026-04-25');

    expect(state.active?.wear.id).toBe('night');
  });

  it('ignores non-today active wears', () => {
    const state = selectTodayWearState([wears[2]], fragrances, '2026-04-25');

    expect(state.stack).toEqual([]);
    expect(state.active).toBeNull();
  });

  it('clamps compliment counts at zero', () => {
    expect(clampComplimentCount(-1)).toBe(0);
    expect(clampComplimentCount(3)).toBe(3);
  });
});
```

- [ ] **Step 2: Extend migration coverage test**

In `__tests__/JournalMigration.test.ts`, add expectations for the Today migration:

```ts
import fs from 'fs';
import path from 'path';

const journalMigration = fs.readFileSync(
  path.join(__dirname, '..', 'supabase/migrations/20260425020000_personal_journal_fields.sql'),
  'utf8',
);

const todayMigration = fs.readFileSync(
  path.join(__dirname, '..', 'supabase/migrations/20260425030000_today_active_wear.sql'),
  'utf8',
);

describe('journal migrations', () => {
  it('adds personal journal fragrance fields', () => {
    expect(journalMigration).toContain('bottle_status');
    expect(journalMigration).toContain('preferred_seasons');
    expect(journalMigration).toContain('preferred_time_of_day');
  });

  it('adds richer wear fields', () => {
    expect(journalMigration).toContain('compliment_count');
    expect(journalMigration).toContain("time_of_day in ('day', 'night')");
    expect(journalMigration).toContain("season in ('spring', 'summer', 'fall', 'winter')");
  });

  it('returns new fragrance fields from the catalog-image RPC', () => {
    expect(journalMigration).toContain('bottle_size_ml numeric');
    expect(journalMigration).toContain('preferred_time_of_day text');
    expect(journalMigration).toContain('fragrances.preferred_seasons');
  });

  it('adds active-wear support and RPC for the Today tab', () => {
    expect(todayMigration).toContain('add column if not exists is_active boolean');
    expect(todayMigration).toContain('wears_one_active_per_user_day_idx');
    expect(todayMigration).toContain('create or replace function public.set_active_wear');
    expect(todayMigration).toContain('grant execute on function public.set_active_wear(uuid) to authenticated');
  });
});
```

Run: `/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand __tests__/todayWear.test.ts __tests__/JournalMigration.test.ts`

Expected: FAIL because `lib/todayWear.ts` and `20260425030000_today_active_wear.sql` do not exist, and `types/wear.ts` does not expose `is_active`.

- [ ] **Step 3: Add wear type field**

Modify `types/wear.ts`:

```ts
import type { Season } from './fragrance';

export type WearTimeOfDay = 'day' | 'night';

export interface Wear {
  id: string;
  user_id: string;
  fragrance_id: string;
  worn_on: string;
  notes: string | null;
  season?: Season | null;
  time_of_day?: WearTimeOfDay | null;
  occasion?: string | null;
  compliment_count?: number;
  compliment_note?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export type NewWear = {
  fragrance_id: string;
  worn_on: string;
  notes: string | null;
  season?: Season | null;
  time_of_day?: WearTimeOfDay | null;
  occasion?: string | null;
  compliment_count?: number;
  compliment_note?: string | null;
  is_active?: boolean;
};

export type WearUpdate = Partial<NewWear>;
```

- [ ] **Step 4: Create migration**

Create `supabase/migrations/20260425030000_today_active_wear.sql`:

```sql
alter table public.wears
  add column if not exists is_active boolean not null default false;

create unique index if not exists wears_one_active_per_user_day_idx
  on public.wears(user_id, worn_on)
  where is_active;

create or replace function public.set_active_wear(wear_id uuid)
returns public.wears
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wear public.wears;
begin
  select *
  into target_wear
  from public.wears
  where id = wear_id
    and user_id = auth.uid();

  if target_wear.id is null then
    raise exception 'Wear not found or not owned by current user';
  end if;

  update public.wears
  set is_active = false,
      updated_at = now()
  where user_id = auth.uid()
    and worn_on = target_wear.worn_on
    and id <> target_wear.id
    and is_active = true;

  update public.wears
  set is_active = true,
      updated_at = now()
  where id = target_wear.id
  returning * into target_wear;

  return target_wear;
end;
$$;

grant execute on function public.set_active_wear(uuid) to authenticated;
```

- [ ] **Step 5: Create pure helper module**

Create `lib/todayWear.ts`:

```ts
import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

export type TodayWearRow = {
  wear: Wear;
  fragrance: Fragrance | null;
};

export type TodayWearState = {
  stack: TodayWearRow[];
  active: TodayWearRow | null;
};

export function todayLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function selectTodayWearState(
  wears: Wear[],
  fragrances: Fragrance[],
  dateKey = todayLocalDate(),
): TodayWearState {
  const fragranceById = new Map(fragrances.map((fragrance) => [fragrance.id, fragrance]));
  const stack = wears
    .filter((wear) => wear.worn_on === dateKey)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((wear) => ({
      wear,
      fragrance: fragranceById.get(wear.fragrance_id) ?? null,
    }));

  return {
    stack,
    active: stack.find((row) => row.wear.is_active) ?? stack[0] ?? null,
  };
}

export function clampComplimentCount(value: number): number {
  return Math.max(0, Math.trunc(value));
}
```

- [ ] **Step 6: Run tests**

Run: `/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand __tests__/todayWear.test.ts __tests__/JournalMigration.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add types/wear.ts lib/todayWear.ts supabase/migrations/20260425030000_today_active_wear.sql __tests__/todayWear.test.ts __tests__/JournalMigration.test.ts
git commit -m "Add active wear data foundation"
```

---

### Task 2: Supabase RPC Hook And Active-On-Create Behavior

**Files:**
- Modify: `lib/wears.ts`
- Modify: `hooks/useWears.ts`
- Modify: `app/fragrance/[id].tsx`
- Modify: `app/(tabs)/calendar.tsx`
- Test: `__tests__/wears.test.ts`
- Test: `__tests__/calendarWearEntry.test.tsx`

- [ ] **Step 1: Add failing service test for active RPC**

In `__tests__/wears.test.ts`, add:

```ts
import {
  createWear,
  deleteWear,
  listWears,
  listWearsForFragrance,
  setActiveWear,
  updateWear,
} from '../lib/wears';
```

Add `rpc` to the Supabase mock object:

```ts
supabase: {
  from: jest.fn(() => builder),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'u' } },
      error: null,
    }),
  },
  __builder: builder,
},
```

Add the service test:

```ts

it('calls set_active_wear RPC', async () => {
  const row = { id: 'wear-1', is_active: true };
  supabase.rpc.mockResolvedValueOnce({ data: row, error: null });

  await expect(setActiveWear('wear-1')).resolves.toBe(row);

  expect(supabase.rpc).toHaveBeenCalledWith('set_active_wear', {
    wear_id: 'wear-1',
  });
});
```

- [ ] **Step 2: Add failing active-on-create UI expectation**

In `__tests__/calendarWearEntry.test.tsx`, add a mock for `useSetActiveWear` while preserving the existing mocked wear rows:

```ts
const mockSetActiveWearMutateAsync = jest.fn();

jest.mock('../hooks/useWears', () => ({
  useCreateWear: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useUpdateWear: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteWear: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useSetActiveWear: () => ({
    mutateAsync: mockSetActiveWearMutateAsync,
    isPending: false,
  }),
  useWearsQuery: () => ({
    data: [
      {
        id: 'wear-1',
        user_id: 'user-1',
        fragrance_id: 'fragrance-1',
        worn_on: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-16`,
        notes: 'Office day',
        created_at: '2026-04-16T12:00:00Z',
        updated_at: '2026-04-16T12:00:00Z',
      },
      {
        id: 'wear-2',
        user_id: 'user-1',
        fragrance_id: 'fragrance-2',
        worn_on: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-16`,
        notes: 'Rainy commute',
        created_at: '2026-04-16T10:00:00Z',
        updated_at: '2026-04-16T10:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));
```

In `beforeEach`, reset it:

```ts
mockSetActiveWearMutateAsync.mockReset();
mockSetActiveWearMutateAsync.mockResolvedValue({});
```

In the "logs the selected calendar date" test, make `mockMutateAsync` resolve a wear row and assert active marking when the selected date is today:

```ts
mockMutateAsync.mockResolvedValueOnce({
  id: 'new-wear',
  fragrance_id: 'fragrance-1',
  worn_on: selectedDate,
  notes: null,
});

if (selectedDate === todayLocalDateForTest()) {
  expect(mockSetActiveWearMutateAsync).toHaveBeenCalledWith('new-wear');
}
```

Add this local test helper at the bottom of the file:

```ts
function todayLocalDateForTest(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
```

Run: `/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand __tests__/wears.test.ts __tests__/calendarWearEntry.test.tsx`

Expected: FAIL because `setActiveWear` and `useSetActiveWear` do not exist and create flows do not activate new today wears.

- [ ] **Step 3: Implement RPC service**

Modify `lib/wears.ts`:

```ts
export async function setActiveWear(wearId: string): Promise<Wear> {
  const { data, error } = await supabase.rpc('set_active_wear', { wear_id: wearId });
  if (error) throw new Error(error.message);
  return data as Wear;
}
```

- [ ] **Step 4: Implement hook**

Modify `hooks/useWears.ts` imports:

```ts
import {
  createWear,
  deleteWear,
  listWears,
  listWearsForFragrance,
  setActiveWear,
  updateWear,
} from '../lib/wears';
```

Add:

```ts
export function useSetActiveWear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wearId: string) => setActiveWear(wearId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wears'] }),
  });
}
```

- [ ] **Step 5: Mark detail-created today wear active**

In `app/fragrance/[id].tsx`, import `useSetActiveWear`:

```ts
import { useCreateWear, useFragranceWearsQuery, useSetActiveWear } from '../../hooks/useWears';
```

Create the hook:

```ts
const setActiveWear = useSetActiveWear();
```

Modify `logWearToday()`:

```ts
const createdWear = await createWear.mutateAsync({
  fragrance_id: fragranceId,
  worn_on: todayLocalDate(),
  notes: wearNotes.trim() ? wearNotes.trim() : null,
  season: wearSeason,
  time_of_day: wearTimeOfDay,
  occasion: wearOccasion.trim() ? wearOccasion.trim() : null,
  compliment_count: complimentCount,
  compliment_note: complimentNote.trim() ? complimentNote.trim() : null,
});
await setActiveWear.mutateAsync(createdWear.id);
```

Update the `PrimaryButton` loading state:

```tsx
<PrimaryButton loading={createWear.isPending || setActiveWear.isPending} onPress={logWearToday}>
  Log today
</PrimaryButton>
```

- [ ] **Step 6: Mark Wears-created today wear active**

In `app/(tabs)/calendar.tsx`, import/use `useSetActiveWear`:

```ts
const setActiveWear = useSetActiveWear();
```

Modify `saveSelectedDayWear()` create branch:

```ts
if (editingWearId) {
  await updateWear.mutateAsync({ id: editingWearId, input });
} else {
  const createdWear = await createWear.mutateAsync(input);
  if (selectedDate === todayLocalDate()) {
    await setActiveWear.mutateAsync(createdWear.id);
  }
}
```

Update saving prop:

```tsx
saving={createWear.isPending || updateWear.isPending || setActiveWear.isPending}
```

- [ ] **Step 7: Run tests**

Run: `/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand __tests__/wears.test.ts __tests__/calendarWearEntry.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/wears.ts hooks/useWears.ts app/fragrance/[id].tsx app/'(tabs)'/calendar.tsx __tests__/wears.test.ts __tests__/calendarWearEntry.test.tsx
git commit -m "Activate today's newly logged wear"
```

---

### Task 3: Today Tab UI

**Files:**
- Create: `app/(tabs)/today.tsx`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `components/ui/Icon.tsx`
- Test: `__tests__/TodayTab.test.tsx`

- [ ] **Step 1: Write failing Today tab component tests**

Create `__tests__/TodayTab.test.tsx`:

```tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Today from '../app/(tabs)/today';

const mockUpdateWearMutateAsync = jest.fn();
const mockSetActiveWearMutateAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => ({
  BottleArt: ({ imageUrl }: { imageUrl: string | null }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'today-bottle-art' }, imageUrl ?? 'placeholder');
  },
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [
      {
        id: 'fragrance-1',
        user_id: 'user-1',
        brand: 'Rasasi',
        name: 'Hawas for Him',
        concentration: 'EDP',
        accords: ['fresh'],
        rating: 8,
        catalog_id: null,
        image_url: 'https://example.com/hawas.jpg',
        catalog_description: null,
        catalog_source: null,
        catalog_release_year: null,
        catalog_notes_top: null,
        catalog_notes_middle: null,
        catalog_notes_base: null,
        catalog_perfumers: null,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
      {
        id: 'fragrance-2',
        user_id: 'user-1',
        brand: 'Diptyque',
        name: 'Tam Dao',
        concentration: 'EDT',
        accords: ['woody'],
        rating: 8,
        catalog_id: null,
        image_url: null,
        catalog_description: null,
        catalog_source: null,
        catalog_release_year: null,
        catalog_notes_top: null,
        catalog_notes_middle: null,
        catalog_notes_base: null,
        catalog_perfumers: null,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../hooks/useWears', () => ({
  useWearsQuery: () => ({
    data: [
      {
        id: 'wear-active',
        user_id: 'user-1',
        fragrance_id: 'fragrance-1',
        worn_on: todayLocalDateForTest(),
        notes: 'Dinner journal',
        time_of_day: 'night',
        occasion: 'Dinner',
        compliment_count: 2,
        compliment_note: 'Asked what it was',
        is_active: true,
        created_at: `${todayLocalDateForTest()}T20:00:00Z`,
        updated_at: `${todayLocalDateForTest()}T20:00:00Z`,
      },
      {
        id: 'wear-morning',
        user_id: 'user-1',
        fragrance_id: 'fragrance-2',
        worn_on: todayLocalDateForTest(),
        notes: 'Morning office',
        compliment_count: 0,
        is_active: false,
        created_at: `${todayLocalDateForTest()}T09:00:00Z`,
        updated_at: `${todayLocalDateForTest()}T09:00:00Z`,
      },
    ],
    isLoading: false,
    error: null,
  }),
  useUpdateWear: () => ({
    mutateAsync: mockUpdateWearMutateAsync,
    isPending: false,
  }),
  useSetActiveWear: () => ({
    mutateAsync: mockSetActiveWearMutateAsync,
    isPending: false,
  }),
}));

describe('Today tab', () => {
  beforeEach(() => {
    mockUpdateWearMutateAsync.mockReset();
    mockUpdateWearMutateAsync.mockResolvedValue({});
    mockSetActiveWearMutateAsync.mockReset();
    mockSetActiveWearMutateAsync.mockResolvedValue({});
  });

  it('renders active wear and today stack', () => {
    const { getByText, getByTestId } = render(<Today />);

    expect(getByText('Currently wearing')).toBeTruthy();
    expect(getByText('Hawas for Him')).toBeTruthy();
    expect(getByText('Rasasi')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Today’s stack')).toBeTruthy();
    expect(getByText('Tam Dao')).toBeTruthy();
    expect(getByTestId('today-bottle-art')).toBeTruthy();
  });

  it('increments and decrements compliments', async () => {
    const { getByLabelText } = render(<Today />);

    fireEvent.press(getByLabelText('Increase compliment count'));
    await waitFor(() => {
      expect(mockUpdateWearMutateAsync).toHaveBeenCalledWith({
        id: 'wear-active',
        input: { compliment_count: 3 },
      });
    });

    fireEvent.press(getByLabelText('Decrease compliment count'));
    await waitFor(() => {
      expect(mockUpdateWearMutateAsync).toHaveBeenCalledWith({
        id: 'wear-active',
        input: { compliment_count: 1 },
      });
    });
  });

  it('saves the journal note', async () => {
    const { getByDisplayValue, getByText } = render(<Today />);

    fireEvent.changeText(getByDisplayValue('Dinner journal'), 'Great opening, softer by 4pm');
    fireEvent.press(getByText('Save journal'));

    await waitFor(() => {
      expect(mockUpdateWearMutateAsync).toHaveBeenCalledWith({
        id: 'wear-active',
        input: { notes: 'Great opening, softer by 4pm' },
      });
    });
  });

  it('switches active wear from today stack', async () => {
    const { getByLabelText } = render(<Today />);

    fireEvent.press(getByLabelText('Make Tam Dao current'));

    await waitFor(() => {
      expect(mockSetActiveWearMutateAsync).toHaveBeenCalledWith('wear-morning');
    });
  });
});

function todayLocalDateForTest(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
```

Run: `/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand __tests__/TodayTab.test.tsx`

Expected: FAIL because `app/(tabs)/today.tsx` does not exist.

- [ ] **Step 2: Add icon**

Modify `components/ui/Icon.tsx`:

```ts
export const IconZap = makeIcon('zap');
```

- [ ] **Step 3: Add tab route**

Modify `app/(tabs)/_layout.tsx` imports:

```ts
import { IconBarChart, IconBook, IconCalendar, IconPlus, IconZap } from '../../components/ui/Icon';
```

Add between Wears and Insights:

```tsx
<Tabs.Screen
  name="today"
  options={{
    title: 'Today',
    tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]}>Today</Text>,
    tabBarIcon: ({ color }) => <IconZap size={22} color={color} />,
  }}
/>
```

- [ ] **Step 4: Implement Today tab**

Create `app/(tabs)/today.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottleArt } from '../../components/BottleArt';
import { EmptyState } from '../../components/EmptyState';
import { GhostButton, PrimaryButton } from '../../components/ui/Button';
import { Caption, Serif } from '../../components/ui/text';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { useSetActiveWear, useUpdateWear, useWearsQuery } from '../../hooks/useWears';
import { SEASON_LABELS, WEAR_TIME_LABELS } from '../../lib/journal';
import { clampComplimentCount, selectTodayWearState, todayLocalDate } from '../../lib/todayWear';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { TodayWearRow } from '../../lib/todayWear';

export default function Today() {
  const router = useRouter();
  const wears = useWearsQuery();
  const fragrances = useFragrancesQuery();
  const updateWear = useUpdateWear();
  const setActiveWear = useSetActiveWear();
  const today = todayLocalDate();
  const state = useMemo(
    () => selectTodayWearState(wears.data ?? [], fragrances.data ?? [], today),
    [wears.data, fragrances.data, today],
  );
  const active = state.active;
  const [journalText, setJournalText] = useState('');

  useEffect(() => {
    setJournalText(active?.wear.notes ?? '');
  }, [active?.wear.id, active?.wear.notes]);

  const loading = wears.isLoading || fragrances.isLoading;
  const error = wears.error || fragrances.error;

  async function changeCompliments(delta: number) {
    if (!active) return;
    const next = clampComplimentCount((active.wear.compliment_count ?? 0) + delta);
    try {
      await updateWear.mutateAsync({
        id: active.wear.id,
        input: { compliment_count: next },
      });
    } catch (e: any) {
      Alert.alert('Could not update compliments', e.message ?? 'Unknown error');
    }
  }

  async function saveJournal() {
    if (!active) return;
    try {
      await updateWear.mutateAsync({
        id: active.wear.id,
        input: { notes: journalText.trim() ? journalText.trim() : null },
      });
    } catch (e: any) {
      Alert.alert('Could not save journal', e.message ?? 'Unknown error');
    }
  }

  async function makeActive(row: TodayWearRow) {
    try {
      await setActiveWear.mutateAsync(row.wear.id);
    } catch (e: any) {
      Alert.alert('Could not switch current wear', e.message ?? 'Unknown error');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Serif size={18} style={{ letterSpacing: 0.4 }}>
          Today
        </Serif>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <EmptyState
          title="Couldn't load today's wears"
          hint={error instanceof Error ? error.message : 'Unknown error'}
        />
      ) : !active ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="Nothing logged today."
            hint="Log a wear to start tracking compliments and journal notes for the day."
          />
          <View style={styles.emptyActions}>
            <PrimaryButton onPress={() => router.push('/calendar' as never)}>Open Wears</PrimaryButton>
            <GhostButton onPress={() => router.push('/' as never)}>Open Collection</GhostButton>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ActiveWearCard
            row={active}
            journalText={journalText}
            onChangeJournal={setJournalText}
            onSaveJournal={saveJournal}
            onChangeCompliments={changeCompliments}
            saving={updateWear.isPending}
          />
          <View style={styles.stackSection}>
            <Caption style={{ marginBottom: 12 }}>Today’s stack</Caption>
            {state.stack.map((row) => (
              <StackRow
                key={row.wear.id}
                row={row}
                active={row.wear.id === active.wear.id}
                onPress={() => makeActive(row)}
                disabled={setActiveWear.isPending}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ActiveWearCard({
  row,
  journalText,
  onChangeJournal,
  onSaveJournal,
  onChangeCompliments,
  saving,
}: {
  row: TodayWearRow;
  journalText: string;
  onChangeJournal: (value: string) => void;
  onSaveJournal: () => void;
  onChangeCompliments: (delta: number) => void;
  saving: boolean;
}) {
  const count = row.wear.compliment_count ?? 0;
  return (
    <View>
      <Caption style={{ marginBottom: 10 }}>Currently wearing</Caption>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Caption style={{ marginBottom: 8 }}>{row.fragrance?.brand ?? 'Unknown'}</Caption>
          <Serif size={32} style={styles.heroTitle}>
            {row.fragrance?.name ?? 'Unknown bottle'}
          </Serif>
          <Text style={styles.contextLine}>{formatContext(row)}</Text>
        </View>
        <BottleArt imageUrl={row.fragrance?.image_url ?? null} width={104} height={136} />
      </View>

      <View style={styles.complimentPanel}>
        <Caption>Compliments</Caption>
        <View style={styles.complimentControls}>
          <Pressable
            onPress={() => onChangeCompliments(-1)}
            disabled={count <= 0 || saving}
            accessibilityLabel="Decrease compliment count"
            style={[styles.roundButton, (count <= 0 || saving) && styles.roundButtonDisabled]}
          >
            <Text style={styles.roundButtonText}>-</Text>
          </Pressable>
          <Text style={styles.complimentCount}>{count}</Text>
          <Pressable
            onPress={() => onChangeCompliments(1)}
            disabled={saving}
            accessibilityLabel="Increase compliment count"
            style={[styles.roundButton, saving && styles.roundButtonDisabled]}
          >
            <Text style={styles.roundButtonText}>+</Text>
          </Pressable>
        </View>
        {row.wear.compliment_note ? (
          <Text style={styles.complimentNote}>{row.wear.compliment_note}</Text>
        ) : null}
      </View>

      <View style={styles.journalPanel}>
        <Caption style={{ marginBottom: 10 }}>Journal</Caption>
        <TextInput
          value={journalText}
          onChangeText={onChangeJournal}
          placeholder="Quick notes from the day"
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.journalInput}
        />
        <PrimaryButton onPress={onSaveJournal} loading={saving} style={styles.saveButton}>
          Save journal
        </PrimaryButton>
      </View>
    </View>
  );
}

function StackRow({
  row,
  active,
  onPress,
  disabled,
}: {
  row: TodayWearRow;
  active: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const label = row.fragrance?.name ?? 'Unknown bottle';
  return (
    <Pressable
      onPress={onPress}
      disabled={active || disabled}
      accessibilityLabel={`Make ${label} current`}
      style={[styles.stackRow, active && styles.stackRowActive]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Caption style={{ marginBottom: 4 }}>{row.fragrance?.brand ?? 'Unknown'}</Caption>
        <Text style={styles.stackName}>{label}</Text>
        <Text style={styles.stackMeta}>{formatContext(row)}</Text>
      </View>
      <Text style={styles.stackCount}>{row.wear.compliment_count ?? 0}</Text>
    </Pressable>
  );
}

function formatContext(row: TodayWearRow): string {
  const parts = [
    row.wear.time_of_day ? WEAR_TIME_LABELS[row.wear.time_of_day] : null,
    row.wear.season ? SEASON_LABELS[row.wear.season] : null,
    row.wear.occasion,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'No context';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  emptyActions: { gap: 10, marginTop: 18 },
  scroll: { padding: 22, paddingBottom: 40 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  heroText: { flex: 1, minWidth: 0 },
  heroTitle: { lineHeight: 37 },
  contextLine: {
    ...typography.bodyDim,
    color: colors.textMuted,
    marginTop: 10,
  },
  complimentPanel: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 16,
    marginBottom: 14,
  },
  complimentControls: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonDisabled: { opacity: 0.35 },
  roundButtonText: { color: colors.text, fontSize: 28, lineHeight: 30 },
  complimentCount: {
    fontFamily: typography.serif,
    fontSize: 64,
    color: colors.text,
    lineHeight: 68,
  },
  complimentNote: {
    ...typography.bodyDim,
    color: colors.textDim,
    marginTop: 10,
  },
  journalPanel: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 16,
    marginBottom: 24,
  },
  journalInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveButton: { height: 44 },
  stackSection: { marginTop: 4 },
  stackRow: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stackRowActive: { borderColor: colors.accent },
  stackName: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 16,
  },
  stackMeta: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  stackCount: {
    fontFamily: typography.serif,
    color: colors.accent,
    fontSize: 24,
  },
});
```

- [ ] **Step 5: Run Today tab tests**

Run: `/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand __tests__/TodayTab.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/'(tabs)'/today.tsx app/'(tabs)'/_layout.tsx components/ui/Icon.tsx __tests__/TodayTab.test.tsx
git commit -m "Add Today wear tab"
```

---

### Task 4: Docs, Verification, And Smoke Checklist

**Files:**
- Modify: `README.md`
- Modify: `docs/design-spec.md`
- Modify: `docs/manual-smoke-tests.md`
- Modify: `docs/phase-1.5-status.md`

- [ ] **Step 1: Update README scope**

In `README.md`, update the shipped tab line:

```md
- Five-tab personal journal shell: Collection, Wears, Today, Insights, Add
```

Add Today scope:

```md
- Today tab for the active current-day wear, compliment stepper, journal note, and same-day wear stack
```

- [ ] **Step 2: Update design spec**

In `docs/design-spec.md`, add this to the Personal Journal / Insights section:

```md
- Today tab uses `wears.is_active` to select one current wear per user/day.
- Today's newest logged wear becomes active automatically; the user can switch active wear within today's stack.
- Compliment updates and journal notes write back to the active `wears` row so Wears and Insights stay consistent.
```

- [ ] **Step 3: Update manual smoke tests**

In `docs/manual-smoke-tests.md`, add:

```md
## Today

- [ ] Today tab appears between Wears and Insights
- [ ] Empty state renders when no wear exists today
- [ ] Logging a wear for today makes it active in Today
- [ ] Logging a second wear for today switches active to the newest wear and keeps the earlier wear in Today's stack
- [ ] Plus increments compliments for the active wear
- [ ] Minus decrements compliments and is disabled at zero
- [ ] Save journal updates the active wear note
- [ ] Tapping a stack row makes that wear current
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand \
  __tests__/todayWear.test.ts \
  __tests__/TodayTab.test.tsx \
  __tests__/wears.test.ts \
  __tests__/calendarWearEntry.test.tsx \
  __tests__/JournalMigration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```bash
/opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit
/opt/homebrew/bin/node ./node_modules/.bin/expo lint
/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand
git diff --check
```

Expected:

- TypeScript exits `0`.
- Lint exits `0`.
- Jest exits `0`.
- `git diff --check` prints no whitespace errors.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/design-spec.md docs/manual-smoke-tests.md docs/phase-1.5-status.md
git commit -m "Document Today wear tab"
```

---

## Execution Notes

- The workspace currently has uncommitted personal journal roadmap changes. Do not revert them.
- The Today tab depends on the existing personal journal fields from `20260425020000_personal_journal_fields.sql`.
- Apply `20260425020000_personal_journal_fields.sql` before `20260425030000_today_active_wear.sql` in live Supabase.
- If the tab bar becomes visually crowded with five labels, keep the labels for now and address tab density as a separate design slice.
