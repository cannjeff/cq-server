var express = require('express'),
	errorhandler = require('errorhandler'),
	mongodb = require('mongodb'),
	MongoClient = mongodb.MongoClient,
	util = require('util'),
	format = util.format,
	http = require('http'),
	path = require('path'),
	app = express(),
	mongoConfig = {
		host: 'localhost',
		port: '27017',
		dbname: 'cryptoquip'
	},
	mongoConnectStr = 'mongodb://' + mongoConfig.host + ':' + mongoConfig.port + '/' + mongoConfig.dbname;


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
app.set('mongoclient', MongoClient);
app.set('mongoconnectstr', mongoConnectStr);

app.set('port', 3000);
// app.use(app.router);

/* Development only */
if ('development' === app.get('env')) {
	app.use(errorhandler());
}

require('./routes')(app);
require('./routes/api')(app);

/**
 *	Startup server
 **/
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});