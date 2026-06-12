sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("onee.courbes.importfichier.controller.ImportFichier", {

        _sSerge          : null,
        _sNomFichier     : null,
        _sContenuBase64  : null,

        onInit: function () { /* OData V4 model initialised from manifest */ },

        onSergeChange: function (oEvent) {
            this._sSerge = oEvent.getParameter("value").trim() || null;
            this._checkImportReady();
        },

        onFileChange: function (oEvent) {
            var oFiles = oEvent.getParameter("files");
            if (!oFiles || oFiles.length === 0) {
                this._clearFile();
                return;
            }
            var oFile = oFiles[0];
            var sName = oFile.name;
            var sExt  = sName.split(".").pop().toLowerCase();
            var oBadge = this.byId("formatBadge");

            if (sExt !== "prn" && sExt !== "xlsx") {
                oBadge.setVisible(true);
                oBadge.setText("Format non supporté : ." + sExt);
                oBadge.setState("Error");
                this._sNomFichier   = null;
                this._sContenuBase64 = null;
                this._checkImportReady();
                return;
            }

            oBadge.setVisible(true);
            oBadge.setText("Format détecté : " + sExt.toUpperCase());
            oBadge.setState("Success");
            this._sNomFichier = sName;

            var oReader = new FileReader();
            oReader.onload = function (e) {
                // readAsDataURL gives "data:<mime>;base64,<content>" — strip prefix
                this._sContenuBase64 = e.target.result.split(",")[1];
                this._checkImportReady();
            }.bind(this);
            oReader.readAsDataURL(oFile);
        },

        _clearFile: function () {
            this._sNomFichier    = null;
            this._sContenuBase64 = null;
            this.byId("formatBadge").setVisible(false);
            this._checkImportReady();
        },

        _checkImportReady: function () {
            // SERGE can be empty — the file itself provides it (PRN Meter ID / XLSX C1)
            // but we still require a file to be selected
            var bEnabled = !!(this._sNomFichier && this._sContenuBase64);
            this.byId("btnImport").setEnabled(bEnabled);
        },

        onImport: function () {
            var oModel = this.getView().getModel();
            var oBtn   = this.byId("btnImport");
            oBtn.setBusy(true);

            var oAction = oModel.bindContext("/importerFichier(...)");
            // serge is optional — the parser extracts it from the file
            oAction.setParameter("serge",          this._sSerge || "");
            oAction.setParameter("nomFichier",     this._sNomFichier);
            oAction.setParameter("contenuBase64",  this._sContenuBase64);

            oAction.execute()
                .then(function () {
                    return oAction.getBoundContext().requestObject();
                })
                .then(function (oResult) {
                    this._showResult(oResult);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Erreur lors de l'import : " + (oError.message || oError));
                })
                .finally(function () {
                    oBtn.setBusy(false);
                });
        },

        _showResult: function (oResult) {
            var bOk = oResult.statut === "V";
            this.byId("msgStrip")
                .setType(bOk ? "Success" : "Error")
                .setText(bOk
                    ? "Import réussi — " + (oResult.nbLignes || 0) + " relevé(s) insérés"
                    : "Import en erreur");

            this.byId("txtFormat").setText(oResult.formatDetecte || "-");
            this.byId("txtNbLignes").setText(String(oResult.nbLignes  || 0));
            this.byId("txtNbAnomalies").setText(String(oResult.nbAnomalies || 0));
            this.byId("txtMessage").setText(oResult.message || "-");

            this.byId("panelResultat").setVisible(true);
        }
    });
});
