import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

/**
 * Converts a local image URI to a base64 data URI string.
 * Stored directly in Firestore — no Firebase Storage needed (free tier friendly).
 * Images are compressed via ImagePicker (quality: 0.3) before reaching here.
 */
export async function convertPhotoToBase64(uri: string): Promise<string> {
  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}
