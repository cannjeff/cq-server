var jwt = require('jsonwebtoken'),
	fs = require('fs'),
	tokenSecret =JSON.parse(fs.readFileSync('./server-config.json', 'utf8')).tokenSecret,
	User = require('../models/user');

module.exports = {
	authenticate: function ( req, res, next ) {
		var token = req.body.token || req.query.token || req.headers['x-access-token'];

		if (token) {
			jwt.verify(token, tokenSecret, function ( error, decoded ) {
				if (error) {
					return res.json({
						success: false,
						message: 'Failed to authenticate token.'
					});
				} else {
					req.decoded = decoded;
					next();
				}
			});
		} else {
			return res.status(403).send({
				success: false,
				message: 'No token provided.'
			});
		}
	},
	authenticateAdmin: function ( req, res, next ) {
		if (req.decoded && req.decoded.user && req.decoded.user.username) {
			/* A bit overkill, but its a quick query */
			User.findOne({
				username: req.decoded.user.username
			}, function ( error, user ) {
				if (error) {
					return res.json({
						success: false,
						message: 'User does not have admin privileges'
					});
				}
				if (user.admin) {
					next();
				}
			});
		} else {
			res.json({
				success: false,
				message: 'User does not have admin privileges'
			});
		}
	}
};
