require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors=require('cors');
const path = require('path');
const UtilisateurRouter=require('./routes/utilisateur');
const CircuitRouter=require('./routes/circuit');
const VolRouter=require('./routes/vol');
const ReservationRouter=require('./routes/reservation');
const VilleRouter=require('./routes/ville');

const VoyageurRouter=require('./routes/voyageur');
const PaiementsRouter = require('./routes/paiements'); // Assurez-vous du bon chemin vers le fichier
const RoleRouter = require('./routes/role');
const AdresseRouter = require('./routes/adresse');
const AppareilRouter = require('./routes/appareil');
const ContactRouter = require('./routes/contact');
require('./routes/updateReservationStatuses')



require('./config/connect');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/utilisateur',UtilisateurRouter);
app.use('/circuit',CircuitRouter);
app.use('/vol',VolRouter);
app.use('/reservation',ReservationRouter);
app.use('/ville',VilleRouter);

app.use('/voy',VoyageurRouter);

app.use('/paiements',PaiementsRouter);
app.use('/role', RoleRouter);
app.use('/adresse', AdresseRouter);
app.use('/appareil', AppareilRouter);
app.use('/contact', ContactRouter);
/*cron.schedule('10 * * * *', () => {
    console.log('🔄 Checking reservations...');
    updateStatuses();
  });
*/
// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000, () => {
    console.log('server work');
    console.log('Cron jobs started');
});




