const express =require('express');


const router=express.Router();
const circuit = require('../models/circuit');
const Ville = require('../models/ville');

//AJOUTER Circuit
router.post('/addCircuit2', async (req, res) => {
    try {
        const { Nom, Description, Prix, Disponibilite,villeId } = req.body;

        // Validate required fields
        if (!Nom || !Description ||  Prix === undefined ||!villeId) {
            return res.status(400).json({ error: "Veuillez fournir toutes les informations requises !" });
        }
        // Check if the ville exists
        const ville = await Ville.findById(villeId);
        if (!ville) {
            return res.status(404).json({ error: "Ville introuvable !" });
        }
        // Create and save the circuit
        const newCircuit = new circuit({
            Nom,
            Description,
            Prix,
            Disponibilite,
            villeId,
            vols: []
        });

        const savedCircuit = await newCircuit.save();
        // Add the circuit to the list of circuits in the Ville
        ville.circuits.push(savedCircuit._id);
        await ville.save();
        res.status(201).json(savedCircuit);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

//get circuit by ville name
router.get('/getbyVille/:name', async (req, res) => {
    try {
        const { name } = req.params;

        // Find the ville by name
        const ville1 = await Ville.findOne({ Nom: name });

        if (!ville1) {
            return res.status(404).json({ error: "Ville non trouvée" });
        }

        // Find circuits associated with this ville
        const circuits = await circuit.find({ villeId: ville1._id });

        if (circuits.length === 0) {
            return res.status(404).json({ error: "Aucun circuit trouvé pour cette ville" });
        }

        res.status(200).json(circuits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// mise a jour de circuit by id
router.put('/putCircuit', async (req, res) => {
    try {
        const { _id } = req.body; 
        const dataToUpdate = req.body;  

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