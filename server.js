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

var users = {
	john: {
        username: 'john',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
        name: 'John Doe',
        id: '2133d32a',
		roles: ['admin', 'user']
    },
	bob: {
        username: 'john',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
        name: 'Bob Doe',
        id: '2133d32b',
		roles: ['user']
    }
}

var orders = {
	
};

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});

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

var isAdmin = function(username){
	server.log('debug', 'Checking user ' + username);
	var currentUser = users[username];
	if (currentUser.roles.indexOf('admin') > -1){
		return true;
	}
	return false;
}

server.register(Basic, function (err) {
    server.auth.strategy('simple', 'basic', { validateFunc: validate });
    server.route({
        method: 'GET',
        path: '/users',
        config: {
            auth: 'simple',
            handler: function (request, reply) {
				var result = [];
				if (isAdmin(request.auth.credentials.username)){
					server.log('info', 'User is admin, returning all users info');
					Object.keys(users).forEach(function(userKey){
						result.push(users[userKey]);
					});
					reply(result);
				} else {
					server.log('info', 'User is not admin. Showing just his information');
					result.push(users[request.auth.credentials.username]);
					reply(result);
				}
            }
        }
    });
});

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
			oxr.latest(function() {
				// You can now use `oxr.rates`, `oxr.base` and `oxr.timestamp`
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
			reply('Provide 3 character currency code. (GBP, USD, EUR, JPY, CZK).');
		}
    }
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