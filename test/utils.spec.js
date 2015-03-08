describe("utils", function() {
    "use strict";

    var utils = require("../src/utils");

    describe("forEach", function(){
        it("should iterate items in array", function(){
            var array = [1,2,3];
            var items = [];
            var indices = [];

            utils.forEach(array, function(item, index, iterated) {
                items.push(item);
                indices.push(index);

                expect(array).toBe(iterated);
            });

            expect(array).toEqual(items);
            expect(indices).toEqual([0,1,2]);
        });

        it("should iterate keys in object", function(){
            var obj = {"a": 1, "b": 2, "c": null};
            var keys = [];
            var values = [];

            utils.forEach(obj, function(value, key, iterated){
                values.push(value);
                keys.push(key);

                expect(obj).toBe(iterated);
            });

            expect(keys).toEqual(["a", "b", "c"]);
            expect(values).toEqual([1,2, null]);
        });

        it("should break from iteration of an array", function(){
            var array = [1,2,3];
            var items = [];

            utils.forEach(array, function(item) {
                items.push(item);
                return false;
            });

            expect(items).toEqual([1]);
        });

        it("should break from iteration of an object", function(){
            var obj = {"a": 1, "b": 2, "c": null};
            var values = [];

            utils.forEach(obj, function(value) {
                values.push(value);
                return false;
            });

            expect(values).toEqual([1]);
        });

        it("should return obj", function() {
            var obj = {};
            expect(utils.forEach(obj, function(){})).toBe(obj);
        });

        it("should not throw error for null object", function(){
            utils.forEach(null);
        });

        it("should not throw error for undefined object", function() {
            utils.forEach(undefined);
        });

        it("should throw error for null iterator", function() {
            expect(function() {
                utils.forEach({a: 1, b: 2}, null);
            }).toThrow();
        });

        it("should throw error for undefined iterator", function() {
            expect(function() {
                utils.forEach({a: 1, b: 2}, undefined);
            }).toThrow();
        });
    });

    describe("extend", function(){
        it("should extend existing object with set of properties", function(){
            var a = {a:1, b:2};
            var b = {c:3};

            utils.extend(a, b);
            expect(a).toEqual({a:1, b:2, c:3});
        });

        it("should override existing properties", function(){
            var a = {a:1, b:2};
            var b = {a:4, c:3};

            utils.extend(a, b);
            expect(a).toEqual({a:4, b:2, c:3});
        });

        it("should not create a new object", function(){
            var a = {a:1, b:2};
            var b = {c:3};

            var c = utils.extend(a, b);
            expect(a).toBe(c);
        });

        it("should not throw an error for null/undefined", function(){
            utils.extend();
            utils.extend({});
        });

        it("extending null/undefined returns null/undefined", function(){
            var result = utils.extend();
            expect(result).toBe(undefined);

            result = utils.extend(null);
            expect(result).toBe(null);
        });
    });

    describe("clone", function(){
        var cloned;

        it("should shallow clone an array", function(){
            var array = [1, "2", 3];
            cloned = utils.clone(array);

            expect(cloned).toEqual([1, "2", 3]);
            expect(cloned).not.toBe(array);
        });

        it("should shallow clone an object", function(){
            var obj = {a: 1, b: "2", c:3};
            cloned = utils.clone(obj);

            expect(cloned).toEqual({a:1, b:"2", c:3});
            expect(cloned).not.toBe(obj);
        });

        it("changes to shallow attributes should not affect the original", function(){
            var obj = {a: 1};
            cloned = utils.clone(obj);

            cloned.a = 2;
            expect(obj.a).toEqual(1);
        });

        it("changes to deep attributes are shared", function(){
            var obj = {a: [1,2]};
            cloned = utils.clone(obj);

            cloned.a.push(3);
            expect(cloned.a).toEqual([1,2,3]);
            expect(cloned.a).toEqual([1,2,3]);
            expect(cloned.a).toBe(cloned.a);
        });

        it("should not throw an error for null/undefined", function(){
            utils.clone();
        });
    });

    describe("isArray", function() {
        var array;

        it("should detect empty array", function() {
            array = [];
            expect(utils.isArray(array)).toEqual(true);
        });

        it("should detect array with items", function() {
            array = [1, 2];
            expect(utils.isArray(array)).toEqual(true);
        });

        it("should detect new Array()", function() {
            array = new Array(); // jshint ignore:line
            expect(utils.isArray(array)).toEqual(true);
        });

        it("should not detect undefined", function() {
            expect(utils.isArray(undefined)).toEqual(false);
        });

        it("should not detect function arguments", function(){
            function test(){
                expect(utils.isArray(arguments)).toEqual(false);
            }

            test();
        });
    });

    describe("isFunction", function() {
        it("should detect functions", function(){
            expect(utils.isFunction(describe)).toEqual(true);
        });

        it("should detect anonymous function", function() {
            expect(utils.isFunction(function(){})).toEqual(true);
        });

        it("should not detect undefined", function() {
            expect(utils.isFunction(undefined)).toEqual(false);
        });

        it("should not detect arrays", function(){
            expect(utils.isFunction([1,2])).toEqual(false);
        });

        it("should not detect strings", function(){
            expect(utils.isFunction("sebastien")).toEqual(false);
        });
    });

    describe("isObject", function() {
        var object;

        it("should detect {}", function() {
            object = {};
            expect(utils.isObject(object)).toEqual(true);
        });

        it("should detect new Object()", function() {
            object = new Object(); // jshint ignore:line
            expect(utils.isObject(object)).toEqual(true);
        });

        it("should detect {} with properties", function() {
            object = {name: "Sebastien"};
            expect(utils.isObject(object)).toEqual(true);
        });

        it("should detect arrays", function(){
            object = [1,2,3];
            expect(utils.isObject(object)).toEqual(true);
        });

        it("should detect function arguments", function(){
            function test(){
                expect(utils.isObject(arguments)).toEqual(true);
            }

            test();
        });

        it("should detect functions", function(){
            object = function(){};
            expect(utils.isObject(object)).toEqual(true);
        });

        it("should not detect undefined", function() {
            expect(utils.isObject(undefined)).toEqual(false);
        });

        it("should not detect null", function(){
            expect(utils.isObject(null)).toEqual(false);
        });

        it("should not detect literal string", function(){
            expect(utils.isObject("sebastien")).toEqual(false);
        });

        it("should detect new String()", function(){
            expect(utils.isObject(new String("sebastien"))).toEqual(true); // jshint ignore:line
        });

        it("should not detect number", function(){
            expect(utils.isObject(1)).toEqual(false);
        });

        it("should not detect boolean", function(){
            expect(utils.isObject(true)).toEqual(false);
        });
    });

    describe("assert", function(){
        it("should throw for false", function(){
            expect(function(){
                utils.assert(false);
            }).toThrow();
        });

        it("should throw for null", function(){
            expect(function(){
                utils.assert(null);
            }).toThrow();
        });

        it("should throw for undefined", function(){
            expect(function(){
                utils.assert(undefined);
            }).toThrow();
        });

        it("should throw for 0", function(){
            expect(function(){
                utils.assert(0);
            }).toThrow();
        });

        it("should throw for an empty string", function(){
            expect(function(){
                utils.assert("");
            }).toThrow();
        });

        it("should not throw for true", function(){
            utils.assert(true);
        });

        it("should not throw for an object", function(){
            utils.assert({a:1});
        });

        it("should not throw for an empty object", function(){
            utils.assert({});
        });

        it("should throw an error", function(){
            expect(function(){
                utils.assert(false);
            }).toThrow(new Error(""));
        });

        it("should include message", function(){
            expect(function(){
                utils.assert(false, "message");
            }).toThrow(new Error("message"));
        });

        it("should format message", function(){
            expect(function(){
                utils.assert(false, "message: {0} {1}", "a", 1);
            }).toThrow(new Error("message: a 1"));
        });
    });

    describe("argumentsToArray", function(){
        var array;
        function test(){
            array = utils.argumentsToArray(arguments);
        }

        beforeEach(function(){
            array = null;
        });

        it("should convert empty arguments", function(){
            test();
            expect(array).toEqual([]);
        });

        it("should convert non empty arguments", function(){
            test("a", "b");
            expect(array).toEqual(["a", "b"]);
        });

        it("should convert non empty arguments", function(){
            function testSliceFirst(){
                array = utils.argumentsToArray(arguments, 1);
            }

            testSliceFirst("a", "b");
            expect(array).toEqual(["b"]);
        });
    });

    describe("format", function(){
        it("should format single argument", function(){
            expect(utils.format("test {0}", "wow")).toEqual("test wow");
        });

        it("should format multiple arguments", function(){
            expect(utils.format("test {0}:{1}", "wow", 1)).toEqual("test wow:1");
        });

        it("should format out of order", function(){
            expect(utils.format("test {1}:{0}", "wow", 1)).toEqual("test 1:wow");
        });

        it("should do nothing if doesn't include format identifiers", function(){
            expect(utils.format("test")).toEqual("test");
        });

        it("should return same string if no values provides", function(){
            expect(utils.format("test {0}:{1}")).toEqual("test {0}:{1}");
        });

        it("should not replace for invalid indices", function(){
            expect(utils.format("test {5}", "wow")).toEqual("test {5}");
        });

        it("should return null for null", function(){
            expect(utils.format(null)).toEqual(null);
        });

        it("should return null for undefined", function(){
            expect(utils.format()).toEqual(null);
        });
    });

    describe("generateUUID", function(){
        it("should have form 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'", function(){
            expect(utils.generateUUID()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/);
        });

        // Not much of a test :)
        it("should not produce identical UUIDs", function(){
            var a = utils.generateUUID();
            var b = utils.generateUUID();

            expect(a).not.toEqual(b);
        });
    });
});