/*!
di.js - v0.1.0
Created by Sebastien Couture on 2015-03-08.

git://github.com/sebastiencouture/di.git

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

    function load() {
        utils.forEach(services, function(service, name){
            get(name);
        });
    }

    function invoke(dependencies, method, context) {
        var dependencyInstances = getDependencyInstances(dependencies);
        return method.apply(context, dependencyInstances);
    }

    var resolving = [];

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
},{"./module":3,"./utils":4}],2:[function(require,module,exports){
"use strict";

module.exports.Module = require("./module");
module.exports.Container = require("./container");
module.exports.VERSION = "0.1.0";
},{"./container":1,"./module":3}],3:[function(require,module,exports){

"use strict";

var utils = require("./utils");

module.exports = Module;

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
    exports: function(names) {
        this._exportNames = names;
    },

    factory: function(name, dependencies, factory) {
        utils.assert(name, "service requires a name");
        utils.assert(utils.isFunction(factory), "factory services requires a function provider");

        updateDependencyNames(name, dependencies);

        this._services[name] = {dependencies: dependencies, value: factory};
        return this;
    },

    type: function(name, dependencies, Type) {
        // guess it to be a function constructor...
        utils.assert(utils.isFunction(Type), "factory services requires a function constructor");

        return this.factory(name, dependencies, function() {
            var instance = Object.create(Type.prototype);
            instance = Type.apply(instance, utils.argumentsToArray(arguments)) || instance;

            return instance;
        });
    },

    typeFactory: function(name, dependencies, Type) {
        // guess it to be a function constructor...
        utils.assert(utils.isFunction(Type), "factory services requires a function constructor");

        return this.factory(name, dependencies, function() {
            var factoryArgs = utils.argumentsToArray(arguments);
            return function() {
                var instance = Object.create(Type.prototype);
                instance = Type.apply(instance, factoryArgs.concat(utils.argumentsToArray(arguments))) || instance;

                return instance;
            };
        });
    },

    value: function(name, value) {
        return this.factory(name, null, function() {
            return value;
        });
    },

    decorator: function(name, dependencies, decorator) {
        utils.assert(name,  "decorator service requires a name");
        utils.assert(utils.isFunction(decorator), "decorator service requires a function provider");

        updateDependencyNames(name, dependencies);

        this._decorators[name] = {dependencies: dependencies, value: decorator};
        return this;
    },

    config: function(name, config) {
        utils.assert(name, "config service requires a name");

        return this.value("config." + name , config);
    },

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
},{"./utils":4}],4:[function(require,module,exports){
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
},{}]},{},[2])(2)
});