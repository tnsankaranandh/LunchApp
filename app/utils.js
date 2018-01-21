var winston = require('winston');

function doLog(errorMessage, errorLevel) {
    winston[errorLevel || 'info'](errorMessage);
    console.log(errorMessage);
};

function doErrorResponse(req, res, errorMessage, technicalError, responseStatus) {
    winston.error({
        url: req.url,
        errorMessage: errorMessage,
        technicalError: technicalError
    });
    res.status(responseStatus || 500).json({
        error: errorMessage,
        technicalError: technicalError
    });
};

function doSuccessResponse(data, res) {
    res.status(200).json(data);
};

function getObjectValues(obj) {
    obj = obj || {};
    var returnArray = [];
    for (var o in obj) {
        if (obj.hasOwnProperty(o)) {
            returnArray.push(obj[o]);
        }
    }
    return returnArray;
};

function getRoundedAmount(amount) {
    var roundingFactor = Math.pow(10, 2);
    return ((Math.round(amount * roundingFactor)) / (roundingFactor));
};

exports.doLog = doLog;
exports.doErrorResponse = doErrorResponse;
exports.doSuccessResponse = doSuccessResponse;
exports.getObjectValues = getObjectValues;
exports.getRoundedAmount = getRoundedAmount;