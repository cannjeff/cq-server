var mongoose = require('mongoose'),
	QuipSchema;

QuipSchema = new mongoose.Schema({
	decrypted_text: String,
	encrypted_text: String,
	hint_key: { type: String, required: true },
	hint_value: { type: String, required: true },
	quarantine: Boolean,
	created_by: mongoose.Schema.Types.ObjectId,
	created_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quip', QuipSchema);
