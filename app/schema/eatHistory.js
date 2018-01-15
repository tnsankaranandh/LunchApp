var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EatHistorySchema = new Schema({
    eatDate: Date,
    hotelUid: {
        type: Schema.ObjectId,
        ref: 'Hotel'
    },
    eatUserUid: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    paidByUserUid: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    totalAmount: Number,
    items: [{
        itemUid: {
            type: Schema.ObjectId,
            ref: 'Item'
        },
        quantity: Number,
        amount: Number
    }]
});

module.exports = mongoose.model('EatHistory', EatHistorySchema);