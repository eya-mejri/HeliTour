const express =require('express');


const router=express.Router();
const ville = require('../models/ville');

//AJOUTER ville
router.post('/addVille', async (req, res) => {
    try {
        const { Nom, Description, circuits } = req.body;

        // Validate required fields
        if (!Nom || !Description) {
            return res.status(400).json({ error: "Veuillez fournir toutes les informations requises !" });
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


// supprimer ville par id 
router.delete('/deleteVille/:id', async (req, res) => {
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
router.get('/updatebyid/:id', async (req, res) => {
    try {
        const { _id } = req.body;  
        const dataToUpdate = req.body;  
        const updatedVille = await ville.findOneAndUpdate({ _id }, dataToUpdate, { new: true });

        if (!updatedVille) {
            return res.status(404).json({ error: "ville non trouvé" });
        }

        res.status(200).json(updatedVille);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});





module.exports=router;