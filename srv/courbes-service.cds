using { onee.courbes as db } from '../db/schema';

/**
 * Service principal — expose toutes les entités du modèle ONEE.
 * Les entités composées (Contrat, Compteur, MesureInterval, QualiteDonnee)
 * restent accessibles via navigation ET en accès direct pour les opérations CRUD.
 */
service CourbesChargeService @(path: '/api/courbes') {

  // ── Référentiel ─────────────────────────────────────────────
  entity Client        as projection on db.Client;
  entity Contrat       as projection on db.Contrat;
  entity Compteur      as projection on db.Compteur;

  // ── Imports (FIA) ────────────────────────────────────────────
  entity FIA           as projection on db.FIA;

  // ── Mesures & Qualité ────────────────────────────────────────
  entity MesureInterval as projection on db.MesureInterval;
  entity QualiteDonnee  as projection on db.QualiteDonnee;

}
