using { onee.courbes as db } from '../db/schema';

/**
 * Service OData V4 principal — gestion des courbes de charge ONEE.
 * Expose toutes les entités en projection directe.
 */
service CourbesService @(path: '/odata/v4/courbes') {

  // ── Référentiel ──────────────────────────────────────────────
  entity Client        as projection on db.Client;
  entity Contrat       as projection on db.Contrat;
  entity Compteur      as projection on db.Compteur;

  // ── Imports (FIA) ────────────────────────────────────────────
  entity FIA           as projection on db.FIA;

  // ── Mesures & Qualité ────────────────────────────────────────
  entity MesureInterval as projection on db.MesureInterval;
  entity QualiteDonnee  as projection on db.QualiteDonnee;

}
