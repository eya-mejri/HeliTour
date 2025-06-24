const express =require('express');
const verifyToken=require('../middlewares/verifyToken');
const authorizeRoles=require('../middlewares/roleMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router=express.Router();
const ville = require('../models/ville');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'public', 'assets', 'img', 'villes');
        // Create the directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const villeName = req.body.Nom.replace(/\s+/g, '_'); 
        const fileExtension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${villeName}-${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage }).array('photos', 10); 

// AJOUTER Ville (admin) with photos
router.post('/addVille', upload, async (req, res) => {
    try {
        const { Nom, Description } = req.body;
        const photos = req.files ? req.files.map(file => file.filename) : [];

       
        if (!Nom || !Description) {
            if (req.files) {
                req.files.forEach(file => {
                    fs.unlinkSync(file.path);
                });
            }
            return res.status(400).json({ error: "Veuillez fournir toutes les informations requises !" });
        }

        
        const newVille = new ville({
            Nom,
            Description,
            photos, 
            circuits: []
        });

        const savedVille = await newVille.save();
        res.status(201).json({ message: "Ville ajoutée avec succès", savedVille });
    } catch (error) {
       
        if (req.files) {
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
        }
        res.status(500).json({ error: error.message });
    }
});
//delete
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)
        // Find and delete the appareil
        const deletedVille = await ville.findByIdAndDelete(id);
        
        if (!deletedVille) {
            return res.status(404).json({ error: "Ville non trouvé" });
        }

        res.status(200).json({ message: "Ville supprimé avec succès" });
    } catch (error) {
        console.error("Error deleting ville:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});



// avoir tout les ville
router.get('/getall', async (req, res) => {
    try {
        const ville1= await ville.find();
        res.status(200).json(ville1);
    } catch (error) {
        res.status(400).json({ error: error.message})};
});

// avoir ville by name
router.get('/getByName/:nom', async (req, res) => {
    try {
        const { nom } = req.params;
        const ville1 = await ville.findOne({Nom:nom});
        if (!ville1) {
            return res.status(404).json({ error: "ville non trouvée" });
        }
        res.status(200).json(ville1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// avoir ville by id 
router.get('/getbyid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ville1 = await ville.findById(id);
        if (!ville1) {
            return res.status(404).json({ error: "ville non trouvée" });
        }
        res.status(200).json(ville1);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



router.put('/putVille', upload, async (req, res) => {
    try {
        const { _id, Nom, Description } = req.body;

        // Find existing ville
        const existingVille = await ville.findById(_id);
        if (!existingVille) {
            return res.status(404).json({ error: "Ville not found" });
        }

        // Handle image deletions
        if (req.body.photosToDelete) {
            const imagesToDelete = Array.isArray(req.body.photosToDelete)
                ? req.body.photosToDelete
                : [req.body.photosToDelete];

            imagesToDelete.forEach(photo => {
                const imgPath = path.join(__dirname, '..', 'public', 'assets', 'img', 'villes', photo);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                }
                existingVille.photos = existingVille.photos.filter(p => p !== photo);
            });
        }

        // Add new images
        if (req.files && req.files.length > 0) {
            const newPhotos = req.files.map(file => file.filename);
            existingVille.photos.push(...newPhotos);
        }

        // Update ville data
        existingVille.Nom = Nom;
        existingVille.Description = Description;

        const updatedVille = await existingVille.save();
        res.status(200).json(updatedVille);

    } catch (error) {
        console.error("Error updating ville:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET /api/villes
router.get('/new', async (req, res) => {
    const villes = await ville.find();
    res.json(villes);
});
// Supprimer toutes les villes
router.delete('/deleteAll', async (req, res) => {
    try {
        const result = await ville.deleteMany({});
        res.status(200).json({ message: `${result.deletedCount} villes supprimées.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




module.exports=router;