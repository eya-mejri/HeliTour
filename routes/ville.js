const express =require('express');


const router=express.Router();
const ville = require('../models/ville');

//AJOUTER ville
router.post('/addVille', async (req, res) => {
    try {
        const data = req.body;
        const ville1 = new ville(data);
        const savedVille = await ville1.save();  
        res.status(201).json(savedVille);
    } catch (error) {
        res.status(400).json({ error: error.message });
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



module.exports=router;