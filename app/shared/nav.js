/* Bandeau de navigation commun ONEE — injecté dans le <body> de chaque app. */
;(function () {
    'use strict';

    var NAV_HEIGHT = '2.5rem';

    var APPS = [
        { label: 'Import',         path: '/import-fichier/webapp/index.html' },
        { label: 'Relevés',        path: '/courbes-display/webapp/index.html' },
        { label: 'Cadrans',        path: '/cadrans/webapp/index.html' },
        { label: 'Résultats',      path: '/calculed/webapp/index.html' },
        { label: 'Puissances max', path: '/pmax-display/webapp/index.html' },
        { label: 'Simulateur',     path: '/simulateur/webapp/index.html'    }
    ];

    // Le dossier de l'app courante suffit à identifier quelle tuile mettre en évidence.
    // On compare le début du pathname : "/courbes-display" ne matche pas "/pmax-display".
    function isActive(appPath) {
        var folder = appPath.split('/webapp/')[0]; // ex: "/courbes-display"
        return window.location.pathname.indexOf(folder) === 0;
    }

    function inject() {
        // ── 1. Construire le bandeau ──────────────────────────────────────
        var nav = document.createElement('nav');
        nav.id = 'onee-nav';

        // Lien marque → accueil
        var brand = document.createElement('a');
        brand.className = 'onee-nav-brand';
        brand.href = '/index.html';
        brand.setAttribute('title', 'Accueil');
        brand.innerHTML =
            '<span class="onee-nav-logo">ONEE</span>' +
            '<span class="onee-nav-sep" aria-hidden="true"></span>' +
            '<span class="onee-nav-subtitle">Gestion des Courbes de Charge</span>';
        nav.appendChild(brand);

        // Liens de navigation
        var links = document.createElement('div');
        links.className = 'onee-nav-links';
        APPS.forEach(function (app) {
            var a = document.createElement('a');
            a.className = 'onee-nav-link' + (isActive(app.path) ? ' onee-nav-active' : '');
            a.href = app.path;
            a.textContent = app.label;
            nav.appendChild(a); // directement dans nav pour un flex propre
        });

        // ── 2. Insérer avant le premier enfant du body ────────────────────
        document.body.insertBefore(nav, document.body.firstChild);

        // ── 3. Ajuster la hauteur de #content ────────────────────────────
        // Le composant SAPUI5 (height:"100%") doit remplir l'espace restant
        // après le bandeau, sans déborder de la fenêtre.
        var content = document.getElementById('content');
        if (content) {
            content.style.height = 'calc(100vh - ' + NAV_HEIGHT + ')';
        }
    }

    // Injecte dès que le DOM est prêt (fonctionne que nav.js soit chargé
    // en tête ou en corps de page, avec ou sans defer).
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
}());
