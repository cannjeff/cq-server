var mongoose = require('mongoose'),
	UserQuipSolutionSchema;

UserQuipSolutionSchema = new mongoose.Schema({
	user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
	quip_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Quip' },
	key_object: mongoose.Schema.Types.Mixed,
	solved: { type: Boolean, default: false },
	created_date: { type: Date, default: Date.now },
	modified_date: { type: Date, default: Date.now }
});

UserQuipSolutionSchema.pre('save', function ( next ) {
	this.modified_date = new Date();
	next();
});

UserQuipSolutionSchema.index({ user_id: 1, quip_id: 1 }, { unique: true });

module.exports = mongoose.model('UserQuipSolution', UserQuipSolutionSchema);
