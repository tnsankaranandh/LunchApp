var winston = require('winston');
var mongoose = require('mongoose');
var utils = require('../utils');

var EatHistoryTransaction = require('../schema/eatHistory');

exports.create = function (req, res) {
    var newEHT = new EatHistoryTransaction();
    newEHT.eatDate = req.body.eatDate;
    newEHT.hotelUid = req.body.hotelUid;
    newEHT.eatUserUid = req.body.eatUserUid;
    newEHT.paidByUserUid = req.body.paidByUserUid;
    newEHT.totalAmount = req.body.totalAmount;
    newEHT.items = [];
    (req.body.items || []).forEach(function (i) {
        newEHT.items.push({
            itemUid: i.itemUid,
            quantity: i.quantity,
            amount: i.amount
        });
    });
    newEHT.save(function (error) {
        if (!!error) {
            utils.doErrorResponse(req, res, 'Error while creating Eat History!', error, 500);
            return;
        }
        utils.doSuccessResponse({
            uid: newEHT._id
        }, res);
    });
};

exports.update = function (req, res) {
    EatHistoryTransaction
        .findById(mongoose.Types.ObjectId(req.body._id))
        .exec(function (getError, ehtDoc) {
            if (!!getError) {
                utils.doErrorResponse(req, res, 'Error while getting Eat History!', getError, 500);
                return;
            }
            ehtDoc.eatDate = req.body.eatDate;
            ehtDoc.hotelUid = req.body.hotelUid;
            ehtDoc.eatUserUid = req.body.eatUserUid;
            ehtDoc.paidByUserUid = req.body.paidByUserUid;
            ehtDoc.totalAmount = req.body.totalAmount;
            ehtDoc.items = [];
            (req.body.items || []).forEach(function (i) {
                ehtDoc.items.push({
                    itemUid: i.itemUid,
                    quantity: i.quantity,
                    amount: i.amount
                });
            });
            ehtDoc.save(function (error) {
                if (!!error) {
                    utils.doErrorResponse(req, res, 'Error while updating Eat History!', error, 500);
                } else {
                    utils.doSuccessResponse({
                        uid: ehtDoc._id
                    }, res);
                }
            });
        });
};

exports.getList = function (req, res) {
    var page = req.body.page || 0;
    var limit = req.body.limit || 0;
    var searchCriteria = {};
    if (!!req.body._id) { searchCriteria._id = mongoose.Types.ObjectId(req.body._id); }
    var query = EatHistoryTransaction
        .find(searchCriteria)
        .populate({
            path: 'hotelUid',
            model: 'Hotel',
            select: 'name'
        })
        .populate({
            path: 'eatUserUid',
            model: 'User',
            select: 'name'
        })
        .populate({
            path: 'paidByUserUid',
            model: 'User',
            select: 'name'
        })
        .populate({
            path: 'items.itemUid',
            model: 'Item',
            select: 'name rate'
        })
        .sort({
            eatDate: -1
        });
    if (!!page && !!limit) {
        query = query
            .skip(limit * (page -1))
            .limit(limit);
    }
    query
        .lean()
        .exec(function (error, ehtDocs) {
            if (!!error) {
                utils.doErrorResponse(req, res, 'Error while getting Eat History!', error, 500);
                return;
            }
            utils.doSuccessResponse({ eatHistories: ehtDocs }, res);
        });
};