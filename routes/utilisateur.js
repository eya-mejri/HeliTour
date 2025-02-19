const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utilisateur');
const Role = require('../models/role');
const Adresse = require('../models/adresse');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken=require('./verifyToken');


// Login route
router.post('/login',async(req,res)=>{
    data=req.body;
    usr=await Utilisateur.findOne({Email:data.Email});
    if(!usr){
        res.status(404).send("Email non trouvé");
    }else{
        validePass=bcrypt.compareSync(data.MDP,usr.MDP);
        if (!validePass){
            res.status(401).send("mdp incorrecte");
        }else{
            payload={
                _id:usr._id,
                Email:usr.Email,
                Nom:usr.Nom,
                Prenom:usr.Prenom,
                Roles:usr.Roles,
                Num_Telephone:usr.Num_Telephone,
                Adresse:usr.Adresse,
                Date_Creation:usr.Date_Creation
            }
            token=jwt.sign(payload,'123456789');
            res.status(200).send({mytoken:token})
        }
    }
})


router.get('/userInfo',verifyToken, async(req,res)=>{
    try{
        const usr = await Utilisateur.findById(req._id);
        if (!usr){
            return res.status(404).send("utilisateur non trouvé");
        }
        res.status(200).send(usr);
    }catch(err){
        res.status(500).send('err serveur');
    }
})




router.post('/register', async (req, res) => {
    const { Nom, Prenom, Email, Num_Telephone, AdresseData,RoleNom } = req.body;
    let user = await Utilisateur.findOne({ Email: req.body.Email })
    const role = await Role.findOne({ Nom: RoleNom });
        if (!role) {
            return res.status(400).json({ message: "Le rôle spécifié n'existe pas" });
        }
    if (user) {
        return res.status(400).json({message:'User already exisits. Please sign in'})
    } else {
        try {
            const newAdresse = new Adresse({
                Pays: AdresseData.Pays,
                Ville: AdresseData.Ville,
                Code_Postal: AdresseData.Code_Postal,
                Adresse_Locale: AdresseData.Adresse_Locale
            });
            const savedAdresse = await newAdresse.save();
            const salt = await bcrypt.genSalt(10)
            const password = await bcrypt.hash(req.body.MDP, salt)
            const MDP=password;
            // Create a new user
            const newUser = new Utilisateur({
                Nom,
                Prenom,
                Email,
                MDP, 
                Num_Telephone,
                Adresse: savedAdresse._id,
            Roles: [role._id], 
            });
            role.users.push(newUser._id);
            await role.save();
            
            // Save the user to the database
            await newUser.save();
            return res.status(201).json({message:"user added"});
        } catch (err) {
            return res.status(400).json({ message: err.message })
        }
    }
})



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
