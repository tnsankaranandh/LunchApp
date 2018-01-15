var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HotelSchema = new Schema({
    name: String
});

module.exports = mongoose.model('Hotel', HotelSchema);