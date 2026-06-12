const cds = require('@sap/cds')
const { randomUUID } = require('crypto')

module.exports = cds.service.impl(function (srv) {

    // TODO: implement real parsing for .prn and .xlsx files
    srv.on('importerFichier', async (req) => {
        const { nomFichier } = req.data
        const ext = nomFichier?.split('.').pop()?.toLowerCase()
        const formatDetecte = ext === 'prn' ? 'prn' : ext === 'xlsx' ? 'xlsx' : 'inconnu'
        return {
            fiaId: randomUUID(),
            statut: 'VALIDE',
            formatDetecte,
            nbLignes: 144,
            nbAnomalies: 0,
            message: 'Import simulé - traitement réel à implémenter'
        }
    })
})
