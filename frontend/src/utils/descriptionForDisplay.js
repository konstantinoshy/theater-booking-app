/**
 * API/DB descriptions may end with « · Φωτογραφία: file.jpg» (metadata for assets).
 * Strip that suffix for user-facing text; images come from local mapping.
 */
export function descriptionWithoutEmbeddedPhotoFilename(description) {
  if (description == null || typeof description !== 'string') return '';
  let s = description.trim();
  const marker = ' · Φωτογραφία:';
  const i = s.indexOf(marker);
  if (i !== -1) s = s.slice(0, i).trim();
  if (/^Φωτογραφία:\s*\S+$/i.test(s)) return '';
  return s;
}
