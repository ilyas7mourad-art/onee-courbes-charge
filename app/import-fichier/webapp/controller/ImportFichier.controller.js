sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("onee.courbes.importfichier.controller.ImportFichier", {

        _sCompteurID : null,
        _sNomFichier : null,
        _sContenuBase64 : null,

        onInit: function () {
            // OData V4 model initialised from manifest
        },

        onCompteurChange: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            this._sCompteurID = oItem ? oItem.getKey() : null;
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
                this._sNomFichier    = null;
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
            var bEnabled = !!(this._sCompteurID && this._sNomFichier && this._sContenuBase64);
            this.byId("btnImport").setEnabled(bEnabled);
        },

        onImport: function () {
            var oModel = this.getView().getModel();
            var oBtn   = this.byId("btnImport");
            oBtn.setBusy(true);

            var oAction = oModel.bindContext("/importerFichier(...)");
            oAction.setParameter("compteurID",    this._sCompteurID);
            oAction.setParameter("nomFichier",    this._sNomFichier);
            oAction.setParameter("contenuBase64", this._sContenuBase64);

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
            var bOk = oResult.statut === "VALIDE";
            this.byId("msgStrip")
                .setType(bOk ? "Success" : "Error")
                .setText(bOk ? "Import réussi" : "Import en erreur");

            this.byId("txtFormat").setText(oResult.formatDetecte || "-");
            this.byId("txtNbLignes").setText(String(oResult.nbLignes  || 0));
            this.byId("txtNbAnomalies").setText(String(oResult.nbAnomalies || 0));
            this.byId("txtMessage").setText(oResult.message || "-");

            this.byId("panelResultat").setVisible(true);
        }
    });
});
