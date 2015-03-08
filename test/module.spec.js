describe("Module", function() {
    "use strict";

    var Module = require("../src/module");

    var moduleA;
    var moduleB;

    beforeEach(function(){
        moduleA = new Module();
        moduleB = new Module(moduleA);
    });

    describe("factory", function() {
        it("should create a service", function() {
            function factory(){
            }

            moduleA.factory("a", null, factory);
            var service = moduleA.exported().services.a;
            expect(service).toEqual({dependencies: null, value: factory});
        });

        it("should require a name", function(){
            expect(function(){
                moduleA.factory();
            }).toThrow();
        });

        it("should require a provider function", function(){
            expect(function(){
                moduleA.factory("a", null, 1);
            }).toThrow();
        });

        it("should override", function(){
            function factoryA(){
            }

            function factoryB(){
            }

            moduleA.factory("a", null, factoryA);
            moduleA.factory("a", null, factoryB);

            var service = moduleA.exported().services.a;
            expect(service).toEqual({dependencies: null, value: factoryB});
        });
    });

    describe("value", function() {
        it("should create a service", function(){
            moduleA.value("a", 1);

            var service = moduleA.exported().services.a;
            expect(service).toBeDefined();
        });

        it("should require a name", function() {
            expect(function(){
                moduleA.value();
            }).toThrow();
        });
    });

    describe("type", function() {
        it("should create a service", function() {
            function Type(){
            }

            moduleA.type("a", null, Type);
            var service = moduleA.exported().services.a;
            expect(service).toBeDefined();
        });

        it("should require a name", function(){
            expect(function(){
                moduleA.type();
            }).toThrow();
        });

        it("should require a provider function", function(){
            expect(function(){
                moduleA.type("a", null, 1);
            }).toThrow();
        });
    });

    describe("typeFactory", function(){
        it("should create a service", function() {
            function Type(){
            }

            moduleA.typeFactory("a", null, Type);
            var service = moduleA.exported().services.a;
            expect(service).toBeDefined();
        });

        it("should require a name", function(){
            expect(function(){
                moduleA.typeFactory();
            }).toThrow();
        });

        it("should require a provider function", function(){
            expect(function(){
                moduleA.typeFactory("a", null, 1);
            }).toThrow();
        });
    });

    describe("config", function(){
        it("should create a service", function(){
            moduleA.config("a", 1);

            var service = moduleA.exported().services["config.a"];
            expect(service).toBeDefined();
        });

        it("should prefix name with 'config.'", function(){
            moduleA.config("a", 1);

            var services = moduleA.exported().services;

            expect(services["config.a"]).toBeDefined();
            expect(services.a).not.toBeDefined();
        });

        it("should require a name", function() {
            expect(function(){
                moduleA.config();
            }).toThrow();
        });
    });

    describe("decorator", function(){
        it("should create a decorator", function() {
            function decorator(){
            }

            moduleA.decorator("a", null, decorator);
            var service = moduleA.exported().decorators.a;
            expect(service).toEqual({dependencies: null, value: decorator});
        });

        it("should require a name", function(){
            expect(function(){
                moduleA.decorator();
            }).toThrow();
        });

        it("should require a provider function", function(){
            expect(function(){
                moduleA.decorator("a", null, 1);
            }).toThrow();
        });

        it("should override", function(){
            function decoratorA(){
            }

            function decoratorB(){
            }

            moduleA.decorator("a", null, decoratorA);
            moduleA.decorator("a", null, decoratorB);

            var service = moduleA.exported().decorators.a;
            expect(service).toEqual({dependencies: null, value: decoratorB});
        });
    });

    describe("export", function(){
        it("should export services", function(){
            moduleA.value("valueA", 1);

            var services = moduleA.exported().services;
            expect(services.valueA).toBeDefined();
        });

        it("should export decorators", function(){
            moduleA.decorator("decoratorA", null, function(){});

            var decorators = moduleA.exported().decorators;
            expect(decorators.decoratorA).toBeDefined();
        });

        it("should only export public services", function(){
            moduleA.value("a", 1);
            moduleA.value("b", 2);

            moduleA.exports(["a"]);

            var services = moduleA.exported().services;

            expect(services.a).toBeDefined();
            expect(services.b).not.toBeDefined();
        });

        it("should only export public decorators", function(){
            moduleA.value("a", 1);
            moduleA.value("b", 2);
            moduleA.decorator("a", null, function(){});
            moduleA.decorator("b", null, function(){});

            moduleA.exports(["a"]);

            var decorators = moduleA.exported().decorators;

            expect(decorators.a).toBeDefined();
            expect(decorators.b).not.toBeDefined();
        });

        it("should export configs for exported services", function() {
            moduleA.value("a", 1);
            moduleA.config("a", {});

            moduleA.exports(["a"]);

            var services = moduleA.exported().services;
            expect(services.a).toBeDefined();
            expect(services["config.a"]).toBeDefined();
        });
    });

    it("should enable chaining", function() {
        moduleA.factory("a", null, function(){}).
            value("b", {}).
            type("c", null, function(){}).
            typeFactory("d", null, function(){}).
            config("e", {}).
            decorator("e", null, function(){});
    });
});