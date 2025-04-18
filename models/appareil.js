const mongoose = require('mongoose');

const appareilSchema = new mongoose.Schema({
    nom: { 
        type: String, 
        required: true 
    },
    date_de_creation: { 
        type: Date, 
        required: true 
    },
    photo: [{ 
        type: String
    }],
    description: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        required: true ,
        enum: ["active","inactive"] ,
        default:"active"
    },

});

module.exports = mongoose.model('Appareil', appareilSchema);