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
router.get('/userInfo', verifyToken, async (req, res) => {
    try {
        const usr = req.Utilisateur;
        if (!usr) {
            return res.status(404).send("Utilisateur non trouvé");
        }
        const userInfo = await Utilisateur.findById(usr._id)
            .populate('Adresse')
            .populate('Role', 'Nom') 
            .exec();

        res.status(200).json(userInfo);
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});


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
router.get('/getAllUsersWithDetails', async (req, res) => {
    try {
        const { Email } = req.query; // Get email from query parameters
        
        let query = Utilisateur.find()
            .populate('Role', 'Nom')
            .populate('Adresse')
            .select('-MDP');

        // If email parameter exists, add it to the query
        if (Email) {
            query = query.where('Email').equals(Email);
        }

        const users = await query.exec();
        
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            message: 'Server error while fetching users',
            error: error.message 
        });
    }
});

router.get('/getAdminUsersWithDetails', async (req, res) => {
    try {
        const { Email } = req.query;
        
        // First find the Admin role
        const adminRole = await Role.findOne({ Nom: 'Admin' });
        
        if (!adminRole) {
            return res.status(404).json({ message: 'Admin role not found' });
        }

        let query = Utilisateur.find({ Role: adminRole._id })
            .populate('Role', 'Nom')
            .populate('Adresse')
            .select('-MDP');

        // Add email filter if provided
        if (Email) {
            query = query.where('Email').equals(Email);
        }

        const users = await query.exec();
        
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching admin users:', error);
        res.status(500).json({ 
            message: 'Server error while fetching admin users',
            error: error.message 
        });
    }
});
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

router.put('/updateProfile', verifyToken, async (req, res) => {
    try {
        const { Nom, Prenom, Email, Num_Telephone, Adresse } = req.body;
        const userId = req.Utilisateur._id;

        // Update the user's basic information
        const updatedUser = await Utilisateur.findByIdAndUpdate(
            userId,
            { Nom, Prenom, Email, Num_Telephone, Adresse },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send("Utilisateur non trouvé");
        }

        res.status(200).json(updatedUser);
    } catch (err) { 
        res.status(500).send('Erreur serveur');
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
router.patch('/updateUserRole/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleId } = req.body;

        if (!roleId) return res.status(400).json({ message: "roleId is required" });

        // Update user's role
        const user = await Utilisateur.findByIdAndUpdate(
            userId,
            { Role: roleId },
            { new: true }
        ).populate('Role');

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ message: "Role updated successfully", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
