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