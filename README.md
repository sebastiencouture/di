DI.js [![Build Status](https://secure.travis-ci.org/sebastiencouture/di.png?branch=master)](https://travis-ci.org/sebastiencouture/di)
===

Dependency injection framework for the browser and Node.js.

The dependency injection pattern is about providing dependent objects to an object instead of the object itself having to
construct them. This is a very useful technique for testing since it allows dependencies to be mocked or stubbed out.

If you're interested in the theory, check out [Martin Fowler's article](http://martinfowler.com/articles/injection.html)

There are three main parts to the framework:

1. Service. A javascript object. Some logical piece of your application.
2. Module. A logical group of public and private services. One or more modules forms a container.
3. Container. Responsible for instantiating and injecting services into dependent services. Also known as an injector.

## Usage

TODO :)

### Example

```javascript
// Create a new module
var core = new Module();

// Create a simple logger service, we have one dependency which is the configuration
// for the service when it is instantiated
core.factory("log", ["$config"], function($config) {
    var disabled = $config.disabled;
    var targets = $config.targets;

    return function(message) {
        if (disabled) {
            return;
        }

        targets.forEach(function(target) {
            target.log(message);
        });
    };
});

// Create log target service, we have one dependency on a $window service.
core.factory("logConsole", ["$window"], function($window) {
    return {
        log: function(message) {
            $window.console.log(message);
        }
    };
});

// Create $window service which is simply the global window. Good use for doing
// this is it allows us to easily mock $window for unit testing if we want.
core.value("$window", window);

// Export log and logConsole services. log and logConsole will be available to
// use  when injected into a container (public). $window will only be usable by
// services within this module (private).
core.exports(["log", "logConsole"]);

// Create another module that is dependent on the core
var app = new Module(core);

// Setup configuration for our logger service. If you don't have any
// dependent services for the config then you can use the helper
// app.config("log", {});. The configuration of the service can be
// accessed as by the service as a dependency named "$config"
app.factory("config.log", ["logConsole"], function(logConsole) {
    return {
        disabled: false,
        targets: [logConsole]
    };
});

// Create a container that contains the core and app modules. There is no need
// to specify the core module since it is dependent module of the app module.
// You can specify it if you want, but it is not needed.
var container = new Container(app);

// Now we can inject everything which will instantiate all services
container.load();

// ... or we can simply instantiate on demand
var log = container.get("log");
log("oh ya");

// ... or as
container.invoke(["log"], function(log) {
    log("oh ya again");
});
```

### Registering Services

### Exporting Services

### Creating Module

### Creating Container

### Instantiating Services

## Installation

The library is written with CommonJS modules. If you are using Browserify, Webpack, or similar you can consume it like
anything else installed from npm or bower.

There is also a global UMD compliant build available in the `dist` folder. The build is created with Browserify. The library registers on `window.di`.

## Browser Support

IE 9+

IE6+ support is available using an ES5 polyfill such as [ES5-Shim](https://github.com/es-shims/es5-shim)

## License

The MIT License (MIT)

Copyright (c) 2015 Sebastien Couture

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.