define({ "api": [
  {
    "type": "get",
    "url": "/exchange-rates/{baseCurrency}",
    "title": "Get exchange rates",
    "name": "GetExchangeRates",
    "group": "ExchangeRates",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Double</p> ",
            "optional": false,
            "field": "exchangeRate",
            "description": "<p>Exchange rate according to currency code</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"CZE\": 1.15,\n  \"GBP\": 0.45\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -XGET http://localhost/exchange-rates/USD",
        "type": "curl"
      }
    ],
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "errorMessage",
            "description": "<p>Message with error description</p> "
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./server.js",
    "groupTitle": "ExchangeRates"
  },
  {
    "type": "get",
    "url": "/orders",
    "title": "Get user orders.",
    "name": "GetOrders",
    "group": "Orders",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "username",
            "description": "<p>Username of user, who created the order</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>Number[]</p> ",
            "optional": false,
            "field": "items",
            "description": "<p>IDs of products in the order</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "createdAt",
            "description": "<p>Date of creation of the order</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"username\": \"john@test.com\",\n  \"items\": [1,2,3],\n  \"createdAt\" : \"2015-07-08\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./server.js",
    "groupTitle": "Orders"
  }
] });