const mongoose = require ('mongoose');

const vol = mongoose .model('vol' , {
     
    id_circuit: {
        type: String,
        required: true 
    },
    Date_depart: {
        type: String,
        required: true 
    },
    place_disponible: {
        type: Number,
        required: true,
        enum: [0, 1, 2,3]     
    },
    status: {
        type: String,
        required: true ,
        enum: ["complet","disponible"] 
    }
    

    
})

module.exports = vol;