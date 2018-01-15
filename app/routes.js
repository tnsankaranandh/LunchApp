var utils = require('./utils');

module.exports = function (app) {
    var user = require('./APIs/user');
    app.post('/user/create', user.create);
    app.post('/user/update', user.update);
    app.post('/user/getList', user.getList);

    var hotel = require('./APIs/hotel');
    app.post('/hotel/create', hotel.create);
    app.post('/hotel/update', hotel.update);
    app.post('/hotel/getList', hotel.getList);

    var item = require('./APIs/item');
    app.post('/item/create', item.create);
    app.post('/item/update', item.update);
    app.post('/item/getList', item.getList);

    var eatHistory = require('./APIs/eatHistory');
    app.post('/eatHistory/create', eatHistory.create);
    app.post('/eatHistory/update', eatHistory.update);
    app.post('/eatHistory/getList', eatHistory.getList);

    var payment = require('./APIs/payment');
    app.post('/payment/create', payment.create);
    app.post('/payment/update', payment.update);
    app.post('/payment/getList', payment.getList);
    app.post('/payment/getPendings', payment.getPendings);

    app.get('*', function (req, res) {
        utils.doErrorResponse(req, res, 'Invalid API');
    });
    app.post('*', function (req, res) {
        utils.doErrorResponse(req, res, 'Invalid API');
    });
    app.put('*', function (req, res) {
        utils.doErrorResponse(req, res, 'Invalid API');
    });
    app.delete('*', function (req, res) {
        utils.doErrorResponse(req, res, 'Invalid API');
    });
};