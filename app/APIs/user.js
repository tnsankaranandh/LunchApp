var winston = require('winston');
var mongoose = require('mongoose');
var utils = require('../utils');

var UserMaster = require('../schema/user');

exports.create = function (req, res) {
    var newUser = new UserMaster();
    newUser.name = req.body.name;
    newUser.save(function (error) {
        if (!!error) {
            utils.doErrorResponse(req, res, 'Error while creating User!', error, 500);
            return;
        }
        utils.doSuccessResponse({
            uid: newUser._id
        }, res);
    });
};

exports.update = function (req, res) {
    UserMaster
        .findById(mongoose.Types.ObjectId(req.body._id))
        .exec(function (getError, userDoc) {
            if (!!getError) {
                utils.doErrorResponse(req, res, 'Error while getting User!', getError, 500);
                return;
            }
            userDoc.name = req.body.name;
            userDoc.save(function (error) {
                if (!!error) {
                    utils.doErrorResponse(req, res, 'Error while updating User!', error, 500);
                } else {
                    utils.doSuccessResponse({
                        uid: userDoc._id
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
    var query = UserMaster
        .find(searchCriteria)
        .sort({ name: 1 });
    if (!!page && !!limit) {
        query = query
            .skip(limit * (page - 1))
            .limit(limit);
    }
    query
        .lean()
        .exec(function (error, userDocs) {
            if (!!error) {
                utils.doErrorResponse(req, res, 'Error while getting User!', error, 500);
                return;
            }
            utils.doSuccessResponse({ users: userDocs }, res);
        });
};