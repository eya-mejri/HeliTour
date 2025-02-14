const mongoose = require('mongoose');

const adresseSchema = new mongoose.Schema({
    Pays: { 
        type: String, 
        required: true 
    },
    Ville: { 
        type: String, 
        required: true 
    },
    Code_Postal: { 
        type: String, 
        required: true 
    },
    Adresse_Locale: { 
        type: String, 
        required: true 
    }
});

module.exports = mongoose.model('Adresse', adresseSchema);
