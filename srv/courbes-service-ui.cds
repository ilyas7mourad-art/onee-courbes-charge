using CourbesService from './courbes-service';

// ═══════════════════════════════════════════════════════════════
//  ZccCourbeChargesIndexs — écran principal ZCC_DISPLAY_AMI
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.ZccCourbeChargesIndexs with @(

  UI.HeaderInfo: {
    TypeName      : 'Relevé',
    TypeNamePlural: 'Relevés de courbe de charge',
    Title      : { $Type: 'UI.DataField', Value: SERGE      },
    Description: { $Type: 'UI.DataField', Value: DAT_RELEVE }
  },

  UI.SelectionFields: [ SERGE, COD_CADRAN, STATUT, DAT_RELEVE ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: SERGE,      Label: 'N° série'     },
    { $Type: 'UI.DataField', Value: DAT_RELEVE, Label: 'Date relevé'  },
    { $Type: 'UI.DataField', Value: HEU_RELEVE, Label: 'Heure relevé' },
    { $Type: 'UI.DataField', Value: COD_CADRAN, Label: 'Cadran'       },
    { $Type: 'UI.DataField', Value: VAL_CADRAN, Label: 'Valeur'       },
    {
      $Type      : 'UI.DataField',
      Value      : STATUT,
      Label      : 'Statut',
      Criticality: statutCriticality   // V=vert A=orange E=rouge
    },
    { $Type: 'UI.DataField', Value: MESSAGE, Label: 'Message QC' }
  ],

  UI.FieldGroup #DonneesReleve: {
    $Type: 'UI.FieldGroupType',
    Label: 'Données de relevé',
    Data : [
      { $Type: 'UI.DataField', Value: MANDT,      Label: 'Mandant'       },
      { $Type: 'UI.DataField', Value: SERGE,      Label: 'N° série'      },
      { $Type: 'UI.DataField', Value: DAT_RELEVE, Label: 'Date relevé'   },
      { $Type: 'UI.DataField', Value: HEU_RELEVE, Label: 'Heure relevé'  },
      { $Type: 'UI.DataField', Value: COD_CADRAN, Label: 'Cadran'        },
      { $Type: 'UI.DataField', Value: VAL_CADRAN, Label: 'Valeur cadran' },
      {
        $Type      : 'UI.DataField',
        Value      : STATUT,
        Label      : 'Statut QC',
        Criticality: statutCriticality
      },
      { $Type: 'UI.DataField', Value: MESSAGE, Label: 'Message QC' }
    ]
  },

  UI.FieldGroup #AuditReleve: {
    $Type: 'UI.FieldGroupType',
    Label: 'Audit',
    Data : [
      { $Type: 'UI.DataField', Value: ERNAM, Label: 'Créé par'       },
      { $Type: 'UI.DataField', Value: ERDAT, Label: 'Date création'  },
      { $Type: 'UI.DataField', Value: ERZET, Label: 'Heure création' },
      { $Type: 'UI.DataField', Value: AENAM, Label: 'Modifié par'    },
      { $Type: 'UI.DataField', Value: AEDAT, Label: 'Date modif.'    },
      { $Type: 'UI.DataField', Value: AEZET, Label: 'Heure modif.'   }
    ]
  },

  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'DonneesReleveFacet',
      Label : 'Données de relevé',
      Target: '@UI.FieldGroup#DonneesReleve'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'AuditReleveFacet',
      Label : 'Audit',
      Target: '@UI.FieldGroup#AuditReleve'
    }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  ZccCadrans — référentiel des cadrans
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.ZccCadrans with @(

  UI.HeaderInfo: {
    TypeName      : 'Cadran',
    TypeNamePlural: 'Cadrans',
    Title      : { $Type: 'UI.DataField', Value: COD_CADRAN },
    Description: { $Type: 'UI.DataField', Value: LIB_CADRAN }
  },

  UI.SelectionFields: [ COD_CADRAN, ACTIF ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: COD_CADRAN, Label: 'Code cadran' },
    { $Type: 'UI.DataField', Value: LIB_CADRAN, Label: 'Libellé'     },
    { $Type: 'UI.DataField', Value: ACTIF,      Label: 'Actif'       },
    { $Type: 'UI.DataField', Value: COEFF,      Label: 'Coefficient' },
    { $Type: 'UI.DataField', Value: ORDRE,      Label: 'Ordre'       }
  ],

  UI.FieldGroup #InfoCadran: {
    $Type: 'UI.FieldGroupType',
    Label: 'Informations cadran',
    Data : [
      { $Type: 'UI.DataField', Value: MANDT,      Label: 'Mandant'     },
      { $Type: 'UI.DataField', Value: COD_CADRAN, Label: 'Code cadran' },
      { $Type: 'UI.DataField', Value: LIB_CADRAN, Label: 'Libellé'     },
      { $Type: 'UI.DataField', Value: ACTIF,      Label: 'Actif'       },
      { $Type: 'UI.DataField', Value: COEFF,      Label: 'Coefficient' },
      { $Type: 'UI.DataField', Value: ORDRE,      Label: 'Ordre'       }
    ]
  },

  UI.FieldGroup #AuditCadran: {
    $Type: 'UI.FieldGroupType',
    Label: 'Audit',
    Data : [
      { $Type: 'UI.DataField', Value: ERNAM, Label: 'Créé par'       },
      { $Type: 'UI.DataField', Value: ERDAT, Label: 'Date création'  },
      { $Type: 'UI.DataField', Value: ERZET, Label: 'Heure création' },
      { $Type: 'UI.DataField', Value: AENAM, Label: 'Modifié par'    },
      { $Type: 'UI.DataField', Value: AEDAT, Label: 'Date modif.'    },
      { $Type: 'UI.DataField', Value: AEZET, Label: 'Heure modif.'   }
    ]
  },

  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'InfoCadranFacet',
      Label : 'Informations cadran',
      Target: '@UI.FieldGroup#InfoCadran'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'AuditCadranFacet',
      Label : 'Audit',
      Target: '@UI.FieldGroup#AuditCadran'
    }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  ZccCourbeChargesCalculed — puissances maximales par tranche
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.ZccCourbeChargesCalculed with @(

  UI.HeaderInfo: {
    TypeName      : 'Puissance maximale',
    TypeNamePlural: 'Puissances maximales par tranche',
    Title      : { $Type: 'UI.DataField', Value: serge     },
    Description: { $Type: 'UI.DataField', Value: codCadran }
  },

  UI.SelectionFields: [ serge, codCadran, saison ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: serge,     Label: 'Compteur (NSF)' },
    { $Type: 'UI.DataField', Value: codCadran, Label: 'Tranche'        },
    { $Type: 'UI.DataField', Value: pmax,      Label: 'Pmax (kW)'      },
    { $Type: 'UI.DataField', Value: datePmax,  Label: 'Date'           },
    { $Type: 'UI.DataField', Value: heurePmax, Label: 'Heure'          },
    { $Type: 'UI.DataField', Value: saison,    Label: 'Saison'         },
    {
      $Type      : 'UI.DataField',
      Value      : STATUT,
      Label      : 'Statut',
      Criticality: statutCriticality
    }
  ],

  UI.FieldGroup #InfoPmax: {
    $Type: 'UI.FieldGroupType',
    Label: 'Puissance maximale',
    Data : [
      { $Type: 'UI.DataField', Value: serge,     Label: 'Compteur (NSF)'  },
      { $Type: 'UI.DataField', Value: codCadran, Label: 'Tranche'         },
      { $Type: 'UI.DataField', Value: pmax,      Label: 'Pmax (kW)'       },
      { $Type: 'UI.DataField', Value: datePmax,  Label: 'Date du Pmax'    },
      { $Type: 'UI.DataField', Value: heurePmax, Label: 'Heure du Pmax'   },
      { $Type: 'UI.DataField', Value: saison,    Label: 'Saison'          },
      {
        $Type      : 'UI.DataField',
        Value      : STATUT,
        Label      : 'Statut',
        Criticality: statutCriticality
      },
      { $Type: 'UI.DataField', Value: MESSAGE,           Label: 'Message'          },
      { $Type: 'UI.DataField', Value: CLE_METIER,        Label: 'Clé métier'       },
      { $Type: 'UI.DataField', Value: CHAMPS_AGREGATION, Label: 'Champs agrégation'}
    ]
  },

  UI.FieldGroup #AuditPmax: {
    $Type: 'UI.FieldGroupType',
    Label: 'Audit',
    Data : [
      { $Type: 'UI.DataField', Value: ERNAM, Label: 'Créé par'       },
      { $Type: 'UI.DataField', Value: ERDAT, Label: 'Date création'  },
      { $Type: 'UI.DataField', Value: ERZET, Label: 'Heure création' },
      { $Type: 'UI.DataField', Value: AENAM, Label: 'Modifié par'    },
      { $Type: 'UI.DataField', Value: AEDAT, Label: 'Date modif.'    },
      { $Type: 'UI.DataField', Value: AEZET, Label: 'Heure modif.'   }
    ]
  },

  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'InfoPmaxFacet',
      Label : 'Puissance maximale',
      Target: '@UI.FieldGroup#InfoPmax'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'AuditPmaxFacet',
      Label : 'Audit',
      Target: '@UI.FieldGroup#AuditPmax'
    }
  ]
);
