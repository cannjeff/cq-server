var express = require('express'),
	errorhandler = require('errorhandler'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	multer = require('multer'),
	morgan = require('morgan'),
	mongodb = require('mongodb'),
	mongoose = require('mongoose'),
	MongoClient = mongodb.MongoClient,
	util = require('util'),
	format = util.format,
	http = require('http'),
	path = require('path'),
	fs = require('fs'),
	User = require('./models/user'),
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
app.set('tokenSecret', serverConfig.tokenSecret);

/**
 *	Mongoose connection
 **/
mongoose.connect( mongoConnectStr );
mongoose.set('debug', app.get('env') === 'development');
/**
 *	Passport - handling auth via Twitter
 **/
// passport.use(new TwitterStrategy({
// 	consumerKey: serverConfig.twitterConsumerKey,
// 	consumerSecret: serverConfig.twitterConsumerSecret,
// 	callbackURL: serverConfig.twitterCallbackURL
// }, function ( token, tokenSecret, profile, done ) {
// 	User.findOrCreate({ twitterId: profile.id }, function ( err, user ) {
// 		return done(err, user);
// 	});
// }));


/**
 *	Sessions - https://github.com/expressjs/session
 *
 *	NEED UPGRADE - https://github.com/expressjs/session#compatible-session-stores
 **/
// app.use(session({
// 	secret: 'apple snake tree',
// 	resave: false,
// 	saveUninitialized: true
// }));

/**
 *	Initialize Passport!  Also use passport.session() middleware, to support persistent login sessions (recommended).
 **/
// app.use(passport.initialize());
// app.use(passport.session());

app.set('port', serverConfig.port);
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data

/* Development only */
if ('development' === app.get('env')) {
	app.use(errorhandler());
}

/**
 *	Allow cross origin
 **/
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
  next();
});

/**
 *	To make connection to mongoDB easier/shorter in the routes
 **/
app.mdbConnect = function ( callback ) {
	throw new Error("Deprecated!");
	// return MongoClient.connect(mongoConnectStr, callback);
};

require('./routes')(app);

/**
 *	Startup server
 **/
http.createServer( app ).listen(app.get('port'), function () {
	console.log('Express server listening on port ' + app.get('port'));
});

