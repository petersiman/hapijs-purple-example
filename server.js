var Bcrypt = require('bcrypt-nodejs');
var Hapi = require('hapi');
var Basic = require('hapi-auth-basic');
var Good = require('good');
var Joi = require('joi');
var oxr = require('open-exchange-rates');
oxr.set({ app_id: '84c877f978ef488ba62286eeafb18fe8' });
var fx = require('money');

var schema = {
    baseCurrency: Joi.string().regex(/[a-zA-Z]{3}/)
};

var currencies = ["USD", "GBP", "CZK", "JPY", "EUR"];

var server = new Hapi.Server();
server.connection({ port: 3000 });

//Users
//john has user roles admin and user
//bob only user
//password for both users is 'secret'
var users = {
	'john@test.com': {
        username: 'john@test.com',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
        name: 'John Doe',
        id: '2133d32a',
		roles: ['admin', 'user']
    },
	'bob@test.com': {
        username: 'bob@test.com',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
        name: 'Bob Doe',
        id: '2133d32b',
		roles: ['user']
    }
};

//Orders 
var orders = {
    1: {
        username: 'bob@test.com',
        items: [1, 4, 5, 99],
        createdAt: '2011-05-04'
    },
    2: {
        username: 'bob@test.com',
        items: [1, 4, 5, 99],
        createdAt: '2012-05-21'
    }, 
    3: {
        username: 'john@test.com',
        items: [1, 3, 10, 54, 87],
        createdAt: '2013-07-11'
    },
    4: {
        username: 'xy@test.com',
        items: [1, 4, 3],
        createdAt: '2014-08-01'
    }
	
};

var validate = function (request, username, password, callback) {
	server.log('debug', 'Validatin user ' + username);
    var user = users[username];
    if (!user) {
        return callback(null, false);
    }

    Bcrypt.compare(password, user.password, function (err, isValid) {
        callback(err, isValid, { id: user.id, name: user.name, username: user.username});
    });
};

var isAdmin = function (username){
	server.log('debug', 'Checking user ' + username);
	var currentUser = users[username];
	if (currentUser.roles.indexOf('admin') > -1){
		return true;
	}
	return false;
}

/**
 * @api {get} /orders Get user orders.
 * @apiName GetOrders
 * @apiGroup Orders
 * @apiSuccess {String} username Username of user, who created the order
 * @apiSuccess {Number[]} items IDs of products in the order
 * @apiSuccess {String} createdAt Date of creation of the order
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "username": "john@test.com",
 *       "items": [1,2,3],
 *       "createdAt" : "2015-07-08"
 *     }
 */
server.register(Basic, function (err) {
    server.auth.strategy('simple', 'basic', { validateFunc: validate });
    server.route({
        method: 'GET',
        path: '/orders',
        config: {
            auth: 'simple',
            handler: function (request, reply) {
				var result = [];
				if (isAdmin(request.auth.credentials.username)){
					server.log('info', 'User is admin, returning all users info');
					Object.keys(orders).forEach(function(orderKey){
						result.push(orders[orderKey]);
					});
					reply(result);
				} else {
					server.log('info', 'User is not admin. Showing just his information');
                    Object.keys(orders).forEach(function(orderKey){
                        if (orders[orderKey].username == request.auth.credentials.username){
                            result.push(orders[orderKey]);
                        }
                    });
					reply(result);
				}
            }
        }
    });
});

/**
 * @api {get} /exchange-rates/{baseCurrency} Get exchange rates
 * @apiName GetExchangeRates
 * @apiGroup ExchangeRates
 * @apiSuccess {Double} exchangeRate Exchange rate according to currency code
 * @apiExample {curl} Example usage:
 *     curl -XGET http://localhost/exchange-rates/USD
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "CZE": 1.15,
 *       "GBP": 0.45
 *     }
 * @apiError {String} errorMessage Message with error description
 */
server.route({
    method: 'GET',
    path: '/exchange-rates/{baseCurrency}',
    handler: function (request, reply) {
		var result = [];
		var validationResult = Joi.validate(request.params, schema);
		if (!validationResult.error){
			server.log('debug', 'Returning exchange rates for base currency: ' + request.params.baseCurrency);
			var baseCurrency = request.params.baseCurrency;
			console.log(validationResult);
				
			var rates = {};
            //Get latest exchange rates
			oxr.latest(function() {
				fx.rates = oxr.rates;
				fx.base = oxr.base;
				
				currencies.forEach(function(cur){
					if (cur.indexOf(baseCurrency) == -1){
						server.log('debug', 'Getting exchange rate for currency ' + cur);
						var rate = fx(1).from(baseCurrency).to(cur);
						var rateObj = {};
						rateObj[cur] = rate;
						result.push(rateObj);
					}
				});
				reply(result);
			});
		} else {
			reply({"errorMessage" : "Provide 3 character currency code. (GBP, USD, EUR, JPY, CZK)."});
		}
    }
});

server.register(require('inert'), function (err) {

    if (err) {
        throw err;
    }

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: 'apidoc'
            }
        }
    });

});

server.register({
    register: Good,
    options: {
        reporters: [{
            reporter: require('good-console'),
            events: {
                response: '*',
                log: '*'
            }
        }]
    }
}, function (err) {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
    });
});