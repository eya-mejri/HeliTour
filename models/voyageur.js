const mongoose = require ('mongoose');

const voyageur = mongoose .model('voyageur' , {
     
    Nom: {
        type: String,
        required: true 
    },
    prenom: {
        type: String,
        required: true 
    },
    poids: {
        type: String,
        required: true 
    },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true }
   ,email:{type:String}
   ,phone:{type:Number}


    
})

module.exports = voyageur;