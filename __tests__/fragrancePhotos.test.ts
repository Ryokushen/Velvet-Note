import { supabase } from '../lib/supabase';
import { uploadPersonalFragrancePhoto } from '../lib/fragrancePhotos';

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('personal fragrance photo uploads', () => {
  const upload = jest.fn();
  const getPublicUrl = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-24T12:30:00Z'));
    jest.mocked(supabase.auth.getUser).mockReset();
    jest.mocked(supabase.storage.from).mockReset();
    upload.mockReset();
    getPublicUrl.mockReset();

    jest.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as never);
    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockReturnValue({
      data: {
        publicUrl: 'https://example.supabase.co/storage/v1/object/public/user-fragrance-photos/user-1/fragrance-1-1777033800000.jpg',
      },
    });
    jest.mocked(supabase.storage.from).mockReturnValue({
      upload,
      getPublicUrl,
    } as never);

    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['photo'], { type: 'image/jpeg' })),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uploads a selected photo into the user-owned storage path and returns its public URL', async () => {
    const url = await uploadPersonalFragrancePhoto(
      {
        uri: 'file:///tmp/photo.jpg',
        mimeType: 'image/jpeg',
      },
      'fragrance-1',
    );

    expect(supabase.storage.from).toHaveBeenCalledWith('user-fragrance-photos');
    expect(upload).toHaveBeenCalledWith(
      'user-1/fragrance-1-1777033800000.jpg',
      expect.any(Blob),
      {
        contentType: 'image/jpeg',
        upsert: true,
      },
    );
    expect(getPublicUrl).toHaveBeenCalledWith('user-1/fragrance-1-1777033800000.jpg');
    expect(url).toBe(
      'https://example.supabase.co/storage/v1/object/public/user-fragrance-photos/user-1/fragrance-1-1777033800000.jpg',
    );
  });
});
