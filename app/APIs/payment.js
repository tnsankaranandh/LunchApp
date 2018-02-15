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
    newPay.toUserUid = req.body.toUserUid;
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
        .populate({
            path: 'fromUserUid',
            model: 'User',
            select: 'name'
        })
        .populate({
            path: 'toUserUid',
            model: 'User',
            select: 'name'
        })
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
                if (!isNaN(ppAmount) && ppAmount !== 0 && ppAmount !== null) {
                    pendingPayments.push({
                        amount: ppAmount,
                        userName: u.name
                    });
                }
                getPendingReceives(userUid, u._id, function (ppError, prAmount) {
                    asyncError = ppError;
                    if (!!asyncError) {
                        uCallback();
                        return;
                    }
                    if (!isNaN(prAmount) && prAmount !== 0 && prAmount !== null) {
                        pendingReceives.push({
                            amount: prAmount,
                            userName: u.name
                        });
                    }
                    uCallback();
                });
            });
        }, function () {
            if (!!asyncError) {
                utils.doErrorResponse(req, res, 'Error while calculating Pending Payments!', asyncError, 500);
                return;
            }
            var ppLength = pendingPayments.length;
            var prLength = pendingReceives.length;

            for (var ppl = 0; ppl < ppLength; ppl++) {
                var pp = pendingPayments[ppl];
                var prIndex = -1;
                var prAmount = 0;
                for (var prl = 0; prl < prLength; prl++) {
                    var pr = pendingReceives[prl];
                    if (pr.userName === pp.userName) {
                        prIndex = prl;
                        prAmount = pr.amount;
                        break;
                    }
                }
                if (prAmount !== 0 && pp.amount > prAmount) {
                    pendingPayments[ppl].amount = pp.amount - prAmount;
                    pendingReceives.splice(prIndex, 1);
                    prLength = pendingReceives.length;
                }
            }
            for (var prL = 0; prL < prLength; prL++) {
                var pR = pendingReceives[prL];
                var ppIndex = -1;
                var ppAmount = 0;
                for (var ppL = 0; ppL < ppLength; ppL++) {
                    var pP = pendingPayments[ppL];
                    if (pP.userName === pR.userName) {
                        ppIndex = ppL;
                        ppAmount = pP.amount;
                        break;
                    }
                }
                if (ppAmount !== 0 && pR.amount > ppAmount) {
                    pendingReceives[prL].amount = pR.amount - ppAmount;
                    pendingPayments.splice(ppIndex, 1);
                    ppLength = pendingPayments.length;
                }
            }
            utils.doSuccessResponse({
                pendingPayments: pendingPayments,
                pendingReceives: pendingReceives
            }, res);
        });
    };

    function getPendingPays(baseUserUid, fromUserUid, ppCallback) {
        if ((baseUserUid || '').toString() === (fromUserUid || '').toString()) {
            ppCallback(null, 0);
            return;
        }
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

                        ppCallback(null, utils.getRoundedAmount(totalEatAmount - totalPaidAmount));
                    });
            });
    };

    function getPendingReceives(baseUserUid, fromUserUid, prCallback) {
        if ((baseUserUid || '').toString() === (fromUserUid || '').toString()) {
            prCallback(null, 0);
            return;
        }
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

                        prCallback(null, utils.getRoundedAmount(totalEatAmount - totalPaidAmount));
                    });
            });
    };
};