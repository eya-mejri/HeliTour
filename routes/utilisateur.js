const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utlisateur');
const Role = require('../models/role');
const Adresse = require('../models/adresse');

// Route pour ajouter un utilisateur
router.post('/adduser', async (req, res) => {
    try {
        const { Nom, Prenom, Email, MDP, Num_Telephone, AdresseData, RoleNom } = req.body;

        // Vérifier si le rôle existe dans la table Role
        const role = await Role.findOne({ Nom: RoleNom });
        if (!role) {
            return res.status(400).json({ message: "Le rôle spécifié n'existe pas" });
        }

        // Créer l'adresse
        const newAdresse = new Adresse({
            Pays: AdresseData.Pays,
            Ville: AdresseData.Ville,
            Code_Postal: AdresseData.Code_Postal,
            Adresse_Locale: AdresseData.Adresse_Locale
        });
        const savedAdresse = await newAdresse.save();

        // Créer l'utilisateur
        const newUser = new Utilisateur({
            Nom,
            Prenom,
            Email,
            MDP,
            Num_Telephone,
            Adresse: savedAdresse._id,
            Roles: [role._id], // Associer l'utilisateur au rôle
        });
        const savedUser = await newUser.save();

        // Ajouter l'utilisateur à la liste des utilisateurs du rôle
        role.users.push(savedUser._id);
        await role.save();

        res.status(201).json({ message: "Utilisateur ajouté avec succès", utilisateur: savedUser });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout de l'utilisateur", error: error.message });
    }
});

router.delete('/deleteuser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await Utilisateur.findByIdAndDelete(id);  // Correction ici
        if (!deletedUser) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        res.status(200).json({ message: "Utilisateur supprimé avec succès", deletedUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/getall', async (req, res) => {
    try {
        const users = await Utilisateur.find();  // Correction ici
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/getbyid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Utilisateur.findById(id);  // Correction ici
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/putuser', async (req, res) => {
    try {
        const { Email } = req.body;  // Récupère l'email dans le corps de la requête
        const dataToUpdate = req.body;  // Récupère les autres informations à mettre à jour

        // Trouver un utilisateur par son email
        const updatedUser = await Utilisateur.findOneAndUpdate({ Email }, dataToUpdate, { new: true });  // Correction ici

        if (!updatedUser) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
