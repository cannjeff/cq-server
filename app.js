var express = require('express'),
	errorhandler = require('errorhandler'),
	bodyParser = require('body-parser'),
	multer = require('multer'),
	morgan = require('morgan'),
	mongodb = require('mongodb'),
	MongoClient = mongodb.MongoClient,
	util = require('util'),
	format = util.format,
	http = require('http'),
	path = require('path'),
	fs = require('fs'),
	app = express(),
	mongoConfig,
	mongoConnectStr,
	serverConfig;

/**
 *	Pull in server configs from an external file (server-config.json)
 **/
serverConfig = JSON.parse(fs.readFileSync('./server-config.json', 'utf8'));
mongoConfig = serverConfig.mongoConfig;
mongoConnectStr = 'mongodb://' + mongoConfig.host + ':' + mongoConfig.port + '/' + mongoConfig.dbname;
app.set('env', serverConfig.environment);

// MongoClient.connect(mongoConnectStr, function ( err, db ) {
// 	if (err) {
// 		throw err;
// 	}
// 	var collection = db.collection('test_insert');
// 	collection.insert({a:2}, function (err, docs) {
// 		collection.count(function(err, count) {
// 			console.log(format("count = %s", count));
// 		});

// 		// Locate all the entries using find
// 		collection.find().toArray(function(err, results) {
// 			console.dir(results);
// 			// Let's close the db
// 			db.close();
// 		});
// 	});
// });

/**
 *	Make mongoClient accessable
 **/
// app.set('mongoclient', MongoClient);
// app.set('mongoconnectstr', mongoConnectStr);

app.set('port', 3000);
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data

/* Development only */
if ('development' === app.get('env')) {
	app.use(errorhandler());
}

/**
 *	To make connection to mongoDB easier/shorter in the routes
 **/
app.mdbConnect = function ( callback ) {
	return MongoClient.connect(mongoConnectStr, callback);
};

require('./routes')(app);

/**
 *	Startup server
 **/
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});