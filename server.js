var Hapi = require('hapi');
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


server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});

server.route({
    method: 'GET',
    path: '/exchange-rates/{baseCurrency}',
    handler: function (request, reply) {
		var result = [];
		var validationResult = Joi.validate(request.params, schema);
		if (!validationResult.error){
			console.log('Returning exchange rates for base currency: ' + request.params.baseCurrency);
			var baseCurrency = request.params.baseCurrency;
			console.log(validationResult);
				
			var rates = {};
			oxr.latest(function() {
				// You can now use `oxr.rates`, `oxr.base` and `oxr.timestamp`
				fx.rates = oxr.rates;
				fx.base = oxr.base;
				
				currencies.forEach(function(cur){
					if (cur.indexOf(baseCurrency) == -1){
						console.log('Getting exchange rate for currency ' + cur);
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

server.start(function () {
    console.log('Server running at:', server.info.uri);
});