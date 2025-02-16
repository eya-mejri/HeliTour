const express =require('express');


const router=express.Router();
const reservation = require('../models/reservation');
const vol = require('../models/vol');

//AJOUTER Reservation

router.post('/addReservation2', async (req, res) => {
    try {
        const { Num_Reservation, nbr_place, disponibilite, voyageurs, volId } = req.body;

        // Check if the reservation already exists
        const existingReservation = await reservation.findOne({ Num_Reservation });
        if (existingReservation) {
            return res.status(400).json({ error: "Cette réservation est déjà ajoutée" });
        }

        // Find the vol (flight)
        const vol1 = await vol.findById(volId);
        if (!vol1) {
            return res.status(404).json({ error: "Vol introuvable!" });
        }

        // Check if enough places are available
        if (vol1.place_disponible < nbr_place) {
            return res.status(400).json({ error: "Pas assez de places disponibles!" });
        }

        // Create a new reservation
        const newReservation = new reservation({
            Num_Reservation,
            nbr_place,
            disponibilite,
            volId: vol1._id // Linking reservation to vol
        });

        const savedReservation = await newReservation.save();
        vol1.reservations.push(savedReservation._id);
        await vol1.save();

        // Update all voyageurs with this reservation ID
        if (voyageurs && voyageurs.length > 0) {
            const updatedVoyageurs = await voyageurs.updateMany(
                { _id: { $in: voyageurs } }, // Find all voyageurs in the list
                { $set: { reservation: savedReservation._id } } // Assign reservation ID
            );

            if (updatedVoyageurs.matchedCount !== voyageurs.length) {
                return res.status(400).json({ error: "Certains voyageurs n'ont pas été trouvés!" });
            }
        }

        // Update the vol (reduce available seats & check status)
        vol1.place_disponible -= nbr_place;
        if (vol1.place_disponible === 0) {
            vol1.status = "complet";
        }

        await vol1.save(); // Save updated vol

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
        const { _id } = req.body;  
        const dataToUpdate = req.body;  

        
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
