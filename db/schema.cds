namespace onee.courbes;

using { cuid, managed } from '@sap/cds/common';

// ─────────────────────────────────────────────
//  Entités principales
// ─────────────────────────────────────────────

/** Point de comptage (PDC) identifié par son numéro de compteur */
entity PointComptage : cuid, managed {
  numeroCompteur  : String(30) not null;
  description     : String(100);
  typeCompteur    : String(20); // monophase, triphase, etc.
  tension         : Decimal(10,2); // kV
  puissanceSouscrite : Decimal(10,2); // kVA
  courbesCharge   : Association to many CourbeCharge on courbesCharge.pointComptage = $self;
}

/** Courbe de charge : ensemble de relevés pour un PDC sur une période */
entity CourbeCharge : cuid, managed {
  pointComptage   : Association to PointComptage;
  dateDebut       : Date;
  dateFin         : Date;
  pas             : Integer default 30; // pas en minutes (15, 30, 60)
  statut          : String(20) default 'BRUT';  // BRUT, VALIDE, CORRIGE
  releves         : Composition of many Releve on releves.courbeCharge = $self;
}

/** Relevé élémentaire : valeur de puissance à un instant T */
entity Releve : cuid {
  courbeCharge    : Association to CourbeCharge;
  horodatage      : DateTime not null;
  puissanceActive : Decimal(12,4);  // kW
  puissanceReactive : Decimal(12,4); // kVAr
  energie         : Decimal(12,4);  // kWh sur le pas
  qualite         : String(10) default 'OK'; // OK, ESTIME, MANQUANT
}
