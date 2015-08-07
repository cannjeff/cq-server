var User = require('../models/user'),
	jwt = require('jsonwebtoken'),
	auth = require('../middleware/authenticate');

var account = function ( app ) {

	app.post('/v1/account/login', function ( req, res ) {
		User.findOne({
			username: req.body.username
		}, function ( error, user ) {
			if (error) {
				throw error;
			}

			if (!user) {
				res.json({
					success: false,
					message: 'Authentication failed. Username not found.'
				});
			} else if (user) {
				user.comparePassword(req.body.password, function ( error, isMatch ) {
					if (error) {
						throw error;
					}

					if (isMatch) {
						var token,
							payload = {
								user: user,
								username: user.username
							};

						token = jwt.sign(payload, app.get('tokenSecret'), {
							expiresInMinutes: 1440 // 24 hours
						});

						res.json({
							success: true,
							token: token,
							user: user
						});
					} else {
						res.json({
							success: false,
							message: 'Authentication failed. Incorrect password'
						});
					}
				});
			}
		});
	});

	app.post('/v1/account/create', function ( req, res ) {
		User.findOne({
			username: req.body.username
		}, function ( error, user ) {
			if (error) {
				console.log(error);
			}

			if (user) {
				res.json({
					success: false,
					message: 'Username not available'
				});
			} else {
				var _user = new User({
					username: req.body.username,
					password: req.body.password
				});

				_user.save(function ( error ) {
					if (error) {
						var errMsg;
						if (error.errors && error.errors.password && error.errors.password.message) {
							errMsg = error.errors.password.message;
						} else {
							errMsg = 'Password was not validated';
						}

						console.log(errMsg, error);

						res.json({
							success: false,
							message: errMsg
						});
						return;
					}

					/* Normally the password is removed from the 'select' query */
					_user.password = undefined;

					res.json({
						success: true,
						user: _user
					});
				});
			}
		});
	});

	app.post('/v1/account/changePassword', auth.authenticate, function ( req, res ) {
		if (req.decoded && req.decoded.user && req.decoded.user.username) {
			User.findOne({
				username: req.decoded.user.username
			}, function ( error, user ) {
				if (error) {
					console.log(error);
				}

				if (user) {
					user.comparePassword(req.body.currentPassword, function ( error, isMatch ) {
						if (error) {
							console.log(error);
						}

						if (isMatch) {
							user.password = req.body.newPassword;
							user.save(function ( error ) {
								if (error) {
									console.log(error);
								} else {
									user.password = undefined;
									res.json({
										success: true,
										user: user
									});
								}
							});
						}
					});
				} else {
					// user not found? this would be odd
					////TODO - handle this case
				}
			});
		}
	});

	app.get('/v1/account/me', auth.authenticate, function ( req, res ) {
		res.json({
			success: true,
			message: 'You are authenticated!'
		});
	});

	app.get('/v1/account/list', auth.authenticate, function ( req, res ) {
		if (req.decoded && req.decoded.user && req.decoded.user.username) {
			User.findOne({
				username: req.decoded.user.username
			}, function ( error, user ) {
				if (error) {
					throw error;
				}
				if (user.admin) {
					User.find().exec(function ( error, users ) {
						if (error) {
							throw error;
						}

						res.json({
							success: true,
							data: users
						});
					});
				}
			});
		}
	});

	app.get('/v1/account/:id/admin', auth.authenticate, auth.authenticateAdmin, function ( req, res ) {
		User.findById(req.params.id, function ( err, user ) {
			if (err) throw err;

			user.admin = true;

			user.save(function ( err ) {
				if (err) { throw err; }

				res.json({
					success: true,
					data: user
				});
			});
		});
	});

	app.get('/v1/account/:id/unsetAdmin', auth.authenticate, auth.authenticateAdmin, function ( req, res ) {
		User.findById(req.params.id, function ( err, user ) {
			if (err) throw err;

			user.admin = false;

			user.save(function ( err ) {
				if (err) { throw err; }

				res.json({
					success: true,
					data: user
				});
			});
		});
	});

	app.get('/v1/account/:id/curator', auth.authenticate, auth.authenticateAdmin, function ( req, res ) {
		User.findById(req.params.id, function ( err, user ) {
			if (err) throw err;

			user.curator = true;

			user.save(function ( err ) {
				if (err) { throw err; }

				res.json({
					success: true,
					data: user
				});
			});
		});
	});

	app.get('/v1/account/:id/unsetCurator', auth.authenticate, auth.authenticateAdmin, function ( req, res ) {
		User.findById(req.params.id, function ( err, user ) {
			if (err) throw err;

			user.curator = false;

			user.save(function ( err ) {
				if (err) { throw err; }

				res.json({
					success: true,
					data: user
				});
			});
		});
	});

	app.get('/v1/account/:id/remove', auth.authenticate, auth.authenticateAdmin, function ( req, res ) {
		User.findByIdAndRemove(req.params.id, function ( err, user ) {
			if (err) throw err;

			res.json({
				success: true,
				user: user
			});
		});
	});

};

module.exports = account;
