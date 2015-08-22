var mongoose = require('mongoose'),
	validate = require('mongoose-validator'),
	uniqueValidator = require('mongoose-unique-validator'),
	bcrypt = require('bcrypt'),
	moment = require('moment'),
	crypto = require('crypto'),
	nodemailer = require('nodemailer'),
	sesTransport = require('nodemailer-ses-transport'),
	_ = require('underscore'),
	fs = require('fs'),
	clientOrigin = JSON.parse(fs.readFileSync('./server-config.json', 'utf8')).clientOrigin,
	smtpTransport,
	mailOptions,
	SALT_WORK_FACTOR = 10,
	UserSchema,
	passwordValidator;

passwordValidator = [
	validate({
		validator: 'isLength',
		arguments: [ 8 ],
		message: 'Password must be at least {ARGS[0]} characters long.'
	})
];

// sesTransporter = nodemailer.createTransport(sesTransport({

// }));
smtpTransport = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'cryptoquipmailer@gmail.com',
		pass: 'theblackcarisgreen'
	}
});
mailOptions = {
	from: 'noreply@cryptoquip.io',
	to: '', /* Fill out during request */
	subject: 'Please verify your email address',
	text: '', /* Fill out during request */
	html: '' /* ? */
};

UserSchema = new mongoose.Schema({
	/* Auth stuff */
	username: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true, select: false, validate: passwordValidator },

	/* Account verification */
	email: { type: String, required: true, unique: true },
	verified: { type: Boolean, required: true, default: false },
	verificationToken: { type: String, required: true },
	verificationTokenExpiration: { type: Date/*, default: moment().add(1, 'days').toDate()*/ },

	/* Roles */
	curator: { type: Boolean, default: false },
	admin: { type: Boolean, default: false },

	/* Meta */
	created_date: { type: Date, default: Date.now }
});

UserSchema.plugin(uniqueValidator);

UserSchema.pre('save', function ( next ) {
	var user = this;

	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.genSalt(SALT_WORK_FACTOR, function ( error, salt ) {
		if (error) {
			return next(error);
		}

		bcrypt.hash(user.password, salt, function ( error, hash ) {
			if (error) {
				return next(error);
			}

			user.password = hash;
			return next();
		});
	});
});

UserSchema.methods.comparePassword = function ( candidatePassword, cb ) {
	/* Password is excluded from resultsets by default, so we need to use a custom query to get it here */
	this.model('User').findOne({ username: this.username }).select('+password').exec(function ( err, user ) {
		if (err) {
			return cb(err);
		}

		bcrypt.compare(candidatePassword, user.password, function ( error, isMatch ) {
			if (error) {
				return cb(error);
			}

			cb(null, isMatch);
		});
	});
};

UserSchema.methods.verifyEmail = function ( callback ) {
	/* Check if account already verified */
	if (this.verified) {
		return callback( 'Account already verified.' );
	}

	/* Check if token has expired */
	if (moment().isAfter(this.verificationTokenExpiration)) {
		return callback( 'Verification token has expired.' );
	}

	/* Set verified bool to true */
	this.verified = true;

	this.save(function ( error ) {
		return callback( error );
	});
};

UserSchema.methods.generateToken = function () {
	var token = crypto.randomBytes(48).toString('base64').replace(/\//g,'_').replace(/\+/g,'-');

	this.verificationToken = token;
	this.verificationTokenExpiration = moment().add(1, 'days').toDate();

	/* NOTE: intentionally NOT saving here */
};

UserSchema.methods.sendVerificationEmail = function () {
	var opts = _.extend({}, mailOptions);
	opts.to = this.email;
	var href = clientOrigin + '/#/verifyEmail/' + this.verificationToken;
	opts.html = [
			'<h3>Please verify your email address</h3>',
			'<p>Hey ' + this.username + '!</p>',
			'<p>Please verify your email address so we know it\'s really you!</p>',
			'<a href="' + href + '">' + href + '</a>',
			'<p>Thanks!</p>'
		].join('');

	/* Send the email */
	smtpTransport.sendMail(opts, function ( error, response ) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email verification message sent to', this.email, ':', response.message);
		}
	});
};

module.exports = mongoose.model('User', UserSchema);
