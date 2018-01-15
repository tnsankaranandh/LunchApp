var winston = require('winston');
var mongoose = require('mongoose');
var async = require('async');
var utils = require('../utils');

var PaymentTransaction = require('../schema/payment');
var UserMaster = require('../schema/user');
var EatHistoryTransaction = require('../schema/eatHistory');

exports.create = function (req, res) {
    var newPay = new PaymentTransaction();
    newPay.payDate = req.body.payDate;
    newPay.fromUserUid = req.body.fromUserUid;
    newPay.toUseUid = req.body.toUseUid;
    newPay.amount = req.body.amount;
    newPay.save(function (error) {
        if (!!error) {
            utils.doErrorResponse(req, res, 'Error while creating Payment!', error, 500);
            return;
        }
        utils.doSuccessResponse({
            uid: newPay._id
        }, res);
    });
};

exports.update = function (req, res) {
    PaymentTransaction
        .findById(mongoose.Types.ObjectId(req.body._id))
        .exec(function (getError, payDoc) {
            if (!!getError) {
                utils.doErrorResponse(req, res, 'Error while getting Payment!', getError, 500);
                return;
            }
            payDoc.payDate = req.body.payDate;
            payDoc.fromUserUid = req.body.fromUserUid;
            payDoc.toUseUid = req.body.toUseUid;
            payDoc.amount = req.body.amount;
            payDoc.save(function (error) {
                if (!!error) {
                    utils.doErrorResponse(req, res, 'Error while updating Payment!', error, 500);
                } else {
                    utils.doSuccessResponse({
                        uid: payDoc._id
                    }, res);
                }
            });
        });
};

exports.getList = function (req, res) {
    var searchCriteria = {};
    var page = req.body.page || 0;
    var limit = req.body.limit || 0;
    if (!!req.body.fromUserUid) { searchCriteria.fromUserUid = mongoose.Types.ObjectId(req.body.fromUserUid); }
    if (!!req.body.toUserUid) { searchCriteria.toUserUid = mongoose.Types.ObjectId(req.body.toUserUid); }
    var query = PaymentTransaction
        .find(searchCriteria)
        .sort({ payDate: -1 });
    if (!!page && !!limit) {
        query = query
            .skip(limit * (page - 1))
            .limit(limit);
    }
    query
        .lean()
        .exec(function (error, paymentDocs) {
            if (!!error) {
                utils.doErrorResponse(req, res, 'Error while getting Payment!', error, 500);
                return;
            }
            utils.doSuccessResponse({ payments: paymentDocs }, res);
        });
};

exports.getPendings = function (req, res) {
    var userUid = req.body.userUid;
    var allUsers = [];

    UserMaster
        .find({})
        .sort({ name: 1 })
        .lean()
        .exec(function (umError, umDocs) {
            if (!!umError) {
                utils.doErrorResponse(req, res, 'Error while getting Users!', umError, 500);
                return;
            }
            allUsers = umDocs || [];
            allUsersUpdated();
        });

    function allUsersUpdated() {
        var asyncError = null;
        var pendingPayments = [];
        var pendingReceives = [];
        async.eachSeries(allUsers, function (u, uCallback) {
            if (!!asyncError) {
                uCallback();
                return;
            }
            getPendingPays(userUid, u._id, function (ppError, ppAmount) {
                asyncError = ppError;
                if (!!asyncError) {
                    uCallback();
                    return;
                }
                pendingPayments.push({
                    amount: ppAmount,
                    userName: u.name
                });
                getPendingReceives(userUid, u._id, function (ppError, prAmount) {
                    asyncError = ppError;
                    if (!!asyncError) {
                        uCallback();
                        return;
                    }
                    pendingReceives.push({
                        amount: prAmount,
                        userName: u.name
                    });
                    uCallback();
                });
            });
        }, function () {
            if (!!asyncError) {
                utils.doErrorResponse(req, res, 'Error while calculating Pending Payments!', asyncError, 500);
                return;
            }
            utils.doSuccessResponse({
                pendingPayments: pendingPayments,
                pendingReceives: pendingReceives
            }, res);
        });
    };

    function getPendingPays(baseUserUid, fromUserUid, ppCallback) {
        EatHistoryTransaction
            .find({
                eatUserUid: mongoose.Types.ObjectId(baseUserUid),
                paidByUserUid: mongoose.Types.ObjectId(fromUserUid)
            })
            .lean()
            .exec(function (ehtError, ehtDocs) {
                if (!!ehtError) {
                    ppCallback(ehtError);
                    return;
                }
                var totalEatAmount = 0;
                (ehtDocs || []).forEach(function (eht) {
                    totalEatAmount = totalEatAmount + eht.totalAmount;
                });

                PaymentTransaction
                    .find({
                        fromUserUid: mongoose.Types.ObjectId(baseUserUid),
                        toUserUid: mongoose.Types.ObjectId(fromUserUid)
                    })
                    .lean()
                    .exec(function (payError, payDocs) {
                        if (!!payError) {
                            ppCallback(payError);
                            return;
                        }

                        var totalPaidAmount = 0;
                        (payDocs || []).forEach(function (pay) {
                            totalPaidAmount = totalPaidAmount + pay.amount;
                        });

                        ppCallback(null, totalEatAmount - totalPaidAmount);
                    });
            });
    };

    function getPendingReceives(baseUserUid, fromUserUid, prCallback) {
        EatHistoryTransaction
            .find({
                eatUserUid: mongoose.Types.ObjectId(fromUserUid),
                paidByUserUid: mongoose.Types.ObjectId(baseUserUid)
            })
            .lean()
            .exec(function (ehtError, ehtDocs) {
                if (!!ehtError) {
                    prCallback(ehtError);
                    return;
                }
                var totalEatAmount = 0;
                (ehtDocs || []).forEach(function (eht) {
                    totalEatAmount = totalEatAmount + eht.totalAmount;
                });

                PaymentTransaction
                    .find({
                        fromUserUid: mongoose.Types.ObjectId(fromUserUid),
                        toUserUid: mongoose.Types.ObjectId(baseUserUid)
                    })
                    .lean()
                    .exec(function (payError, payDocs) {
                        if (!!payError) {
                            prCallback(payError);
                            return;
                        }

                        var totalPaidAmount = 0;
                        (payDocs || []).forEach(function (pay) {
                            totalPaidAmount = totalPaidAmount + pay.amount;
                        });

                        prCallback(null, totalEatAmount - totalPaidAmount);
                    });
            });
    };
};