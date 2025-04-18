    const mongoose = require('mongoose');

    const paiementSchema = new mongoose.Schema({

        reservation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'reservation',  
            required: true
        },
        montant: {
            type: Number,
            required: true
        },
        devise: {
            type: String,
            enum: ['EUR', 'USD', 'TND'],
            required: true
        },
        date_paiement: {
            type: Date,
            required: true,
            default: Date.now
        },
        statut: {
            type: String,
            enum: ['en_attente', 'réussi', 'échoué'],
            required: true
        },
    
    });

    const Paiement = mongoose.model('Paiement', paiementSchema);

    module.exports = Paiement;
