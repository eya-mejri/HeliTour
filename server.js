const express = require('express');
const mongoose = require('mongoose');
const utilisateur = require('./models/utlisateur');  // Assure-toi que le nom du modèle est correct
require('./config/connect');

const app = express();
app.use(express.json());

app.listen(3000, () => {
    console.log('server work');
});

app.post('/adduser', async (req, res) => {
    try {
        const data = req.body;
        const existingUser = await utilisateur.findOne({ Email: data.Email });
        if (existingUser) {
            return res.status(400).json({ error: "Cet email est déjà utilisé" });
        }

        const usr = new utilisateur(data);
        const saveduser = await usr.save();  
        res.status(201).json(saveduser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
