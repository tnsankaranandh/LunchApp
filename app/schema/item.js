var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema({
    name: String,
    hotelUid: {
    	type: Schema.ObjectId,
    	ref: 'Hotel'
    },
    rate: Number
});

module.exports = mongoose.model('Item', ItemSchema);