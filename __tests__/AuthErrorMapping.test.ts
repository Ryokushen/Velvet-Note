jest.mock('../lib/supabase', () => ({ supabase: { auth: {} } }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));

import { mapAuthError } from '../app/(auth)/sign-in';

describe('mapAuthError', () => {
  it('maps invalid credentials to on-brand copy', () => {
    const result = mapAuthError('Invalid login credentials', 'signin');
    expect(result.toLowerCase()).toContain('match');
    expect(result).not.toContain('Invalid login credentials');
  });

  it('maps an unconfirmed email with recovery guidance', () => {
    const result = mapAuthError('Email not confirmed', 'signin');
    expect(result.toLowerCase()).toContain('confirm');
  });

  it('maps an already-registered email to a sign-in nudge', () => {
    const result = mapAuthError('User already registered', 'signup');
    expect(result.toLowerCase()).toContain('already exists');
  });

  it('maps network failures to a connection message', () => {
    const result = mapAuthError('AuthRetryableFetchError: network request failed', 'signin');
    expect(result.toLowerCase()).toContain('connection');
  });

  it('falls back to a calm generic line that never leaks internals', () => {
    const raw = 'PGRST500: internal database exception at row 42';
    const signin = mapAuthError(raw, 'signin');
    const signup = mapAuthError(raw, 'signup');
    expect(signin).not.toContain(raw);
    expect(signin.toLowerCase()).toContain('signing in');
    expect(signup.toLowerCase()).toContain('creating your account');
  });
});
