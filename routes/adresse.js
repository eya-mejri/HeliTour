const express = require('express');
const Adresse = require('../models/adresse'); // Assurez-vous que le chemin est correct
const router = express.Router();

// Obtenir toutes les adresses
router.get('/', async (req, res) => {
    try {
        const adresses = await Adresse.find();
        res.json(adresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtenir une adresse par son ID
router.get('/:id', async (req, res) => {
    try {
        const adresse = await Adresse.findById(req.params.id);
        if (!adresse) return res.status(404).json({ message: "Adresse non trouvée" });
        res.json(adresse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Créer une nouvelle adresse
router.post('/', async (req, res) => {
    const { Pays, Ville, Code_Postal, Adresse_Locale } = req.body;

    // Validation des champs
    if (!Pays || !Ville || !Code_Postal || !Adresse_Locale) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    try {
        const newAdresse = new Adresse({
            Pays,
            Ville,
            Code_Postal,
            Adresse_Locale
        });

        const savedAdresse = await newAdresse.save();
        res.status(201).json(savedAdresse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mettre à jour une adresse
router.put('/:id', async (req, res) => {
    try {
        const adresse = await Adresse.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!adresse) return res.status(404).json({ message: "Adresse non trouvée" });
        res.json(adresse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Supprimer une adresse
router.delete('/:id', async (req, res) => {
    try {
        const adresse = await Adresse.findByIdAndDelete(req.params.id);
        if (!adresse) return res.status(404).json({ message: "Adresse non trouvée" });
        res.json({ message: 'Adresse supprimée' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
