const express =require('express');
const verifyToken=require('../middlewares/verifyToken');
const authorizeRoles=require('../middlewares/roleMiddleware');

const router=express.Router();
const ville = require('../models/ville');

//AJOUTER ville (admin)
router.post('/addVille',verifyToken,authorizeRoles('Admin'), async (req, res) => {
    try {
        const { Nom, Description } = req.body;
        if (!Nom || !Description) {
            return res.status(400).json({ error: "des informations manquantes! " });
        }
        // Create and save the ville
        const newVille = new ville({
            Nom,
            Description,
            circuits:[]
        });
        const savedVille = await newVille.save();
        res.status(201).json({ message: "Ville ajoutée avec succès", savedVille });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//je pense on va pas supprimer des villes pour des raisons de data
// supprimer ville par id 
router.delete('/deleteVille/:id', verifyToken,authorizeRoles('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVille = await ville.findByIdAndDelete(id);
        if (!deletedVille) {
            return res.status(404).json({ error: "ville non trouvée" });
        }
        res.status(200).json({ message: "ville supprimée avec succès", deletedDestination });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



// avoir tout les ville
router.get('/getall', async (req, res) => {
    try {
        const ville1= await ville.find();
        res.status(200).json(ville1);
    } catch (error) {
        res.status(400).json({ error: error.message})};
});



// avoir ville by id 
router.get('/getbyid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ville1 = await ville.findById(id);
        if (!ville1) {
            return res.status(404).json({ error: "ville non trouvée" });
        }
        res.status(200).json(ville1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// update ville by id 
router.put('/updatebyid/:id', verifyToken,authorizeRoles('Admin'),async (req, res) => {
    try {
        const { id } = req.params;  
        const dataToUpdate = req.body;  
        const updatedVille = await ville.findOneAndUpdate({ _id :id}, dataToUpdate, { new: true });

        if (!updatedVille) {
            return res.status(404).json({ error: "ville non trouvé" });
        }

        res.status(200).json(updatedVille);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});





module.exports=router;