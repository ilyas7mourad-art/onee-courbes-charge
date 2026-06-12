using CourbesService from './courbes-service';

// ═══════════════════════════════════════════════════════════════
//  CLIENT
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.Client with @(
  UI.HeaderInfo: {
    TypeName      : 'Client',
    TypeNamePlural: 'Clients',
    Title      : { $Type: 'UI.DataField', Value: nomClient        },
    Description: { $Type: 'UI.DataField', Value: secteurActivite  }
  },
  UI.SelectionFields: [ secteurActivite ],
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: nomClient,       Label: 'Client'           },
    { $Type: 'UI.DataField', Value: secteurActivite, Label: 'Secteur d''activité' }
  ],
  UI.FieldGroup #InfoClient: {
    $Type: 'UI.FieldGroupType',
    Label: 'Informations client',
    Data : [
      { $Type: 'UI.DataField', Value: nomClient,       Label: 'Nom du client'     },
      { $Type: 'UI.DataField', Value: secteurActivite, Label: 'Secteur d''activité' }
    ]
  },
  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'InfoClientFacet',
      Label : 'Informations client',
      Target: '@UI.FieldGroup#InfoClient'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'ContratsFacet',
      Label : 'Contrats',
      Target: 'contrats/@UI.LineItem'
    }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  CONTRAT
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.Contrat with @(
  UI.HeaderInfo: {
    TypeName      : 'Contrat',
    TypeNamePlural: 'Contrats',
    Title      : { $Type: 'UI.DataField', Value: numeroContrat      },
    Description: { $Type: 'UI.DataField', Value: puissanceSouscrite }
  },
  UI.SelectionFields: [ numeroContrat ],
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: numeroContrat,      Label: 'N° Contrat'          },
    { $Type: 'UI.DataField', Value: cosPhi,             Label: 'Cos φ'               },
    { $Type: 'UI.DataField', Value: puissanceSouscrite, Label: 'PS souscrite (kVA)'  },
    { $Type: 'UI.DataField', Value: dateDebut,          Label: 'Date début'          },
    { $Type: 'UI.DataField', Value: dateFin,            Label: 'Date fin'            }
  ],
  UI.FieldGroup #InfoContrat: {
    $Type: 'UI.FieldGroupType',
    Label: 'Informations contrat',
    Data : [
      { $Type: 'UI.DataField', Value: numeroContrat,      Label: 'N° Contrat'         },
      { $Type: 'UI.DataField', Value: cosPhi,             Label: 'Cos φ'              },
      { $Type: 'UI.DataField', Value: puissanceSouscrite, Label: 'PS souscrite (kVA)' },
      { $Type: 'UI.DataField', Value: dateDebut,          Label: 'Date début'         },
      { $Type: 'UI.DataField', Value: dateFin,            Label: 'Date fin'           }
    ]
  },
  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'InfoContratFacet',
      Label : 'Informations contrat',
      Target: '@UI.FieldGroup#InfoContrat'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'CompteursFacet',
      Label : 'Compteurs',
      Target: 'compteurs/@UI.LineItem'
    }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  COMPTEUR
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.Compteur with @(
  UI.HeaderInfo: {
    TypeName      : 'Compteur',
    TypeNamePlural: 'Compteurs',
    Title      : { $Type: 'UI.DataField', Value: meterID      },
    Description: { $Type: 'UI.DataField', Value: typeCompteur }
  },
  UI.SelectionFields: [ typeCompteur, marque ],
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: meterID,      Label: 'Meter ID'      },
    { $Type: 'UI.DataField', Value: numeroSerie,  Label: 'N° série'      },
    { $Type: 'UI.DataField', Value: typeCompteur, Label: 'Type'          },
    { $Type: 'UI.DataField', Value: marque,       Label: 'Marque'        },
    { $Type: 'UI.DataField', Value: localisation, Label: 'Localisation'  }
  ],
  UI.FieldGroup #InfoCompteur: {
    $Type: 'UI.FieldGroupType',
    Label: 'Informations compteur',
    Data : [
      { $Type: 'UI.DataField', Value: meterID,      Label: 'Meter ID'     },
      { $Type: 'UI.DataField', Value: numeroSerie,  Label: 'N° série'     },
      { $Type: 'UI.DataField', Value: typeCompteur, Label: 'Type'         },
      { $Type: 'UI.DataField', Value: marque,       Label: 'Marque'       },
      { $Type: 'UI.DataField', Value: modele,       Label: 'Modèle'       },
      { $Type: 'UI.DataField', Value: localisation, Label: 'Localisation' },
      { $Type: 'UI.DataField', Value: datePose,     Label: 'Date de pose' }
    ]
  },
  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'InfoCompteurFacet',
      Label : 'Informations compteur',
      Target: '@UI.FieldGroup#InfoCompteur'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'FIAsFacet',
      Label : 'Fiches FIA',
      Target: 'mesures/@UI.LineItem'
    }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  FIA — entête de l'Object Page
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.FIA with @(
  UI.HeaderInfo: {
    TypeName      : 'FIA',
    TypeNamePlural: 'Fiches Information Appareil',
    Title      : { $Type: 'UI.DataField', Value: nomFichier },
    Description: { $Type: 'UI.DataField', Value: statut     }
  }
);

// ═══════════════════════════════════════════════════════════════
//  FIA — barre de filtres du List Report
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.FIA with @(
  UI.SelectionFields: [ statut, formatFichier ]
);

// ═══════════════════════════════════════════════════════════════
//  FIA — colonnes du List Report
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.FIA with @(
  UI.LineItem: [
    {
      $Type      : 'UI.DataField',
      Value      : nomFichier,
      Label      : 'Fichier'
    },
    {
      $Type      : 'UI.DataField',
      Value      : formatFichier,
      Label      : 'Format'
    },
    {
      $Type      : 'UI.DataField',
      Value      : statut,
      Label      : 'Statut',
      Criticality: statutCriticality  // 1=rouge ERREUR, 2=orange EN_COURS, 3=vert VALIDE
    },
    {
      $Type      : 'UI.DataField',
      Value      : nbLignesImportees,
      Label      : 'Lignes importées'
    },
    {
      $Type      : 'UI.DataField',
      Value      : nbAnomalies,
      Label      : 'Anomalies'
    },
    {
      $Type      : 'UI.DataField',
      Value      : psEstimeeKva,
      Label      : 'PS estimée (kVA)'
    },
    {
      $Type      : 'UI.DataField',
      Value      : ajustementKva,
      Label      : 'Ajustement (kVA)'
    }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  FIA — groupes de champs de l'Object Page
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.FIA with @(

  UI.FieldGroup #InfoFichier: {
    $Type: 'UI.FieldGroupType',
    Label: 'Informations fichier',
    Data : [
      { $Type: 'UI.DataField', Value: nomFichier,    Label: 'Nom du fichier' },
      { $Type: 'UI.DataField', Value: formatFichier, Label: 'Format'         },
      { $Type: 'UI.DataField', Value: sousTypeXlsx,  Label: 'Sous-type xlsx' },
      {
        $Type      : 'UI.DataField',
        Value      : statut,
        Label      : 'Statut',
        Criticality: statutCriticality
      }
    ]
  },

  UI.FieldGroup #ResultatsCalcul: {
    $Type: 'UI.FieldGroupType',
    Label: 'Résultats de calcul',
    Data : [
      { $Type: 'UI.DataField', Value: puissanceActiveKw,     Label: 'Puissance active (kW)'     },
      { $Type: 'UI.DataField', Value: puissanceApparenteKva, Label: 'Puissance apparente (kVA)' },
      { $Type: 'UI.DataField', Value: psEstimeeKva,          Label: 'PS estimée (kVA)'          },
      { $Type: 'UI.DataField', Value: ajustementKva,         Label: 'Ajustement (kVA)'          }
    ]
  }

);

// ═══════════════════════════════════════════════════════════════
//  FIA — sections de l'Object Page (Facets)
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.FIA with @(
  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'InfoFichierFacet',
      Label : 'Informations fichier',
      Target: '@UI.FieldGroup#InfoFichier'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'ResultatsCalculFacet',
      Label : 'Résultats de calcul',
      Target: '@UI.FieldGroup#ResultatsCalcul'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'MesuresFacet',
      Label : 'Mesures',
      Target: 'mesures/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'AnomaliesFacet',
      Label : 'Anomalies',
      Target: 'anomalies/@UI.LineItem'
    }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  MesureInterval — colonnes de la section "Mesures"
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.MesureInterval with @(
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: horodatage,            Label: 'Horodatage'              },
    { $Type: 'UI.DataField', Value: dureeIntervalleMin,    Label: 'Pas (min)'               },
    { $Type: 'UI.DataField', Value: puissanceActiveKw,     Label: 'P active (kW)'           },
    { $Type: 'UI.DataField', Value: puissanceReactiveKvar, Label: 'Q réactive (kVAr)'       },
    { $Type: 'UI.DataField', Value: energieActiveKwh,      Label: 'Énergie active (kWh)'    },
    { $Type: 'UI.DataField', Value: energieReactiveKvarh,  Label: 'Énergie réactive (kVArh)'},
    { $Type: 'UI.DataField', Value: sourceFormat,          Label: 'Source'                  },
    { $Type: 'UI.DataField', Value: etatCourbe,            Label: 'État courbe'             },
    { $Type: 'UI.DataField', Value: flagAnomalie,          Label: 'Anomalie'                }
  ]
);

// ═══════════════════════════════════════════════════════════════
//  QualiteDonnee — colonnes de la section "Anomalies"
// ═══════════════════════════════════════════════════════════════
annotate CourbesService.QualiteDonnee with @(
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: typeAnomalie,       Label: 'Type'        },
    { $Type: 'UI.DataField', Value: horodatageAnomalie, Label: 'Horodatage'  },
    { $Type: 'UI.DataField', Value: description,        Label: 'Description' }
  ]
);
