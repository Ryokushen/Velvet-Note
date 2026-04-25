import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Scan from '../app/scan';
import { findSupabaseCatalogByBarcode } from '../lib/catalog';

const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockReplace = jest.fn();
const mockRequestPermission = jest.fn();
let mockCameraPermissionGranted = true;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    replace: mockReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-camera', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    CameraView: ({ children, onBarcodeScanned }: any) => (
      <Pressable
        accessibilityLabel="Mock camera scanner"
        onPress={() => onBarcodeScanned?.({ data: 'EAN 3348901321129', type: 'ean13' })}
      >
        <Text>Camera active</Text>
        {children}
      </Pressable>
    ),
    useCameraPermissions: () => [{ granted: mockCameraPermissionGranted }, mockRequestPermission],
  };
});

jest.mock('../lib/catalog', () => ({
  findSupabaseCatalogByBarcode: jest.fn(),
  normalizeBarcode: (value: string) => (value.split(/[:=]/).pop() ?? value).replace(/\D/g, ''),
}));

describe('Scan barcode screen', () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockCanGoBack.mockReset();
    mockCanGoBack.mockReturnValue(true);
    mockReplace.mockReset();
    mockRequestPermission.mockReset();
    mockCameraPermissionGranted = true;
    jest.mocked(findSupabaseCatalogByBarcode).mockReset();
  });

  it('falls back to Add when back is pressed without navigation history', () => {
    mockCameraPermissionGranted = false;
    mockCanGoBack.mockReturnValue(false);
    const { getByLabelText } = render(<Scan />);

    fireEvent.press(getByLabelText('Back to Add'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/add');
  });

  it('looks up a scanned barcode and returns to Add with the matched code', async () => {
    jest.mocked(findSupabaseCatalogByBarcode).mockResolvedValue({
      id: 'catalog-sauvage',
      brand: 'Dior',
      name: 'Sauvage',
      concentration: 'EDT',
      description: '',
      notes: ['Fresh Spicy'],
      notesTop: [],
      notesMiddle: [],
      notesBase: [],
      releaseYear: 2015,
      perfumers: [],
      ratingValue: null,
      ratingCount: null,
      imageUrl: null,
      source: 'barcode_api',
    });

    const { getByLabelText, getByText } = render(<Scan />);

    fireEvent.press(getByLabelText('Mock camera scanner'));

    await waitFor(() => {
      expect(findSupabaseCatalogByBarcode).toHaveBeenCalledWith('3348901321129');
      expect(getByText('Dior')).toBeTruthy();
      expect(getByText('Sauvage')).toBeTruthy();
    });

    fireEvent.press(getByText('Use this match'));

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/add',
      params: { barcode: '3348901321129' },
    });
  });

  it('shows a no-match state for unknown barcodes', async () => {
    jest.mocked(findSupabaseCatalogByBarcode).mockResolvedValue(null);

    const { getByLabelText, getByText } = render(<Scan />);

    fireEvent.press(getByLabelText('Mock camera scanner'));

    await waitFor(() => {
      expect(getByText('No catalog match yet')).toBeTruthy();
      expect(getByText('3348901321129')).toBeTruthy();
    });
  });
});
