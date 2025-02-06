const express = require('express');
const mongoose = require('mongoose');
const UtilisateurRouter=require('./routes/utilisateur');
require('./config/connect');

const app = express();
app.use(express.json());

app.use('/utilisateur',UtilisateurRouter);


app.listen(3000, () => {
    console.log('server work');
});




