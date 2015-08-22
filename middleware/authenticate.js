var jwt = require('jsonwebtoken'),
	fs = require('fs'),
	tokenSecret =JSON.parse(fs.readFileSync('./server-config.json', 'utf8')).tokenSecret,
	User = require('../models/user'),
	HTTPStatus = require('http-status');

module.exports = {
	authenticate: function ( req, res, next ) {
		var token = req.body.token || req.query.token || req.headers['x-access-token'];

		if (token) {
			jwt.verify(token, tokenSecret, { ignoreExpiration: true }, function ( error, decoded ) {
				if (error) {
					console.log('Error verifying jwt', error);
					return res
						.status(HTTPStatus.UNAUTHORIZED)
						.json({
							success: false,
							error: error,
							message: 'Failed to authenticate token.'
						});
				} else {
					req.decoded = decoded;
					next();
				}
			});
		} else {
			return res
				.status(HTTPStatus.FORBIDDEN)
				.send({
					success: false,
					message: 'No token provided.'
				});
		}
	},
	authenticateCurator: function ( req, res, next ) {
		function missingPrivileges() {
			res.json({
				success: false,
				message: 'User does not have curator privileges'
			});
		}
		if (req.decoded && req.decoded.user && req.decoded.user.username) {
			/* A bit overkill, but its a quick query */
			User.findOne({
				username: req.decoded.user.username
			}, function ( error, user ) {
				if (error) {
					missingPrivileges();
					return;
				}
				if (user.curator) {
					next();
				} else {
					missingPrivileges();
				}
			});
		} else {
			missingPrivileges();
		}
	},
	authenticateAdmin: function ( req, res, next ) {
		function missingPrivileges() {
			res.json({
				success: false,
				message: 'User does not have admin privileges'
			});
		}
		if (req.decoded && req.decoded.user && req.decoded.user.username) {
			/* A bit overkill, but its a quick query */
			User.findOne({
				username: req.decoded.user.username
			}, function ( error, user ) {
				if (error) {
					missingPrivileges();
					return;
				}
				if (user.admin) {
					next();
				} else {
					missingPrivileges();
				}
			});
		} else {
			missingPrivileges();
		}
	}
};
