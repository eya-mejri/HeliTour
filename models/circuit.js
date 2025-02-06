const mongoose = require ('mongoose');

const circuit = mongoose .model('circuit' , {
     
    Nom: {
        type: String,
        required: true 
    },
    Description: {
        type: String,
        required: true 
    },
    Destination: {
        type: String,
        required: true,
        enum: ["tozeur", "Hammamet", "Sousse"]     
    },
    Duree: {
        type: Number,
        required: true 
    },
    Prix: {
        type: Number,
    },
    Disponibilite: {
        type: Boolean,
        default:true
    },
    

    
})

module.exports = circuit;