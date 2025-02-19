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
    photo: [{ 
        type: String 
    }],
    vols: [{ type: mongoose.Schema.Types.ObjectId, ref: "vol" }],
    villeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ville",  
            required: true
        }
    
})

module.exports = circuit;