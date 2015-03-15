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