import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { AuthGate } from '../app/_layout';

const mockReplace = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('expo-router', () => ({
  Stack: ({ children }: { children: React.ReactNode }) => children,
  usePathname: () => '/',
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => [],
}));

jest.mock('../hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
}));

describe('AuthGate', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockUseAuth.mockReturnValue({ session: null, loading: true });
  });

  it('does not render protected content while auth state is loading', () => {
    const { queryByText } = render(
      <AuthGate>
        <Text>Protected tabs</Text>
      </AuthGate>,
    );

    expect(queryByText('Protected tabs')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
