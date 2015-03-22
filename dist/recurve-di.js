/*!
recurve-di.js - v0.1.5
Created by Sebastien Couture on 2015-03-22.

git://github.com/sebastiencouture/recurve-di.git

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
*/

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.di = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var utils = require("./utils");
var Module = require("./module");

var CONTAINER_SERVICE_NAME = "$container";

/**
 * @param modules Array or one module that forms the container
 * @constructor
 * @returns {Container}
 * @throws Error if no modules
 */
module.exports = function(modules) {
    utils.assert(modules, "no modules specified for container");

    if (!utils.isArray(modules)) {
        modules = [modules];
    }

    utils.assert(modules.length, "no modules specified for container");

    var instances = [];
    var services = {};
    var decorators = {};

    loadModules();

    function loadModules() {
        addContainerServiceModule();

        // Only load each module once
        var allModules = [];
        getAllModules(modules, allModules);
        allModules = uniqueModules(allModules);

        utils.forEach(allModules, function(module) {
            var exported = module.exported();

            services = utils.extend(services, exported.services);
            decorators = utils.extend(decorators, exported.decorators);
        });
    }

    function addContainerServiceModule() {
        var module = new Module();
        module.value(CONTAINER_SERVICE_NAME,  {
            load: load,
            invoke: invoke,
            get: get
        });

        modules.push(module);
    }

    function getAllModules(modules, all) {
        utils.forEach(modules, function(module){
            getAllModules(module.dependentModules, all);
            all.push(module);
        });
    }

    function uniqueModules(modules) {
        var unique = [];
        utils.forEach(modules, function(module) {
            if (-1 === unique.indexOf(module)) {
                unique.push(module);
            }
        });

        return unique;
    }

    /**
     * Creates all service instances
     */
    function load() {
        utils.forEach(services, function(service, name){
            get(name);
        });
    }

    /**
     * Invoke a method with instantiated services as parameters
     *
     * @example
     * container.invoke(["$window, log], function($window, log) {
     *      // service instances available
     * });
     *
     * @param dependencies Array of services
     * @param method Method that will be invoked with the dependent service instances as parameters
     * @param context Context for the method
     * @returns {*} Value returned by the invoked method
     */
    function invoke(dependencies, method, context) {
        var dependencyInstances = getDependencyInstances(dependencies);
        return method.apply(context, dependencyInstances);
    }

    var resolving = [];

    /**
     * Returns a service instance
     *
     * @param name The name of the service
     * @returns {*} Service instance
     * @throws Error if the service does not exist or is not public
     * @throws Error if there is a circular dependency between services
     * @throws Error if the service factory does not return an instance
     * @throws Error if a service decorator does not return an instance
     */
    function get(name) {
        if (instances[name]) {
            return instances[name];
        }

        var service = services[name];
        utils.assert(service, "no service or public service exists with the name {0}", name);

        if (0 <= resolving.indexOf(name)) {
            var dependencyStack = resolving.join(" -> ");
            resolving = [];

            utils.assert(false, "circular dependency detected: " + dependencyStack);
        }

        resolving.push(name);

        var instance = invoke(service.dependencies, service.value);
        utils.assert(instance, "factory {0} must return an instance", name);

        instances[name] = decorate(name, instance);
        utils.assert(undefined !== instances[name], "decorator {0} must return an instance", name);

        resolving.pop();

        return instances[name];
    }

    function decorate(name, instance) {
        var decorator = decorators[name];
        if (!decorator) {
            return instance;
        }

        var dependencyInstances = getDependencyInstances(decorator.dependencies);
        return decorator.value.apply(null, [instance].concat(dependencyInstances));
    }

    function getDependencyInstances(dependencies) {
        var instances = [];
        if (dependencies) {
            utils.forEach(dependencies, function(dependency) {
                instances.push(get(dependency));
            });
        }

        return instances;
    }

    return get(CONTAINER_SERVICE_NAME);
};
},{"./module":2,"./utils":4}],2:[function(require,module,exports){

"use strict";

var utils = require("./utils");

module.exports = Module;

/**
 * @param dependentModules Array of dependent modules, or a module
 * @constructor
 */
function Module(dependentModules) {
    if (!utils.isArray(dependentModules)) {
        dependentModules = dependentModules ? [dependentModules] : [];
    }

    this.dependentModules = dependentModules;
    this._services = {};
    this._decorators = {};
    this._exportNames = [];
}

Module.prototype = {
    /**
     * Registers a service with the module
     *
     * @example
     * module.factory("log", ["$window"], function($window) {
     *      // return the service instance
     *      return {
     *          debug: function(message) {
     *          }
     *     };
     * });
     *
     * var log = container.get("log");
     * log.debug("wow");
     *
     * @param name Name of the service
     * @param dependencies Array of dependent services. If none pass in null. The services will be passed in order
     * to the factory method as arguments
     * @param factory Method that is responsible for creating the service. The value returned from this method
     * will be the instance of the service
     * @returns {Module}
     * @throws Error if no name
     * @throws Error if the factory is not a function
     */
    factory: function(name, dependencies, factory) {
        utils.assert(name, "service requires a name");
        utils.assert(utils.isFunction(factory), "factory services requires a function provider");

        updateDependencyNames(name, dependencies);

        this._services[name] = {dependencies: dependencies, value: factory};
        return this;
    },

    /**
     * Helper method that registers one Type/Class instance as a service (singleton)
     *
     * @example
     * var Log = function($window) {
     * };
     * Log.prototype = {
     *      debug: function(message) {
     *      };
     * };
     *
     * module.type("log", ["$window"], Log);
     *
     * var log = container.get("log");
     * log.debug("wow");
     *
     * @param name Name of the service
     * @param dependencies Array of dependent services. If none pass in null. The services will be passed in order
     * to the Type constructor as arguments
     * @param Constructor Type/Class constructor
     * @returns {Module}
     */
    type: function(name, dependencies, Constructor) {
        // guess it to be a function constructor...
        utils.assert(utils.isFunction(Constructor), "factory services requires a function constructor");

        return this.factory(name, dependencies, function() {
            var instance = Object.create(Constructor.prototype);
            instance = Constructor.apply(instance, utils.argumentsToArray(arguments)) || instance;

            return instance;
        });
    },

    /**
     * Helper method that registers a Type/Class factory method. Calling the factory method will create an instance
     * of the Type/Class. Arguments passed to the factory method will be passed to the constructor along with dependent
     * services.
     *
     * @example
     * var Log = function($window, name) {
     * };
     * Log.prototype = {
     *      debug: function(message) {
     *      };
     * };
     *
     * module.typeFactory("logFactory", ["$window"], Log);
     *
     * var logFactory = container.get("logFactory");
     * var coreLog = logFactory("core");
     * coreLog.debug("wow");
     *
     * @param name Name of the service
     * @param dependencies Array of dependent services. If none pass in null. The services will be passed in order
     * to the Type constructor as arguments
     * @param Constructor Type/Class constructor
     * @returns {Module}
     * @throws Error if Type is not a function constructor
     */
    typeFactory: function(name, dependencies, Constructor) {
        // guess it to be a function constructor...
        utils.assert(utils.isFunction(Constructor), "factory services requires a function constructor");

        return this.factory(name, dependencies, function() {
            var factoryArgs = utils.argumentsToArray(arguments);
            return function() {
                var instance = Object.create(Constructor.prototype);
                instance = Constructor.apply(instance, factoryArgs.concat(utils.argumentsToArray(arguments))) || instance;

                return instance;
            };
        });
    },

    /**
     * Helper method that registers the value as a service. The value can be anything: object, string, Type/Class, etc.
     *
     * @example
     * module.config("settings", {
     *      apiUrl: "www.test.com/api",
     *      imageUrl: "www.test.com/images
     * });
     *
     * @param name Name of the service
     * @param value The service
     * @returns {Module}
     */
    value: function(name, value) {
        return this.factory(name, null, function() {
            return value;
        });
    },

    /**
     * Registers a service decorator. A decorator is used to modify or enhance a service before it is instantiated.
     * A general use case would be to modify or enhance a service provided by some other module.
     *
     * @example
     * module.factory("log", ["$window"], function() {
     *      return {
     *          debug: function(message) {
     *          }
     *     };
     * });
     *
     * module.decorator("log", ["utils"], function(log, utils) {
     *      var debug = log.debug;
     *      // Enhance the log debug method by including "[DEBUG]:" with each message
     *      log.debug = function(message) {
     *          message =  "[DEBUG]: " + message;
     *          debug.call(this, message);
     *      };
     *
     *      return log;
     * }
     *
     * var log = container.get("log");
     * log.debug("wow"); // outputs [DEBUG]: wow
     *
     * @param name The name of the service to decorate
     * @param dependencies Array of dependent services
     * @param decorator Method that returns the decorated service. The service will be passed as the first argument,
     * dependent services will be passed starting from the second argument onwards
     * @returns {Module}
     * @throws Error if no name
     * @throws Error if decorator is not a method
     */
    decorator: function(name, dependencies, decorator) {
        utils.assert(name,  "decorator service requires a name");
        utils.assert(utils.isFunction(decorator), "decorator service requires a function provider");

        updateDependencyNames(name, dependencies);

        this._decorators[name] = {dependencies: dependencies, value: decorator};
        return this;
    },

    /**
     * Registers a configuration for a service. Each service can have one configuration. The configuration can be accessed
     * by the service as a dependency named "$config".
     *
     * @example
     * module.config("log", {enabled: true});
     *
     * The configuration can then be accessed by the service:
     *
     * @example
     * module.factory("log", ["$config"], function($config) {
     *     var enabled = $config.enabled; // true
     * });
     *
     * This method is simply a wrapper for registering a service named "config.<service name>". If your configuration
     * has dependencies then you can register the configuration as:
     *
     * @example
     * module.factory("config.log", ["logConsole"], function(logConsole) {
     *      return {
     *          enabled: true,
     *          targets: [logConsole]
     *      };
     * });
     *
     * @param name The name of the service to configure
     * @param config The configuration for the service. The configuration can be anything: Object, String, Array, etc.
     * @returns {Module}
     * @throws Error if no name
     */
    config: function(name, config) {
        utils.assert(name, "config service requires a name");

        return this.value("config." + name , config);
    },

    /**
     * Configure services that are exported (public) by the module. Public services are usable in other modules that
     * use this module as a dependent module. Private services can only be used within the module.
     *
     * This is useful if you have services that you don't want to make public outside of the module, and to avoid having
     * to worry about name collisions with other modules. A private service name is unique to the module, multiple modules
     * can have private services with the same names. A public service name is unique to the container, there can only
     * be one public service with a name.
     *
     * By default all services are exported in a module
     *
     * @param names Array of service names to export. If null or an empty array is provided then all services are
     * exported
     */
    exports: function(names) {
        this._exportNames = names;
    },

    /**
     * @returns {{services: *, decorators: *}} Arrays of public services and decorators
     */
    exported: function() {
        var exportedServices = utils.extend({}, this._services);
        var exportedDecorators = utils.extend({}, this._decorators);

        // Create pseudo private services, they are still public; however,
        // there is no reasonable way to access these services outside of the module
        if (this._exportNames && 0 < this._exportNames.length) {
            var names = privateNames(this._services, this._exportNames);

            utils.forEach(names, function(name) {
                updateNameForExport(name, exportedServices, exportedDecorators);
            });
        }

        return {
            services: exportedServices,
            decorators: exportedDecorators
        };
    }
};

function updateDependencyNames(name, dependencies) {
    utils.forEach(dependencies, function(dependency, index) {
        if (0 === dependency.indexOf("$config")) {
            dependencies[index] = "config." + name;
        }
    });
}

function privateNames(services, exportNames) {
    var allNames = [];
    utils.forEach(services, function(service, name) {
        allNames.push(name);
    });

    // Sanity check to ensure all export names map to a service
    // (exports can't include dependent module services)
    utils.forEach(exportNames, function(exportName) {
        if (-1 === allNames.indexOf(exportName)) {
            utils.assert(false, "export name {0} doesn't map to a service", exportName);
        }
    });

    return allNames.filter(function(name) {
        var isConfigForExported = false;
        if (0 === name.indexOf("config.")) {
            var serviceName = name.slice("config.".length);
            isConfigForExported = 0 <= exportNames.indexOf(serviceName);
        }

        return !isConfigForExported && 0 > exportNames.indexOf(name);
    });
}

function updateNameForExport(oldName, exportedServices, exportedDecorators) {
    var newName = utils.generateUUID();

    var service = exportedServices[oldName];
    if (service) {
        delete exportedServices[oldName];
        exportedServices[newName] = service;
    }

    var decorator = exportedDecorators[oldName];
    if (decorator) {
        delete exportedDecorators[oldName];
        exportedDecorators[newName] = decorator;
    }

    utils.forEach(exportedServices, function(service, key) {
        var cloned = updateDependencies(service);
        if (cloned) {
            exportedServices[key] = cloned;
        }
    });

    utils.forEach(exportedDecorators, function(decorator, key) {
        var cloned = updateDependencies(decorator);
        if (cloned) {
            exportedDecorators[key] = cloned;
        }
    });

    function updateDependencies(item) {
        var cloned = null;

        // Clone the service/decorator in this case since the new private name
        // is tied to the export. We don't want the dependencies altered for
        // further exports
        utils.forEach(item.dependencies, function(dependency, index) {
            if (dependency == oldName) {
                cloned = {};
                cloned.dependencies = utils.clone(item.dependencies);
                cloned.name = item.name;
                cloned.value = item.value;
                cloned.type = item.type;

                cloned.dependencies[index] = newName;

                return false;
            }
        });

        return cloned;
    }
}
},{"./utils":4}],3:[function(require,module,exports){
"use strict";

module.exports.Module = require("./module");
module.exports.Container = require("./container");
module.exports.VERSION = "0.1.5";
},{"./container":1,"./module":2}],4:[function(require,module,exports){
"use strict";

function forEach(obj, iterator, context) {
    if (!obj) {
        return obj;
    }

    var index;

    if (obj.forEach && obj.forEach === Object.forEach) {
        obj.forEach(iterator, context);
    }
    else if (isArray(obj)) {
        for (index = 0; index < obj.length; index++) {
            if (false === iterator.call(context, obj[index], index, obj)) {
                break;
            }
        }
    }
    else {
        var keys = Object.keys(obj);
        for (index = 0; index < keys.length; index++) {
            var key = keys[index];
            if (false === iterator.call(context, obj[key], key, obj)) {
                break;
            }
        }
    }

    return obj;
}

function extend(dest, src) {
    if (!dest || !src) {
        return dest;
    }

    for (var key in src) {
        dest[key] = src[key];
    }

    return dest;
}

function clone(object) {
    if (!isObject(object)) {
        return object;
    }

    return isArray(object) ? object.slice() : extend({}, object);
}

function isArray(value) {
    return value instanceof Array;
}

function isFunction(value) {
    return "[object Function]" === Object.prototype.toString.call(value);
}

function isObject(value) {
    return value === Object(value) || isFunction(value);
}

function assert(condition, message) {
    if (!!condition) {
        return;
    }

    Array.prototype.shift.apply(arguments);
    message = format.apply(null, arguments) || "";

    throw new Error(message);
}

function argumentsToArray(args, sliceCount) {
    if (undefined === sliceCount) {
        sliceCount = 0;
    }

    return sliceCount < args.length ? Array.prototype.slice.call(args, sliceCount) : [];
}

function format(value) {
    if (!value) {
        return null;
    }

    var args = argumentsToArray(arguments, 1);
    return value.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}

// RFC4122 version 4 compliant
function generateUUID() {
    // http://stackoverflow.com/a/8809472
    var now = Date.now();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(character) {
        // jshint bitwise: false
        var random = (now + Math.random()*16)%16 | 0;
        now = Math.floor(now/16);
        // jshint bitwise: false
        return (character=='x' ? random : (random&0x3|0x8)).toString(16);
    });

    return uuid;
}

module.exports = {
    forEach: forEach,
    extend: extend,
    clone: clone,
    isArray: isArray,
    isFunction: isFunction,
    isObject: isObject,
    assert: assert,
    argumentsToArray: argumentsToArray,
    format: format,
    generateUUID: generateUUID
};
},{}]},{},[3])(3)
});