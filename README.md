DI.js
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

```

### Registering Services

### Creating Module

### Creating Container

## Installation

The library is written with CommonJS modules. If you are using Browserify, Webpack, or similar you can consume it like
anything else installed from npm or bower.

There is also a global UMD compliant build available in the `dist` folder. The build is created with Browserify. The library registers on `window.di`.

## Browser Support

IE 9+. IE6+ support is available using an ES5 polyfill such as [ES5-Shim](https://github.com/es-shims/es5-shim)

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