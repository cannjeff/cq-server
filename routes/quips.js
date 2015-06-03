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
				if (results && results.length) {
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify( results ));
				}
				db.close();
			});
		});
	});

	/**
	 *	Quick API reset for the quips collection - obviously not a great thing but meh
	 **/
	app.get('/api/quips/resetall', function ( req, res ) {
		var defaultQuips = [
			{ encrypted_text: "YO U GUWW AWUDESPSP YD FKVFSYESH UVH AKLAKQD, GKQWH CKQ DUC IS'D DEQFFK KV IYLDSWO?", hint: "O => F", date: "06/03/2015" },
			{ encrypted_text: "JI GRF 'VW VWTYJMH \"SFDABWEWVVG IJMM\" KSJBW RM TCXVTA, GRF CTG EW XTAJMH T XKTJM VJYW.", hint: "V => R", date: "06/02/2015" },
			{ encrypted_text: "FNOUI UJ MLURL EJ BJYIGLEJYIY ERZGIXX QIRNFIX LIFFIY UJ NJ EVV XUYIX: \"MEVV EQNBZ IOI.\"", hint: "I => E", date: "06/01/2015" },
			{ encrypted_text: "TSZC H CZT ZCQWHCVZJ LHXZP H JHCVGL PRJYUUWYCQ, RGNWV MGN RHWW KSHK H MHCXZZ VGGVWZ?", hint: "G => O", date: "05/31/2015" },
			{ encrypted_text: "QHEV WSAMP, SOHDP PH OV SWWKAVN PH SM HKN TDQPVN YST, QFHDPVN \"NHM'P YHSP EV HM PFSP!\"", hint: "M => N", date: "05/30/2015" },
			{ encrypted_text: "XU H KPO XN BVHZZO XDAL SHASGXDK JLBHON HDY SLDKVBN, SLPZY OLP SHZZ GXJ HD VVZXDK UHD?", hint: "Z => L", date: "05/29/2015" }
		];

		app.mdbConnect(function ( err, db ) {
			db.collection('quips').remove();
			db.collection('quips').insert( defaultQuips );
			db.collection('quips').find().toArray(function ( err, results ) {
				if (err) { throw err; }
				if (results && results.length) {
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify( results ));
				}
				db.close();
			});
		});
	});

};

module.exports = quips;