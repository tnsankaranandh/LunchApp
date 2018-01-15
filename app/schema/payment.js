var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentsSchema = new Schema({
    payDate: Date,
    fromUseUid: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    toUserUid: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    amount: Number
});

module.exports = mongoose.model('Payment', PaymentsSchema);