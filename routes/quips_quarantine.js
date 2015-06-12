var mongodb = require('mongodb'),
	ObjectId = mongodb.ObjectId;

/**
 *	Quips Quarantine
 **/
var quips_quarantine = function ( app ) {

	/**
	 *	Return a list of all (for now) quips in quips_quarantine
	 **/
	app.get('/v1/quips_quarantine', function ( req, res ) {
		app.mdbConnect(function ( err, db ) {
			db.collection('quips_quarantine').find().toArray(function ( err, results ) {
				if (err) { throw err; }

				if (results) {
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify( results ));
				}
				db.close();
			});
		});
	});

	app.get('/v1/quips_quarantine/:id', function ( req, res ) {
		app.mdbConnect(function ( err, db ) {
			if (err) { throw err; }

			db.collection('quips_quarantine').findOne({ "_id": new ObjectId( req.params.id ) }, function ( err, doc ) {
				if (err) { throw err; }

				if (doc) {
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify( doc ));
				}
				db.close();
			});
		});
	});

	app.get('/v1/quips_quarantine/:id/approve', function ( req, res ) {
		app.mdbConnect(function ( err, db ) {
			if (err) { throw err; }

			db.collection('quips_quarantine').findOne({ "_id": new ObjectId( req.params.id ) }, function ( err, doc ) {
				if (err) { throw err; }

				if (doc) {
					db.collection('quips').insert( doc );
					db.collection('quips_quarantine').remove( doc );
					res.send(JSON.stringify( doc ));
				}
				db.close();
			});
		});
	});

};

module.exports = quips_quarantine;