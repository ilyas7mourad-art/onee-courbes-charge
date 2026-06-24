// Extension du ObjectPageController pour la section "Courbe de charge".
// Nommage obligatoire : <nom>.controller.js — sap.fe charge le module
// <controllerName>.controller, ce qui résout vers ce fichier.
sap.ui.define([
    'sap/fe/core/controllerextensions/ControllerExtension'
], function (ControllerExtension) {
    'use strict';

    return ControllerExtension.extend(
        'onee.courbes.courbesdisplay.ext.CourbeSection',
        {
            // ── Instance Chart.js courante ──────────────────────────
            _chart: null,

            // ── Hook sap.fe : déclenché à chaque chargement de relevé
            override: {
                routing: {
                    onAfterBinding: function (oBindingContext) {
                        if (!oBindingContext) return;
                        var serge = oBindingContext.getProperty('SERGE');
                        if (!serge) {
                            console.warn('[courbe] SERGE vide dans le contexte OData V4');
                            return;
                        }
                        this._scheduleRender(serge);
                    }
                }
            },

            // ── Attend que le conteneur HTML soit dans le DOM ───────
            // (sap.ui.core.HTML rend de façon asynchrone)
            _scheduleRender: function (serge) {
                var self    = this;
                var retries = 30;       // 30 × 100 ms = 3 s max

                ;(function tryRender() {
                    var div = document.getElementById('courbeOPChartDiv');
                    if (div) {
                        self._renderChart(serge, div);
                    } else if (retries-- > 0) {
                        setTimeout(tryRender, 100);
                    } else {
                        console.warn('[courbe] #courbeOPChartDiv introuvable après 3 s');
                    }
                }());
            },

            // ── Fetch OData + rendu Chart.js ────────────────────────
            _renderChart: async function (serge, div) {
                if (typeof Chart === 'undefined') {
                    div.textContent = 'Erreur : Chart.js non chargé (cdn.jsdelivr.net inaccessible ?)';
                    console.error('[courbe] Chart.js manquant');
                    return;
                }

                // Crée le canvas s'il n'existe pas encore
                var canvas = document.getElementById('courbeOPChart');
                if (!canvas) {
                    div.innerHTML = '';
                    canvas = document.createElement('canvas');
                    canvas.id = 'courbeOPChart';
                    div.appendChild(canvas);
                }

                try {
                    var enc = encodeURIComponent(serge);

                    // 1. Relevés — cadran EA en priorité (mapping provisoire .prn)
                    var data = await this._get(
                        '/odata/v4/courbes/ZccCourbeChargesIndexs'
                        + '?$filter=SERGE%20eq%20%27' + enc + '%27%20and%20COD_CADRAN%20eq%20%27EA%27'
                        + '&$orderby=DAT_RELEVE,HEU_RELEVE&$select=DAT_RELEVE,HEU_RELEVE,VAL_CADRAN'
                    );
                    var releves = data.value || [];

                    if (!releves.length) {      // fallback : tous cadrans
                        data    = await this._get(
                            '/odata/v4/courbes/ZccCourbeChargesIndexs'
                            + '?$filter=SERGE%20eq%20%27' + enc + '%27'
                            + '&$orderby=DAT_RELEVE,HEU_RELEVE&$select=DAT_RELEVE,HEU_RELEVE,VAL_CADRAN'
                        );
                        releves = data.value || [];
                    }

                    // 2. Pmax par tranche
                    data     = await this._get(
                        '/odata/v4/courbes/ZccCourbeChargesCalculed'
                        + '?$filter=serge%20eq%20%27' + enc + '%27&$select=codCadran,pmax'
                    );
                    var pmax = {};
                    (data.value || []).forEach(function (p) {
                        pmax[p.codCadran] = parseFloat(p.pmax) || null;
                    });

                    // 3. Dataset Chart.js
                    var self     = this;
                    var labels   = releves.map(function (r) { return self._fmt(r.DAT_RELEVE, r.HEU_RELEVE); });
                    var values   = releves.map(function (r) { return parseFloat(r.VAL_CADRAN) || 0; });
                    var n        = labels.length;
                    var datasets = [{
                        label          : 'Courbe de charge',
                        data           : values,
                        borderColor    : '#1F7BC0',
                        backgroundColor: 'rgba(31,123,192,0.07)',
                        borderWidth    : 2,
                        pointRadius    : 3,
                        tension        : 0.3,
                        fill           : true,
                        order          : 0
                    }];

                    [
                        { key: 'PAIHP',  label: 'Pmax PAIHP (Pointe)',  color: '#E84444' },
                        { key: 'PAIHC',  label: 'Pmax PAIHC (Creuse)',  color: '#5B9BD5' },
                        { key: 'PAIHPL', label: 'Pmax PAIHPL (Pleine)', color: '#2DAB65' }
                    ].forEach(function (def) {
                        if (pmax[def.key] == null) return;
                        datasets.push({
                            label      : def.label + ' = ' + pmax[def.key] + ' kW',
                            data       : Array(n).fill(pmax[def.key]),
                            borderColor: def.color,
                            borderWidth: 1.5,
                            borderDash : [6, 4],
                            pointRadius: 0,
                            fill       : false,
                            order      : 1
                        });
                    });

                    // 4. Rendu
                    if (this._chart) { this._chart.destroy(); this._chart = null; }
                    this._chart = new Chart(canvas, {
                        type: 'line',
                        data: { labels: labels, datasets: datasets },
                        options: {
                            responsive         : true,
                            maintainAspectRatio: false,
                            animation          : { duration: 300 },
                            plugins: {
                                title : {
                                    display: true,
                                    text   : 'Courbe de charge — ' + serge,
                                    font   : { size: 13, weight: '600' }
                                },
                                legend : { display: true },
                                tooltip: { mode: 'index', intersect: false }
                            },
                            scales: {
                                x: { ticks: { maxTicksLimit: 16, maxRotation: 45 } },
                                y: { title: { display: true, text: 'kW' }, beginAtZero: false }
                            }
                        }
                    });

                } catch (e) {
                    console.error('[courbe] _renderChart :', e);
                    if (div) div.textContent = 'Erreur chargement données : ' + e.message;
                }
            },

            // ── Helpers ─────────────────────────────────────────────

            _get: async function (url) {
                var r = await fetch(url, { headers: { Accept: 'application/json' } });
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            },

            // "YYYY-MM-DD" + "HH:MM:SS" → "DD/MM HH:MM"
            _fmt: function (date, time) {
                if (!date || !time) return '?';
                return date.slice(8, 10) + '/' + date.slice(5, 7) + ' ' + time.slice(0, 5);
            }
        }
    );
});
