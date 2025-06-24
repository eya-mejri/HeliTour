const axios = require('axios');
const express = require('express');
const router = express.Router();
const Paiement = require('../models/paiements');
const Reservation = require('../models/reservation');


router.post('/addPaiement', async (req, res) => {
    try {
        const data = req.body;
        const paiement = new Paiement(data);
        const savedPaiement = await paiement.save();
        res.status(201).json(savedPaiement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/deletePaiement/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPaiement = await Paiement.findByIdAndDelete(id);
        if (!deletedPaiement) {
            return res.status(404).json({ error: "Paiement non trouvé" });
        }
        res.status(200).json({ message: "Paiement supprimé avec succès", deletedPaiement });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/getAllPaiements', async (req, res) => {
    try {
        const paiements = await Paiement.find();
        res.status(200).json(paiements);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/getPaymentSummary', async (req, res) => {
    try {
      const now = new Date();
      
      // Current period (last 30 days)
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 30);
      
      // Previous period (30-60 days ago)
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 30);
  
      // Get amounts for both periods (only successful payments)
      const [currentResult, previousResult] = await Promise.all([
        Paiement.aggregate([
          { 
            $match: { 
              statut: "réussi",
              date_paiement: { $gte: currentStart, $lte: now }
            } 
          },
          { $group: { _id: null, total: { $sum: "$montant" } } }
        ]),
        Paiement.aggregate([
          { 
            $match: { 
              statut: "réussi",
              date_paiement: { $gte: previousStart, $lte: currentStart }
            } 
          },
          { $group: { _id: null, total: { $sum: "$montant" } } }
        ])
      ]);
  
      // Extract totals (default to 0 if no results)
      const currentAmount = currentResult[0]?.total || 0;
      const previousAmount = previousResult[0]?.total || 0;
  
      // Calculate percentage change
      let percentageChange = "0.00";
      if (previousAmount > 0) {
        percentageChange = (((currentAmount - previousAmount) / previousAmount) * 100).toFixed(2);
      } else if (currentAmount > 0) {
        percentageChange = "100.00"; // No previous amount but current exists
      }
  
      res.status(200).json({
        currentMonthAmount: currentAmount,
        previousMonthAmount: previousAmount,
        percentageChange
      });
  
    } catch (error) {
      console.error('Payment summary error:', error);
      res.status(500).json({ 
        error: 'Server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  
router.get('/getPaiementById/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const paiement = await Paiement.findById(id);
        if (!paiement) {
            return res.status(404).json({ error: "Paiement non trouvé" });
        }
        res.status(200).json(paiement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/getPaiementsByMonth', async (req, res) => {
    try {
        // Step 1: Use MongoDB aggregation to group payments by month and year
        const paiementsByMonth = await Paiement.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$date_paiement" }, // Extract year from date_paiement
                        month: { $month: "$date_paiement" } // Extract month from date_paiement
                    },
                    totalMontant: { $sum: "$montant" } // Sum the montant for each group
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
            },
            {
                $project: {
                    _id: 0, // Exclude the default _id field
                    year: "$_id.year", // Rename _id.year to year
                    month: "$_id.month", // Rename _id.month to month
                    totalMontant: 1 // Include the totalMontant field
                }
            }
        ]);

        // Step 2: Send the response
        res.status(200).json(paiementsByMonth);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/getPaiementsOfThisMonth', async (req, res) => {
    try {
        // Get the current date
        const currentDate = new Date();

        // Get the start of the current month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        // Get the end of the current month
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Step 1: Use MongoDB aggregation to filter payments for the current month
        const paiementsThisMonth = await Paiement.aggregate([
            {
                $match: {
                    date_paiement: {
                        $gte: startOfMonth, // Greater than or equal to the start of the month
                        $lte: endOfMonth   // Less than or equal to the end of the month
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date_paiement" }, // Extract year from date_paiement
                        month: { $month: "$date_paiement" } // Extract month from date_paiement
                    },
                    totalMontant: { $sum: "$montant" } // Sum the montant for each group
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
            },
            {
                $project: {
                    _id: 0, // Exclude the default _id field
                    year: "$_id.year", // Rename _id.year to year
                    month: "$_id.month", // Rename _id.month to month
                    totalMontant: 1 // Include the totalMontant field
                }
            }
        ]);

        // Step 2: Send the response
        res.status(200).json(paiementsThisMonth);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/*router.put('/updatePaiement/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dataToUpdate = req.body;
        const updatedPaiement = await Paiement.findByIdAndUpdate(id, dataToUpdate, { new: true });

        if (!updatedPaiement) {
            return res.status(404).json({ error: "Paiement non trouvé" });
        }

        res.status(200).json(updatedPaiement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});*/
router.delete('/deleteAll', async (req, res) => {
    try {
        const result = await Paiement.deleteMany({});
        res.status(200).json({ message: `${result.deletedCount} paiement  supprimées.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });




const initiateFlouciPayment = async (req, res) => {
  try {
    const { amount, reservationId, customer_email, customer_phone } = req.body;
    
    // First create a payment record in our database
    const newPayment = new Paiement({
      reservation_id: reservationId,
      montant: amount,
      devise: 'TND',
      statut: 'en_attente'
    });
    await newPayment.save();

    // Initiate Flouci payment
    const flouciResponse = await axios.post('https://developer.flouci.com/api/generate_payment', {
      app_token: process.env.FLOUCI_APP_TOKEN,
      app_secret: process.env.FLOUCI_APP_SECRET,
      amount,
      accept_card: true,
      session_timeout_secs: 1200,
      success_link: `${process.env.FRONTEND_URL}/payment/success`,
      fail_link: `${process.env.FRONTEND_URL}/payment/fail`,
      developer_tracking_id: newPayment._id.toString(), // Use our payment ID for tracking
      customer_email,
      customer_phone
    });

    // Update payment with Flouci reference
    newPayment.flouci_payment_id = flouciResponse.data.payment_id;
    await newPayment.save();

    res.json({
      payment_url: flouciResponse.data.payment_url,
      payment_id: flouciResponse.data.payment_id,
      our_payment_id: newPayment._id
    });
  } catch (error) {
    console.error('Flouci initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

const verifyFlouciPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // First get our payment record
    const payment = await Paiement.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify with Flouci
    const flouciResponse = await axios.get(
      `https://developer.flouci.com/api/verify_payment/${payment.flouci_payment_id}`
    );

    // Update payment status based on Flouci response
    let newStatus = 'échoué';
    if (flouciResponse.data.status === 'paid') {
      newStatus = 'réussi';
      
      // Update reservation status
      await Reservation.findByIdAndUpdate(payment.reservation_id, {
        Status: 'confirmé'
      });
    }

    payment.statut = newStatus;
    payment.date_paiement = new Date();
    await payment.save();

    res.json({
      status: newStatus,
      reservation_id: payment.reservation_id
    });
  } catch (error) {
    console.error('Flouci verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// Webhook handler for Flouci notifications
const flouciWebhook = async (req, res) => {
  try {
    const { payment_id, status } = req.body;
    
    // Find payment by Flouci payment ID
    const payment = await Paiement.findOne({ flouci_payment_id: payment_id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    let newStatus = status === 'paid' ? 'réussi' : 'échoué';
    payment.statut = newStatus;
    payment.date_paiement = new Date();
    await payment.save();

    if (status === 'paid') {
      // Update reservation status
      await Reservation.findByIdAndUpdate(payment.reservation_id, {
        Status: 'confirmé'
      });
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};
router.post('/flouci-initiate', initiateFlouciPayment);
router.get('/flouci-status/:paymentId', verifyFlouciPayment);
router.post('/flouci-webhook', flouciWebhook);


  

module.exports = router;
