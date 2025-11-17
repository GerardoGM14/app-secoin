const functions = require('firebase-functions');
const fetch = require('node-fetch');
const cors = require('cors')({ origin: true }); 

exports.consultarRUC = functions.https.onRequest((req, res) => {
  cors(req, res, async () => { 
    const ruc = req.query.ruc;

    if (!ruc) {
      return res.status(400).json({ error: 'RUC no proporcionado' });
    }

    try {
      const respuesta = await fetch(`https://api.apis.net.pe/v2/sunat/ruc/full?numero=${ruc}`, {
        headers: {
          Authorization: 'Bearer apis-token-14560.75omi91hA0BCQT8cMcR9A5I052Aynaln' 
        }
      });

      if (!respuesta.ok) {
        throw new Error('No se pudo consultar el RUC.');
      }

      const data = await respuesta.json();
      res.status(200).json(data);

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al consultar el RUC.' });
    }
  });
});


