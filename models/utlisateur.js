const mongoose = require('mongoose');
//est ce que l'utilisateur peut ajouter des photo oui ou non?(a verifier apr l'admin)
const utilisateurSchema = new mongoose.Schema({
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
    //a discuter
    Roles: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Role', 
        required: true 
    }], // Many to Many avec Role
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
    Adresse: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Adresse', 
        required: true 
    }, // One to One avec Adresse
    Date_Creation: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema)
