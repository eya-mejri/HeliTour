const express =require('express');
const verifyToken=require('../middlewares/verifyToken');
const authorizeRoles=require('../middlewares/roleMiddleware');
const moment = require('moment');
const nodemailer = require('nodemailer');
const { diff } = require('deep-diff');

const router=express.Router();
const vol = require('../models/vol');
const circuit = require('../models/circuit');



//AJOUTER vol (admin)
router.post('/addVol',/*verifyToken,authorizeRoles('Admin'), */async (req, res) => {
    try {
        const { Date_depart, place_disponible, status,Duree, circuitId } = req.body;

        // Validate required fields
        if (!Date_depart || place_disponible === undefined || !status || !circuitId || !Duree) {
            return res.status(400).json({ error: "Veuillez fournir toutes les informations requises !" });
        }
        // Ensure circuit exists
        const existingCircuit = await circuit.findById(circuitId);
        if (!existingCircuit) {
            return res.status(404).json({ error: "Circuit introuvable !" });
        }

        // Create and save the vol
        const newVol = new vol({
            Date_depart: new Date(req.body.Date_depart),
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



// a modifier de sort que lorsqu'on supp un vol , il va etre supprimer de la liste de circuit qu'il correspond 
// supprimer vol par id (admin)
router.delete('/deleteVol/:id',verifyToken,authorizeRoles('Admin'), async (req, res) => {
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
// In your backend routes
router.get('/date/:date', async (req, res) => {
    try {
        const date = req.params.date;
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const vols = await Vol.find({
            Date_depart: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });
        
        res.json(vols);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// In your vol routes file
router.get('/circuit-date/:circuitId/:date', async (req, res) => {
    try {
        const { circuitId, date } = req.params;
        
        // Validate date format
        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
        }

        const startOfDay = moment(date).startOf('day').toDate();
        const endOfDay = moment(date).endOf('day').toDate();
        
        const vols = await vol.find({
            circuitId: circuitId,
            Date_depart: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).select('Date_depart'); // Only return the date field
        
        res.json(vols);
    } catch (error) {
        console.error('Error fetching flights:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});
// get by id
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


//get vol complet:
router.get('/getComplet', async (req, res) => {
    try {
        const vol1 = await vol.find({place_disponible:0});
        if (!vol1) {
            return res.status(404).json({ error: "pas de vol complètes" });
        }
        res.status(200).json(vol1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//get vol by status
router.get('/getStatus/:Status', async (req, res) => {
    try {
        const { Status } = req.params;
        const vol1 = await vol.find({status:Status});
        if (!vol1) {
            return res.status(404).json({ error: `pas de vol ${Status}` });
        }
        res.status(200).json(vol1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//get vol by day
/*router.get('/getByDay/:Day', async (req, res) => {
    try {
        const { Day } = req.params;
        const vol1 = await vol.find({Date_depart:Day});
        if (!vol1) {
            return res.status(404).json({ error: `pas de vol en  ${Day}` });
        }
        res.status(200).json(vol1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});*/
router.get('/vols/:year/:month/:day', async (req, res) => {
    const { year, month, day } = req.params;

    // Create start and end of the day
    const startOfDay = new Date(year, month - 1, day); // Month is 0-indexed
    const endOfDay = new Date(year, month - 1, day + 1);

    try {
        // Find vols where Date_depart is within the specified day
        const vols = await vol.find({
            Date_depart: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        }); 
        
        res.status(200).json({vols});
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving vols', error: error.message });
    }
});

//get vols of today
router.get('/getVolsToday', async (req, res) => {
    const now = new Date();

    // Calculate the start of the day (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate the end of the day (23:59:59.999)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    try {
        // Find vols where Date_depart is within today
        const vols = await vol.find({
            Date_depart: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        res.status(200).json(vols);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving vols', error: error.message });
    }
});

router.get('/getall2', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start and end date are required' });
        }

        console.log('Received startDate:', startDate);
        console.log('Received endDate:', endDate);

        const start = new Date(startDate);
        const end = new Date(endDate);

        console.log('Parsed startDate:', start);
        console.log('Parsed endDate:', end);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const vols = await vol.find({
            Date_depart: {
                $gte: start,
                $lte: end,
            },
        });

        console.log('Filtered vols:', vols);
        res.json(vols);
    } catch (error) {
        console.error('Error in /getall2:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.get('/getfirst', async (req, res) => {
    try {
        const firstVol = await vol.find().sort({ Date_depart: 1 }).limit(1).exec(); // Ensures query runs correctly
        if (firstVol.length > 0) {
            res.json({ Date_depart: firstVol[0].Date_depart });
        } else {
            res.status(404).json({ message: 'No flights found' });
        }
    } catch (error) {
        console.error('Error fetching first flight:', error); // Log error for debugging
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
router.get('/getlast', async (req, res) => {
    try {
        // Add CORS headers if needed
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        
        const lastVol = await vol.find().sort({ Date_depart: -1 }).limit(1).exec(); // Sort descending to get most recent
        if (lastVol.length > 0) {
            res.json({ Date_depart: lastVol[0].Date_depart });
        } else {
            res.status(404).json({ message: 'No flights found' });
        }
    } catch (error) {
        console.error('Error fetching last flight:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// mise a jour de vol by id
/*router.put('/putVol',/*verifyToken,authorizeRoles('Admin'), async (req, res) => {
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
});*/
// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Field name mappings for friendly display
  const FIELD_NAMES = {
    'Duree': 'Durée du vol (minutes)',
    'Date_depart': 'Date et heure de départ',
    'place_disponible': 'Places disponibles',
    'status': 'Statut du vol',
    'circuitId': 'Circuit'
  };
  
  // Format values for display
  const formatValue = (value, field) => {
    if (field === 'Date_depart') {
      return new Date(value).toLocaleString();
    }
    if (field === 'circuitId' && typeof value === 'object') {
      return value.Nom; // Assuming Circuit has a Nom field
    }
    return value;
  };
  
  // Update flight endpoint
  router.put('/putVol', async (req, res) => {
    try {
      const { _id } = req.body;
      
      // 1. Get previous flight data
      const previousVol = await vol.findById(_id)
        .populate('circuitId')
        .populate({
          path: 'reservations',
          populate: {
            path: 'voyageurs',
            model: 'Voyageur'
          }
        });
  
      if (!previousVol) {
        return res.status(404).json({ error: "Vol non trouvé" });
      }
  
      // 2. Update the flight
      const updatedVol = await vol.findOneAndUpdate(
        { _id },
        req.body,
        { new: true }
      ).populate('circuitId');
  
      // 3. Detect changes
      const changes = diff(
        previousVol.toObject({ virtuals: true }),
        updatedVol.toObject({ virtuals: true })
      );
  
      if (changes && changes.length > 0) {
        // 4. Prepare change details
        const changeDetails = changes
          .filter(change => change.kind === 'E') // Only edited fields
          .map(change => ({
            field: change.path[0],
            from: formatValue(change.lhs, change.path[0]),
            to: formatValue(change.rhs, change.path[0])
          }));
  
        // 5. Notify all passengers if there are changes
        if (changeDetails.length > 0) {
          for (const reservation of previousVol.reservations) {
            for (const voyageur of reservation.voyageurs) {
              try {
                await transporter.sendMail({
                  from: process.env.EMAIL_USER,
                  to: voyageur.email,
                  subject: `Modification de votre vol ${updatedVol._id}`,
                  html: `
                    <h3>Bonjour ${voyageur.prenom} ${voyageur.Nom},</h3>
                    <p>Votre vol a été modifié :</p>
                    <ul>
                      ${changeDetails.map(change => `
                        <li>
                          <strong>${FIELD_NAMES[change.field] || change.field}:</strong><br>
                          Ancienne valeur: ${change.from}<br>
                          Nouvelle valeur: ${change.to}
                        </li>
                      `).join('')}
                    </ul>
                    <p>Veuillez vérifier ces modifications sur notre plateforme.</p>
                    <p>Cordialement,<br>Équipe de réservation</p>
                  `
                });
                console.log(`Notification sent to ${voyageur.email}`);
              } catch (emailError) {
                console.error(`Failed to notify ${voyageur.email}:`, emailError);
              }
            }
          }
        }
      }
  
      res.status(200).json(updatedVol);
    } catch (error) {
      console.error('Update error:', error);
      res.status(400).json({ error: error.message });
    }
  });



module.exports=router;