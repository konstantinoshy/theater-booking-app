/**
 * Στατικός χάρτης πορτρέτων με bundling για performance.
 * Fallback σε ουδέτερο placeholder για μη διαθέσιμες φωτογραφίες.
 */

const portraitPlaceholder = require('../../assets/images/cast/portrait-placeholder.jpg');

/** @type {Record<string, number>} */
const castImagesByKey = {
  'aimilios-cheilakis': require('../../assets/images/cast/aimilios-cheilakis.jpg'),
  'athina-maximou': require('../../assets/images/cast/athina-maximou.jpg'),
  'thanasis-kourlampas': require('../../assets/images/cast/thanasis-kourlampas.jpg'),
  'dandoulaki': require('../../assets/images/cast/dandoulaki.jpg'),
  'geronikolou': require('../../assets/images/cast/geronikolou.jpg'),
  'kyriakidis': require('../../assets/images/cast/kyriakidis.jpg'),
  'lalos': require('../../assets/images/cast/lalos.jpg'),
  'lamproyianni': require('../../assets/images/cast/lamproyianni.jpg'),
  'mainas': require('../../assets/images/cast/mainas.jpg'),
  'protopappa': require('../../assets/images/cast/protopappa.jpg'),
  'tsimitselis': require('../../assets/images/cast/tsimitselis.jpg'),
};

/**
 * Επιστρέφει asset ID πορτρέτου ή placeholder.
 * @param {string | null | undefined} imageKey
 * @returns {number}
 */
export function resolveCastPortrait(imageKey) {
  if (imageKey != null && castImagesByKey[imageKey]) {
    return castImagesByKey[imageKey];
  }
  return portraitPlaceholder;
}
