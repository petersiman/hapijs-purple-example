# hapijs-purple-example
Small application providing basic REST API for
- exchange rates retrieval
- orders fixed data retrieval

Built using HapiJS framework. 

## Run using

```
node server.js
```

## Api documentation is available on

```
http://localhost:3000
```

## User login

- john@test.com/secret (admin)
- bob@test.com/secret (regular user)

## Regenerate API DOC

```
apidoc -i . -f "server.js" -o apidoc/
```
