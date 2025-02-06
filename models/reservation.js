const mongoose = require ('mongoose');

const reservation = mongoose .model('reservation' , {
     
    Date_Reservation: {
        type: Date,
        required: true,
        default:Date.now()
    },
    Num_Reservation: {
        type: String,
        required: true 
    },
    nbr_place: {
        type: Number,
        required: true,
        enum: [1,2,3]     
    },
    id_utilisateur: {
        type: String,
        required: true 
    },
    id_circuit: {
        type: String,
        required: true 
    },
    Disponibilite: {
        type: Boolean,
        default:true
    },
    

    
})

module.exports = reservation;