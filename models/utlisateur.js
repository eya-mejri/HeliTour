const mongoose = require ('mongoose');

const utilisateur = mongoose .model('utilisateur' , {
     
    Nom: {
        type: String,
        required: true 
    },
    Prenom: {
        type: String,
        required: true 
    },
    Email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Email invalide'] 
    },
    MDP: {
        type: String,
        required: true 
    },
    Role: {
        type: String,
        enum: ["Admin", "Utilisateur", "agnece"], // Liste de rôles autorisés
        default: "Utilisateur"
    },
    Num_Telephone: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return /^[0-9]{8,15}$/.test(v); // Numéro entre 8 et 15 chiffres
            },
            message: "Numéro de téléphone invalide"
                }
    },
    Address: {
        type: String,
        required: true
    },
    Date_Creation: {
        type: Date,
        default: Date.now 
    }

    
})

module.exports = utilisateur;