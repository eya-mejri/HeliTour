const express = require('express');
const Role = require('../models/role'); // Assurez-vous que le chemin est correct
const router = express.Router();

// Obtenir tous les rôles
router.get('/', async (req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtenir un rôle par son ID
router.get('/:id', async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: "Rôle non trouvé" });
        res.json(role);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Créer un nouveau rôle
router.post('/add', async (req, res) => {
    const { Nom } = req.body;
    
    // Validation du rôle
    if (!Nom) return res.status(400).json({ message: "Nom du rôle requis" });

    try {
        const newRole = new Role({
            Nom,
            users:[]
        });

        const savedRole = await newRole.save();
        res.status(201).json(savedRole);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mettre à jour un rôle
router.put('/:id', async (req, res) => {
    try {
        const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!role) return res.status(404).json({ message: "Rôle non trouvé" });
        res.json(role);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Supprimer un rôle
router.delete('/:id', async (req, res) => {
    try {
        const role = await Role.findByIdAndDelete(req.params.id);
        if (!role) return res.status(404).json({ message: "Rôle non trouvé" });
        res.json({ message: 'Rôle supprimé' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
