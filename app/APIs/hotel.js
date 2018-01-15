var winston = require('winston');
var mongoose = require('mongoose');
var utils = require('../utils');

var HotelMaster = require('../schema/hotel');

exports.create = function (req, res) {
    var newHotel = new HotelMaster();
    newHotel.name = req.body.name;
    newHotel.save(function (error) {
        if (!!error) {
            utils.doErrorResponse(req, res, 'Error while creating Hotel!', error, 500);
            return;
        }
        utils.doSuccessResponse({
            uid: newHotel._id
        }, res);
    });
};

exports.update = function (req, res) {
    HotelMaster
        .findById(mongoose.Types.ObjectId(req.body._id))
        .exec(function (getError, hotelDoc) {
            if (!!getError) {
                utils.doErrorResponse(req, res, 'Error while getting Hotel!', getError, 500);
                return;
            }
            hotelDoc.name = req.body.name;
            hotelDoc.save(function (error) {
                if (!!error) {
                    utils.doErrorResponse(req, res, 'Error while updating Hotel!', error, 500);
                } else {
                    utils.doSuccessResponse({
                        uid: hotelDoc._id
                    }, res);
                }
            });
        });
};

exports.getList = function (req, res) {
    var searchCriteria = {};
    var page = req.body.page || 0;
    var limit = req.body.limit || 0;
    if (!!req.body.name) { searchCriteria.name = { '$regex': new RegExp(req.body.name.toLowerCase().replace(/\\/g, "\\\\"), 'i') }; };
    var query = HotelMaster
        .find(searchCriteria)
        .sort({ name: 1 });
    if (!!page && !!limit) {
        query = query
            .skip(limit * (page - 1))
            .limit(limit);
    }
    query
        .lean()
        .exec(function (error, hotelDocs) {
            if (!!error) {
                utils.doErrorResponse(req, res, 'Error while getting Hotel!', error, 500);
                return;
            }
            utils.doSuccessResponse({ hotels: hotelDocs }, res);
        });
};