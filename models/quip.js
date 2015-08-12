var mongoose = require('mongoose'),
	QuipSchema;

QuipSchema = new mongoose.Schema({
	decrypted_text: String,
	encrypted_text: String,
	hint_key: { type: String, required: true },
	hint_value: { type: String, required: true },
	quarantine: Boolean,
	archived: { type: Boolean, default: false },
	created_by: mongoose.Schema.Types.ObjectId,
	created_date: { type: Date, default: Date.now }
});

QuipSchema.pre('save', function ( next ) {
	this.hint_key = this.hint_key.toUpperCase();
	this.hint_value = this.hint_value.toUpperCase();

	return next();
});

module.exports = mongoose.model('Quip', QuipSchema);
