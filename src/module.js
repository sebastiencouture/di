
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