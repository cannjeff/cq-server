/**
 *	Quips Quarantine
 **/
var quips_quarantine = function ( app ) {

	/**
	 *	Return a list of all (for now) quips in quips_quarantine
	 **/
	app.get('/api/quips_quarantine', function ( req, res ) {
		app.mdbConnect(function ( err, db ) {
			db.collection('quips_quarantine').find().toArray(function ( err, results ) {
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

module.exports = quips_quarantine;