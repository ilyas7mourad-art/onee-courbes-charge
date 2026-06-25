using { onee.courbes as db } from '../db/schema';

service CourbesService @(path: '/odata/v4/courbes') {

  // ── Référentiel cadrans ──────────────────────────────────────
  entity ZccCadrans               as projection on db.ZccCadrans;

  // ── Relevés bruts (écran principal ZCC_DISPLAY_AMI) ──────────
  // statutCriticality : champ calculé pour la coloration Fiori
  //   V→3 (vert)  A→2 (orange)  E→1 (rouge)
  entity ZccCourbeChargesIndexs as projection on db.ZccCourbeChargesIndexs {
    *,
    case STATUT
      when 'V' then 3
      when 'A' then 2
      when 'E' then 1
      else          0
    end as statutCriticality : Integer
  };

  // ── Résultats calculés ───────────────────────────────────────
  entity ZccCourbeChargesCalculed as projection on db.ZccCourbeChargesCalculed {
    *,
    case STATUT
      when 'V' then 3
      when 'A' then 2
      when 'E' then 1
      else          0
    end as statutCriticality : Integer
  };

  // ── Action d'import ──────────────────────────────────────────
  action importerFichier(
    serge         : String,
    nomFichier    : String,
    contenuBase64 : LargeString
  ) returns {
    cleMetier       : String;
    statut          : String;
    formatDetecte   : String;
    nbLignes        : Integer;
    nbAnomalies     : Integer;
    nbPmaxCalcules  : Integer;
    message         : String;
  };

  // ── Actions simulateur temps réel ────────────────────────────
  type SimulateurStatus {
    statut       : String;   // 'active' | 'inactive'
    nbReleves    : Integer;
    heureSimulee : String;   // 'YYYY-MM-DD HH:MM' | '--'
    message      : String;
  }

  action   demarrerSimulation() returns SimulateurStatus;
  action   arreterSimulation()  returns SimulateurStatus;
  action   resetSimulation()    returns SimulateurStatus;
  function statutSimulation()   returns SimulateurStatus;

}
