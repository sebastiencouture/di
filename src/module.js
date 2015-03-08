
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