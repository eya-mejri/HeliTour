const express =require('express');


const router=express.Router();
const circuit = require('../models/circuit');

//AJOUTER Circuit
router.post('/addCircuit', async (req, res) => {
    try {
        const data = req.body;
        const existingCircuit = await circuit.findOne({Destination: data.Destination });
        if (existingCircuit) {
            return res.status(400).json({ error: "Ce circuit est déjà ajouté" });
        }

        const cir = new circuit(data);
        const savedcir = await cir.save();  
        res.status(201).json(savedcir);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// supprimer circuit par id 
router.delete('/deletCircuit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCircuit = await circuit.findByIdAndDelete(id);
        if (!deletedCircuit) {
            return res.status(404).json({ error: "circuit non trouvé" });
        }
        res.status(200).json({ message: "Circuit supprimé avec succès", deletedCircuit });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// avoir tout les circuits
router.get('/getall', async (req, res) => {
    try {
        const cirs= await circuit.find();
        res.status(200).json(cirs);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// avoir circuit by id 
router.get('/getbyid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cir = await circuit.findById(id);
        if (!cir) {
            return res.status(404).json({ error: "circuit non trouvé" });
        }
        res.status(200).json(cir);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// mise a jour de circuit by id
router.put('/putCircuit', async (req, res) => {
    try {
        const { _id } = req.body;  // Récupère l'email dans le corps de la requête
        const dataToUpdate = req.body;  // Récupère les autres informations à mettre à jour

        // Trouver un utilisateur par son email
        const updatedCircuit = await circuit.findOneAndUpdate({ _id }, dataToUpdate, { new: true });

        if (!updatedCircuit) {
            return res.status(404).json({ error: "circuit non trouvé" });
        }

        res.status(200).json(updatedCircuit);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



module.exports=router;