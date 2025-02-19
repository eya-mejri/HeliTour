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
    status: {
        type: String,
        required: true ,
        enum: ["confirmé","annulé","en cour"] ,
        default:'confirmé'
    },
    Disponibilite: {
        type: Boolean,
        default:true
    },voyageurs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voyageur' }],

    // Reference to a single vol (Many reservations can belong to one vol)
    volId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "vol",  // Reference to the Vol model
        required: true
    }
    

    
})

module.exports = reservation;