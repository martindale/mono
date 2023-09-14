# The `core` library

The `core` library contains classes that provide the most basic functionality necessary for applications to be built. These are designed to be unopinionated and without any external dependencies.

## `HttpServer`

This class implements a very basic HTTP server with a simple interface consisting of 2 methods:

- `.start()` to start the HTTP server
- `.stop()` to stop the HTTP server

The class is implemented as an `EventEmitter` that emits certain events of interest.

- `start`: Emitted when the server has acquired the required resources to begin serving incoming requests. A reference to the instance is passed to the event handler.

- `error`: Emitted when the server or any request encounters an error. The event handler receives an `Error` instance, followed by the `HttpRequest` and `HttpResponse` instances that were being processed when the error occurred.

- `stop`: Emitted when the server has stopped and all resources have been released.

```javascript
const Server = require('core/server')
const server = new Server()
  .on('start', server => console.info(server))
  .on('error', (err, req, res) => console.error(err, req, res))
  .on('stop', server => console.info(server))
  .start()

process.on('SIGTERM', () => server.stop())
```

## `HttpApi`

The API module is designed to be flexible to meet a variety of needs. Given a directory path, the module recursively `require`'s all javascript files (bearing the `.js` file extension) in the directory tree, and exports an object whose keys are the endpoints exposed by the `HttpServer`, and the corresponding values are HTTP request handlers.

Shown below is an example of a request handler.

```javascript
/**
 * An HTTP request handler
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {Context} ctx Context object exposing all external dependencies
 * @returns {Void}
 */
module.exports = function (req, res, ctx) {
  // Any incoming JSON data is automatically parsed and available at req.json
  const { json } = req

  // res.send() accepts a JSON object or an Error instance to be sent
  if (json == null) {
    res.send(new Error('no JSON data to sent!'))
  } else {
    res.send(json)
  }
}
```

Each file in the API directory tree may export a [single request handler](../../test/core/fixtures/echo.js) or [an object whose keys are HTTP methods and corresponding values are request handlers](../../test/core/fixtures/http_methods.js).

## `HttpContext`

TODO: If you are reading this and need to know, please reach out to Anand and have him document this.

## `HttpClient`

TODO: If you are reading this and need to know, please reach out to Anand and have him document this.

## `Store`

TODO: If you are reading this and need to know, please reach out to Anand and have him document this.
