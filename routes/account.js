var User = require('../models/user'),
	jwt = require('jsonwebtoken'),
	_ = require('underscore'),
	auth = require('../middleware/authenticate'),
	HTTPStatus = require('http-status')

var account = function ( app ) {

	app.post('/v1/account/login', function ( req, res ) {
		User.findOne({
			username: req.body.username
		}, function ( error, user ) {
			if (error) {
				throw error;
			}

			if (!user) {
				res.status(HTTPStatus.UNAUTHORIZED).json({
					success: false,
					message: 'Authentication failed. Username not found.'
				});
			} else if (!user.verified) {
				res.status(HTTPStatus.UNAUTHORIZED).json({
					success: false,
					message: 'Authentication failed. Email not verified.'
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
						res.status(HTTPStatus.UNAUTHORIZED).json({
							success: false,
							message: 'Authentication failed. Incorrect password'
						});
					}
				});
			}
		});
	});

	app.get('/v1/account/verify/:token', function ( req, res ) {
		User.findOne({
			verificationToken: req.params.token
		}, function ( error, user ) {
			if (error) {
				console.log(error);
				return res.json({
					success: false,
					message: 'Email verification failed.'
				});
			} else if (user) {
				user.verifyEmail(function ( error ) {
					if (error) {
						return res.json({
							success: false,
							message: error
						});
					}

					res.json({
						success: true,
						data: user
					});
				});
			} else {
				res.json({
					success: false,
					message: 'Not a valid token.'
				});
			}
		});
	});

	app.post('/v1/account/resendVerification', function ( req, res ) {
		User.findOne({
			email: req.body.email
		}, function ( error, user ) {
			if (error) {
				console.log(error);
				return res.json({
					success: false,
					message: 'An unknown error occurred while resending the verification email'
				});
			} else if (user) {
				if (user.verified) {
					return res.json({
						success: false,
						message: 'Account already verified.'
					});
				}

				user.generateToken();
				user.save(function ( error ) {
					if (error) {
						console.log(error);
						return res.json({
							success: false,
							message: 'An unknown error occurred while resending the verification email'
						});
					}

					user.sendVerificationEmail();

					res.json({
						success: true
					});
				});
			} else {
				console.log('Email not found while trying to resend verification email');
				return res.json({
					success: false,
					message: 'An unknown error occurred while resending the verification email'
				});
			}
		});
	});

	app.post('/v1/account/create', function ( req, res ) {
		var user = new User({
			username: 			req.body.username,
			email:  			req.body.email,
			password: 			req.body.password
		});

		console.log('request', req.body);

		/* Token gets generated and set (not saved) on the object */
		user.generateToken();

		user.save(function ( error ) {
			if (error) {
				if (error.errors) {
					/* Error Handling */
					var errors = error.errors,
						errorMessage = 'An unknown error occurred when creating your account.';

					if (errors.username) {
						/* 1. Username taken */
						errorMessage = 'Error: Username not available.'
					} else if (errors.password) {
						/* 2. Password not valid */
						errorMessage = errors.password.message
					} else if (errors.email) {
						/* 3. Email not unique */
						errorMessage = 'Error: An account is aready registered to this email.'
					}
					return res.json({
							success: false,
							message: errorMessage
						});
				}
			} else {
				/* Normally the password is removed from the 'select' query */
				user.password = undefined;

				user.sendVerificationEmail();

				res.json({
					success: true
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
			/* Also set curator */
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
