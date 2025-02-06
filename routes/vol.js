const express =require('express');


const router=express.Router();
const vol = require('../models/vol');

//AJOUTER vol 
router.post('/addvol', async (req, res) => {
    try {
        const data = req.body;
        const existingvol = await vol.findOne({Date_depart: data.Date_depart ,id_circuit: data.id_circuit});
        if (existingvol) {
            return res.status(400).json({ error: "Ce vol est déjà ajouté" });
        }

        const vol1 = new vol(data);
        const savedvol = await vol1.save();  
        res.status(201).json(savedvol);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
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