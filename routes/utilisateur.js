const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utlisateur');
const Role = require('../models/role');
const Adresse = require('../models/adresse');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken=require('../middlewares/verifyToken');
const authorizeRoles=require('../middlewares/roleMiddleware');
// Login 
router.post('/login',async(req,res)=>{
    data=req.body;
    usr=await Utilisateur.findOne({Email:data.Email});
    console.log(usr);
    if(!usr){
        res.status(404).send("Email non trouvé");
    }else{
        validePass=bcrypt.compareSync(data.MDP,usr.MDP);
        if (!validePass){
            res.status(401).send("mdp incorrecte");
        }else{
            role1=await Role.findById(usr.Role)
            console.log(role1);
            
            payload={
                _id:usr._id,
                Email:usr.Email,
                Nom:usr.Nom,
                Prenom:usr.Prenom,
                Role:role1.Nom,
                Num_Telephone:usr.Num_Telephone,
                Adresse:usr.Adresse,
                Date_Creation:usr.Date_Creation
            }
            token=jwt.sign(payload,'123456789');
            res.status(200).send({mytoken:token})
        }
    }
})

//test role and verify token 
  router.get('/admin',verifyToken,authorizeRoles('Admin'),(req,res)=>{
    res.json({message:'welcom admin '});
  })


//get the user info (for account)
router.get('/userInfo',verifyToken, async(req,res)=>{
    try{
        const usr = req.Utilisateur;
        if (!usr){
            return res.status(404).send("utilisateur non trouvé");
        }
        res.status(200).send(usr);
    }catch(err){
        res.status(500).send('err serveur');
    }
})


//register for users (client or agence)
router.post('/register', async (req, res) => {
    const { Nom, Prenom, Email, Num_Telephone, AdresseData,RoleNom } = req.body;
    let user = await Utilisateur.findOne({ Email: req.body.Email })
    const role = await Role.findOne({ Nom: RoleNom });
       // Vérifier que le rôle est soit "Client" soit "Agence"
    if (RoleNom !== "Client" && RoleNom !== "Agence") {
        return res.status(400).json({ message: "Le rôle doit être soit 'Client' soit 'Agence'" });
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
                Role: role._id, 
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

//register for admin (Admin)
router.post('/registerAdmin',verifyToken,authorizeRoles('Admin'), async (req, res) => {
    const { Nom, Prenom, Email, Num_Telephone, AdresseData } = req.body;
    let user = await Utilisateur.findOne({ Email: req.body.Email })
    const role = await Role.findOne({ Nom: "Admin" });
        
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
                Role: role._id, 
            });
            role.users.push(newUser._id);
            await role.save();
            // Save the user to the database
            await newUser.save();
            return res.status(201).json({message:"admin added"});
        } catch (err) {
            return res.status(400).json({ message: err.message })
        }
    }
})



// register for admins
/*router.post('/addAdmin', async (req, res) => {
    try {
        const { Nom, Prenom, Email, Num_Telephone, AdresseData } = req.body;
        // Créer l'adresse
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
        const role = await Role.findOne({ Nom:"Admin" });
        // Créer l'utilisateur
        const newUser = new Utilisateur({
            Nom,
            Prenom,
            Email,
            MDP,
            Num_Telephone,
            Adresse: savedAdresse._id,
            Role: role._id, // Associer l'utilisateur au rôle
        });
        const savedUser = await newUser.save();
        console.log(role);
        // Ajouter l'utilisateur à la liste des utilisateurs du rôle
        role.users.push(savedUser._id);
        await role.save();

        res.status(201).json({ message: "Admin est ajouté avec succès", utilisateur: savedUser });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout de l'admin", error: error.message });
    }
});*/


//delete user by the admin (admin)
router.delete('/deleteuser/:id',verifyToken,authorizeRoles('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await Utilisateur.findByIdAndDelete(id);  // Correction ici
        if (!deletedUser) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        if (deletedUser.Adresse) {
            await Adresse.findByIdAndDelete(deletedUser.Adresse);
        }
        const role = await Role.findById(deletedUser.Role);
        if (role) {
            // Retirer l'utilisateur de la liste des utilisateurs du table Role
            role.users = role.users.filter(userId => userId.toString() !== id);
            await role.save();
        }
        res.status(200).json({ message: "Utilisateur supprimé avec succès", deletedUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



// get all users (admin)
router.get('/getallUsers', /*verifyToken,authorizeRoles('Admin'),*/async (req, res) => {
    try {
        const users = await Utilisateur.find();  // Correction ici
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//get user by id (admin)
router.get('/getbyid/:id', verifyToken,authorizeRoles('Admin'), async (req, res) => {
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


//update user (user itself or admin)
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
