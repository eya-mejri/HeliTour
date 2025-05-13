const express =require('express');


const router=express.Router();
const voyageur = require('../models/voyageur');
const reservation = require('../models/reservation'); // Ensure this is the correct path


router.post('/addVoyageur', async (req, res) => {
    try {
        const data = req.body;
        const { reservationId, Nom, prenom, poids ,email,phone} = data;

        // Check if the reservation exists
        const existingReservation = await reservation.findById(reservationId); // Ensure it's the correct model and field name
        if (!existingReservation) {
            return res.status(400).json({ error: "Reservation not found!" });
        }

        // Create a new voyageur
        const newVoyageur = new voyageur({
            Nom,
            prenom,
            poids,
            reservation: reservationId,  // Reference to the reservation
            email,
            phone,
        });

        const savedVoyageur = await newVoyageur.save();

        // Add the voyageur to the reservation's voyageurs list
        existingReservation.voyageurs.push(savedVoyageur._id);
        await existingReservation.save();

        res.status(201).json(savedVoyageur);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Supprimer toutes les villes
router.delete('/deleteAll', async (req, res) => {
    try {
        const result = await voyageur.deleteMany({});
        res.status(200).json({ message: `${result.deletedCount} voyageurs supprimées.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports=router;