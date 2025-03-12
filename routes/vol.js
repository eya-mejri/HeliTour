const express =require('express');
const verifyToken=require('../middlewares/verifyToken');
const authorizeRoles=require('../middlewares/roleMiddleware');
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



// mise a jour de vol by id
router.put('/putVol',verifyToken,authorizeRoles('Admin'), async (req, res) => {
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