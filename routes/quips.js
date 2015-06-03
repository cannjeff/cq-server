var _ = require('underscore');

/**
 *	Quips - potentially move to their own file if it grows wildly
 **/
var quips = function ( app ) {

	/**
	 *	Return a list of all (for now) quips
	 **/
	app.get('/api/quips', function ( req, res ) {
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
	app.get('/api/quips/create', function ( req, res ) {
		var expectedParams = [ 'encrypted_text', /*'decrypted_text',*/ 'hint', 'date' ], // TODO figure out if we want the user to submit the solution
			missingParams = [];

		/* Make sure all the expected params exist */
		_.each( expectedParams, function ( param ) {
			var hasProp = req.query.hasOwnProperty( param );
			if (!hasProp) {
				missingParams.push( param );
			}
			return hasProp;
		});

		if (missingParams.length > 0) {
			res.status(500).send({ error: 'Missing params ' + JSON.stringify( missingParams ) });
		} else {
			app.mdbConnect(function ( err, db ) {
				if (err) { throw err; }

				/* Minor thing to prevent extra crap, not the best */
				var obj = {};
				_.each( expectedParams, function ( p ) {
					obj[p] = req.query[p];
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
	app.get('/api/quips/resetall', function ( req, res ) {
		if (app.get('env') !== 'development') { return; }

		var defaultQuips = [
			{ encrypted_text: "YO U GUWW AWUDESPSP YD FKVFSYESH UVH AKLAKQD, GKQWH CKQ DUC IS'D DEQFFK KV IYLDSWO?", hint: "O => F", date: "06/03/2015" },
			{ encrypted_text: "JI GRF 'VW VWTYJMH \"SFDABWEWVVG IJMM\" KSJBW RM TCXVTA, GRF CTG EW XTAJMH T XKTJM VJYW.", hint: "V => R", date: "06/02/2015" },
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

};

module.exports = quips;