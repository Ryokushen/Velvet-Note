export const colors = {
  background: '#0F0E0D',
  surface: '#1A1917',
  surfaceElevated: '#252320',
  border: '#2F2C28',
  borderSoft: '#221F1C',
  text: '#EDE6DA',
  textDim: '#B5AD9E',
  textMuted: '#7F7869',
  accent: '#8B3A3A',
  accentMuted: '#5E2828',
  error: '#C4594F',
  success: '#6A8E5A',
} as const;

// Alpha variant of a token hex color — use instead of re-hardcoding rgba()
// literals that silently drift when the token changes.
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
