const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    Roles: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Role', 
        required: true 
    }], // Many to Many avec Role
    Num_Telephone: {
        type: String, // Changé en String pour éviter la suppression des zéros initiaux
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

// Hachage du mot de passe avant l'enregistrement
utilisateurSchema.pre('save', async function (next) {
    if (this.isModified('MDP')) {
        const salt = await bcrypt.genSalt(10);
        this.MDP = await bcrypt.hash(this.MDP, salt);
    }
    next();
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
