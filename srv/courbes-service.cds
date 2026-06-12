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
  // statutCriticality : champ calculé (1=rouge, 2=orange, 3=vert) utilisé par Fiori Elements
  entity FIA as projection on db.FIA {
    *,
    case statut
      when 'VALIDE'   then 3
      when 'ERREUR'   then 1
      when 'EN_COURS' then 2
      else                 0
    end as statutCriticality : Integer
  };

  // ── Mesures & Qualité ────────────────────────────────────────
  entity MesureInterval as projection on db.MesureInterval;
  entity QualiteDonnee  as projection on db.QualiteDonnee;

  // ── Action d'import de fichier compteur ──────────────────────
  action importerFichier(
    compteurID    : UUID,
    nomFichier    : String,
    contenuBase64 : LargeString
  ) returns {
    fiaId         : UUID;
    statut        : String;
    formatDetecte : String;
    nbLignes      : Integer;
    nbAnomalies   : Integer;
    message       : String;
  };

}