var express = require('express');
var app = express();
var http = require('http');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan = require('morgan');
var FileStreamRotator = require('file-stream-rotator');
var fs = require('fs');
var winston = require('winston');
var compress = require('compression');
var mongoose = require('mongoose');

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 8000;

app.use(bodyParser.json({ limit: '1.2mb' }));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(methodOverride('X-HTTP-Method-Override'));
app.use(compress());


var dbUrl = 'mongodb://lunch:lunch@ds255797.mlab.com:55797/lunchdb';
var localDBUrl = 'mongodb://127.0.0.1/lunchdb';
mongoose.connect(dbUrl, {}, function (dbError) { if (!!dbError) { console.log(dbError); } });

var logDirectory = __dirname + '/log'

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

var accessLogStream = FileStreamRotator.getStream({
    filename: logDirectory + '/access.log',
    frequency: 'weekly',
    verbose: false
});

process.env.TZ = 'UTC';

app.use(morgan('combined', { stream: accessLogStream }));

winston.add(winston.transports.File, { filename: logDirectory + '/app.log' });
winston.remove(winston.transports.Console);

app.use(function (req, res, next) {
    // Put some preprocessing here.
    //Session validation
    next();
});

require('./app/routes')(app);

http.createServer(app).listen(port);

console.log('App runs on port ' + port);
winston.info('App runs on port ' + port, { timestamp: Date.now(), pid: process.pid })
exports = module.exports = app;

winston.handleExceptions();
winston.exitOnError = false;