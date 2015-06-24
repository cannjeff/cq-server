var _ = require('underscore'),
	mongodb = require('mongodb'),
	ObjectId = mongodb.ObjectId;

/**
 *	Quips - potentially move to their own file if it grows wildly
 **/
var quips = function ( app ) {

	/**
	 *	Return a list of all (for now) quips
	 **/
	app.get('/v1/quips', function ( req, res ) {
		app.mdbConnect(function ( err, db ) {
			db.collection('quips').find().toArray(function ( err, results ) {
				if (err) { throw err; }

				if (results) {
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify( results ));
				}
				db.close();
			});
		});
	});

	/**
	 *	Creates a new quip and places it in quarantine
	 **/
	app.get('/v1/quips/create', function ( req, res ) {
		var params = [ 'decrypted_text', 'encrypted_text', 'hint', 'date' ],
			expectedParams = [ 'decrypted_text', 'hint' ],
			missingParams = [];

		/* Make sure all the expected params exist */
		_.each( expectedParams, function ( param ) {
			var hasProp = req.query.hasOwnProperty( param );
			if (!hasProp) {
				missingParams.push( param );
			}
			return hasProp;
		});

		if (missingParams.length > 0) { /* Check if all params exist */
			res.status(500).send({ error: 'Missing params ' + JSON.stringify( missingParams ) });
		// } else if (!checkSubmittedQuip( req.query )) { /* Check if provided solution is correct */
			// res.status(500).send({ error: 'The submitted quip is not properly decrypted. Please check your solution and resubmit.' });
		} else {
			app.mdbConnect(function ( err, db ) {
				if (err) { throw err; }

				/* Minor thing to prevent extra crap, not the best */
				var obj = {};
				_.each( params, function ( p ) {
					/* Encrypt the text if need be */
					if (p === 'encrypted_text' && !req.query.hasOwnProperty(p)) {
						obj[p] = encryptText(req.query.decrypted_text);
					} else {
						obj[p] = req.query[p];
					}
				});

				db.collection('quips_quarantine').insert( obj );
				res.send(JSON.stringify( obj ));
				db.close();
			});
		}
	});

	/**
	 *	Quick API reset for the quips collection - obviously not a great thing but meh
	 **/
	app.get('/v1/quips/resetall', function ( req, res ) {
		// if (app.get('env') !== 'development') { return; }

		var defaultQuips = [
			{ encrypted_text: "YO U GUWW AWUDESPSP YD FKVFSYESH UVH AKLAKQD, GKQWH CKQ DUC IS'D DEQFFK KV IYLDSWO?", hint: "O => F", date: "06/03/2015" },
			{ encrypted_text: "JI GRF'VW VWTYJMH \"SFDABWEWVVG IJMM\" KSJBW RM TCXVTA, GRF CTG EW XTAJMH T XKTJM VJYW.", decrypted_text: "if you're reading \"Huckleberry Finn\" while on amtrak, you may be taking a twain ride.", hint: "V => R", date: "06/02/2015" },
			{ encrypted_text: "FNOUI UJ MLURL EJ BJYIGLEJYIY ERZGIXX QIRNFIX LIFFIY UJ NJ EVV XUYIX: \"MEVV EQNBZ IOI.\"", hint: "I => E", date: "06/01/2015" },
			{ encrypted_text: "TSZC H CZT ZCQWHCVZJ LHXZP H JHCVGL PRJYUUWYCQ, RGNWV MGN RHWW KSHK H MHCXZZ VGGVWZ?", hint: "G => O", date: "05/31/2015" },
			{ encrypted_text: "QHEV WSAMP, SOHDP PH OV SWWKAVN PH SM HKN TDQPVN YST, QFHDPVN \"NHM'P YHSP EV HM PFSP!\"", hint: "M => N", date: "05/30/2015" },
			{ encrypted_text: "XU H KPO XN BVHZZO XDAL SHASGXDK JLBHON HDY SLDKVBN, SLPZY OLP SHZZ GXJ HD VVZXDK UHD?", hint: "Z => L", date: "05/29/2015" }
		];

		app.mdbConnect(function ( err, db ) {
			if (err) { throw err; }

			db.collection('quips').remove();
			db.collection('quips').insert( defaultQuips );
			db.collection('quips').find().toArray(function ( err, results ) {
				if (err) { throw err; }

				if (results) {
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify( results ));
				}
				db.close();
			});
		});
	});

	/**
	 *	Returns a single quip by ID
	 **/
	app.get('/v1/quips/:id', function ( req, res ) {
		app.mdbConnect(function ( err, db ) {
			db.collection('quips').findOne({ "_id": new ObjectId( req.params.id ) }, function ( err, doc ) {
				if (err) { throw err; }

				if (doc) {
					res.send(JSON.stringify( doc ));
				}
				db.close();
			});
		});
	});

	/**
	 *	Checks if solution is correct
	 *
	 *	Query params:
	 *		solution - the plain text solution to the cryptoquip
	 **/
	app.get('/v1/quips/:id/solve', function ( req, res ) {
		app.mdbConnect(function ( err, db ) {
			db.collection('quips').findOne({ "_id": new ObjectId( req.params.id ) }, function ( err, doc ) {
				if (err) { throw err; }

				if (doc) {
					var isSolved = false;
					if (req.query.solution && doc.decrypted_text) {
						isSolved = formatQuipText( req.query.solution ) === formatQuipText( doc.decrypted_text );
					}
					res.send({
						solved: isSolved,
						expected: doc.decrypted_text,
						received: req.query.solution
					});
				}
				db.close();
			});
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
		regex = new RegExp(alphabet.join('|'), 'g');

	str = str.toUpperCase();

	function shuffle( arr ) {
		var shuffled = _.shuffle( arr );
		if (_(arr).all(function ( a, i ) { return a !== shuffled[ i ]; })) {
			return shuffled;
		} else {
			return shuffle( arr );
		}
	};

	return str.replace(regex, function ( matched ) {
		return shuffledAlphabet[ alphabet.indexOf( matched ) ];
	});
};

module.exports = quips;