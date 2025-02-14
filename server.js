const express = require('express');
const mongoose = require('mongoose');
const UtilisateurRouter=require('./routes/utilisateur');
const CircuitRouter=require('./routes/circuit');
const VolRouter=require('./routes/vol');
const ReservationRouter=require('./routes/reservation');
const VilleRouter=require('./routes/ville');
const PaiementsRouter = require('./routes/paiements'); // Assurez-vous du bon chemin vers le fichier
const RoleRouter = require('./routes/role');
const AdresseRouter = require('./routes/adresse');
require('./config/connect');

const app = express();
app.use(express.json());

app.use('/utilisateur',UtilisateurRouter);
app.use('/circuit',CircuitRouter);
app.use('/vol',VolRouter);
app.use('/reservation',ReservationRouter);
app.use('/ville',VilleRouter);
app.use('/paiements',PaiementsRouter);
app.use('/role', RoleRouter);
app.use('/adresse', AdresseRouter);

app.listen(3000, () => {
    console.log('server work');
});




