namespace onee.courbes;

using { cuid, managed } from '@sap/cds/common';

// ═══════════════════════════════════════════════════════════════
//  RÉFÉRENTIEL CLIENTS & CONTRATS
// ═══════════════════════════════════════════════════════════════

/** Client Grands Comptes de l'ONEE */
entity Client : cuid, managed {
  nomClient       : String(100) not null;
  secteurActivite : String(50);
  contrats        : Composition of many Contrat on contrats.client = $self;
}

/** Contrat d'abonnement liant un client à des conditions tarifaires */
entity Contrat : cuid, managed {
  client             : Association to Client;
  numeroContrat      : String(50) not null;
  cosPhi             : Decimal(4,3);   // facteur de puissance contractuel
  puissanceSouscrite : Decimal(10,2);  // kVA
  dateDebut          : Date;
  dateFin            : Date;
  compteurs          : Composition of many Compteur on compteurs.contrat = $self;
}

// ═══════════════════════════════════════════════════════════════
//  ÉQUIPEMENTS DE MESURE
// ═══════════════════════════════════════════════════════════════

/** Compteur physique rattaché à un contrat */
entity Compteur : cuid, managed {
  contrat      : Association to Contrat;
  meterID      : String(50) not null;  // identifiant fichier .prn
  numeroSerie  : String(50);           // n° série CLOU
  typeCompteur : String(20);           // ELSTER ou CLOU
  marque       : String(50);
  modele       : String(50);
  localisation : String(100);
  datePose     : Date;
}

// ═══════════════════════════════════════════════════════════════
//  IMPORTS & TRAITEMENT (FIA)
// ═══════════════════════════════════════════════════════════════

/**
 * Fiche Information Appareil — générée à chaque import de fichier.
 * Centralise les métadonnées du fichier et les résultats du traitement.
 */
entity FIA : cuid, managed {
  compteur              : Association to Compteur;
  contrat               : Association to Contrat;
  nomFichier            : String(255);
  formatFichier         : String(10);   // prn | xlsx
  sousTypeXlsx          : String(20);   // instantane | moyen | null
  statut                : String(20) default 'EN_COURS';  // EN_COURS | VALIDE | ERREUR
  nbLignesImportees     : Integer;
  nbAnomalies           : Integer;
  puissanceActiveKw     : Decimal(10,3);
  puissanceApparenteKva : Decimal(10,3);
  psEstimeeKva          : Decimal(10,2);
  ajustementKva         : Decimal(10,2);
  mesures               : Composition of many MesureInterval on mesures.fia = $self;
  anomalies             : Composition of many QualiteDonnee  on anomalies.fia = $self;
}

// ═══════════════════════════════════════════════════════════════
//  RELEVÉS DE MESURE
// ═══════════════════════════════════════════════════════════════

/** Relevé élémentaire à pas de 10 minutes */
entity MesureInterval : cuid {
  fia                  : Association to FIA;
  compteur             : Association to Compteur;
  horodatage           : Timestamp not null;
  dureeIntervalleMin   : Integer   default 10;
  energieActiveKwh     : Decimal(12,4);
  energieReactiveKvarh : Decimal(12,4);
  puissanceActiveKw    : Decimal(10,3);
  puissanceReactiveKvar: Decimal(10,3);
  sourceFormat         : String(20);  // prn | xlsx_instantane | xlsx_moyen
  etatCourbe           : String(10);  // FST | PDN | null
  flagAnomalie         : Boolean default false;
}

// ═══════════════════════════════════════════════════════════════
//  QUALITÉ DES DONNÉES
// ═══════════════════════════════════════════════════════════════

/** Anomalie détectée lors de l'import ou de la validation d'une FIA */
entity QualiteDonnee : cuid, managed {
  fia                : Association to FIA;
  mesure             : Association to MesureInterval;  // nullable : anomalie de niveau FIA si absent
  typeAnomalie       : String(30);   // LACUNE | VALEUR_NULLE | DOUBLON |
                                     // FORMAT_INVALIDE | STATUT_PANNE | VALEUR_NEGATIVE
  horodatageAnomalie : Timestamp;
  description        : String;       // LargeString — texte libre de diagnostic
}
