const mongoose = require ('mongoose');

const vol = mongoose .model('vol' , {
     
    Duree: {
        type: Number,
        required: true 
    },
    Date_depart: {
        type: Date,
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
        enum: ["confirmé","annulé"] ,
        default:'confirmé'
    },
    appareilId :{type: mongoose.Schema.Types.ObjectId, ref: "appareil", required: true},
    reservations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "reservation"  // Reference to the Reservation model
    }],
    circuitId: { type: mongoose.Schema.Types.ObjectId, ref: "Circuit", required: true }
    
})

module.exports = vol;