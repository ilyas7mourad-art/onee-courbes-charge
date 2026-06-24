sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Item'
], function (Controller, JSONModel, Item) {
    'use strict';

    return Controller.extend('onee.courbes.courbegraphique.controller.View1', {

        // ─────────────────────────────────────────────────────────────
        //  Lifecycle
        // ─────────────────────────────────────────────────────────────

        onInit: function () {
            // Modèle JSON dédié au graphique
            var oChartModel = new JSONModel({ data: [] });
            this.getView().setModel(oChartModel, 'chart');

            // Feeds + Popover — chargés via sap.ui.require pour isoler les
            // erreurs CDN sap.viz des autres modules
            var oView = this.getView();
            sap.ui.require([
                'sap/viz/ui5/controls/feeds/FeedItem',
                'sap/viz/ui5/controls/Popover'
            ], function (FeedItem, Popover) {
                var oVizFrame = oView.byId('vizFrame');
                if (!oVizFrame) {
                    console.error('[courbe-graphique] VizFrame introuvable — sap.viz n\'a pas pu être chargé depuis le CDN.');
                    oView.byId('txtStatus').setText(
                        'Erreur : sap.viz non disponible. Vérifiez la connexion au CDN https://ui5.sap.com/'
                    );
                    return;
                }

                oVizFrame.addFeed(new FeedItem({
                    uid   : 'valueAxis',
                    values: ['Courbe de charge', 'Pmax PAIHP', 'Pmax PAIHC', 'Pmax PAIHPL']
                }));
                oVizFrame.addFeed(new FeedItem({
                    uid   : 'categoryAxis',
                    values: ['Horodatage']
                }));

                // Popover sur survol
                var oPopover = new Popover({});
                oPopover.connect(oVizFrame.getVizUid());

                console.log('[courbe-graphique] sap.viz OK — VizFrame + Popover initialisés');
            }, function (oErr) {
                console.error('[courbe-graphique] Échec chargement sap.viz depuis CDN :', oErr);
                oView.byId('txtStatus').setText(
                    'Erreur CDN : impossible de charger sap.viz (' + (oErr && oErr.message || 'timeout ?') + ')'
                );
            });

            this._loadSerges();
        },

        // ─────────────────────────────────────────────────────────────
        //  Chargement de la liste des compteurs (SERGE distincts)
        // ─────────────────────────────────────────────────────────────

        _loadSerges: async function () {
            var oCbo    = this.byId('cboSerge');
            var oStatus = this.byId('txtStatus');
            try {
                // Récupération de tous les SERGE puis déduplication côté client
                var resp = await fetch(
                    '/odata/v4/courbes/ZccCourbeChargesIndexs?$select=SERGE&$orderby=SERGE',
                    { headers: { Accept: 'application/json' } }
                );
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var json    = await resp.json();
                var seen    = {};
                var aSerges = (json.value || [])
                    .map(function (r) { return r.SERGE; })
                    .filter(function (s) { if (seen[s]) return false; seen[s] = true; return true; });

                aSerges.forEach(function (s) {
                    oCbo.addItem(new Item({ key: s, text: s }));
                });

                if (aSerges.length === 0) {
                    oStatus.setText('Aucun relevé disponible. Importez d\'abord un fichier PRN ou XLSX.');
                } else if (aSerges.length === 1) {
                    // Auto-sélection si un seul compteur
                    oCbo.setSelectedKey(aSerges[0]);
                    this._loadChartData(aSerges[0]);
                } else {
                    oStatus.setText(aSerges.length + ' compteur(s) disponible(s). Sélectionnez-en un.');
                }
            } catch (e) {
                console.error('[courbe-graphique] _loadSerges :', e);
                oStatus.setText('Erreur chargement compteurs : ' + e.message);
            }
        },

        // ─────────────────────────────────────────────────────────────
        //  Événement changement de compteur
        // ─────────────────────────────────────────────────────────────

        onSergeChange: function (oEvent) {
            var oItem = oEvent.getParameter('selectedItem');
            if (oItem) {
                this._loadChartData(oItem.getKey());
            }
        },

        // ─────────────────────────────────────────────────────────────
        //  Chargement des données du graphique pour un SERGE donné
        // ─────────────────────────────────────────────────────────────

        _loadChartData: async function (serge) {
            var oStatus    = this.byId('txtStatus');
            var oVizFrame  = this.byId('vizFrame');
            oStatus.setText('Chargement des données pour ' + serge + '…');

            try {
                var enc = encodeURIComponent(serge);

                // 1. Relevés — priorité cadran EA (mapping provisoire .prn)
                var url = '/odata/v4/courbes/ZccCourbeChargesIndexs'
                    + '?$filter=SERGE%20eq%20%27' + enc + '%27%20and%20COD_CADRAN%20eq%20%27EA%27'
                    + '&$orderby=DAT_RELEVE,HEU_RELEVE'
                    + '&$select=DAT_RELEVE,HEU_RELEVE,VAL_CADRAN';
                var data = await this._get(url);
                var releves = data.value || [];

                if (!releves.length) {
                    // Fallback : tous les relevés si pas de cadran EA
                    url = '/odata/v4/courbes/ZccCourbeChargesIndexs'
                        + '?$filter=SERGE%20eq%20%27' + enc + '%27'
                        + '&$orderby=DAT_RELEVE,HEU_RELEVE'
                        + '&$select=DAT_RELEVE,HEU_RELEVE,VAL_CADRAN';
                    data    = await this._get(url);
                    releves = data.value || [];
                }

                // 2. Pmax par tranche (ZccCourbeChargesCalculed)
                url  = '/odata/v4/courbes/ZccCourbeChargesCalculed'
                    + '?$filter=serge%20eq%20%27' + enc + '%27'
                    + '&$select=codCadran,pmax';
                data = await this._get(url);
                var pmax = {};
                (data.value || []).forEach(function (p) {
                    pmax[p.codCadran] = parseFloat(p.pmax) || null;
                });

                // 3. Construction du dataset graphique
                var self      = this;
                var chartData = releves.map(function (r) {
                    return {
                        timestamp  : self._fmt(r.DAT_RELEVE, r.HEU_RELEVE),
                        courbe     : parseFloat(r.VAL_CADRAN) || 0,
                        pmaxPAIHP  : pmax.PAIHP  != null ? pmax.PAIHP  : null,
                        pmaxPAIHC  : pmax.PAIHC  != null ? pmax.PAIHC  : null,
                        pmaxPAIHPL : pmax.PAIHPL != null ? pmax.PAIHPL : null
                    };
                });

                this.getView().getModel('chart').setData({ data: chartData });

                // 4. Mise à jour des propriétés visuelles du VizFrame
                if (oVizFrame) {
                    oVizFrame.setVizProperties({
                        title: {
                            visible: true,
                            text   : 'Courbe de charge — ' + serge
                        },
                        legend: { visible: true },
                        interaction: {
                            trigger       : 'hover',
                            selectability : { mode: 'EXCLUSIVE' }
                        },
                        plotArea: {
                            // Courbe=bleu ONEE, PAIHP=rouge, PAIHC=bleu clair, PAIHPL=vert
                            colorPalette: ['#1F7BC0', '#E84444', '#5B9BD5', '#2DAB65'],
                            dataLabel   : { visible: false }
                        },
                        categoryAxis: {
                            title  : { visible: false },
                            label  : { rotation: 'auto' }
                        },
                        valueAxis: {
                            title: { visible: true, text: 'kW' }
                        }
                    });
                }

                // 5. Message de statut
                var pmaxParts = [];
                ['PAIHP', 'PAIHC', 'PAIHPL'].forEach(function (k) {
                    if (pmax[k] != null) pmaxParts.push(k + ' = ' + pmax[k] + ' kW');
                });
                oStatus.setText(
                    releves.length + ' relevé(s)'
                    + (pmaxParts.length ? ' — Pmax : ' + pmaxParts.join(' | ') : ' — Pmax non calculés')
                );

            } catch (e) {
                console.error('[courbe-graphique] _loadChartData :', e);
                oStatus.setText('Erreur : ' + e.message);
            }
        },

        // ─────────────────────────────────────────────────────────────
        //  Helpers
        // ─────────────────────────────────────────────────────────────

        _get: async function (url) {
            var resp = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!resp.ok) throw new Error('HTTP ' + resp.status + ' — ' + url);
            return resp.json();
        },

        // "YYYY-MM-DD" + "HH:MM:SS" → "DD/MM HH:MM"
        _fmt: function (date, time) {
            if (!date || !time) return '?';
            return date.slice(8, 10) + '/' + date.slice(5, 7) + ' ' + time.slice(0, 5);
        }

    });
});
