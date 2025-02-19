const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importation des routes
const UtilisateurRouter = require('./routes/utilisateur');
const CircuitRouter = require('./routes/circuit');
const VolRouter = require('./routes/vol');
const ReservationRouter = require('./routes/reservation');
const VilleRouter = require('./routes/ville');
const VoyageurRouter = require('./routes/voyageur');
const PaiementsRouter = require('./routes/paiements');
const RoleRouter = require('./routes/role');
const AdresseRouter = require('./routes/adresse');

// Connexion à la base de données
require('./config/connect');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Définition des routes
app.use('/utilisateur', UtilisateurRouter);
app.use('/circuit', CircuitRouter);
app.use('/vol', VolRouter);
app.use('/reservation', ReservationRouter);
app.use('/ville', VilleRouter);
app.use('/voyageur', VoyageurRouter); // Correction de la route
app.use('/paiements', PaiementsRouter);
app.use('/role', RoleRouter);
app.use('/adresse', AdresseRouter);

// Lancement du serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
});
