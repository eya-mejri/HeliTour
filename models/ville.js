const mongoose = require ('mongoose');

const ville = mongoose .model('ville' , {
    
    Nom: {
        type: String,
        required: true 
    },
    Description: {
        type: String,
        required: true 
    },
    circuits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'circuit' }],
   
    

    
})

module.exports = ville;