namespace onee.courbes;

// ═══════════════════════════════════════════════════════════════
//  ZCC_CADRANS — référentiel des cadrans de compteur
// ═══════════════════════════════════════════════════════════════
entity ZccCadrans {
  key MANDT      : String(3)      default '100';
  key COD_CADRAN : String(10);
  ERNAM          : String(12);
  ERDAT          : Date;
  ERZET          : Time;
  AENAM          : String(12);
  AEDAT          : Date;
  AEZET          : Time;
  LIB_CADRAN     : String(40);
  ACTIF          : String(1);     // O=actif  N=inactif
  COEFF          : Decimal(10,4);
  ORDRE          : Integer;
}

// ═══════════════════════════════════════════════════════════════
//  ZCC_COURBE_CHARGES_INDEXS — relevés bruts par compteur/cadran
// ═══════════════════════════════════════════════════════════════
entity ZccCourbeChargesIndexs {
  key MANDT      : String(3)      default '100';
  key SERGE      : String(20);    // numéro de série compteur
  key DAT_RELEVE : Date;
  key HEU_RELEVE : Time;
  key COD_CADRAN : String(10);
  ERNAM          : String(12);
  ERDAT          : Date;
  ERZET          : Time;
  AENAM          : String(12);
  AEDAT          : Date;
  AEZET          : Time;
  VAL_CADRAN     : Decimal(15,3);
  STATUT         : String(1);     // V=validé  E=erreur  P=en cours
  MESSAGE        : String(220);
  cadran         : Association to ZccCadrans
                   on cadran.MANDT = MANDT and cadran.COD_CADRAN = COD_CADRAN;
}

// ═══════════════════════════════════════════════════════════════
//  ZCC_COURBE_CHARGES_CALCULED — résultats calculés / agrégats
// ═══════════════════════════════════════════════════════════════
entity ZccCourbeChargesCalculed {
  key MANDT             : String(3)   default '100';
  key CLE_METIER        : String(50);
  CHAMPS_AGREGATION     : String(100);
  ERNAM                 : String(12);
  ERDAT                 : Date;
  ERZET                 : Time;
  AENAM                 : String(12);
  AEDAT                 : Date;
  AEZET                 : Time;
  STATUT                : String(1);
  MESSAGE               : String(220);
}
