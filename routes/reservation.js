const express =require('express');


const router=express.Router();
const reservation = require('../models/reservation');


//AJOUTER Reservation
router.post('/addReservation', async (req, res) => {
    try {
        const data = req.body;
        const existingReservation = await reservation.findOne({Num_Reservation: data.Num_Reservation });
        if (existingReservation) {
            return res.status(400).json({ error: "Cette reservation  est déjà ajoutée" });
        }

        const reservation1 = new reservation(data);
        const savedReservation = await reservation1.save();  
        res.status(201).json(savedReservation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// supprimer reservation par id
router.delete('/deleteReservation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedReservation = await reservation.findByIdAndDelete(id);
        if (!deletedReservation) {
            return res.status(404).json({ error: "Reservation non trouvée" });
        }
        res.status(200).json({ message: "Reservation supprimée avec succès", deletedReservation });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// avoir tout les reservation
router.get('/getall', async (req, res) => {
    try {
        const reservation1= await reservation.find();
        res.status(200).json(reservation1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// avoir reservation by id 
router.get('/getbyid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reservation1 = await reservation.findById(id);
        if (!reservation1) {
            return res.status(404).json({ error: "reservation non trouvée" });
        }
        res.status(200).json(reservation1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// mise a jour de reservation by id
router.put('/putReservation', async (req, res) => {
    try {
        const { _id } = req.body;  // Récupère l'email dans le corps de la requête
        const dataToUpdate = req.body;  // Récupère les autres informations à mettre à jour

        // Trouver un utilisateur par son email
        const updatedReservation = await reservation.findOneAndUpdate({ _id }, dataToUpdate, { new: true });

        if (!updatedReservation) {
            return res.status(404).json({ error: "reservation non trouvée" });
        }

        res.status(200).json(updatedReservation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



module.exports=router;
