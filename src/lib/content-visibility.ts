export function isContentVisible(data: { publish: boolean; preview?: boolean }) {
  return data.publish || (import.meta.env.DEV && data.preview === true);
}
