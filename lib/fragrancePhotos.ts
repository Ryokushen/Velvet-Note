import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export const PERSONAL_FRAGRANCE_PHOTOS_BUCKET = 'user-fragrance-photos';

export type PersonalPhotoSelection = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  file?: Blob | File | null;
};

export async function pickPersonalFragrancePhoto(): Promise<PersonalPhotoSelection | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library access is required to attach a bottle photo.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    exif: false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
    file: asset.file ?? null,
  };
}

export async function uploadPersonalFragrancePhoto(
  selection: PersonalPhotoSelection,
  namespace: string,
): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('Not authenticated');
  }

  const contentType = inferContentType(selection);
  const path = `${userId}/${safeNamespace(namespace)}-${Date.now()}.${extensionForContentType(contentType)}`;
  const body = await uploadBodyForSelection(selection);
  const { error } = await supabase.storage
    .from(PERSONAL_FRAGRANCE_PHOTOS_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrl } = supabase.storage
    .from(PERSONAL_FRAGRANCE_PHOTOS_BUCKET)
    .getPublicUrl(path);
  return publicUrl.publicUrl;
}

async function uploadBodyForSelection(selection: PersonalPhotoSelection): Promise<Blob | File> {
  if (selection.file) {
    return selection.file;
  }

  const response = await fetch(selection.uri);
  return response.blob();
}

function inferContentType(selection: PersonalPhotoSelection): string {
  if (selection.mimeType?.startsWith('image/')) {
    return selection.mimeType;
  }

  const lowerName = `${selection.fileName ?? selection.uri}`.toLowerCase();
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function extensionForContentType(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

function safeNamespace(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'photo';
}
