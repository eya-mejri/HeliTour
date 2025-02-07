const express = require('express');
const router = express.Router();
const Paiement = require('../models/paiements');


router.post('/addPaiement', async (req, res) => {
    try {
        const data = req.body;
        const paiement = new Paiement(data);
        const savedPaiement = await paiement.save();
        res.status(201).json(savedPaiement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/deletePaiement/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPaiement = await Paiement.findByIdAndDelete(id);
        if (!deletedPaiement) {
            return res.status(404).json({ error: "Paiement non trouvé" });
        }
        res.status(200).json({ message: "Paiement supprimé avec succès", deletedPaiement });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/getAllPaiements', async (req, res) => {
    try {
        const paiements = await Paiement.find();
        res.status(200).json(paiements);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/getPaiementById/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const paiement = await Paiement.findById(id);
        if (!paiement) {
            return res.status(404).json({ error: "Paiement non trouvé" });
        }
        res.status(200).json(paiement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


router.put('/updatePaiement/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dataToUpdate = req.body;
        const updatedPaiement = await Paiement.findByIdAndUpdate(id, dataToUpdate, { new: true });

        if (!updatedPaiement) {
            return res.status(404).json({ error: "Paiement non trouvé" });
        }

        res.status(200).json(updatedPaiement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
