/**
 * Local asset images keyed by API theatre name / show title (exact match after trim).
 * Paths: frontend/assets/images/
 */

const theatreByName = {
  'Αθηνών': require('../../assets/images/athinon.jpg'),
  'Ακροπόλ': require('../../assets/images/akropol.jpg'),
  'Art 63': require('../../assets/images/art63.jpg'),
};

const showHeroByTitle = {
  '#Cancel': require('../../assets/images/cancel.jpg'),
  'Ο αγαπητικός της βοσκοπούλας': require('../../assets/images/agapitikos.jpg'),
  'Πολύ καλύτερα τώρα...': require('../../assets/images/poly-kalytera-tora.jpg'),
  'Ο επιθεωρητής Ντρέικ και η μαύρη χήρα': require('../../assets/images/drake-black-widow.jpg'),
  'Το καταφύγιο': require('../../assets/images/to-katafygio.jpg'),
};

const defaultTheatreImage = theatreByName['Αθηνών'];
const defaultShowHeroImage = showHeroByTitle['#Cancel'];

export function resolveTheatreImageSource(name) {
  if (name == null || typeof name !== 'string') return defaultTheatreImage;
  const key = name.trim();
  return theatreByName[key] ?? defaultTheatreImage;
}

export function resolveShowHeroImageSource(title) {
  if (title == null || typeof title !== 'string') return defaultShowHeroImage;
  const key = title.trim();
  return showHeroByTitle[key] ?? defaultShowHeroImage;
}
