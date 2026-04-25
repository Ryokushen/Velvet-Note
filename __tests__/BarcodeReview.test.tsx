import { fireEvent, render, waitFor } from '@testing-library/react-native';
import BarcodeReview from '../app/barcode-review';
import {
  approveCatalogBarcodeSubmission,
  listPendingCatalogBarcodeSubmissions,
  rejectCatalogBarcodeSubmission,
} from '../lib/catalog';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../lib/catalog', () => ({
  approveCatalogBarcodeSubmission: jest.fn(),
  listPendingCatalogBarcodeSubmissions: jest.fn(),
  rejectCatalogBarcodeSubmission: jest.fn(),
}));

const pendingSubmission = {
  id: 'submission-1',
  barcode: '3348901321129',
  catalogFragranceId: 'catalog-sauvage',
  catalogBrand: 'Dior',
  catalogName: 'Sauvage',
  submittedUserId: 'user-1',
  status: 'pending' as const,
  source: 'app_scan',
  reviewerNote: null,
  createdAt: '2026-04-25T12:00:00Z',
};

describe('Barcode review screen', () => {
  beforeEach(() => {
    jest.mocked(approveCatalogBarcodeSubmission).mockReset();
    jest.mocked(approveCatalogBarcodeSubmission).mockResolvedValue(undefined);
    jest.mocked(listPendingCatalogBarcodeSubmissions).mockReset();
    jest.mocked(listPendingCatalogBarcodeSubmissions).mockResolvedValue([pendingSubmission]);
    jest.mocked(rejectCatalogBarcodeSubmission).mockReset();
    jest.mocked(rejectCatalogBarcodeSubmission).mockResolvedValue(undefined);
  });

  it('loads pending barcode submissions for review', async () => {
    const { getByText } = render(<BarcodeReview />);

    await waitFor(() => {
      expect(listPendingCatalogBarcodeSubmissions).toHaveBeenCalledWith(50);
      expect(getByText('3348901321129')).toBeTruthy();
      expect(getByText('Dior')).toBeTruthy();
      expect(getByText('Sauvage')).toBeTruthy();
    });
  });

  it('approves a pending barcode submission with a review note', async () => {
    const { getByPlaceholderText, getByText } = render(<BarcodeReview />);

    await waitFor(() => {
      expect(getByText('Sauvage')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Review note'), 'Box label matches');
    fireEvent.press(getByText('Approve'));

    await waitFor(() => {
      expect(approveCatalogBarcodeSubmission).toHaveBeenCalledWith(
        'submission-1',
        'Box label matches',
      );
      expect(listPendingCatalogBarcodeSubmissions).toHaveBeenCalledTimes(2);
    });
  });

  it('rejects a pending barcode submission with a review note', async () => {
    const { getByPlaceholderText, getByText } = render(<BarcodeReview />);

    await waitFor(() => {
      expect(getByText('Sauvage')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Review note'), 'Wrong flanker');
    fireEvent.press(getByText('Reject'));

    await waitFor(() => {
      expect(rejectCatalogBarcodeSubmission).toHaveBeenCalledWith(
        'submission-1',
        'Wrong flanker',
      );
      expect(listPendingCatalogBarcodeSubmissions).toHaveBeenCalledTimes(2);
    });
  });

  it('shows authorization errors from the review RPC', async () => {
    jest.mocked(listPendingCatalogBarcodeSubmissions).mockRejectedValue(
      new Error('Not authorized'),
    );

    const { getByText } = render(<BarcodeReview />);

    await waitFor(() => {
      expect(getByText('Not authorized')).toBeTruthy();
    });
  });
});
