const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    Nom: {
        type: String,
        enum: ["Admin", "Client", "Agence"],
        required: true,
        unique: true
    },
    users: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Utilisateur' 
    }]
});

module.exports = mongoose.model('Role', roleSchema);
