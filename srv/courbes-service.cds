using { onee.courbes as db } from '../db/schema';

service CourbesService @(path: '/odata/v4/courbes') {

  // ── Référentiel ──────────────────────────────────────────────
  entity ZccCadrans               as projection on db.ZccCadrans;

  // ── Relevés bruts ────────────────────────────────────────────
  entity ZccCourbeChargesIndexs   as projection on db.ZccCourbeChargesIndexs;

  // ── Résultats calculés ───────────────────────────────────────
  entity ZccCourbeChargesCalculed as projection on db.ZccCourbeChargesCalculed;

  // ── Action d'import ──────────────────────────────────────────
  action importerFichier(
    serge         : String,
    nomFichier    : String,
    contenuBase64 : LargeString
  ) returns {
    cleMetier     : String;
    statut        : String;
    formatDetecte : String;
    nbLignes      : Integer;
    nbAnomalies   : Integer;
    message       : String;
  };

}
