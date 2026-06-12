const cds = require('@sap/cds')

module.exports = cds.service.impl(function (srv) {

    srv.on('importerFichier', async (req) => {
        const { serge, nomFichier } = req.data
        const ext = nomFichier?.split('.').pop()?.toLowerCase()
        const formatDetecte = ext === 'prn' ? 'prn' : ext === 'xlsx' ? 'xlsx' : 'inconnu'
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        return {
            cleMetier     : `${serge ?? 'INCONNU'}_${date}`,
            statut        : 'V',
            formatDetecte,
            nbLignes      : 144,
            nbAnomalies   : 0,
            message       : 'Import simulé — traitement réel à implémenter'
        }
    })
})
