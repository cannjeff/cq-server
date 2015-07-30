var mongoose = require('mongoose'),
	QuipSchema;

QuipSchema = new mongoose.Schema({
	decrypted_text: String,
	encrypted_text: String,
	hint_key: String,
	hint_value: String,
	created_date: Date,
	quarantine: Boolean
});

module.exports = mongoose.model('Quip', QuipSchema);