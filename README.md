# cq-server
NodeJS server for CryptoQuip (CQ)

## Server Configuration
MongoDB connection settings are now pulled from the server-config.json file. It should look something like this:

``` JavaScript
{
	"mongoConfig": {
		"host": "localhost",
		"port": 27017,
		"dbname": "cryptoquip"
	}
}
```