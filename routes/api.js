var apis = function ( app ) {

	app.get('/api/test', function ( req, res ) {
		var mdb = app.get('mongoclient');
		mdb.connect(app.get('mongoconnectstr'), function ( err, db ) {
			if (err) { throw err; }
			db.collection('test_insert').find().toArray(function ( err, results ) {
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

module.exports = apis;