const express =require('express');


const router=express.Router();
const utilisateur = require('../models/utlisateur');

router.post('/adduser', async (req, res) => {
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

router.delete('/deleteuser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await utilisateur.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        res.status(200).json({ message: "Utilisateur supprimé avec succès", deletedUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/getall', async (req, res) => {
    try {
        const users = await utilisateur.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/getbyid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await utilisateur.findById(id);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/putuser', async (req, res) => {
    try {
        const { Email } = req.body;  // Récupère l'email dans le corps de la requête
        const dataToUpdate = req.body;  // Récupère les autres informations à mettre à jour

        // Trouver un utilisateur par son email
        const updatedUser = await utilisateur.findOneAndUpdate({ Email }, dataToUpdate, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

 module.exports=router;