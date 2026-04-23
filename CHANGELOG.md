# Changelog

## 2026-04-23 - Fix Android sign-in navigation handoff after auth success

### Summary

Resolved a regression where email/password sign-in succeeded against Supabase on Android, but the app appeared to do nothing after the loading spinner stopped. The user remained on the sign-in screen even though Supabase returned a valid session and the client emitted `SIGNED_IN`.

### User-visible symptom

- On Android in Expo Go, tapping `Sign in` showed the button loading spinner briefly and then returned the button to idle.
- No error banner or alert appeared.
- No navigation to the authenticated area occurred.
- Supabase server logs showed `POST /auth/v1/token?grant_type=password` returning `200 OK`.
- Local debugger output later confirmed:
  - `SIGNED_IN` fired
  - `signInWithPassword` returned a session
  - the app still did not transition into the collection UI

### Impact

- Email/password auth was functionally blocked for the refreshed Velvet Note UI flow.
- Existing authenticated sessions could still work, but fresh sign-in was effectively unusable.
- The issue presented as an auth problem, but the failure was in client-side navigation state.

### Root cause

The app mixed Expo Router file-system group paths with Expo Router runtime paths.

Broken assumptions in the pre-fix implementation:

- Auth redirects used file-group paths such as `/(auth)` and `/(tabs)`.
- `AuthGate` inferred whether the user was in the auth flow with:
  - `useSegments()`
  - `segments[0] === '(auth)'`
- Success handlers also navigated to `/(tabs)`.

What Expo Router actually reported at runtime:

- Auth screen pathname: `/sign-in`
- Authenticated root pathname: `/`
- Segments were normalized for runtime navigation and did not reliably expose route-group names the way the file tree suggested.

Net effect:

- Supabase auth completed successfully.
- `SIGNED_IN` fired and a valid session existed locally.
- The old redirect checks never matched the real runtime route state.
- Navigation either never triggered or targeted the wrong path.

### Why the bug was initially misleading

Several early hypotheses were reasonable but ultimately secondary:

- `react-native-svg` native linking after the UI refresh
- `SafeAreaView` / `SafeAreaProvider` interaction
- tabs screen crash during mount
- sign-in component remount racing with auth subscription updates

Those were plausible because the regression arrived during a large design refresh and the first broken experience happened immediately after authentication. The decisive evidence came from instrumenting the auth flow and reducing the authenticated destination to a minimal probe screen:

- `SIGNED_IN` was observed locally
- `signInWithPassword` returned a session locally
- a simple authenticated probe screen rendered once navigation targeted `/`

That isolated the bug to navigation path handling rather than auth transport, native module linking, or the collection screen itself.

### Fix implemented

#### 1. Centralized auth state

Converted auth consumption to a shared provider-backed source so the root layout and screens read the same session snapshot instead of creating independent subscriptions.

Primary file:

- `hooks/useAuth.ts`

#### 2. Switched auth gating to runtime pathname checks

Reworked `AuthGate` to use `usePathname()` and compare against actual runtime routes:

- unauthenticated users are redirected to `/sign-in`
- authenticated users entering the auth flow are redirected to `/`

Primary file:

- `app/_layout.tsx`

#### 3. Fixed post-auth success navigation

Changed sign-in success navigation to use `/` instead of `/(tabs)`.

Primary file:

- `app/(auth)/sign-in.tsx`

#### 4. Fixed remaining bad authenticated redirects

Replaced remaining route-group redirects that pointed to `/(tabs)` with runtime path `/`.

Primary files:

- `app/(tabs)/add.tsx`
- `app/fragrance/[id].tsx`

#### 5. Restored the real collection UI after isolation

During diagnosis, the authenticated route was temporarily replaced with a minimal “Tabs mounted.” probe screen to prove whether auth handoff worked independently of the collection screen. After confirming the navigation fix, the real tab layout and collection screen were restored.

Primary files:

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`

### Files involved in the final fix

- `app/_layout.tsx`
- `app/(auth)/sign-in.tsx`
- `hooks/useAuth.ts`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/add.tsx`
- `app/fragrance/[id].tsx`

### Verification

Verified locally with:

- `npx tsc --noEmit`
- `npm test -- --runInBand --watchman=false`

Observed runtime behavior after fix:

- sign-in succeeds
- `SIGNED_IN` event fires
- app transitions into the authenticated route
- collection UI becomes reachable again

### Operational note

The Expo CLI warning about `jest`, `jest-expo`, and `@types/jest` version drift was unrelated to this bug. It did not cause the sign-in navigation failure.

### Cleanup

Completed before commit:

- removed the temporary auth debugging `console.log` statements from the auth provider, root layout, and sign-in screen after confirming the fix
