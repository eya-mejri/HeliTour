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
    Prix: {
        type: Number,
    },
    Disponibilite: {
        type: Boolean,
        default:true
    },
    vols: [{ type: mongoose.Schema.Types.ObjectId, ref: "vol" }]
    ,villeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ville",  
            required: true
    },
    photos:[{ 
        type: String
    }]
    
})

module.exports = circuit;