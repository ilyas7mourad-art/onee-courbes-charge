using CourbesService from './courbes-service';

// ═══════════════════════════════════════════════════════════════
//  ZccCadrans
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
    { $Type: 'UI.DataField', Value: COD_CADRAN, Label: 'Code cadran'  },
    { $Type: 'UI.DataField', Value: LIB_CADRAN, Label: 'Libellé'      },
    { $Type: 'UI.DataField', Value: ACTIF,      Label: 'Actif'        },
    { $Type: 'UI.DataField', Value: COEFF,      Label: 'Coefficient'  },
    { $Type: 'UI.DataField', Value: ORDRE,      Label: 'Ordre'        }
  ],
  UI.FieldGroup #InfoCadran: {
    $Type: 'UI.FieldGroupType',
    Label: 'Informations cadran',
    Data : [
      { $Type: 'UI.DataField', Value: MANDT,      Label: 'Mandant'      },
      { $Type: 'UI.DataField', Value: COD_CADRAN, Label: 'Code cadran'  },
      { $Type: 'UI.DataField', Value: LIB_CADRAN, Label: 'Libellé'      },
      { $Type: 'UI.DataField', Value: ACTIF,      Label: 'Actif'        },
      { $Type: 'UI.DataField', Value: COEFF,      Label: 'Coefficient'  },
      { $Type: 'UI.DataField', Value: ORDRE,      Label: 'Ordre'        }
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
//  ZccCourbeChargesIndexs
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.ZccCourbeChargesIndexs with @(
  UI.HeaderInfo: {
    TypeName      : 'Relevé d''index',
    TypeNamePlural: 'Relevés d''index',
    Title      : { $Type: 'UI.DataField', Value: SERGE      },
    Description: { $Type: 'UI.DataField', Value: DAT_RELEVE }
  },
  UI.SelectionFields: [ SERGE, DAT_RELEVE, COD_CADRAN, STATUT ],
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: SERGE,      Label: 'N° série'      },
    { $Type: 'UI.DataField', Value: DAT_RELEVE, Label: 'Date relevé'   },
    { $Type: 'UI.DataField', Value: HEU_RELEVE, Label: 'Heure relevé'  },
    { $Type: 'UI.DataField', Value: COD_CADRAN, Label: 'Cadran'        },
    { $Type: 'UI.DataField', Value: VAL_CADRAN, Label: 'Valeur'        },
    { $Type: 'UI.DataField', Value: STATUT,     Label: 'Statut'        },
    { $Type: 'UI.DataField', Value: MESSAGE,    Label: 'Message'       }
  ],
  UI.FieldGroup #InfoIndex: {
    $Type: 'UI.FieldGroupType',
    Label: 'Données de relevé',
    Data : [
      { $Type: 'UI.DataField', Value: MANDT,      Label: 'Mandant'       },
      { $Type: 'UI.DataField', Value: SERGE,      Label: 'N° série'      },
      { $Type: 'UI.DataField', Value: DAT_RELEVE, Label: 'Date relevé'   },
      { $Type: 'UI.DataField', Value: HEU_RELEVE, Label: 'Heure relevé'  },
      { $Type: 'UI.DataField', Value: COD_CADRAN, Label: 'Cadran'        },
      { $Type: 'UI.DataField', Value: VAL_CADRAN, Label: 'Valeur cadran' },
      { $Type: 'UI.DataField', Value: STATUT,     Label: 'Statut'        },
      { $Type: 'UI.DataField', Value: MESSAGE,    Label: 'Message'       }
    ]
  },
  UI.FieldGroup #AuditIndex: {
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
      ID    : 'InfoIndexFacet',
      Label : 'Données de relevé',
      Target: '@UI.FieldGroup#InfoIndex'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'AuditIndexFacet',
      Label : 'Audit',
      Target: '@UI.FieldGroup#AuditIndex'
    }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  ZccCourbeChargesCalculed
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.ZccCourbeChargesCalculed with @(
  UI.HeaderInfo: {
    TypeName      : 'Résultat calculé',
    TypeNamePlural: 'Résultats calculés',
    Title      : { $Type: 'UI.DataField', Value: CLE_METIER        },
    Description: { $Type: 'UI.DataField', Value: CHAMPS_AGREGATION }
  },
  UI.SelectionFields: [ CLE_METIER, STATUT, ERDAT ],
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: CLE_METIER,        Label: 'Clé métier'        },
    { $Type: 'UI.DataField', Value: CHAMPS_AGREGATION, Label: 'Champs agrégation' },
    { $Type: 'UI.DataField', Value: STATUT,            Label: 'Statut'            },
    { $Type: 'UI.DataField', Value: ERDAT,             Label: 'Date création'     },
    { $Type: 'UI.DataField', Value: MESSAGE,           Label: 'Message'           }
  ],
  UI.FieldGroup #InfoCalcul: {
    $Type: 'UI.FieldGroupType',
    Label: 'Résultat calculé',
    Data : [
      { $Type: 'UI.DataField', Value: MANDT,             Label: 'Mandant'           },
      { $Type: 'UI.DataField', Value: CLE_METIER,        Label: 'Clé métier'        },
      { $Type: 'UI.DataField', Value: CHAMPS_AGREGATION, Label: 'Champs agrégation' },
      { $Type: 'UI.DataField', Value: STATUT,            Label: 'Statut'            },
      { $Type: 'UI.DataField', Value: MESSAGE,           Label: 'Message'           }
    ]
  },
  UI.FieldGroup #AuditCalcul: {
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
      ID    : 'InfoCalculFacet',
      Label : 'Résultat calculé',
      Target: '@UI.FieldGroup#InfoCalcul'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'AuditCalculFacet',
      Label : 'Audit',
      Target: '@UI.FieldGroup#AuditCalcul'
    }
  ]
);
