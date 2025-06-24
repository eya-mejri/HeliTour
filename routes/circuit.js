const express =require('express');
const router=express.Router();
const circuit = require('../models/circuit');
const Ville = require('../models/ville');
const verifyToken=require('../middlewares/verifyToken');
const authorizeRoles=require('../middlewares/roleMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'public', 'assets', 'img', 'circuits');
        // Create the directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const circuitName = req.body.Nom.replace(/\s+/g, '_'); // Replace spaces with underscores
        const fileExtension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${circuitName}-${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage }).array('photos', 10); // Allow up to 10 photos

// AJOUTER Circuit (admin) with photos
router.post('/addCircuit2', upload, async (req, res) => {
    try {
        const { Nom, Description, Prix, Disponibilite, villeId } = req.body;
        const photos = req.files ? req.files.map(file => file.filename) : [];

        // Validate required fields
        if (!Nom || !Description || Prix === undefined || !villeId) {
            // Clean up uploaded files if validation fails
            if (req.files) {
                req.files.forEach(file => {
                    fs.unlinkSync(file.path);
                });
            }
            return res.status(400).json({ error: "Veuillez fournir toutes les informations requises !" });
        }

        // Check if the ville exists
        const ville = await Ville.findById(villeId);
        if (!ville) {
            // Clean up uploaded files if ville not found
            if (req.files) {
                req.files.forEach(file => {
                    fs.unlinkSync(file.path);
                });
            }
            return res.status(404).json({ error: "Ville introuvable !" });
        }

        // Create and save the circuit
        const newCircuit = new circuit({
            Nom,
            Description,
            Prix,
            Disponibilite,
            villeId,
            vols: [],
            photos // Add the photo filenames to the circuit
        });

        const savedCircuit = await newCircuit.save();
        
        // Add the circuit to the list of circuits in the Ville
        ville.circuits.push(savedCircuit._id);
        await ville.save();
        
        res.status(201).json(savedCircuit);
    } catch (error) {
        // Clean up uploaded files if error occurs
        if (req.files) {
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
        }
        res.status(500).json({ error: error.message });
    }
});


// supprimer circuit par id (admin)
router.delete('/deletCircuit/:id',verifyToken,authorizeRoles('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCircuit = await circuit.findByIdAndDelete(id);
        if (!deletedCircuit) {
            return res.status(404).json({ error: "circuit non trouvé" });
        }
        res.status(200).json({ message: "Circuit supprimé avec succès", deletedCircuit });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// avoir tout les circuits
router.get('/getall', async (req, res) => {
    try {
        const cirs= await circuit.find();
        res.status(200).json(cirs);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// avoir circuit by id 
router.get('/getbyid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cir = await circuit.findById(id);
        if (!cir) {
            return res.status(404).json({ error: "circuit non trouvé" });
        }
        res.status(200).json(cir);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//get circuit by ville name
router.get('/getbyVille/:name', async (req, res) => {
    try {
        const { name } = req.params;

        // Find the ville by name
        const ville1 = await Ville.findOne({ Nom: name });

        if (!ville1) {
            return res.status(404).json({ error: "Ville non trouvée" });
        }

        // Find circuits associated with this ville
        const circuits = await circuit.find({ villeId: ville1._id });

        if (circuits.length === 0) {
            return res.status(404).json({ error: "Aucun circuit trouvé pour cette ville" });
        }

        res.status(200).json(circuits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/getbyvilleid/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find circuits associated with this ville
        const circuits = await circuit.find({ villeId: id});

        if (circuits.length === 0) {
            return res.status(404).json({ error: "Aucun circuit trouvé pour cette ville" });
        }

        res.status(200).json(circuits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/putCircuit', upload, async (req, res) => {
    try {
        const { _id, Nom, Description, Prix, Disponibilite, villeId } = req.body;

        // Trouver le circuit existant
        const existingCircuit = await circuit.findById(_id);
        if (!existingCircuit) {
            return res.status(404).json({ error: "Circuit not found" });
        }

        if (req.body.photosToDelete) {
            const imagesToDelete = Array.isArray(req.body.photosToDelete)
                ? req.body.photosToDelete
                : [req.body.photosToDelete];

            imagesToDelete.forEach(photo => {
                const imgPath = path.join(__dirname, '..', 'public', 'assets', 'img', 'circuits', photo);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                }
                existingCircuit.photos = existingCircuit.photos.filter(p => p !== photo);
            });
        }

        if (req.files && req.files.length > 0) {
            const newPhotos = req.files.map(file => file.filename);
            existingCircuit.photos.push(...newPhotos);
        }

        existingCircuit.Nom = Nom;
        existingCircuit.Description = Description;
        existingCircuit.Prix = Number(Prix);
        existingCircuit.Disponibilite = Disponibilite === "true";
        if (villeId) existingCircuit.villeId = villeId;

        const updatedCircuit = await existingCircuit.save();
        res.status(200).json(updatedCircuit);

    } catch (error) {
        console.error("Error updating circuit:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
  router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the appareil
        const deletedCircuit = await circuit.findByIdAndDelete(id);
        
        if (!deletedCircuit) {
            return res.status(404).json({ error: "circuit non trouvé" });
        }

        res.status(200).json({ message: "circuit supprimé avec succès" });
    } catch (error) {
        console.error("Error deleting circuit:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET /api/circuits/:villeId
router.get('/new/:villeId', async (req, res) => {
    const circuits = await circuit.find({ villeId: req.params.villeId });
    res.json(circuits);
});
// Supprimer toutes les villes
router.delete('/deleteAll', async (req, res) => {
    try {
        const result = await circuit.deleteMany({});
        res.status(200).json({ message: `${result.deletedCount} circuits supprimées.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });



module.exports=router;