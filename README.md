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

### Creating a Module

#### Module(dependentModules)

```javascript
var core = new Module();
var app = new Module(core);
```

### Registering Module Services

#### factory(name, dependencies, factory)

Registers a service with the module

```javascript
module.factory("log", ["$window"], function($window) {
    // return the service instance
    return {
        debug: function(message) {
        }
    };
});

var log = container.get("log");
log.debug("wow");
```

#### type(name, dependencies, Constructor)

Helper method that registers a Type/Class instance as a service

```javascript
var Log = function($window) {
};
Log.prototype = {
    debug: function(message) {
    };
};

module.type("log", ["$window"], Log);

var log = container.get("log");
log.debug("wow");
```

#### typeFactory(name, dependencies, Constructor

Helper method that registers a Type/Class factory method. Calling the factory method will create an instance
of the Type/Class. Arguments passed to the factory method will be passed to the constructor along with dependent
services.

```javascript
var Log = function($window, name) {
};
Log.prototype = {
     debug: function(message) {
     };
};

module.typeFactory("logFactory", ["$window"], Log);

var logFactory = container.get("logFactory");
var httpLog = logFactory("http");
httpLog.debug("wow");
```

#### value(name, value)

Helper method that registers the value as a service. The value can be anything: object, string, Type/Class, etc.

```javascript
module.config("settings", {
    apiUrl: "www.test.com/api",
    imageUrl: "www.test.com/images
});
```

#### decorator(name, dependencies, decorator)

Registers a service decorator. A decorator is used to modify or enhance a service before it is instantiated.
A general use case would be to modify or enhance a service provided by some other module.

```javascript
module.factory("log", ["$window"], function() {
    return {
        debug: function(message) {
        }
    };
});

module.decorator("log", ["utils"], function(log, utils) {
    var debug = log.debug;
    // Enhance the log debug method by including "[DEBUG]:" with each message
    log.debug = function(message) {
        message =  "[DEBUG]: " + message;
        debug.call(this, message);
    };

    return log;
}

var log = container.get("log");
log.debug("wow"); // outputs [DEBUG]: wow
```

#### config(name, config)

Registers a configuration for a service. Each service can have one configuration. The configuration can be accessed
by the service as a dependency named "$config".

```javascript
module.config("log", {enabled: true});
```

The configuration can then be accessed by the service:

```javascript
module.factory("log", ["$config"], function($config) {
    var enabled = $config.enabled; // true
});
```

This method is simply a wrapper for registering a service named "config.<service name>". If your configuration
has dependencies then you can register the configuration as:

```javascript
module.factory("config.log", ["logConsole"], function(logConsole) {
    return {
        enabled: true,
        targets: [logConsole]
    };
});
```

### Exporting Services

#### exports(names)

Configure services that are exported by the module. Exported/public services are usable in other modules that
use this module as a dependent module. Non exported/private services can only be used within the module they
belong to.

This is useful if you have services that you don't want to expose, and to avoid having to worry
about name collisions. A private service name is unique to the module, multiple modules can have private services
with the same names. A public service name is unique to the container, there can only be one public service with
a name.

By default all services are exported in a module.

```javascript
module.exports(["log"]);
```

### Creating a Container

#### Container(modules)

```javascript
var container = new Container([moduleA, moduleB]);
```

### Instantiating Container Services

#### load()

Creates all service instances at once

```javascript
container.load();
```

#### invoke(dependencies, method, context)

Invokes a method with instantiated services as parameters

```javascript
container.invoke(["$window, log], function($window, log) {
    // service instances available
});
```

#### get(name)

Get a service instance

```javascript
var log = container.get("log");
log.debug("wow");
```

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