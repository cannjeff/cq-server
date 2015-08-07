var _ = require('underscore'),
	mongodb = require('mongodb'),
	// passport = require('passport'),
	Quip = require('../models/quip'),
	auth = require('../middleware/authenticate');

/**
 *	Quips - potentially move to their own file if it grows wildly
 **/
var quips = function ( app ) {

	/**
	 *	Return a list of all (for now) quips
	 **/
	app.get('/v1/quips', auth.authenticate, function ( req, res ) {
		var query = {$or: [
			{ quarantine: false },
			{ quarantine: undefined }
		]};

		/* To pull quarantined quips */
		if (req.query.quarantine == 1) {
			query = { quarantine: true };
		}
		Quip
			.find( query )
			.limit(50)
			.sort({ created_date: -1 })
			.exec(function ( err, quips ) {
			if (err) { res.send( err ); }

			res.json( quips );
		});
	});

	/**
	 *	Creates a new quip and places it in quarantine
	 **/
	app.post('/v1/quips/create', auth.authenticate, function ( req, res ) {
		var quip = new Quip(),
			encryptedObj;

		/* Pull the user ID from the decoded object on the request */
		quip.created_by = req.decoded.user._id;

		quip.decrypted_text = req.body.decrypted_text;
		if (!req.body.encrypted_text) {
			encryptedObj = 			encryptText( req.body.decrypted_text );

			quip.encrypted_text = 	encryptedObj.encrypted_text;
			quip.hint_key = 		encryptedObj.hint_key;
			quip.hint_value = 		encryptedObj.hint_value;
		} else {
			quip.encrypted_text = 	req.body.encrypted_text;
			quip.hint_key = 		req.body.hint_key;
			quip.hint_value = 		req.body.hint_value;
		}

		/* Directly to quarantine */
		////TODO - add direct to live for (G)GUJ and maybe other admins/curators
		quip.quarantine = true;

		quip.save(function ( err ) {
			if (err) { throw err; }

			res.json( quip );
		});
	});

	/**
	 *	Quick API reset for the quips collection - obviously not a great thing but meh
	 **/
	app.get('/v1/quips/resetall', function ( req, res ) {
		// if (app.get('env') !== 'development') { return; }

		// var defaultQuips = [
		// 	{ encrypted_text: "YO U GUWW AWUDESPSP YD FKVFSYESH UVH AKLAKQD, GKQWH CKQ DUC IS'D DEQFFK KV IYLDSWO?", hint: "O => F", date: "06/03/2015" },
		// 	{ encrypted_text: "JI GRF'VW VWTYJMH \"SFDABWEWVVG IJMM\" KSJBW RM TCXVTA, GRF CTG EW XTAJMH T XKTJM VJYW.", decrypted_text: "if you're reading \"Huckleberry Finn\" while on amtrak, you may be taking a twain ride.", hint: "V => R", date: "06/02/2015" },
		// 	{ encrypted_text: "FNOUI UJ MLURL EJ BJYIGLEJYIY ERZGIXX QIRNFIX LIFFIY UJ NJ EVV XUYIX: \"MEVV EQNBZ IOI.\"", hint: "I => E", date: "06/01/2015" },
		// 	{ encrypted_text: "TSZC H CZT ZCQWHCVZJ LHXZP H JHCVGL PRJYUUWYCQ, RGNWV MGN RHWW KSHK H MHCXZZ VGGVWZ?", hint: "G => O", date: "05/31/2015" },
		// 	{ encrypted_text: "QHEV WSAMP, SOHDP PH OV SWWKAVN PH SM HKN TDQPVN YST, QFHDPVN \"NHM'P YHSP EV HM PFSP!\"", hint: "M => N", date: "05/30/2015" },
		// 	{ encrypted_text: "XU H KPO XN BVHZZO XDAL SHASGXDK JLBHON HDY SLDKVBN, SLPZY OLP SHZZ GXJ HD VVZXDK UHD?", hint: "Z => L", date: "05/29/2015" }
		// ];

		// app.mdbConnect(function ( err, db ) {
		// 	if (err) { throw err; }

		// 	db.collection('quips').remove();
		// 	db.collection('quips').insert( defaultQuips );
		// 	db.collection('quips').find().toArray(function ( err, results ) {
		// 		if (err) { throw err; }

		// 		if (results) {
		// 			res.setHeader('Content-Type', 'application/json');
		// 			res.send(JSON.stringify( results ));
		// 		}
		// 		db.close();
		// 	});
		// });
	});

	/**
	 *	Returns a single quip by ID
	 **/
	app.get('/v1/quips/:id', function ( req, res ) {
		Quip.findById(req.params.id, function ( err, quip ) {
			if (err) { res.send( err ); }

			res.json( quip );
		});
	});

	/**
	 *	Checks if solution is correct
	 *
	 *	Query params:
	 *		solution - the plain text solution to the cryptoquip
	 **/
	app.get('/v1/quips/:id/solve', function ( req, res ) {
		Quip.findById(req.params.id, function ( err, quip ) {
			if (err) { throw err; }

			if (quip) {
				var isSolved = false;
				if (req.query.solution && quip.decrypted_text) {
					isSolved = formatQuipText( req.query.solution ) === formatQuipText( quip.decrypted_text );
				}
				res.json({
					solved: isSolved,
					expected: quip.decrypted_text,
					received: req.query.solution
				});
			}
		});
	});

	/**
	 *	Approve quarantined quip
	 **/
	app.get('/v1/quips/:id/approve', function ( req, res ) {
		Quip.findById(req.params.id, function ( err, quip ) {
			if (err) { throw err; }

			if (quip.quarantine == 1) {
				quip.quarantine = 0;

				quip.save(function ( err ) {
					if (err) { throw err; }

					res.json(quip);
				});
			}
		});
	});

	/**
	 *	Reject quarantined quip
	 **/
	app.get('/v1/quips/:id/reject', function ( req, res ) {
		Quip.findByIdAndRemove(req.params.id, function ( err, quip ) {
			if (err) { throw err; }

			res.json( quip );
		});
	});

};

/**
 *	Checks:
 *		- equal lengths
 *		- to make sure all occurances of a letter map to the same letter
 *
 *	!!! This can and will be beefed up later. !!!
 **/
function checkSubmittedQuip( quip ) {
	var decryptedCorrectly = false,
		encryptedText = formatQuipText( quip.encrypted_text ).split(''),
		decryptedText = formatQuipText( quip.decrypted_text ).split(''),
		map = [];

	if (encryptedText.length === 0 ||
		encryptedText.length !== decryptedText.length) { return false; } /* Quit early if the lengths don't match */

	decryptedCorrectly = _.all( decryptedText, function ( letter, idx ) {
		var isMatch = false;
		if (map[ letter ]) {
			isMatch = map[ letter ] === encryptedText[ idx ];
		} else {
			map[ letter ] = encryptedText[ idx ];
			isMatch = true;
		}
		return isMatch;
	});

	return decryptedCorrectly;
};

function formatQuipText( str ) {
	if (typeof str !== 'string') { return ""; }
	return str.replace(/\W+/g, '').toUpperCase();
};

function encryptText( str ) {
	var alphabet = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ],
		shuffledAlphabet = shuffle(alphabet),
		regex = new RegExp(alphabet.join('|'), 'g'),
		encryptedText,
		hintObj,
		hintKey,
		hintValue;

	str = str.toUpperCase();

	function shuffle( arr ) {
		var shuffled = _.shuffle( arr );
		if (_(arr).all(function ( a, i ) { return a !== shuffled[ i ]; })) {
			return shuffled;
		} else {
			return shuffle( arr );
		}
	};

	function findHint( dStr, eStr ) {
		var idx = Math.floor(Math.random() * dStr.length),
			letter = dStr[ idx ];

		if (regex.test( letter )) {
			return {
				hint_key: eStr[ idx ],
				hint_value: dStr[ idx ]
			};
		} else {
			return findHint( dStr, eStr );
		}
	};

	/* Encrypt the string */
	encryptedText = str.replace(regex, function ( matched ) {
		return shuffledAlphabet[ alphabet.indexOf( matched ) ];
	});

	/* Generate the hint, make sure it's actually used */
	hintObj = findHint( str, encryptedText );
	hintKey = hintObj.hint_key;
	hintValue = hintObj.hint_value;

	return {
		encrypted_text: encryptedText,
		hint_key: hintKey,
		hint_value: hintValue
	};
};

module.exports = quips;
