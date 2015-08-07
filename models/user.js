var mongoose = require('mongoose'),
	validate = require('mongoose-validator'),
	bcrypt = require('bcrypt'),
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

UserSchema = new mongoose.Schema({
	username: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true, select: false, validate: passwordValidator },
	curator: { type: Boolean, default: false },
	admin: { type: Boolean, default: false },
	created_date: { type: Date, default: Date.now }
});

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

module.exports = mongoose.model('User', UserSchema);
