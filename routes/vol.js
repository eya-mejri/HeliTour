const express =require('express');


const router=express.Router();
const vol = require('../models/vol');
const circuit = require('../models/circuit');

//AJOUTER vol 

router.post('/addVol', async (req, res) => {
    try {
        const { Date_depart, place_disponible, status,Duree, circuitId } = req.body;

        // Validate required fields
        if (!Date_depart || place_disponible === undefined || !status || !circuitId || !Duree) {
            return res.status(400).json({ error: "Veuillez fournir toutes les informations requises !" });
        }

        // Ensure status is valid
        if (!["complet", "disponible"].includes(status)) {
            return res.status(400).json({ error: "Statut invalide, doit être 'complet' ou 'disponible'." });
        }

        // Ensure circuit exists
        const existingCircuit = await circuit.findById(circuitId);
        if (!existingCircuit) {
            return res.status(404).json({ error: "Circuit introuvable !" });
        }

        // Create and save the vol
        const newVol = new vol({
            Date_depart,
            place_disponible,
            status,
            circuitId,
            Duree,
            reservations: [] // Initially, no reservations
        });

        const savedVol = await newVol.save();

        const beforeUpdate = existingCircuit.vols;

        // Update circuit using findByIdAndUpdate
        const updatedCircuit = await circuit.findByIdAndUpdate(
            circuitId,
            { $push: { vols: savedVol._id } },
            { new: true, useFindAndModify: false }
        );

        res.status(201).json({
            message: "Vol ajouté avec succès",
            savedVol,
            beforeUpdate,
            afterUpdate: updatedCircuit.vols
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})
// supprimer vol par id 
router.delete('/deletVol/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVol = await vol.findByIdAndDelete(id);
        if (!deletedVol) {
            return res.status(404).json({ error: "vol non trouvé" });
        }
        res.status(200).json({ message: "vol supprimé avec succès", deletedVol });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// avoir tout les vols
router.get('/getall', async (req, res) => {
    try {
        const vols= await vol.find();
        res.status(200).json(vols);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// avoir circuit by id 
router.get('/getbyid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vol1 = await vol.findById(id);
        if (!vol1) {
            return res.status(404).json({ error: "vol non trouvé" });
        }
        res.status(200).json(vol1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// mise a jour de vol by id
router.put('/putVol', async (req, res) => {
    try {
        const { _id } = req.body;  
        const dataToUpdate = req.body;  

        
        const updatedVol = await vol.findOneAndUpdate({ _id }, dataToUpdate, { new: true });

        if (!updatedVol) {
            return res.status(404).json({ error: "circuit non trouvé" });
        }

        res.status(200).json(updatedVol);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



module.exports=router;