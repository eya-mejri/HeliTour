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
   
    

    
})

module.exports = ville;