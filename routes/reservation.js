const express =require('express');


const router=express.Router();
const reservation = require('../models/reservation');
const vol = require('../models/vol');
const Ville = require('../models/ville');
const Circuit = require('../models/circuit');
const circuit = require('../models/circuit');


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

router.get('/getReservationsWithDetails', async (req, res) => {
  try {
    const reservations = await reservation.aggregate([
      {
        $lookup: {
          from: 'vols', // Join with the vol collection
          localField: 'volId',
          foreignField: '_id',
          as: 'vol',
        },
      },
      {
        $unwind: '$vol', // Unwind the vol array (since $lookup returns an array)
      },
      {
        $lookup: {
          from: 'circuits', // Join with the circuit collection
          localField: 'vol.circuitId',
          foreignField: '_id',
          as: 'circuit',
        },
      },
      {
        $unwind: '$circuit', // Unwind the circuit array
      },
      {
        $lookup: {
          from: 'voyageurs', // Join with the voyageur collection
          localField: 'voyageurs',
          foreignField: '_id',
          as: 'voyageurs',
        },
      },
      {
        $lookup: {
          from: 'paiements', // Join with the paiement collection
          localField: '_id',
          foreignField: 'reservation_id',
          as: 'paiement',
        },
      },
      {
        $group: {
          _id: '$_id', // Group by reservation ID
          Num_Reservation: { $first: '$Num_Reservation' }, // Include reservation ID
          reservationDate: { $first: '$Date_Reservation' }, // Include reservation date
          volDate: { $first: '$vol.Date_depart' }, // Include vol date
          numberOfVoyageurs: { $first: { $size: '$voyageurs' } }, // Count the number of voyageurs
          circuitName: { $first: '$circuit.Nom' }, // Include circuit name
          reservationStatus: { $first: '$vol.status' }, // Include reservation status
          paiement: { $push: '$paiement' }, // Aggregate paiement records into an array
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default _id field
          reservationId: '$_id', // Include reservation ID
          Num_Reservation: 1, // Include reservation ID
          reservationDate: 1, // Include reservation date
          volDate: 1, // Include vol date
          numberOfVoyageurs: 1, // Include number of voyageurs
          circuitName: 1, // Include circuit name
          reservationStatus: 1, // Include reservation status
          paiement: 1, // Include paiement details
        },
      },
    ]);

    
    res.status(200).json(reservations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//get reservation details by ville :
router.get('/getReservationsByVille/:villeName', async (req, res) => {
  try {
    const { villeName } = req.params; // Extract villeName from the request parameters

    const reservations = await reservation.aggregate([
      {
        $lookup: {
          from: 'vols', // Join with the vol collection
          localField: 'volId',
          foreignField: '_id',
          as: 'vol',
        },
      },
      {
        $unwind: '$vol', // Unwind the vol array (since $lookup returns an array)
      },
      {
        $lookup: {
          from: 'circuits', // Join with the circuit collection
          localField: 'vol.circuitId',
          foreignField: '_id',
          as: 'circuit',
        },
      },
      {
        $unwind: '$circuit', // Unwind the circuit array
      },
      {
        $lookup: {
          from: 'villes', // Join with the ville collection
          localField: 'circuit.villeId', // Assuming circuit has a villeId field
          foreignField: '_id',
          as: 'ville',
        },
      },
      {
        $unwind: '$ville', // Unwind the ville array
      },
      {
        $match: {
          'ville.Nom': villeName, // Filter by ville name
        },
      },
      {
        $lookup: {
          from: 'voyageurs', // Join with the voyageur collection
          localField: 'voyageurs',
          foreignField: '_id',
          as: 'voyageurs',
        },
      },
      {
        $lookup: {
          from: 'paiements', // Join with the paiement collection
          localField: '_id',
          foreignField: 'reservation_id',
          as: 'paiement',
        },
      },
      {
        $group: {
          _id: '$_id', // Group by reservation ID
          Num_Reservation: { $first: '$Num_Reservation' }, // Include reservation ID
          reservationDate: { $first: '$Date_Reservation' }, // Include reservation date
          volDate: { $first: '$vol.Date_depart' }, // Include vol date
          numberOfVoyageurs: { $first: { $size: '$voyageurs' } }, // Count the number of voyageurs
          circuitName: { $first: '$circuit.Nom' }, // Include circuit name
          reservationStatus: { $first: '$vol.status' }, // Include reservation status
          paiement: { $push: '$paiement' }, // Aggregate paiement records into an array
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default _id field
          reservationId: '$_id', // Include reservation ID
          Num_Reservation: 1, // Include reservation ID
          reservationDate: 1, // Include reservation date
          volDate: 1, // Include vol date
          numberOfVoyageurs: 1, // Include number of voyageurs
          circuitName: 1, // Include circuit name
          reservationStatus: 1, // Include reservation status
          paiement: 1, // Include paiement details
        },
      },
    ]);

    res.status(200).json(reservations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Get reservations grouped by circuit for a specific ville
router.get('/getReservationsByCircuit/:villeName', async (req, res) => {
  try {
    const { villeName } = req.params;

    const reservations = await reservation.aggregate([
      {
        $lookup: {
          from: 'vols',
          localField: 'volId',
          foreignField: '_id',
          as: 'vol',
        },
      },
      { $unwind: '$vol' },
      {
        $lookup: {
          from: 'circuits',
          localField: 'vol.circuitId',
          foreignField: '_id',
          as: 'circuit',
        },
      },
      { $unwind: '$circuit' },
      {
        $lookup: {
          from: 'villes',
          localField: 'circuit.villeId',
          foreignField: '_id',
          as: 'ville',
        },
      },
      { $unwind: '$ville' },
      {
        $match: {
          'ville.Nom': villeName,
        },
      },
      {
        $group: {
          _id: '$circuit.Nom', // Group by circuit name
          count: { $sum: 1 }, // Count reservations for each circuit
        },
      },
      {
        $project: {
          _id: 0,
          circuitName: '$_id',
          count: 1,
        },
      },
    ]);

    res.status(200).json(reservations);
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


    router.get('/getByVilleName/:villeName', async (req, res) => {
        try {
          const { villeName } = req.params;
      
          // Step 1: Find the ville by name
          const ville = await Ville.findOne({ Nom: villeName });
          if (!ville) {
            return res.status(404).json({ error: 'Ville not found' });
          }
      
          // Step 2: Find all circuits associated with the ville
          const circuits = await Circuit.find({ villeId: ville._id });
          if (!circuits || circuits.length === 0) {
            return res.status(200).json(null);
          }
      
          // Step 3: Find all vols associated with the circuits
          const circuitIds = circuits.map((circuit) => circuit._id);
          const vols = await vol.find({ circuitId: { $in: circuitIds } });
          if (!vols || vols.length === 0) {
            return res.status(200).json(null);
          }
      
          // Step 4: Find all reservations associated with the vols
          const volIds = vols.map((vol) => vol._id);
          const reservations = await reservation.find({ volId: { $in: volIds } });
      
          // Return the reservations
          res.status(200).json(reservations);
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


router.get('/getReservationAmount/:reservationId', async (req, res) => {
  try {
      const reservationId = req.params.reservationId;

      // Step 1: Fetch the reservation
      const reservation1 = await reservation.findById(reservationId)
          
      if (!reservation1) {
          return res.status(404).json({ message: 'Reservation not found' });
      }
      const nbr=reservation1.voyageurs.length;
      // Step 2: Fetch the associated circuit for the vol
      const vol1 = await vol.findById(reservation1.volId)
         
      if (!vol) {
          return res.status(404).json({ message: 'Vol not found' });
      }

      if (!vol1.circuitId) {
          return res.status(404).json({ message: 'Circuit not found for the vol' });
      }

      // Step 3: Calculate the total amount
      
      const circuit1 = await circuit.findById(vol1.circuitId);
      const totalAmount = circuit1.Prix * nbr;

      // Step 4: Send the response
      res.status(200).json({ totalAmount });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});



module.exports=router;
