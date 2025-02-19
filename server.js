const express = require('express');
const mongoose = require('mongoose');
const UtilisateurRouter=require('./routes/utilisateur');
const CircuitRouter=require('./routes/circuit');
const VolRouter=require('./routes/vol');
const ReservationRouter=require('./routes/reservation');
const VilleRouter=require('./routes/ville');
const VoyageurRouter=require('./routes/voyageur');

require('./config/connect');

const app = express();
app.use(express.json());

app.use('/utilisateur',UtilisateurRouter);
app.use('/circuit',CircuitRouter);
app.use('/vol',VolRouter);
app.use('/reservation',ReservationRouter);
app.use('/ville',VilleRouter);
app.use('/voy',VoyageurRouter);

app.listen(3000, () => {
    console.log('server work');
});




