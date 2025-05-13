require('dotenv').config();
const express =require('express');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const router=express.Router();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const socketClient = require('socket.io-client'); 
const reservation = require('../models/reservation');
const vol = require('../models/vol');
const Ville = require('../models/ville');
const Circuit = require('../models/circuit');
const circuit = require('../models/circuit');
const Utilisateur = require('../models/utlisateur');
const Voyageur = require('../models/voyageur');
const { sendEmail } = require('./emailService');
const { sendWhatsApp } = require('./smsService');


const socketIOClient = socketClient('http://localhost:3002'); 
//AJOUTER Reservation

router.post('/addReservation2', async (req, res) => {
  try {
      const { Num_Reservation, nbr_place, disponibilite, voyageurs, volId, Status,Date_Reservation } = req.body;

      // 1. Check if reservation already exists
      if (await reservation.findOne({ Num_Reservation })) {
          return res.status(400).json({ error: "Cette réservation est déjà ajoutée" });
      }

      // 2. Find the flight and check availability
      const vol1 = await vol.findById(volId);
      if (!vol1) {
          return res.status(404).json({ error: "Vol introuvable!" });
      }

      if (vol1.place_disponible < nbr_place) {
          return res.status(400).json({ 
              error: `Seulement ${vol1.place_disponible} place(s) disponible(s)!` 
          });
      }

      // 3. Create and save the reservation
      const newReservation = await reservation.create({
          Num_Reservation,
          Date_Reservation,
          nbr_place,
          disponibilite,
          volId: vol1._id,
          Status,
          voyageurs: voyageurs || []
      });

      // 4. Update flight's available seats
      vol1.place_disponible -= nbr_place;
      vol1.reservations.push(newReservation._id);
      await vol1.save();

      // 5. Update voyageurs if provided
      if (voyageurs?.length > 0) {
          await Voyageur.updateMany(
              { _id: { $in: voyageurs } },
              { $set: { reservation: newReservation._id } }
          );
      }

      // 6. Emit socket event
      socketIOClient.emit('new_reservation', {
          message: 'Nouvelle réservation ajoutée!',
          reservation: newReservation
      });

      res.status(201).json(newReservation);

  } catch (error) {
      console.error('Erreur de réservation:', error);
      res.status(400).json({ 
          error: "Échec de la réservation",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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




router.get('/bookingAnalytics30Days', async (req, res) => {
  try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(thirtyDaysAgo);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);

      // Get counts for all statuses in both periods
      const [currentPeriodCounts, previousPeriodCounts] = await Promise.all([
          reservation.aggregate([
              {
                  $match: {
                      Date_Reservation: { 
                          $gte: thirtyDaysAgo,
                          $lte: now
                      }
                  }
              },
              {
                  $group: {
                      _id: "$Status",
                      count: { $sum: 1 }
                  }
              }
          ]),
          reservation.aggregate([
              {
                  $match: {
                      Date_Reservation: { 
                          $gte: sixtyDaysAgo,
                          $lte: thirtyDaysAgo
                      }
                  }
              },
              {
                  $group: {
                      _id: "$Status",
                      count: { $sum: 1 }
                  }
              }
          ])
      ]);

      // Convert arrays to objects for easier access
      const currentCounts = {};
      currentPeriodCounts.forEach(item => {
          currentCounts[item._id] = item.count;
      });

      const previousCounts = {};
      previousPeriodCounts.forEach(item => {
          previousCounts[item._id] = item.count;
      });

      // All possible statuses
      const allStatuses = ["confirmé", "annulé", "en attente"];
      
      // Calculate metrics for each status
      const results = {};
      allStatuses.forEach(status => {
          const current = currentCounts[status] || 0;
          const previous = previousCounts[status] || 0;
          
          let percentageChange = 0;
          let trend = "stable";
          
          if (previous > 0) {
              percentageChange = ((current - previous) / previous) * 100;
              if (Math.abs(percentageChange) >= 0.01) {
                  trend = percentageChange > 0 ? "up" : "down";
              }
          } else if (current > 0) {
              percentageChange = 100;
              trend = "up";
          }

          results[status] = {
              currentPeriodCount: current,
              previousPeriodCount: previous,
              percentageChange: percentageChange.toFixed(2),
              trend,
              message: current === previous 
                  ? `No change in ${status} bookings`
                  : `${status} bookings are ${trend} by ${Math.abs(percentageChange).toFixed(2)}%`
          };
      });

      // Add totals
      const totalCurrent = Object.values(currentCounts).reduce((a, b) => a + b, 0);
      const totalPrevious = Object.values(previousCounts).reduce((a, b) => a + b, 0);
      
      let totalPercentageChange = 0;
      let totalTrend = "stable";
      
      if (totalPrevious > 0) {
          totalPercentageChange = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
          if (Math.abs(totalPercentageChange) >= 0.01) {
              totalTrend = totalPercentageChange > 0 ? "up" : "down";
          }
      } else if (totalCurrent > 0) {
          totalPercentageChange = 100;
          totalTrend = "up";
      }

      results.total = {
          currentPeriodCount: totalCurrent,
          previousPeriodCount: totalPrevious,
          percentageChange: totalPercentageChange.toFixed(2),
          trend: totalTrend,
          message: totalCurrent === totalPrevious
              ? "No change in total bookings"
              : `Total bookings are ${totalTrend} by ${Math.abs(totalPercentageChange).toFixed(2)}%`
      };

      res.status(200).json({
          periodStart: thirtyDaysAgo.toISOString(),
          periodEnd: now.toISOString(),
          previousPeriodStart: sixtyDaysAgo.toISOString(),
          previousPeriodEnd: thirtyDaysAgo.toISOString(),
          analytics: results
      });

  } catch (error) {
      console.error('Error in booking analytics:', error);
      res.status(500).json({ 
          error: 'Server error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
});

/*router.get('/getReservationsWithDetails', async (req, res) => {
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
        $unwind: '$vol', // Unwind the vol array
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
        $unwind: {
          path: '$voyageurs',
          preserveNullAndEmptyArrays: true // Handle cases where voyageurs might be empty
        }
      },
      {
        $group: {
          _id: '$_id', // Group by reservation ID
          Num_Reservation: { $first: '$Num_Reservation' },
          Date_Reservation: { $first: '$Date_Reservation' },
          nbr_place: { $first: '$nbr_place' },
          Status: { $first: '$Status' },
          volDate: { $first: '$vol.Date_depart' },
          circuitName: { $first: '$circuit.Nom' },
          circuitPrice: { $first: '$circuit.Prix' },
          voyageurEmails: { $push: '$voyageurs.email' }, // Collect all voyageur emails
          paiement: { $first: { $arrayElemAt: ['$paiement', 0] } }, // Get first payment if exists
        },
      },
      {
        $addFields: {
          totalPrice: { $multiply: ['$circuitPrice', '$nbr_place'] } // Calculate total price
        }
      },
      {
        $project: {
          _id: 0,
          reservationId: '$_id',
          Num_Reservation: 1,
          Date_Reservation: 1,
          volDate: 1,
          nbr_place: 1,
          Status: 1,
          circuitName: 1,
          voyageurEmails: 1,
          totalPrice: 1,
          paiementStatus: '$paiement.statut' // Include payment status if needed
        }
      }
    ]);

    res.status(200).json(reservations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});*/


router.get('/getReservationsWithDetails', async (req, res) => {
  try {
    const { startDate, endDate, status, searchEmail } = req.query;
    
    // Build the match conditions
    const matchConditions = [];
    
    // Date range filter
    if (startDate && endDate) {
      matchConditions.push({
        'vol.Date_depart': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      });
    }
    
    // Status filter
    if (status) {
      matchConditions.push({
        Status: status
      });
    }
    
    // Email search
    if (searchEmail) {
      matchConditions.push({
        'voyageurs.email': { $regex: searchEmail, $options: 'i' }
      });
    }
    
    const pipeline = [
      {
        $lookup: {
          from: 'vols',
          localField: 'volId',
          foreignField: '_id',
          as: 'vol',
        },
      },
      {
        $unwind: '$vol',
      },
      {
        $lookup: {
          from: 'circuits',
          localField: 'vol.circuitId',
          foreignField: '_id',
          as: 'circuit',
        },
      },
      {
        $unwind: '$circuit',
      },
      {
        $lookup: {
          from: 'voyageurs',
          localField: 'voyageurs',
          foreignField: '_id',
          as: 'voyageurs',
        },
      },
      {
        $lookup: {
          from: 'paiements',
          localField: '_id',
          foreignField: 'reservation_id',
          as: 'paiement',
        },
      },
      ...(matchConditions.length ? [{ $match: { $and: matchConditions } }] : []),
      {
        $unwind: {
          path: '$voyageurs',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$_id',
          Num_Reservation: { $first: '$Num_Reservation' },
          Date_Reservation: { $first: '$Date_Reservation' },
          nbr_place: { $first: '$nbr_place' },
          Status: { $first: '$Status' },
          volDate: { $first: '$vol.Date_depart' },
          circuitName: { $first: '$circuit.Nom' },
          circuitPrice: { $first: '$circuit.Prix' },
          voyageurEmails: { $push: '$voyageurs.email' },
          paiement: { $first: { $arrayElemAt: ['$paiement', 0] } },
        },
      },
      {
        $addFields: {
          totalPrice: { $multiply: ['$circuitPrice', '$nbr_place'] }
        }
      },
      {
        $project: {
          _id: 0,
          reservationId: '$_id',
          Num_Reservation: 1,
          Date_Reservation: 1,
          volDate: 1,
          nbr_place: 1,
          Status: 1,
          circuitName: 1,
          voyageurEmails: 1,
          totalPrice: 1,
          paiementStatus: '$paiement.statut'
        }
      }
    ];

    const reservations = await reservation.aggregate(pipeline);
    res.status(200).json(reservations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/getReservationsWithDetailsByVoyageurEmail/:voyageurEmail', async (req, res) => {
  try {
    const voyageurEmail = req.params.voyageurEmail;
    const { startDate, endDate, status } = req.query;

    const matchConditions = [];

    // Add filters only after voyageurs lookup
    if (status) {
      matchConditions.push({ Status: status });
    }

    if (startDate && endDate) {
      matchConditions.push({
        'vol.Date_depart': {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });
    }

    // Always filter by voyageur email
    matchConditions.push({
      'voyageurs.email': { $regex: voyageurEmail, $options: 'i' },
    });

    const pipeline = [
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
          from: 'voyageurs',
          localField: 'voyageurs',
          foreignField: '_id',
          as: 'voyageurs',
        },
      },
      {
        $lookup: {
          from: 'paiements',
          localField: '_id',
          foreignField: 'reservation_id',
          as: 'paiement',
        },
      },
      {
        $unwind: {
          path: '$voyageurs',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $and: matchConditions,
        },
      },
      {
        $group: {
          _id: '$_id',
          Num_Reservation: { $first: '$Num_Reservation' },
          Date_Reservation: { $first: '$Date_Reservation' },
          nbr_place: { $first: '$nbr_place' },
          Status: { $first: '$Status' },
          volDate: { $first: '$vol.Date_depart' },
          circuitName: { $first: '$circuit.Nom' },
          circuitPrice: { $first: '$circuit.Prix' },
          voyageurEmails: { $addToSet: '$voyageurs.email' },
          paiement: { $first: { $arrayElemAt: ['$paiement', 0] } },
        },
      },
      {
        $addFields: {
          totalPrice: { $multiply: ['$circuitPrice', '$nbr_place'] },
        },
      },
      {
        $project: {
          _id: 0,
          reservationId: '$_id',
          Num_Reservation: 1,
          Date_Reservation: 1,
          volDate: 1,
          nbr_place: 1,
          Status: 1,
          circuitName: 1,
          voyageurEmails: 1,
          totalPrice: 1,
          paiementStatus: '$paiement.statut',
        },
      },
    ];

    const reservations = await reservation.aggregate(pipeline);
    res.status(200).json(reservations);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});




router.get('/reservationDetails/:id', async (req, res) => {
  try {
    const reservationId = req.params.id;

    const pipeline = [
      {
        $match: { _id: new mongoose.Types.ObjectId(reservationId) }
      },
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
          from: 'voyageurs',
          localField: 'voyageurs',
          foreignField: '_id',
          as: 'voyageurs',
        },
      },
      {
        $lookup: {
          from: 'paiements',
          localField: '_id',
          foreignField: 'reservation_id',
          as: 'paiement',
        },
      },
      {
        $addFields: {
          paiement: { $arrayElemAt: ['$paiement', 0] }, // get first paiement if any
          totalPrice: { $multiply: ['$circuit.Prix', '$nbr_place'] }
        }
      },
      {
        $project: {
          _id: 0,
          reservationId: '$_id',
          Num_Reservation: 1,
          Date_Reservation: 1,
          nbr_place: 1,
          Status: 1,
          voyageurs: 1,
          paiement: {
            statut: '$paiement.statut',
            date_paiement: '$paiement.date_paiement',
            montant: '$paiement.montant',
            method: '$paiement.method'
          },
          vol: {
            Date_depart: '$vol.Date_depart',
            Heure_depart: '$vol.Heure_depart',
            Heure_arrive: '$vol.Heure_arrive',
            lieu_depart: '$vol.lieu_depart',
            lieu_arrive: '$vol.lieu_arrive'
          },
          circuit: {
            Nom: '$circuit.Nom',
            Description: '$circuit.Description',
            Prix: '$circuit.Prix'
          },
          totalPrice: 1
        }
      }
    ];

    const result = await reservation.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});


/*router.get('/getReservationsWithDetails', async (req, res) => {
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
});*/
/*router.get('/getReservationsByVille/:villeName', async (req, res) => {
  try {
    const { villeName } = req.params;
    
    // Calculate date 365 days ago from now
    const date365DaysAgo = new Date();
    date365DaysAgo.setDate(date365DaysAgo.getDate() - 365);

    const reservations = await reservation.aggregate([
      {
        $match: {
          Date_Reservation: { $gte: date365DaysAgo },
          Status : "confirmé"
        }
      },
      {
        $lookup: {
          from: 'vols',
          localField: 'volId',
          foreignField: '_id',
          as: 'vol',
        },
      },
      {
        $unwind: '$vol',
      },
      {
        $lookup: {
          from: 'circuits',
          localField: 'vol.circuitId',
          foreignField: '_id',
          as: 'circuit',
        },
      },
      {
        $unwind: '$circuit',
      },
      {
        $lookup: {
          from: 'villes',
          localField: 'circuit.villeId',
          foreignField: '_id',
          as: 'ville',
        },
      },
      {
        $unwind: '$ville',
      },
      {
        $match: {
          'ville.Nom': villeName,
        },
      },
      {
        $lookup: {
          from: 'voyageurs',
          localField: 'voyageurs',
          foreignField: '_id',
          as: 'voyageurs',
        },
      },
      {
        $lookup: {
          from: 'paiements',
          localField: '_id',
          foreignField: 'reservation_id',
          as: 'paiement',
        },
      },
      {
        $group: {
          _id: '$_id',
          Num_Reservation: { $first: '$Num_Reservation' },
          reservationDate: { $first: '$Date_Reservation' },
          volDate: { $first: '$vol.Date_depart' },
          numberOfVoyageurs: { $first: { $size: '$voyageurs' } },
          circuitName: { $first: '$circuit.Nom' },
          reservationStatus: { $first: '$Status' }, // Changed from vol.status to reservation.Status
          paiement: { $push: '$paiement' },
        },
      },
      {
        $project: {
          _id: 0,
          reservationId: '$_id',
          Num_Reservation: 1,
          reservationDate: 1,
          volDate: 1,
          numberOfVoyageurs: 1,
          circuitName: 1,
          reservationStatus: 1,
          paiement: 1,
        },
      },
    ]);

    res.status(200).json(reservations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
*/



/*router.get('/getReservationsByVille/:villeName', async (req, res) => {
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
      {
        $unwind: '$vol',
      },
      {
        $lookup: {
          from: 'circuits',
          localField: 'vol.circuitId',
          foreignField: '_id',
          as: 'circuit',
        },
      },
      {
        $unwind: '$circuit',
      },
      {
        $lookup: {
          from: 'villes',
          localField: 'circuit.villeId',
          foreignField: '_id',
          as: 'ville',
        },
      },
      {
        $unwind: '$ville',
      },
      {
        $match: {
          'ville.Nom': villeName, // Filter by city name only
        },
      },
      {
        $lookup: {
          from: 'voyageurs',
          localField: 'voyageurs',
          foreignField: '_id',
          as: 'voyageurs',
        },
      },
      {
        $unwind: {
          path: '$voyageurs',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$_id',
          Num_Reservation: { $first: '$Num_Reservation' },
          Date_Reservation: { $first: '$Date_Reservation' },
          nbr_place: { $first: '$nbr_place' },
          Status: { $first: '$Status' },
          volDate: { $first: '$vol.Date_depart' },
          circuitName: { $first: '$circuit.Nom' },
          circuitPrice: { $first: '$circuit.prix' },
          villeName: { $first: '$ville.Nom' },
          voyageurEmails: { $push: '$voyageurs.email' },
         
        },
      },
      {
        $addFields: {
          totalPrice: { $multiply: ['$circuitPrice', '$nbr_place'] }
        }
      },
      {
        $project: {
          _id: 0,
          reservationId: '$_id',
          Num_Reservation: 1,
          Date_Reservation: 1,
          volDate: 1,
          nbr_place: 1,
          Status: 1,
          circuitName: 1,
          villeName: 1,
          voyageurEmails: 1,
          totalPrice: 1,
          
        }
      }
    ]);

    res.status(200).json(reservations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});*/

router.get('/getReservationsByVille/:villeName', async (req, res) => {
  try {
    const { villeName } = req.params;
    const { startDate, endDate, status, searchEmail } = req.query;
    console.log("Search email parameter:", req.query.searchEmail);

    // Build the match conditions
    const matchConditions = [{
      'ville.Nom': villeName // Always filter by city name
    }];
    
    // Date range filter
    if (startDate && endDate) {
      matchConditions.push({
        'vol.Date_depart': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      });
    }
    
    // Status filter
    if (status) {
      matchConditions.push({
        'Status': status
      });
    }
    
  // NEW: Proper email search implementation
  if (searchEmail) {
    matchConditions.push({
      $or: [
        { 'voyageurs.email': { $regex: searchEmail, $options: 'i' } },
        { 'voyageurEmails': { $elemMatch: { $regex: searchEmail, $options: 'i' } } }
      ]
    });
  }

    const pipeline = [
      {
        $lookup: {
          from: 'vols',
          localField: 'volId',
          foreignField: '_id',
          as: 'vol',
        },
      },
      {
        $unwind: '$vol',
      },
      {
        $lookup: {
          from: 'circuits',
          localField: 'vol.circuitId',
          foreignField: '_id',
          as: 'circuit',
        },
      },
      {
        $unwind: '$circuit',
      },
      {
        $lookup: {
          from: 'villes',
          localField: 'circuit.villeId',
          foreignField: '_id',
          as: 'ville',
        },
      },
      {
        $unwind: '$ville',
      },
      {
        $match: {
          $and: matchConditions // Apply all filters
        }
      },
      {
        $lookup: {
          from: 'voyageurs',
          localField: 'voyageurs',
          foreignField: '_id',
          as: 'voyageurs',
        },
      },
      {
        $lookup: {
          from: 'paiements',
          localField: '_id',
          foreignField: 'reservation_id',
          as: 'paiement',
        },
      },
      {
        $unwind: {
          path: '$voyageurs',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$_id',
          Num_Reservation: { $first: '$Num_Reservation' },
          Date_Reservation: { $first: '$Date_Reservation' },
          nbr_place: { $first: '$nbr_place' },
          Status: { $first: '$Status' },
          volDate: { $first: '$vol.Date_depart' },
          circuitName: { $first: '$circuit.Nom' },
          circuitPrice: { $first: '$circuit.Prix' },
          villeName: { $first: '$ville.Nom' },
          voyageurEmails: { $push: '$voyageurs.email' },
          paiement: { $first: { $arrayElemAt: ['$paiement', 0] } }
        },
      },
      {
        $addFields: {
          totalPrice: { $multiply: ['$circuitPrice', '$nbr_place'] }
        }
      },
      {
        $project: {
          _id: 0,
          reservationId: '$_id',
          Num_Reservation: 1,
          Date_Reservation: 1,
          volDate: 1,
          nbr_place: 1,
          Status: 1,
          circuitName: 1,
          villeName: 1,
          voyageurEmails: 1,
          totalPrice: 1,
          paiementStatus: '$paiement.statut'
        }
      }
    ];

    const reservations = await reservation.aggregate(pipeline);
    res.status(200).json(reservations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
/*// Get reservations grouped by circuit for a specific ville
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
});*/

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
    
        // Calculate date 365 days ago from now
        const date365DaysAgo = new Date();
        date365DaysAgo.setDate(date365DaysAgo.getDate() - 365);
    
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
    
        // Step 4: Find all reservations associated with the vols from the last 365 days
        const volIds = vols.map((vol) => vol._id);
        const reservations = await reservation.find({
          volId: { $in: volIds },
          Date_Reservation: { $gte: date365DaysAgo },
          Status : "confirmé" 
        }) // Optional: populate voyageurs if needed
    
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



// Add this new endpoint

router.patch('/updateReservationStatus/:numReservation', async (req, res) => {
  try {
    const { numReservation } = req.params;
    const { status } = req.body;

    const updatedReservation = await reservation.findOneAndUpdate(
      { Num_Reservation: numReservation },
      { Status: status },
      { new: true }
    ).populate({ path: 'voyageurs', model: 'voyageur' });

    if (!updatedReservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (updatedReservation.voyageurs?.length > 0) {
      const voyageur = updatedReservation.voyageurs[0]; // Pick the first one (or loop if needed)
    
      if (voyageur.email) {
        try {
          await sendEmail(
            voyageur.email,
            `Statut de réservation mis à jour`,
            `Bonjour ${voyageur.prenom} ${voyageur.Nom},
    
    Le statut de votre réservation ${updatedReservation.Num_Reservation} est maintenant : ${status.toUpperCase()}.
    
    Merci pour votre confiance.
    
    Cordialement,
    Équipe HeliTour`
          );
          console.log(`✅ Email envoyé à ${voyageur.email}`);
        } catch (emailErr) {
          console.error(`❌ Échec d’envoi à ${voyageur.email}:`, emailErr.message);
        }
        await sendWhatsApp(
          `+216${voyageur.phone}`, // replace with `voyageur.whatsapp`
          `Bonjour ${voyageur.nom}, votre réservation (${reservation.Num_Reservation}) a été mise à jour. Nouveau statut: ${status}.`
        );
      } else {
        console.warn("⚠️ Aucun email trouvé pour ce voyageur.");
      }
    }
    

    res.status(200).json(updatedReservation);
  } catch (error) {
    console.error("Erreur updateReservationStatus:", error);
    res.status(500).json({ error: error.message });
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
  
router.get('/counts', async (req, res) => {
  try {
      const [
          villeCount,
          confirmedReservationCount,
          userCount,
          voyageurCount
      ] = await Promise.all([
          Ville.countDocuments(),
          reservation.countDocuments({ Status: 'confirmé' }),
          Utilisateur.countDocuments(),
          Voyageur.countDocuments()
      ]);

      res.status(200).json({
          villeCount,
          confirmedReservationCount,
          userCount,
          voyageurCount
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
router.post('/send-confirmation-email', async (req, res) => {
  const { email, reservation,phone } = req.body;

  if (!email || !reservation) {
    return res.status(400).json({ error: 'Email and reservation data are required.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,         // Use env variables in real projects
        pass: process.env.EMAIL_PASS,       // Use an App Password if using Gmail
      },
    });

    const mailOptions = {
      from: '"Helitour Tunisia" <malekchallouf24@gmail.com>',
      to: email,
      subject: 'Your Helitour Booking Confirmation',
      html: `
        <h2>Reservation Confirmation</h2>
        <p><strong>Reservation Number:</strong> ${reservation.Num_Reservation}</p>
        <p><strong>Status:</strong> ${reservation.Status}</p>
        <p><strong>Date:</strong> ${new Date(reservation.Date_Reservation).toLocaleString()}</p>
        <p><strong>Total Price:</strong> DT ${reservation.totalPrice}</p>
        <hr/>
        <p>Thank you for choosing our service!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    await sendWhatsApp(
      `+216${phone}`, // replace with `voyageur.whatsapp`
      `Your Helitour Booking Confirmation - Bonjour, Reservation Confirmation
        Reservation Number: ${reservation.Num_Reservation}
        Status: ${reservation.Status}
        Date: ${new Date(reservation.Date_Reservation).toLocaleString()}
        Total Price: DT ${reservation.totalPrice}
        
        Thank you for choosing our service!`
    );
    res.status(200).json({ message: 'Confirmation email sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send confirmation email.' });
  }
});
// Supprimer toutes les villes
router.delete('/deleteAll', async (req, res) => {
  try {
      const result = await reservation.deleteMany({});
      res.status(200).json({ message: `${result.deletedCount} reservations supprimées.` });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

module.exports=router;
