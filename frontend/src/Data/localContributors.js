/**
 * Στατικοί συντελεστές ανά show_id για άμεση UI απόδοση χωρίς API κλήση.
 * Record για O(1) lookup, fallback σε placeholder για pending ονόματα.
 */

/**
 * @typedef {{ role: string, name: string, imageKey?: string | null }} Συντελεστής
 */

/** @type {Record<number, Συντελεστής[]>} */
export const contributorsByShowId = {
  1: [
    { role: 'Συμμετέχουν', name: 'Αιμίλιος Χειλάκης', imageKey: 'aimilios-cheilakis' },
    { role: 'Συμμετέχουν', name: 'Αθηνά Μαξίμου', imageKey: 'athina-maximou' },
    { role: 'Συμμετέχουν', name: 'Θανάσης Κουρλαμπάς', imageKey: 'thanasis-kourlampas' },
  ],
  2: [
    { role: 'Συμμετέχουν', name: 'Μαρία Πρωτόπαππα', imageKey: 'protopappa' },
    { role: 'Συμμετέχουν', name: 'Δημήτρης Λάλος', imageKey: 'lalos' },
  ],
  3: [
    { role: 'Συμμετέχουν', name: 'Κατερίνα Γερονικολού', imageKey: 'geronikolou' },
    { role: 'Συμμετέχουν', name: 'Γιάννης Τσιμιτσέλης', imageKey: 'tsimitselis' },
  ],
  4: [
    { role: 'Συμμετέχουν', name: 'Βλαδίμηρος Κυριακίδης', imageKey: 'kyriakidis' },
    { role: 'Συμμετέχουν', name: 'Δάφνη Λαμπρόγιαννη', imageKey: 'lamproyianni' },
  ],
  5: [
    { role: 'Συμμετέχουν', name: 'Στέλιος Μάινας', imageKey: 'mainas' },
    { role: 'Συμμετέχουν', name: 'Κάτια Δανδουλάκη', imageKey: 'dandoulaki' },
  ],
};

/**
 * @param {number | string | null | undefined} showId
 * @returns {Συντελεστής[]}
 */
export function getContributorsForShow(showId) {
  const id = Number(showId);
  if (!Number.isFinite(id)) return [];
  return contributorsByShowId[id] ?? [];
}
