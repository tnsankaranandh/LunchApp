var winston = require('winston');
var mongoose = require('mongoose');
var utils = require('../utils');

var ItemMaster = require('../schema/item');

exports.create = function (req, res) {
    var newItem = new ItemMaster();
    newItem.name = req.body.name;
    newItem.hotelUid = req.body.hotelUid;
    newItem.rate = req.body.rate;
    newItem.save(function (error) {
        if (!!error) {
            utils.doErrorResponse(req, res, 'Error while creating Item!', error, 500);
            return;
        }
        utils.doSuccessResponse({
            uid: newItem._id
        }, res);
    });
};

exports.update = function (req, res) {
    ItemMaster
        .findById(mongoose.Types.ObjectId(req.body._id))
        .exec(function (getError, itemDoc) {
            if (!!getError) {
                utils.doErrorResponse(req, res, 'Error while getting Item!', getError, 500);
                return;
            }
            itemDoc.name = req.body.name;
            itemDoc.hotelUid = req.body.hotelUid;
            itemDoc.rate = req.body.rate;
            itemDoc.save(function (error) {
                if (!!error) {
                    utils.doErrorResponse(req, res, 'Error while updating Item!', error, 500);
                } else {
                    utils.doSuccessResponse({
                        uid: itemDoc._id
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
    if (!!req.body.hotelUid) { searchCriteria.hotelUid = mongoose.Types.ObjectId(req.body.hotelUid); }
    var query = ItemMaster
        .find(searchCriteria)
        .sort({
            hotelUid: 1
        });
    if (!!page && !!limit) {
        query = query
            .skip(limit * (page - 1))
            .limit(limit);
    }
    query
        .populate({
            path: 'hotelUid',
            model: 'Hotel',
            select: 'name'
        })
        .lean()
        .exec(function (error, itemDocs) {
            if (!!error) {
                utils.doErrorResponse(req, res, 'Error while getting Item!', error, 500);
                return;
            }
            utils.doSuccessResponse({ items: itemDocs }, res);
        });
};