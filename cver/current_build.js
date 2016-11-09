// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_WEB = typeof window === 'object';
// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  if (!Module['thisProgram']) {
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    } else {
      Module['thisProgram'] = 'unknown-program';
    }
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WORKER) {
    Module['load'] = importScripts;
  }

  if (typeof Module['setWindowTitle'] === 'undefined') {
    Module['setWindowTitle'] = function(title) { document.title = title };
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in: 
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at: 
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  prepVararg: function (ptr, type) {
    if (type === 'double' || type === 'i64') {
      // move so the load is aligned
      if (ptr & 7) {
        assert((ptr & 7) === 4);
        ptr += 4;
      }
    } else {
      assert((ptr & 3) === 0);
    }
    return ptr;
  },
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      sigCache[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+15)&-16); if (DYNAMICTOP >= TOTAL_MEMORY) { var success = enlargeMemory(); if (!success) { DYNAMICTOP = ret;  return 0; } }; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



Module["Runtime"] = Runtime;



//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try {
      func = eval('_' + ident); // explicit lookup
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var JSfuncs = {
    // Helpers for cwrap -- it can't refer to Runtime directly because it might
    // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
    // out what the minified function name is.
    'stackSave': function() {
      Runtime.stackSave()
    },
    'stackRestore': function() {
      Runtime.stackRestore()
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        ret = Runtime.stackAlloc((str.length << 2) + 1);
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. 
  ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if ((!opts || !opts.async) && typeof EmterpreterAsync === 'object') {
      assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling ccall');
    }
    if (opts && opts.async) assert(!returnType, 'async ccalls cannot return values');
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push(function() {
          Runtime.stackRestore(stack);
        });
        return;
      }
      Runtime.stackRestore(stack);
    }
    return ret;
  }

  var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }
  var JSsource = {};
  for (var fun in JSfuncs) {
    if (JSfuncs.hasOwnProperty(fun)) {
      // Elements of toCsource are arrays of three items:
      // the code, and the return value
      JSsource[fun] = parseJSFunc(JSfuncs[fun]);
    }
  }

  
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      funcstr += 'var stack = ' + JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=' + convertCode.returnValue + ';';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    funcstr += "if (typeof EmterpreterAsync === 'object') { assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling cwrap') }";
    if (!numericArgs) {
      // If we had a stack, restore it
      funcstr += JSsource['stackRestore'].body.replace('()', '(stack)') + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module["setValue"] = setValue;


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module["getValue"] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module["allocate"] = allocate;

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);
  if ((typeof _sbrk !== 'undefined' && !_sbrk.called) || !runtimeInitialized) return Runtime.dynamicAlloc(size);
  return _malloc(size);
}
Module["getMemory"] = getMemory;

function Pointer_stringify(ptr, /* optional */ length) {
  if (length === 0 || !ptr) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module['UTF8ToString'](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module["AsciiToString"] = AsciiToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

function UTF8ArrayToString(u8Array, idx) {
  var u0, u1, u2, u3, u4, u5;

  var str = '';
  while (1) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    u0 = u8Array[idx++];
    if (!u0) return str;
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    u1 = u8Array[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    u2 = u8Array[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u3 = u8Array[idx++] & 63;
      if ((u0 & 0xF8) == 0xF0) {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
      } else {
        u4 = u8Array[idx++] & 63;
        if ((u0 & 0xFC) == 0xF8) {
          u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
        } else {
          u5 = u8Array[idx++] & 63;
          u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
        }
      }
    }
    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}
Module["UTF8ToString"] = UTF8ToString;

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module["UTF16ToString"] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}
Module["stringToUTF16"] = stringToUTF16;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module["UTF32ToString"] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}
Module["stringToUTF32"] = stringToUTF32;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;

function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var buf = _malloc(func.length);
      writeStringToMemory(func.substr(1), buf);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed, we can try ours which may return a partial result
    } catch(e) {
      // failure when using libcxxabi, we can try ours which may return a partial result
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
  }
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  var parsed = func;
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    parsed = parse();
  } catch(e) {
    parsed += '?';
  }
  if (parsed.indexOf('?') >= 0 && !hasLibcxxabi) {
    Runtime.warnOnce('warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  }
  return parsed;
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;

// Memory management

var PAGE_SIZE = 4096;

function alignMemoryPage(x) {
  if (x % 4096 > 0) {
    x += (4096 - (x % 4096));
  }
  return x;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk



function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and DYNAMICTOP is the new top.
  assert(DYNAMICTOP >= TOTAL_MEMORY);
  assert(TOTAL_MEMORY > 4); // So the loop below will not be infinite

  var OLD_TOTAL_MEMORY = TOTAL_MEMORY;


  var LIMIT = Math.pow(2, 31); // 2GB is a practical maximum, as we use signed ints as pointers
                               // and JS engines seem unhappy to give us 2GB arrays currently
  if (DYNAMICTOP >= LIMIT) return false;

  while (TOTAL_MEMORY <= DYNAMICTOP) { // Simple heuristic.
    if (TOTAL_MEMORY < LIMIT/2) {
      TOTAL_MEMORY = alignMemoryPage(2*TOTAL_MEMORY); // double until 1GB
    } else {
      var last = TOTAL_MEMORY;
      TOTAL_MEMORY = alignMemoryPage((3*TOTAL_MEMORY + LIMIT)/4); // add smaller increments towards 2GB, which we cannot reach
      if (TOTAL_MEMORY <= last) return false;
    }
  }

  TOTAL_MEMORY = Math.max(TOTAL_MEMORY, 16*1024*1024);

  if (TOTAL_MEMORY >= LIMIT) return false;

  Module.printErr('Warning: Enlarging memory arrays, this is not fast! ' + [OLD_TOTAL_MEMORY, TOTAL_MEMORY]);


  var start = Date.now();

  try {
    if (ArrayBuffer.transfer) {
      buffer = ArrayBuffer.transfer(buffer, TOTAL_MEMORY);
    } else {
      var oldHEAP8 = HEAP8;
      buffer = new ArrayBuffer(TOTAL_MEMORY);
    }
  } catch(e) {
    return false;
  }

  var success = _emscripten_replace_memory(buffer);
  if (!success) return false;

  // everything worked

  Module['buffer'] = buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
  if (!ArrayBuffer.transfer) {
    HEAP8.set(oldHEAP8);
  }

  Module.printErr('enlarged memory arrays from ' + OLD_TOTAL_MEMORY + ' to ' + TOTAL_MEMORY + ', took ' + (Date.now() - start) + ' ms (has ArrayBuffer.transfer? ' + (!!ArrayBuffer.transfer) + ')');

  return true;
}

var byteLength;
try {
  byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
  byteLength(new ArrayBuffer(4)); // can fail on older ie
} catch(e) { // can fail on older node/v8
  byteLength = function(buffer) { return buffer.byteLength; };
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;

var totalMemory = 64*1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
totalMemory = Math.max(totalMemory, 16*1024*1024);
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be compliant with the asm.js spec (and given that TOTAL_STACK=' + TOTAL_STACK + ')');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer;



buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);


// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;

// Tools


function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module["intArrayToString"] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer++)>>0)]=array[i];
  }
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


if (!Math['clz32']) Math['clz32'] = function(x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & (1 << (31 - i))) return i;
  }
  return 32;
};
Math.clz32 = Math['clz32']

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module["removeRunDependency"] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;



// === Body ===

var ASM_CONSTS = [function() { window.fo_sample[0] = window.fo_sample[1] = 0; },
 function($0, $1) { { window.fo_sample[0] += $0; window.fo_sample[1] += $1; } },
 function() { window.fo_sample = [0, 0]; var audioCtx = new (window.AudioContext || window.webkitAudioContext)(), pcm_node = audioCtx.createScriptProcessor(4096, 0, 2), source = audioCtx.createBufferSource(); pcm_node.onaudioprocess = function(e) { var outbuf_l = e.outputBuffer.getChannelData(0), outbuf_r = e.outputBuffer.getChannelData(1); for(var i = 0; i < 4096; i++) { Module.ccall('doPullSample'); outbuf_r[i] = window.fo_sample[1]; outbuf_l[i] = window.fo_sample[0]; } }; source.connect(pcm_node); pcm_node.connect(audioCtx.destination); source.start(); },
 function($0) { {return window.innerWidth} },
 function($0) { {return window.innerHeight} },
 function($0, $1, $2) { { window.fo_canvas = document.createElement('canvas'); document.body.style.margin = '0px'; window.fo_canvas.width = $0; window.fo_canvas.height = $1; window.fo_buf_address = $2; window.fo_buf_size = 4 * $0 * $1; document.body.appendChild(window.fo_canvas); window.fo_context = window.fo_canvas.getContext('2d'); window.fo_canvas_data = window.fo_context.getImageData(0, 0, $0, $1); window.fo_draw = true; setInterval(function() { if(!window.fo_draw) return; window.fo_canvas_data.data.set( Module.HEAPU8.subarray( window.fo_buf_address, window.fo_buf_address + window.fo_buf_size ) ); window.fo_context.putImageData(window.fo_canvas_data, 0, 0); }, 17); } },
 function($0) { { return window.fo_mouse_x; } },
 function($0) { { return window.fo_mouse_y; } },
 function($0) { { return window.fo_button_status; } },
 function() { window.fo_button_status = 0; window.fo_mouse_x = 0; window.fo_mouse_y = 0; window.fo_canvas.onmousemove = function(e) { window.fo_mouse_x = e.clientX; window.fo_mouse_y = e.clientY; Module.ccall('doMouseCallback'); }; window.fo_canvas.onmousedown = function(e) { window.fo_button_status = 1; Module.ccall('doMouseCallback'); }; window.fo_canvas.onmouseup = function(e) { window.fo_button_status = 0; Module.ccall('doMouseCallback'); }; },
 function($0) { { window.fo_buf_address = $0; window.fo_buf_size = 4 * window.fo_canvas.width * window.fo_canvas.height; window.fo_canvas_data = window.fo_context.getImageData(0, 0, window.fo_canvas.width, window.fo_canvas.height); window.fo_draw = true; } },
 function() { window.onresize = function() { window.fo_draw = false; window.fo_canvas.width = window.innerWidth; window.fo_canvas.height = window.innerHeight; Module.ccall('doResizeCallback'); }; }];

function _emscripten_asm_const_0(code) {
 return ASM_CONSTS[code]();
}

function _emscripten_asm_const_1(code, a0) {
 return ASM_CONSTS[code](a0);
}

function _emscripten_asm_const_2(code, a0, a1) {
 return ASM_CONSTS[code](a0, a1);
}

function _emscripten_asm_const_3(code, a0, a1, a2) {
 return ASM_CONSTS[code](a0, a1, a2);
}



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 5296;
  /* global initializers */  __ATINIT__.push();
  

/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,119,105,110,100,111,119,46,102,111,95,115,97,109,112,108,101,91,48,93,32,61,32,119,105,110,100,111,119,46,102,111,95,115,97,109,112,108,101,91,49,93,32,61,32,48,59,0,123,32,119,105,110,100,111,119,46,102,111,95,115,97,109,112,108,101,91,48,93,32,43,61,32,36,48,59,32,119,105,110,100,111,119,46,102,111,95,115,97,109,112,108,101,91,49,93,32,43,61,32,36,49,59,32,125,0,119,105,110,100,111,119,46,102,111,95,115,97,109,112,108,101,32,61,32,91,48,44,32,48,93,59,32,118,97,114,32,97,117,100,105,111,67,116,120,32,61,32,110,101,119,32,40,119,105,110,100,111,119,46,65,117,100,105,111,67,111,110,116,101,120,116,32,124,124,32,119,105,110,100,111,119,46,119,101,98,107,105,116,65,117,100,105,111,67,111,110,116,101,120,116,41,40,41,44,32,112,99,109,95,110,111,100,101,32,61,32,97,117,100,105,111,67,116,120,46,99,114,101,97,116,101,83,99,114,105,112,116,80,114,111,99,101,115,115,111,114,40,52,48,57,54,44,32,48,44,32,50,41,44,32,115,111,117,114,99,101,32,61,32,97,117,100,105,111,67,116,120,46,99,114,101,97,116,101,66,117,102,102,101,114,83,111,117,114,99,101,40,41,59,32,112,99,109,95,110,111,100,101,46,111,110,97,117,100,105,111,112,114,111,99,101,115,115,32,61,32,102,117,110,99,116,105,111,110,40,101,41,32,123,32,118,97,114,32,111,117,116,98,117,102,95,108,32,61,32,101,46,111,117,116,112,117,116,66,117,102,102,101,114,46,103,101,116,67,104,97,110,110,101,108,68,97,116,97,40,48,41,44,32,111,117,116,98,117,102,95,114,32,61,32,101,46,111,117,116,112,117,116,66,117,102,102,101,114,46,103,101,116,67,104,97,110,110,101,108,68,97,116,97,40,49,41,59,32,102,111,114,40,118,97,114,32,105,32,61,32,48,59,32,105,32,60,32,52,48,57,54,59,32,105,43,43,41,32,123,32,77,111,100,117,108,101,46,99,99,97,108,108,40,39,100,111,80,117,108,108,83,97,109,112,108,101,39,41,59,32,111,117,116,98,117,102,95,114,91,105,93,32,61,32,119,105,110,100,111,119,46,102,111,95,115,97,109,112,108,101,91,49,93,59,32,111,117,116,98,117,102,95,108,91,105,93,32,61,32,119,105,110,100,111,119,46,102,111,95,115,97,109,112,108,101,91,48,93,59,32,125,32,125,59,32,115,111,117,114,99,101,46,99,111,110,110,101,99,116,40,112,99,109,95,110,111,100,101,41,59,32,112,99,109,95,110,111,100,101,46,99,111,110,110,101,99,116,40,97,117,100,105,111,67,116,120,46,100,101,115,116,105,110,97,116,105,111,110,41,59,32,115,111,117,114,99,101,46,115,116,97,114,116,40,41,59,0,123,114,101,116,117,114,110,32,119,105,110,100,111,119,46,105,110,110,101,114,87,105,100,116,104,125,0,123,114,101,116,117,114,110,32,119,105,110,100,111,119,46,105,110,110,101,114,72,101,105,103,104,116,125,0,123,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,32,61,32,100,111,99,117,109,101,110,116,46,99,114,101,97,116,101,69,108,101,109,101,110,116,40,39,99,97,110,118,97,115,39,41,59,32,100,111,99,117,109,101,110,116,46,98,111,100,121,46,115,116,121,108,101,46,109,97,114,103,105,110,32,61,32,39,48,112,120,39,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,119,105,100,116,104,32,61,32,36,48,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,104,101,105,103,104,116,32,61,32,36,49,59,32,119,105,110,100,111,119,46,102,111,95,98,117,102,95,97,100,100,114,101,115,115,32,61,32,36,50,59,32,119,105,110,100,111,119,46,102,111,95,98,117,102,95,115,105,122,101,32,61,32,52,32,42,32,36,48,32,42,32,36,49,59,32,100,111,99,117,109,101,110,116,46,98,111,100,121,46,97,112,112,101,110,100,67,104,105,108,100,40,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,41,59,32,119,105,110,100,111,119,46,102,111,95,99,111,110,116,101,120,116,32,61,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,103,101,116,67,111,110,116,101,120,116,40,39,50,100,39,41,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,95,100,97,116,97,32,61,32,119,105,110,100,111,119,46,102,111,95,99,111,110,116,101,120,116,46,103,101,116,73,109,97,103,101,68,97,116,97,40,48,44,32,48,44,32,36,48,44,32,36,49,41,59,32,119,105,110,100,111,119,46,102,111,95,100,114,97,119,32,61,32,116,114,117,101,59,32,115,101,116,73,110,116,101,114,118,97,108,40,102,117,110,99,116,105,111,110,40,41,32,123,32,105,102,40,33,119,105,110,100,111,119,46,102,111,95,100,114,97,119,41,32,114,101,116,117,114,110,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,95,100,97,116,97,46,100,97,116,97,46,115,101,116,40,32,77,111,100,117,108,101,46,72,69,65,80,85,56,46,115,117,98,97,114,114,97,121,40,32,119,105,110,100,111,119,46,102,111,95,98,117,102,95,97,100,100,114,101,115,115,44,32,119,105,110,100,111,119,46,102,111,95,98,117,102,95,97,100,100,114,101,115,115,32,43,32,119,105,110,100,111,119,46,102,111,95,98,117,102,95,115,105,122,101,32,41,32,41,59,32,119,105,110,100,111,119,46,102,111,95,99,111,110,116,101,120,116,46,112,117,116,73,109,97,103,101,68,97,116,97,40,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,95,100,97,116,97,44,32,48,44,32,48,41,59,32,125,44,32,49,55,41,59,32,125,0,123,32,114,101,116,117,114,110,32,119,105,110,100,111,119,46,102,111,95,109,111,117,115,101,95,120,59,32,125,0,123,32,114,101,116,117,114,110,32,119,105,110,100,111,119,46,102,111,95,109,111,117,115,101,95,121,59,32,125,0,123,32,114,101,116,117,114,110,32,119,105,110,100,111,119,46,102,111,95,98,117,116,116,111,110,95,115,116,97,116,117,115,59,32,125,0,119,105,110,100,111,119,46,102,111,95,98,117,116,116,111,110,95,115,116,97,116,117,115,32,61,32,48,59,32,119,105,110,100,111,119,46,102,111,95,109,111,117,115,101,95,120,32,61,32,48,59,32,119,105,110,100,111,119,46,102,111,95,109,111,117,115,101,95,121,32,61,32,48,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,111,110,109,111,117,115,101,109,111,118,101,32,61,32,102,117,110,99,116,105,111,110,40,101,41,32,123,32,119,105,110,100,111,119,46,102,111,95,109,111,117,115,101,95,120,32,61,32,101,46,99,108,105,101,110,116,88,59,32,119,105,110,100,111,119,46,102,111,95,109,111,117,115,101,95,121,32,61,32,101,46,99,108,105,101,110,116,89,59,32,77,111,100,117,108,101,46,99,99,97,108,108,40,39,100,111,77,111,117,115,101,67,97,108,108,98,97,99,107,39,41,59,32,125,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,111,110,109,111,117,115,101,100,111,119,110,32,61,32,102,117,110,99,116,105,111,110,40,101,41,32,123,32,119,105,110,100,111,119,46,102,111,95,98,117,116,116,111,110,95,115,116,97,116,117,115,32,61,32,49,59,32,77,111,100,117,108,101,46,99,99,97,108,108,40,39,100,111,77,111,117,115,101,67,97,108,108,98,97,99,107,39,41,59,32,125,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,111,110,109,111,117,115,101,117,112,32,61,32,102,117,110,99,116,105,111,110,40,101,41,32,123,32,119,105,110,100,111,119,46,102,111,95,98,117,116,116,111,110,95,115,116,97,116,117,115,32,61,32,48,59,32,77,111,100,117,108,101,46,99,99,97,108,108,40,39,100,111,77,111,117,115,101,67,97,108,108,98,97,99,107,39,41,59,32,125,59,0,123,32,119,105,110,100,111,119,46,102,111,95,98,117,102,95,97,100,100,114,101,115,115,32,61,32,36,48,59,32,119,105,110,100,111,119,46,102,111,95,98,117,102,95,115,105,122,101,32,61,32,52,32,42,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,119,105,100,116,104,32,42,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,104,101,105,103,104,116,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,95,100,97,116,97,32,61,32,119,105,110,100,111,119,46,102,111,95,99,111,110,116,101,120,116,46,103,101,116,73,109,97,103,101,68,97,116,97,40,48,44,32,48,44,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,119,105,100,116,104,44,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,104,101,105,103,104,116,41,59,32,119,105,110,100,111,119,46,102,111,95,100,114,97,119,32,61,32,116,114,117,101,59,32,125,0,119,105,110,100,111,119,46,111,110,114,101,115,105,122,101,32,61,32,102,117,110,99,116,105,111,110,40,41,32,123,32,119,105,110,100,111,119,46,102,111,95,100,114,97,119,32,61,32,102,97,108,115,101,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,119,105,100,116,104,32,61,32,119,105,110,100,111,119,46,105,110,110,101,114,87,105,100,116,104,59,32,119,105,110,100,111,119,46,102,111,95,99,97,110,118,97,115,46,104,101,105,103,104,116,32,61,32,119,105,110,100,111,119,46,105,110,110,101,114,72,101,105,103,104,116,59,32,77,111,100,117,108,101,46,99,99,97,108,108,40,39,100,111,82,101,115,105,122,101,67,97,108,108,98,97,99,107,39,41,59,32,125,59,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,36,0,0,0,0,16,8,32,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,36,0,8,0,0,16,16,16,84,0,0,0,0,4,56,8,60,126,4,62,60,126,24,60,0,0,0,0,0,24,0,24,112,60,120,126,126,60,66,124,126,68,64,65,66,60,124,60,124,60,127,66,66,65,66,68,126,28,64,56,16,0,48,0,64,0,2,0,0,0,64,0,0,32,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,36,18,28,64,24,16,16,16,56,0,0,0,0,4,76,24,66,2,12,32,66,2,36,66,16,0,0,0,0,36,56,36,72,66,68,64,64,66,66,16,4,68,64,99,98,66,66,66,66,66,8,66,66,65,66,68,2,16,64,8,40,0,16,0,64,0,2,0,12,0,64,0,0,32,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,72,18,42,162,32,16,32,8,40,16,0,0,0,8,76,40,66,4,20,64,64,4,36,66,16,16,2,0,64,66,68,66,68,64,66,64,64,64,66,16,4,72,64,99,98,66,66,66,66,64,8,66,66,65,36,68,2,16,32,8,68,0,0,0,64,0,2,0,18,0,64,16,4,32,16,0,0,0,0,0,0,0,16,0,0,0,0,0,0,8,8,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,127,40,164,16,0,32,8,40,16,0,0,0,8,76,8,2,24,36,64,64,8,24,66,0,0,12,126,48,2,130,66,68,64,66,64,64,64,66,16,4,80,64,85,82,66,66,66,66,32,8,66,66,65,36,68,4,16,32,8,0,0,0,56,64,0,2,0,16,30,64,0,0,32,16,84,44,60,92,60,44,28,62,36,34,68,66,36,62,16,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,36,24,72,32,0,32,8,0,124,0,126,0,16,84,8,2,4,68,124,92,8,36,62,0,0,48,0,12,4,146,66,120,64,66,124,124,64,66,16,4,96,64,85,82,66,124,66,124,24,8,66,66,73,24,40,8,16,16,8,0,0,0,4,92,60,58,60,16,34,64,0,4,34,16,42,18,66,34,68,18,34,16,36,34,68,34,36,2,32,8,4,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,36,12,16,82,0,32,8,0,16,0,0,0,16,84,8,4,2,68,2,98,16,66,2,0,0,64,0,2,8,170,126,68,64,66,64,64,78,126,16,4,80,64,73,74,66,64,66,80,4,8,66,66,73,24,16,16,16,16,8,0,0,0,60,98,66,70,66,60,34,92,16,4,44,16,42,18,66,34,68,16,32,16,36,34,84,36,36,4,16,8,8,76,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,254,10,34,74,0,32,8,0,16,0,0,0,32,84,8,8,2,126,2,66,16,66,2,16,16,48,126,12,16,170,66,66,64,66,64,64,66,66,16,68,72,64,73,74,66,64,66,76,2,8,66,36,73,36,16,32,16,8,8,0,0,0,68,66,64,66,126,16,30,98,16,4,48,16,42,18,66,50,60,16,28,16,36,34,84,24,28,8,8,8,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,10,69,68,0,32,8,0,0,0,0,0,32,100,8,16,2,4,66,66,16,66,2,16,16,12,0,48,16,148,66,66,64,66,64,64,66,66,16,68,68,64,65,70,66,64,74,66,66,8,66,36,73,36,16,64,16,8,8,0,0,0,68,66,64,66,64,16,2,66,16,4,40,16,42,18,66,44,4,16,2,16,36,34,84,36,4,16,8,8,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,42,5,58,0,16,16,0,0,32,0,0,64,100,8,32,68,4,66,66,16,66,4,0,32,2,0,64,0,64,66,66,66,68,64,64,66,66,16,68,66,64,65,70,66,64,68,66,66,8,66,36,73,66,16,64,16,4,8,0,0,0,68,98,66,70,66,16,34,66,16,36,36,16,42,18,66,32,4,16,34,16,36,20,84,68,4,32,8,8,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,28,2,0,0,16,16,0,0,32,0,0,64,56,8,126,56,4,60,60,16,60,56,0,0,0,0,0,0,56,66,124,60,120,126,64,60,66,124,56,66,126,65,66,60,64,58,66,60,8,60,24,54,66,16,126,28,4,56,0,127,0,58,92,60,58,60,16,28,66,8,24,34,8,42,18,60,32,2,16,28,14,26,8,42,66,56,62,8,8,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,8,0,0,0,8,32,0,0,64,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,96,0,0,87,105,110,100,111,119,105,110,103,32,83,121,115,116,101,109,115,32,98,121,32,69,120,97,109,112,108,101,0,77,97,115,116,101,114,32,79,117,116,0,78,111,105,115,101,0,80,105,116,99,104,32,75,110,111,98,0,83,101,113,117,101,110,99,101,0,83,105,110,101,0,83,113,117,97,114,101,0,80,65,84,67,72,32,66,117,105,108,100,32,78,117,109,98,101,114,32,63,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);





/* no memory initializer */
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


   
  Module["_i64Add"] = _i64Add;

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      else Module.printErr('failed to set errno from JS');
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 85: return totalMemory / PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 79:
          return 0;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

   
  Module["_memset"] = _memset;

   
  Module["_bitshift64Lshr"] = _bitshift64Lshr;

  function _abort() {
      Module['abort']();
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _emscripten_asm_const=true;

  var _llvm_pow_f64=Math_pow;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) {
        var success = self.alloc(bytes);
        if (!success) return -1 >>> 0; // sbrk failure code
      }
      return ret;  // Previous break location.
    }

  var _emscripten_asm_const_int=true;

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function (stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              var fd = process.stdin.fd;
              // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
              var usingDevice = false;
              try {
                fd = fs.openSync('/dev/stdin', 'r');
                usingDevice = true;
              } catch (e) {}
  
              bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
  
              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
  
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.buffer.byteLength which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) { // Can we just reuse the buffer we are given?
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        flags &= ~0100000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          if (length === 0) return 0; // node errors on 0 length reads
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          return position;
        }}};
  
  var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:function (mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
        var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
          // return the parent node, creating subdirs as necessary
          var parts = path.split('/');
          var parent = root;
          for (var i = 0; i < parts.length-1; i++) {
            var curr = parts.slice(0, i+1).join('/');
            if (!createdParents[curr]) {
              createdParents[curr] = WORKERFS.createNode(parent, curr, WORKERFS.DIR_MODE, 0);
            }
            parent = createdParents[curr];
          }
          return parent;
        }
        function base(path) {
          var parts = path.split('/');
          return parts[parts.length-1];
        }
        // We also accept FileList here, by using Array.prototype
        Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
          WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
        });
        (mount.opts["blobs"] || []).forEach(function(obj) {
          WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
        });
        (mount.opts["packages"] || []).forEach(function(pack) {
          pack['metadata'].files.forEach(function(file) {
            var name = file.filename.substr(1); // remove initial slash
            WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack['blob'].slice(file.start, file.end));
          });
        });
        return root;
      },createNode:function (parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
          node.size = contents.size;
          node.contents = contents;
        } else {
          node.size = 4096;
          node.contents = {};
        }
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          return {
            dev: 1,
            ino: undefined,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: undefined,
            size: node.size,
            atime: new Date(node.timestamp),
            mtime: new Date(node.timestamp),
            ctime: new Date(node.timestamp),
            blksize: 4096,
            blocks: Math.ceil(node.size / 4096),
          };
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rename:function (oldNode, newDir, newName) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },unlink:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rmdir:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readdir:function (node) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },symlink:function (parent, newName, oldPath) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readlink:function (node) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          if (position >= stream.node.size) return 0;
          var chunk = stream.node.contents.slice(position, position + length);
          var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
          buffer.set(new Uint8Array(ab), offset);
          return chunk.size;
        },write:function (stream, buffer, offset, length, position) {
          throw new FS.ErrnoError(ERRNO_CODES.EIO);
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.size;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },msync:function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function (stream) {
        return 0;
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto').randomBytes(1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { return (Math.random()*256)|0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function () {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 0777, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          //Module.printErr(stackTrace()); // useful for debugging
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
          'IDBFS': IDBFS,
          'NODEFS': NODEFS,
          'WORKERFS': WORKERFS,
        };
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperty(node, "usedBytes", {
            get: function() { return this.contents.length; }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        console.error('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          setTimeout(Browser.mainLoop.runner, value); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      } else if (mode == 2 /*EM_TIMING_SETIMMEDIATE*/) {
        if (!window['setImmediate']) {
          // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
          var setImmediates = [];
          var emscriptenMainLoopMessageId = '__emcc';
          function Browser_setImmediate_messageHandler(event) {
            if (event.source === window && event.data === emscriptenMainLoopMessageId) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          }
          window.addEventListener("message", Browser_setImmediate_messageHandler, true);
          window['setImmediate'] = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);
            window.postMessage(emscriptenMainLoopMessageId, "*");
          }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          window['setImmediate'](Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'immediate';
      }
      return 0;
    }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(function() {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        });
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullScreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullScreen();
        }
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = event.wheelDelta;
            break;
          case 'wheel': 
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _pthread_self() {
      //FIXME: assumes only a single thread
      return 0;
    }

  var _sin=Math_sin;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
  Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) { return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes) }
FS.staticInit();__ATINIT__.unshift(function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() });__ATMAIN__.push(function() { FS.ignorePermissions = false });__ATEXIT__.push(function() { FS.quit() });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift(function() { TTY.init() });__ATEXIT__.push(function() { TTY.shutdown() });
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);


function nullFunc_ii(x) { Module["printErr"]("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iiii(x) { Module["printErr"]("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viiii(x) { Module["printErr"]("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viii(x) { Module["printErr"]("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_vi(x) { Module["printErr"]("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity, "byteLength": byteLength };

Module.asmLibraryArg = { "abort": abort, "assert": assert, "nullFunc_ii": nullFunc_ii, "nullFunc_iiii": nullFunc_iiii, "nullFunc_viiii": nullFunc_viiii, "nullFunc_viii": nullFunc_viii, "nullFunc_vi": nullFunc_vi, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_viiii": invoke_viiii, "invoke_viii": invoke_viii, "invoke_vi": invoke_vi, "_sin": _sin, "_llvm_pow_f64": _llvm_pow_f64, "_sysconf": _sysconf, "_pthread_self": _pthread_self, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_abort": _abort, "___setErrNo": ___setErrNo, "_sbrk": _sbrk, "_time": _time, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_emscripten_asm_const_3": _emscripten_asm_const_3, "_emscripten_asm_const_2": _emscripten_asm_const_2, "_emscripten_asm_const_1": _emscripten_asm_const_1, "_emscripten_asm_const_0": _emscripten_asm_const_0, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8 };
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'almost asm';
  
  
  var Int8View = global.Int8Array;
  var Int16View = global.Int16Array;
  var Int32View = global.Int32Array;
  var Uint8View = global.Uint8Array;
  var Uint16View = global.Uint16Array;
  var Uint32View = global.Uint32Array;
  var Float32View = global.Float32Array;
  var Float64View = global.Float64Array;
  var HEAP8 = new Int8View(buffer);
  var HEAP16 = new Int16View(buffer);
  var HEAP32 = new Int32View(buffer);
  var HEAPU8 = new Uint8View(buffer);
  var HEAPU16 = new Uint16View(buffer);
  var HEAPU32 = new Uint32View(buffer);
  var HEAPF32 = new Float32View(buffer);
  var HEAPF64 = new Float64View(buffer);
  var byteLength = global.byteLength;


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var nullFunc_ii=env.nullFunc_ii;
  var nullFunc_iiii=env.nullFunc_iiii;
  var nullFunc_viiii=env.nullFunc_viiii;
  var nullFunc_viii=env.nullFunc_viii;
  var nullFunc_vi=env.nullFunc_vi;
  var invoke_ii=env.invoke_ii;
  var invoke_iiii=env.invoke_iiii;
  var invoke_viiii=env.invoke_viiii;
  var invoke_viii=env.invoke_viii;
  var invoke_vi=env.invoke_vi;
  var _sin=env._sin;
  var _llvm_pow_f64=env._llvm_pow_f64;
  var _sysconf=env._sysconf;
  var _pthread_self=env._pthread_self;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var _abort=env._abort;
  var ___setErrNo=env.___setErrNo;
  var _sbrk=env._sbrk;
  var _time=env._time;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _emscripten_asm_const_3=env._emscripten_asm_const_3;
  var _emscripten_asm_const_2=env._emscripten_asm_const_2;
  var _emscripten_asm_const_1=env._emscripten_asm_const_1;
  var _emscripten_asm_const_0=env._emscripten_asm_const_0;
  var tempFloat = 0.0;

function _emscripten_replace_memory(newBuffer) {
  if ((byteLength(newBuffer) & 0xffffff || byteLength(newBuffer) <= 0xffffff) || byteLength(newBuffer) > 0x80000000) return false;
  HEAP8 = new Int8View(newBuffer);
  HEAP16 = new Int16View(newBuffer);
  HEAP32 = new Int32View(newBuffer);
  HEAPU8 = new Uint8View(newBuffer);
  HEAPU16 = new Uint16View(newBuffer);
  HEAPU32 = new Uint32View(newBuffer);
  HEAPF32 = new Float32View(newBuffer);
  HEAPF64 = new Float64View(newBuffer);
  buffer = newBuffer;
  return true;
}

// EMSCRIPTEN_START_FUNCS
function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
  STACKTOP = (STACKTOP + 15)&-16;
if ((STACKTOP|0) >= (STACK_MAX|0)) abort();

  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}
function establishStackSpace(stackBase, stackMax) {
  stackBase = stackBase|0;
  stackMax = stackMax|0;
  STACKTOP = stackBase;
  STACK_MAX = stackMax;
}

function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}
function copyTempFloat(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
}
function copyTempDouble(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
  HEAP8[tempDoublePtr+4>>0] = HEAP8[ptr+4>>0];
  HEAP8[tempDoublePtr+5>>0] = HEAP8[ptr+5>>0];
  HEAP8[tempDoublePtr+6>>0] = HEAP8[ptr+6>>0];
  HEAP8[tempDoublePtr+7>>0] = HEAP8[ptr+7>>0];
}

function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}
function getTempRet0() {
  return tempRet0|0;
}

function _doPullSample() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0.0, $15 = 0.0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $ah = 0;
 var $i = 0, $l = 0, $r = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $l = sp + 8|0;
 $r = sp;
 _emscripten_asm_const_0(0); //@line 18 "../platform/platformwrapper_emscripten.c"
 $i = 0; //@line 22 "../platform/platformwrapper_emscripten.c"
 while(1) {
  $0 = $i; //@line 22 "../platform/platformwrapper_emscripten.c"
  $1 = HEAP32[16>>2]|0; //@line 22 "../platform/platformwrapper_emscripten.c"
  $2 = ((($1)) + 4|0); //@line 22 "../platform/platformwrapper_emscripten.c"
  $3 = HEAP32[$2>>2]|0; //@line 22 "../platform/platformwrapper_emscripten.c"
  $4 = ($0>>>0)<($3>>>0); //@line 22 "../platform/platformwrapper_emscripten.c"
  if (!($4)) {
   break;
  }
  $5 = HEAP32[16>>2]|0; //@line 24 "../platform/platformwrapper_emscripten.c"
  $6 = $i; //@line 24 "../platform/platformwrapper_emscripten.c"
  $7 = (_List_get_at($5,$6)|0); //@line 24 "../platform/platformwrapper_emscripten.c"
  $ah = $7; //@line 24 "../platform/platformwrapper_emscripten.c"
  $8 = $ah; //@line 25 "../platform/platformwrapper_emscripten.c"
  $9 = ((($8)) + 4|0); //@line 25 "../platform/platformwrapper_emscripten.c"
  $10 = HEAP32[$9>>2]|0; //@line 25 "../platform/platformwrapper_emscripten.c"
  $11 = $ah; //@line 25 "../platform/platformwrapper_emscripten.c"
  $12 = ((($11)) + 8|0); //@line 25 "../platform/platformwrapper_emscripten.c"
  $13 = HEAP32[$12>>2]|0; //@line 25 "../platform/platformwrapper_emscripten.c"
  FUNCTION_TABLE_viii[$10 & 63]($13,$l,$r); //@line 25 "../platform/platformwrapper_emscripten.c"
  $14 = +HEAPF64[$l>>3]; //@line 27 "../platform/platformwrapper_emscripten.c"
  $15 = +HEAPF64[$r>>3]; //@line 27 "../platform/platformwrapper_emscripten.c"
  $16 = _emscripten_asm_const_2(1, (+$14), (+$15))|0; //@line 27 "../platform/platformwrapper_emscripten.c"
  $17 = $i; //@line 22 "../platform/platformwrapper_emscripten.c"
  $18 = (($17) + 1)|0; //@line 22 "../platform/platformwrapper_emscripten.c"
  $i = $18; //@line 22 "../platform/platformwrapper_emscripten.c"
 }
 STACKTOP = sp;return; //@line 32 "../platform/platformwrapper_emscripten.c"
}
function _PlatformWrapper_init() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_List_new()|0); //@line 36 "../platform/platformwrapper_emscripten.c"
 HEAP32[16>>2] = $0; //@line 36 "../platform/platformwrapper_emscripten.c"
 HEAP32[20>>2] = 0; //@line 37 "../platform/platformwrapper_emscripten.c"
 HEAP32[24>>2] = 0; //@line 38 "../platform/platformwrapper_emscripten.c"
 HEAP32[28>>2] = 0; //@line 39 "../platform/platformwrapper_emscripten.c"
 HEAP32[32>>2] = 0; //@line 40 "../platform/platformwrapper_emscripten.c"
 HEAP32[36>>2] = 0; //@line 41 "../platform/platformwrapper_emscripten.c"
 _emscripten_asm_const_0(2); //@line 44 "../platform/platformwrapper_emscripten.c"
 return; //@line 69 "../platform/platformwrapper_emscripten.c"
}
function _PlatformWrapper_hold_for_exit() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return; //@line 73 "../platform/platformwrapper_emscripten.c"
}
function _PlatformWrapper_install_audio_handler($audio_handler) {
 $audio_handler = $audio_handler|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $audio_handler;
 $1 = HEAP32[16>>2]|0; //@line 78 "../platform/platformwrapper_emscripten.c"
 $2 = $0; //@line 78 "../platform/platformwrapper_emscripten.c"
 (_List_add($1,$2)|0); //@line 78 "../platform/platformwrapper_emscripten.c"
 STACKTOP = sp;return; //@line 79 "../platform/platformwrapper_emscripten.c"
}
function _PlatformWrapper_is_mouse_shown() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0; //@line 84 "../platform/platformwrapper_emscripten.c"
}
function _PlatformWrapper_get_context() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $height = 0, $i = 0, $return_buffer = 0;
 var $width = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $return_buffer = 0; //@line 91 "../platform/platformwrapper_emscripten.c"
 $1 = _emscripten_asm_const_1(3, 0)|0; //@line 94 "../platform/platformwrapper_emscripten.c"
 $2 = $1&65535; //@line 94 "../platform/platformwrapper_emscripten.c"
 $width = $2; //@line 94 "../platform/platformwrapper_emscripten.c"
 $3 = _emscripten_asm_const_1(4, 0)|0; //@line 95 "../platform/platformwrapper_emscripten.c"
 $4 = $3&65535; //@line 95 "../platform/platformwrapper_emscripten.c"
 $height = $4; //@line 95 "../platform/platformwrapper_emscripten.c"
 $5 = $width; //@line 98 "../platform/platformwrapper_emscripten.c"
 $6 = $5&65535; //@line 98 "../platform/platformwrapper_emscripten.c"
 $7 = $6<<2; //@line 98 "../platform/platformwrapper_emscripten.c"
 $8 = $height; //@line 98 "../platform/platformwrapper_emscripten.c"
 $9 = $8&65535; //@line 98 "../platform/platformwrapper_emscripten.c"
 $10 = Math_imul($7, $9)|0; //@line 98 "../platform/platformwrapper_emscripten.c"
 $11 = (_malloc($10)|0); //@line 98 "../platform/platformwrapper_emscripten.c"
 $return_buffer = $11; //@line 98 "../platform/platformwrapper_emscripten.c"
 $12 = ($11|0)!=(0|0); //@line 98 "../platform/platformwrapper_emscripten.c"
 if (!($12)) {
  $0 = 0; //@line 99 "../platform/platformwrapper_emscripten.c"
  $36 = $0; //@line 142 "../platform/platformwrapper_emscripten.c"
  STACKTOP = sp;return ($36|0); //@line 142 "../platform/platformwrapper_emscripten.c"
 }
 $i = 0; //@line 103 "../platform/platformwrapper_emscripten.c"
 while(1) {
  $13 = $i; //@line 103 "../platform/platformwrapper_emscripten.c"
  $14 = $width; //@line 103 "../platform/platformwrapper_emscripten.c"
  $15 = $14&65535; //@line 103 "../platform/platformwrapper_emscripten.c"
  $16 = $height; //@line 103 "../platform/platformwrapper_emscripten.c"
  $17 = $16&65535; //@line 103 "../platform/platformwrapper_emscripten.c"
  $18 = Math_imul($15, $17)|0; //@line 103 "../platform/platformwrapper_emscripten.c"
  $19 = ($13|0)<($18|0); //@line 103 "../platform/platformwrapper_emscripten.c"
  if (!($19)) {
   break;
  }
  $20 = $i; //@line 104 "../platform/platformwrapper_emscripten.c"
  $21 = $return_buffer; //@line 104 "../platform/platformwrapper_emscripten.c"
  $22 = (($21) + ($20<<2)|0); //@line 104 "../platform/platformwrapper_emscripten.c"
  HEAP32[$22>>2] = -16777216; //@line 104 "../platform/platformwrapper_emscripten.c"
  $23 = $i; //@line 103 "../platform/platformwrapper_emscripten.c"
  $24 = (($23) + 1)|0; //@line 103 "../platform/platformwrapper_emscripten.c"
  $i = $24; //@line 103 "../platform/platformwrapper_emscripten.c"
 }
 $25 = $width; //@line 109 "../platform/platformwrapper_emscripten.c"
 $26 = $25&65535; //@line 109 "../platform/platformwrapper_emscripten.c"
 $27 = $height; //@line 109 "../platform/platformwrapper_emscripten.c"
 $28 = $27&65535; //@line 109 "../platform/platformwrapper_emscripten.c"
 $29 = $return_buffer; //@line 109 "../platform/platformwrapper_emscripten.c"
 $30 = _emscripten_asm_const_3(5, ($26|0), ($28|0), ($29|0))|0; //@line 109 "../platform/platformwrapper_emscripten.c"
 $31 = $width; //@line 139 "../platform/platformwrapper_emscripten.c"
 $32 = $height; //@line 139 "../platform/platformwrapper_emscripten.c"
 $33 = $return_buffer; //@line 139 "../platform/platformwrapper_emscripten.c"
 $34 = (_Context_new($31,$32,$33)|0); //@line 139 "../platform/platformwrapper_emscripten.c"
 HEAP32[20>>2] = $34; //@line 139 "../platform/platformwrapper_emscripten.c"
 $35 = HEAP32[20>>2]|0; //@line 141 "../platform/platformwrapper_emscripten.c"
 $0 = $35; //@line 141 "../platform/platformwrapper_emscripten.c"
 $36 = $0; //@line 142 "../platform/platformwrapper_emscripten.c"
 STACKTOP = sp;return ($36|0); //@line 142 "../platform/platformwrapper_emscripten.c"
}
function _doMouseCallback() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $buttons = 0, $mouse_x = 0, $mouse_y = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = HEAP32[28>>2]|0; //@line 149 "../platform/platformwrapper_emscripten.c"
 $1 = ($0|0)!=(0|0); //@line 149 "../platform/platformwrapper_emscripten.c"
 if (!($1)) {
  STACKTOP = sp;return; //@line 167 "../platform/platformwrapper_emscripten.c"
 }
 $2 = _emscripten_asm_const_1(6, 0)|0; //@line 153 "../platform/platformwrapper_emscripten.c"
 $3 = $2&65535; //@line 153 "../platform/platformwrapper_emscripten.c"
 $mouse_x = $3; //@line 153 "../platform/platformwrapper_emscripten.c"
 $4 = _emscripten_asm_const_1(7, 0)|0; //@line 157 "../platform/platformwrapper_emscripten.c"
 $5 = $4&65535; //@line 157 "../platform/platformwrapper_emscripten.c"
 $mouse_y = $5; //@line 157 "../platform/platformwrapper_emscripten.c"
 $6 = _emscripten_asm_const_1(8, 0)|0; //@line 161 "../platform/platformwrapper_emscripten.c"
 $7 = $6&255; //@line 161 "../platform/platformwrapper_emscripten.c"
 $buttons = $7; //@line 161 "../platform/platformwrapper_emscripten.c"
 $8 = HEAP32[28>>2]|0; //@line 166 "../platform/platformwrapper_emscripten.c"
 $9 = HEAP32[24>>2]|0; //@line 166 "../platform/platformwrapper_emscripten.c"
 $10 = $mouse_x; //@line 166 "../platform/platformwrapper_emscripten.c"
 $11 = $mouse_y; //@line 166 "../platform/platformwrapper_emscripten.c"
 $12 = $buttons; //@line 166 "../platform/platformwrapper_emscripten.c"
 FUNCTION_TABLE_viiii[$8 & 15]($9,$10,$11,$12); //@line 166 "../platform/platformwrapper_emscripten.c"
 STACKTOP = sp;return; //@line 167 "../platform/platformwrapper_emscripten.c"
}
function _PlatformWrapper_install_mouse_callback($param_object,$callback) {
 $param_object = $param_object|0;
 $callback = $callback|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $param_object;
 $1 = $callback;
 _doMouseCallback(); //@line 173 "../platform/platformwrapper_emscripten.c"
 _emscripten_asm_const_0(9); //@line 175 "../platform/platformwrapper_emscripten.c"
 $2 = $0; //@line 199 "../platform/platformwrapper_emscripten.c"
 HEAP32[24>>2] = $2; //@line 199 "../platform/platformwrapper_emscripten.c"
 $3 = $1; //@line 200 "../platform/platformwrapper_emscripten.c"
 HEAP32[28>>2] = $3; //@line 200 "../platform/platformwrapper_emscripten.c"
 STACKTOP = sp;return; //@line 201 "../platform/platformwrapper_emscripten.c"
}
function _doResizeCallback() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $height = 0, $width = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = _emscripten_asm_const_1(3, 0)|0; //@line 205 "../platform/platformwrapper_emscripten.c"
 $1 = $0&65535; //@line 205 "../platform/platformwrapper_emscripten.c"
 $width = $1; //@line 205 "../platform/platformwrapper_emscripten.c"
 $2 = _emscripten_asm_const_1(4, 0)|0; //@line 206 "../platform/platformwrapper_emscripten.c"
 $3 = $2&65535; //@line 206 "../platform/platformwrapper_emscripten.c"
 $height = $3; //@line 206 "../platform/platformwrapper_emscripten.c"
 $4 = HEAP32[20>>2]|0; //@line 208 "../platform/platformwrapper_emscripten.c"
 $5 = ((($4)) + 8|0); //@line 208 "../platform/platformwrapper_emscripten.c"
 $6 = HEAP32[$5>>2]|0; //@line 208 "../platform/platformwrapper_emscripten.c"
 _free($6); //@line 208 "../platform/platformwrapper_emscripten.c"
 $7 = $width; //@line 209 "../platform/platformwrapper_emscripten.c"
 $8 = $7&65535; //@line 209 "../platform/platformwrapper_emscripten.c"
 $9 = $8<<2; //@line 209 "../platform/platformwrapper_emscripten.c"
 $10 = $height; //@line 209 "../platform/platformwrapper_emscripten.c"
 $11 = $10&65535; //@line 209 "../platform/platformwrapper_emscripten.c"
 $12 = Math_imul($9, $11)|0; //@line 209 "../platform/platformwrapper_emscripten.c"
 $13 = (_malloc($12)|0); //@line 209 "../platform/platformwrapper_emscripten.c"
 $14 = HEAP32[20>>2]|0; //@line 209 "../platform/platformwrapper_emscripten.c"
 $15 = ((($14)) + 8|0); //@line 209 "../platform/platformwrapper_emscripten.c"
 HEAP32[$15>>2] = $13; //@line 209 "../platform/platformwrapper_emscripten.c"
 $16 = $width; //@line 210 "../platform/platformwrapper_emscripten.c"
 $17 = HEAP32[20>>2]|0; //@line 210 "../platform/platformwrapper_emscripten.c"
 $18 = ((($17)) + 12|0); //@line 210 "../platform/platformwrapper_emscripten.c"
 HEAP16[$18>>1] = $16; //@line 210 "../platform/platformwrapper_emscripten.c"
 $19 = $height; //@line 211 "../platform/platformwrapper_emscripten.c"
 $20 = HEAP32[20>>2]|0; //@line 211 "../platform/platformwrapper_emscripten.c"
 $21 = ((($20)) + 14|0); //@line 211 "../platform/platformwrapper_emscripten.c"
 HEAP16[$21>>1] = $19; //@line 211 "../platform/platformwrapper_emscripten.c"
 $22 = HEAP32[20>>2]|0; //@line 213 "../platform/platformwrapper_emscripten.c"
 $23 = ((($22)) + 8|0); //@line 213 "../platform/platformwrapper_emscripten.c"
 $24 = HEAP32[$23>>2]|0; //@line 213 "../platform/platformwrapper_emscripten.c"
 $25 = _emscripten_asm_const_1(10, ($24|0))|0; //@line 213 "../platform/platformwrapper_emscripten.c"
 $26 = HEAP32[36>>2]|0; //@line 220 "../platform/platformwrapper_emscripten.c"
 $27 = HEAP32[32>>2]|0; //@line 220 "../platform/platformwrapper_emscripten.c"
 $28 = $width; //@line 220 "../platform/platformwrapper_emscripten.c"
 $29 = $28&65535; //@line 220 "../platform/platformwrapper_emscripten.c"
 $30 = $height; //@line 220 "../platform/platformwrapper_emscripten.c"
 $31 = $30&65535; //@line 220 "../platform/platformwrapper_emscripten.c"
 FUNCTION_TABLE_viii[$26 & 63]($27,$29,$31); //@line 220 "../platform/platformwrapper_emscripten.c"
 STACKTOP = sp;return; //@line 221 "../platform/platformwrapper_emscripten.c"
}
function _PlatformWrapper_install_resize_callback($param_object,$callback) {
 $param_object = $param_object|0;
 $callback = $callback|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $param_object;
 $1 = $callback;
 _emscripten_asm_const_0(11); //@line 225 "../platform/platformwrapper_emscripten.c"
 $2 = $0; //@line 236 "../platform/platformwrapper_emscripten.c"
 HEAP32[32>>2] = $2; //@line 236 "../platform/platformwrapper_emscripten.c"
 $3 = $1; //@line 237 "../platform/platformwrapper_emscripten.c"
 HEAP32[36>>2] = $3; //@line 237 "../platform/platformwrapper_emscripten.c"
 STACKTOP = sp;return; //@line 238 "../platform/platformwrapper_emscripten.c"
}
function _String_new($source_buf) {
 $source_buf = $source_buf|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $i = 0, $len = 0, $string = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $source_buf;
 $2 = (_malloc(8)|0); //@line 8 "../wslib/object.c"
 $string = $2; //@line 8 "../wslib/object.c"
 $3 = $string; //@line 10 "../wslib/object.c"
 $4 = ($3|0)!=(0|0); //@line 10 "../wslib/object.c"
 $5 = $string; //@line 13 "../wslib/object.c"
 if (!($4)) {
  $0 = $5; //@line 11 "../wslib/object.c"
  $40 = $0; //@line 33 "../wslib/object.c"
  STACKTOP = sp;return ($40|0); //@line 33 "../wslib/object.c"
 }
 _Object_init($5,1); //@line 13 "../wslib/object.c"
 $6 = $1; //@line 15 "../wslib/object.c"
 $7 = ($6|0)!=(0|0); //@line 15 "../wslib/object.c"
 if (!($7)) {
  $8 = $1; //@line 17 "../wslib/object.c"
  $9 = $string; //@line 17 "../wslib/object.c"
  $10 = ((($9)) + 4|0); //@line 17 "../wslib/object.c"
  HEAP32[$10>>2] = $8; //@line 17 "../wslib/object.c"
  $11 = $string; //@line 18 "../wslib/object.c"
  $0 = $11; //@line 18 "../wslib/object.c"
  $40 = $0; //@line 33 "../wslib/object.c"
  STACKTOP = sp;return ($40|0); //@line 33 "../wslib/object.c"
 }
 $len = 1; //@line 21 "../wslib/object.c"
 while(1) {
  $12 = $len; //@line 21 "../wslib/object.c"
  $13 = (($12) - 1)|0; //@line 21 "../wslib/object.c"
  $14 = $1; //@line 21 "../wslib/object.c"
  $15 = (($14) + ($13)|0); //@line 21 "../wslib/object.c"
  $16 = HEAP8[$15>>0]|0; //@line 21 "../wslib/object.c"
  $17 = ($16<<24>>24)!=(0); //@line 21 "../wslib/object.c"
  $18 = $len; //@line 21 "../wslib/object.c"
  if (!($17)) {
   break;
  }
  $19 = (($18) + 1)|0; //@line 21 "../wslib/object.c"
  $len = $19; //@line 21 "../wslib/object.c"
 }
 $20 = (_malloc($18)|0); //@line 23 "../wslib/object.c"
 $21 = $string; //@line 23 "../wslib/object.c"
 $22 = ((($21)) + 4|0); //@line 23 "../wslib/object.c"
 HEAP32[$22>>2] = $20; //@line 23 "../wslib/object.c"
 $23 = ($20|0)!=(0|0); //@line 23 "../wslib/object.c"
 if (!($23)) {
  $24 = $string; //@line 25 "../wslib/object.c"
  _Object_delete($24); //@line 25 "../wslib/object.c"
  $0 = 0; //@line 26 "../wslib/object.c"
  $40 = $0; //@line 33 "../wslib/object.c"
  STACKTOP = sp;return ($40|0); //@line 33 "../wslib/object.c"
 }
 $i = 0; //@line 29 "../wslib/object.c"
 while(1) {
  $25 = $i; //@line 29 "../wslib/object.c"
  $26 = $len; //@line 29 "../wslib/object.c"
  $27 = ($25|0)<($26|0); //@line 29 "../wslib/object.c"
  if (!($27)) {
   break;
  }
  $28 = $i; //@line 30 "../wslib/object.c"
  $29 = $1; //@line 30 "../wslib/object.c"
  $30 = (($29) + ($28)|0); //@line 30 "../wslib/object.c"
  $31 = HEAP8[$30>>0]|0; //@line 30 "../wslib/object.c"
  $32 = $i; //@line 30 "../wslib/object.c"
  $33 = $string; //@line 30 "../wslib/object.c"
  $34 = ((($33)) + 4|0); //@line 30 "../wslib/object.c"
  $35 = HEAP32[$34>>2]|0; //@line 30 "../wslib/object.c"
  $36 = (($35) + ($32)|0); //@line 30 "../wslib/object.c"
  HEAP8[$36>>0] = $31; //@line 30 "../wslib/object.c"
  $37 = $i; //@line 29 "../wslib/object.c"
  $38 = (($37) + 1)|0; //@line 29 "../wslib/object.c"
  $i = $38; //@line 29 "../wslib/object.c"
 }
 $39 = $string; //@line 32 "../wslib/object.c"
 $0 = $39; //@line 32 "../wslib/object.c"
 $40 = $0; //@line 33 "../wslib/object.c"
 STACKTOP = sp;return ($40|0); //@line 33 "../wslib/object.c"
}
function _Object_init($object,$delete_function) {
 $object = $object|0;
 $delete_function = $delete_function|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $object;
 $1 = $delete_function;
 $2 = $1; //@line 60 "../wslib/object.c"
 $3 = ($2|0)!=(0|0); //@line 60 "../wslib/object.c"
 if ($3) {
  $4 = $1; //@line 61 "../wslib/object.c"
  $5 = $0; //@line 61 "../wslib/object.c"
  HEAP32[$5>>2] = $4; //@line 61 "../wslib/object.c"
  STACKTOP = sp;return; //@line 64 "../wslib/object.c"
 } else {
  $6 = $0; //@line 63 "../wslib/object.c"
  HEAP32[$6>>2] = 2; //@line 63 "../wslib/object.c"
  STACKTOP = sp;return; //@line 64 "../wslib/object.c"
 }
}
function _String_delete_function($string_object) {
 $string_object = $string_object|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $string = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $string_object;
 $1 = $0; //@line 42 "../wslib/object.c"
 $2 = ($1|0)!=(0|0); //@line 42 "../wslib/object.c"
 if (!($2)) {
  STACKTOP = sp;return; //@line 51 "../wslib/object.c"
 }
 $3 = $0; //@line 45 "../wslib/object.c"
 $string = $3; //@line 45 "../wslib/object.c"
 $4 = $string; //@line 47 "../wslib/object.c"
 $5 = ((($4)) + 4|0); //@line 47 "../wslib/object.c"
 $6 = HEAP32[$5>>2]|0; //@line 47 "../wslib/object.c"
 $7 = ($6|0)!=(0|0); //@line 47 "../wslib/object.c"
 if ($7) {
  $8 = $string; //@line 48 "../wslib/object.c"
  $9 = ((($8)) + 4|0); //@line 48 "../wslib/object.c"
  $10 = HEAP32[$9>>2]|0; //@line 48 "../wslib/object.c"
  _free($10); //@line 48 "../wslib/object.c"
 }
 $11 = $0; //@line 50 "../wslib/object.c"
 _Object_default_delete_function($11); //@line 50 "../wslib/object.c"
 STACKTOP = sp;return; //@line 51 "../wslib/object.c"
}
function _Object_delete($object) {
 $object = $object|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $object;
 $1 = $0; //@line 68 "../wslib/object.c"
 $2 = ($1|0)!=(0|0); //@line 68 "../wslib/object.c"
 if (!($2)) {
  STACKTOP = sp;return; //@line 75 "../wslib/object.c"
 }
 $3 = $0; //@line 71 "../wslib/object.c"
 $4 = HEAP32[$3>>2]|0; //@line 71 "../wslib/object.c"
 $5 = ($4|0)!=(0|0); //@line 71 "../wslib/object.c"
 $6 = $0; //@line 72 "../wslib/object.c"
 if ($5) {
  $7 = HEAP32[$6>>2]|0; //@line 72 "../wslib/object.c"
  $8 = $0; //@line 72 "../wslib/object.c"
  FUNCTION_TABLE_vi[$7 & 63]($8); //@line 72 "../wslib/object.c"
  STACKTOP = sp;return; //@line 75 "../wslib/object.c"
 } else {
  _Object_default_delete_function($6); //@line 74 "../wslib/object.c"
  STACKTOP = sp;return; //@line 75 "../wslib/object.c"
 }
}
function _String_compare($string_a,$string_b) {
 $string_a = $string_a|0;
 $string_b = $string_b|0;
 var $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $string_a;
 $1 = $string_b;
 $2 = $0; //@line 37 "../wslib/object.c"
 $3 = ((($2)) + 4|0); //@line 37 "../wslib/object.c"
 $4 = HEAP32[$3>>2]|0; //@line 37 "../wslib/object.c"
 $5 = $1; //@line 37 "../wslib/object.c"
 $6 = ((($5)) + 4|0); //@line 37 "../wslib/object.c"
 $7 = HEAP32[$6>>2]|0; //@line 37 "../wslib/object.c"
 $8 = (_strcmp($4,$7)|0); //@line 37 "../wslib/object.c"
 $9 = ($8|0)==(0); //@line 37 "../wslib/object.c"
 $10 = $9&1; //@line 37 "../wslib/object.c"
 STACKTOP = sp;return ($10|0); //@line 37 "../wslib/object.c"
}
function _Object_default_delete_function($object) {
 $object = $object|0;
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $object;
 $1 = $0; //@line 55 "../wslib/object.c"
 _free($1); //@line 55 "../wslib/object.c"
 STACKTOP = sp;return; //@line 56 "../wslib/object.c"
}
function _ListNode_new($payload) {
 $payload = $payload|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $list_node = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $payload;
 $2 = (_malloc(16)|0); //@line 13 "../wslib/listnode.c"
 $list_node = $2; //@line 13 "../wslib/listnode.c"
 $3 = ($2|0)!=(0|0); //@line 13 "../wslib/listnode.c"
 $4 = $list_node; //@line 17 "../wslib/listnode.c"
 if ($3) {
  _Object_init($4,0); //@line 17 "../wslib/listnode.c"
  $5 = $list_node; //@line 18 "../wslib/listnode.c"
  $6 = ((($5)) + 8|0); //@line 18 "../wslib/listnode.c"
  HEAP32[$6>>2] = 0; //@line 18 "../wslib/listnode.c"
  $7 = $list_node; //@line 19 "../wslib/listnode.c"
  $8 = ((($7)) + 12|0); //@line 19 "../wslib/listnode.c"
  HEAP32[$8>>2] = 0; //@line 19 "../wslib/listnode.c"
  $9 = $1; //@line 20 "../wslib/listnode.c"
  $10 = $list_node; //@line 20 "../wslib/listnode.c"
  $11 = ((($10)) + 4|0); //@line 20 "../wslib/listnode.c"
  HEAP32[$11>>2] = $9; //@line 20 "../wslib/listnode.c"
  $12 = $list_node; //@line 22 "../wslib/listnode.c"
  $0 = $12; //@line 22 "../wslib/listnode.c"
  $13 = $0; //@line 23 "../wslib/listnode.c"
  STACKTOP = sp;return ($13|0); //@line 23 "../wslib/listnode.c"
 } else {
  $0 = $4; //@line 14 "../wslib/listnode.c"
  $13 = $0; //@line 23 "../wslib/listnode.c"
  STACKTOP = sp;return ($13|0); //@line 23 "../wslib/listnode.c"
 }
 return (0)|0;
}
function _draw_panel($context,$x,$y,$width,$height,$color,$border_width,$invert) {
 $context = $context|0;
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 $height = $height|0;
 $color = $color|0;
 $border_width = $border_width|0;
 $invert = $invert|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0;
 var $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0;
 var $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0;
 var $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0;
 var $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $b = 0, $g = 0, $i = 0, $light_color = 0, $r = 0, $shade_color = 0, $temp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $x;
 $2 = $y;
 $3 = $width;
 $4 = $height;
 $5 = $color;
 $6 = $border_width;
 $7 = $invert;
 $8 = $5; //@line 7 "../wslib/styleutils.c"
 $9 = $8 & 255; //@line 7 "../wslib/styleutils.c"
 $10 = $9&255; //@line 7 "../wslib/styleutils.c"
 $r = $10; //@line 7 "../wslib/styleutils.c"
 $11 = $5; //@line 8 "../wslib/styleutils.c"
 $12 = $11 & 65280; //@line 8 "../wslib/styleutils.c"
 $13 = $12 >>> 8; //@line 8 "../wslib/styleutils.c"
 $14 = $13&255; //@line 8 "../wslib/styleutils.c"
 $g = $14; //@line 8 "../wslib/styleutils.c"
 $15 = $5; //@line 9 "../wslib/styleutils.c"
 $16 = $15 & 16711680; //@line 9 "../wslib/styleutils.c"
 $17 = $16 >>> 16; //@line 9 "../wslib/styleutils.c"
 $18 = $17&255; //@line 9 "../wslib/styleutils.c"
 $b = $18; //@line 9 "../wslib/styleutils.c"
 $19 = $b; //@line 10 "../wslib/styleutils.c"
 $20 = $19&255; //@line 10 "../wslib/styleutils.c"
 $21 = ($20|0)>(155); //@line 10 "../wslib/styleutils.c"
 if ($21) {
  $27 = 255;
 } else {
  $22 = $b; //@line 10 "../wslib/styleutils.c"
  $23 = $22&255; //@line 10 "../wslib/styleutils.c"
  $24 = (($23) + 100)|0; //@line 10 "../wslib/styleutils.c"
  $25 = $24 & 255; //@line 10 "../wslib/styleutils.c"
  $27 = $25;
 }
 $26 = $27 << 16; //@line 10 "../wslib/styleutils.c"
 $28 = -16777216 | $26; //@line 10 "../wslib/styleutils.c"
 $29 = $g; //@line 10 "../wslib/styleutils.c"
 $30 = $29&255; //@line 10 "../wslib/styleutils.c"
 $31 = ($30|0)>(155); //@line 10 "../wslib/styleutils.c"
 if ($31) {
  $37 = 255;
 } else {
  $32 = $g; //@line 10 "../wslib/styleutils.c"
  $33 = $32&255; //@line 10 "../wslib/styleutils.c"
  $34 = (($33) + 100)|0; //@line 10 "../wslib/styleutils.c"
  $35 = $34 & 255; //@line 10 "../wslib/styleutils.c"
  $37 = $35;
 }
 $36 = $37 << 8; //@line 10 "../wslib/styleutils.c"
 $38 = $28 | $36; //@line 10 "../wslib/styleutils.c"
 $39 = $r; //@line 10 "../wslib/styleutils.c"
 $40 = $39&255; //@line 10 "../wslib/styleutils.c"
 $41 = ($40|0)>(155); //@line 10 "../wslib/styleutils.c"
 if ($41) {
  $47 = 255;
 } else {
  $42 = $r; //@line 10 "../wslib/styleutils.c"
  $43 = $42&255; //@line 10 "../wslib/styleutils.c"
  $44 = (($43) + 100)|0; //@line 10 "../wslib/styleutils.c"
  $45 = $44 & 255; //@line 10 "../wslib/styleutils.c"
  $47 = $45;
 }
 $46 = $38 | $47; //@line 10 "../wslib/styleutils.c"
 $light_color = $46; //@line 10 "../wslib/styleutils.c"
 $48 = $b; //@line 11 "../wslib/styleutils.c"
 $49 = $48&255; //@line 11 "../wslib/styleutils.c"
 $50 = ($49|0)<(100); //@line 11 "../wslib/styleutils.c"
 if ($50) {
  $56 = 0;
 } else {
  $51 = $b; //@line 11 "../wslib/styleutils.c"
  $52 = $51&255; //@line 11 "../wslib/styleutils.c"
  $53 = (($52) - 100)|0; //@line 11 "../wslib/styleutils.c"
  $54 = $53 & 255; //@line 11 "../wslib/styleutils.c"
  $56 = $54;
 }
 $55 = $56 << 16; //@line 11 "../wslib/styleutils.c"
 $57 = -16777216 | $55; //@line 11 "../wslib/styleutils.c"
 $58 = $g; //@line 11 "../wslib/styleutils.c"
 $59 = $58&255; //@line 11 "../wslib/styleutils.c"
 $60 = ($59|0)<(100); //@line 11 "../wslib/styleutils.c"
 if ($60) {
  $66 = 0;
 } else {
  $61 = $g; //@line 11 "../wslib/styleutils.c"
  $62 = $61&255; //@line 11 "../wslib/styleutils.c"
  $63 = (($62) - 100)|0; //@line 11 "../wslib/styleutils.c"
  $64 = $63 & 255; //@line 11 "../wslib/styleutils.c"
  $66 = $64;
 }
 $65 = $66 << 8; //@line 11 "../wslib/styleutils.c"
 $67 = $57 | $65; //@line 11 "../wslib/styleutils.c"
 $68 = $r; //@line 11 "../wslib/styleutils.c"
 $69 = $68&255; //@line 11 "../wslib/styleutils.c"
 $70 = ($69|0)<(100); //@line 11 "../wslib/styleutils.c"
 if ($70) {
  $76 = 0;
 } else {
  $71 = $r; //@line 11 "../wslib/styleutils.c"
  $72 = $71&255; //@line 11 "../wslib/styleutils.c"
  $73 = (($72) - 100)|0; //@line 11 "../wslib/styleutils.c"
  $74 = $73 & 255; //@line 11 "../wslib/styleutils.c"
  $76 = $74;
 }
 $75 = $67 | $76; //@line 11 "../wslib/styleutils.c"
 $shade_color = $75; //@line 11 "../wslib/styleutils.c"
 $77 = $7; //@line 15 "../wslib/styleutils.c"
 $78 = ($77|0)!=(0); //@line 15 "../wslib/styleutils.c"
 if ($78) {
  $79 = $shade_color; //@line 17 "../wslib/styleutils.c"
  $temp = $79; //@line 17 "../wslib/styleutils.c"
  $80 = $light_color; //@line 18 "../wslib/styleutils.c"
  $shade_color = $80; //@line 18 "../wslib/styleutils.c"
  $81 = $temp; //@line 19 "../wslib/styleutils.c"
  $light_color = $81; //@line 19 "../wslib/styleutils.c"
 }
 $i = 0; //@line 22 "../wslib/styleutils.c"
 while(1) {
  $82 = $i; //@line 22 "../wslib/styleutils.c"
  $83 = $6; //@line 22 "../wslib/styleutils.c"
  $84 = ($82|0)<($83|0); //@line 22 "../wslib/styleutils.c"
  if (!($84)) {
   break;
  }
  $85 = $0; //@line 25 "../wslib/styleutils.c"
  $86 = $1; //@line 25 "../wslib/styleutils.c"
  $87 = $i; //@line 25 "../wslib/styleutils.c"
  $88 = (($86) + ($87))|0; //@line 25 "../wslib/styleutils.c"
  $89 = $2; //@line 25 "../wslib/styleutils.c"
  $90 = $i; //@line 25 "../wslib/styleutils.c"
  $91 = (($89) + ($90))|0; //@line 25 "../wslib/styleutils.c"
  $92 = $3; //@line 25 "../wslib/styleutils.c"
  $93 = $i; //@line 25 "../wslib/styleutils.c"
  $94 = $93<<1; //@line 25 "../wslib/styleutils.c"
  $95 = (($92) - ($94))|0; //@line 25 "../wslib/styleutils.c"
  $96 = $light_color; //@line 25 "../wslib/styleutils.c"
  _Context_horizontal_line($85,$88,$91,$95,$96); //@line 25 "../wslib/styleutils.c"
  $97 = $0; //@line 28 "../wslib/styleutils.c"
  $98 = $1; //@line 28 "../wslib/styleutils.c"
  $99 = $i; //@line 28 "../wslib/styleutils.c"
  $100 = (($98) + ($99))|0; //@line 28 "../wslib/styleutils.c"
  $101 = $2; //@line 28 "../wslib/styleutils.c"
  $102 = $i; //@line 28 "../wslib/styleutils.c"
  $103 = (($101) + ($102))|0; //@line 28 "../wslib/styleutils.c"
  $104 = (($103) + 1)|0; //@line 28 "../wslib/styleutils.c"
  $105 = $4; //@line 28 "../wslib/styleutils.c"
  $106 = $i; //@line 28 "../wslib/styleutils.c"
  $107 = (($106) + 1)|0; //@line 28 "../wslib/styleutils.c"
  $108 = $107<<1; //@line 28 "../wslib/styleutils.c"
  $109 = (($105) - ($108))|0; //@line 28 "../wslib/styleutils.c"
  $110 = $light_color; //@line 28 "../wslib/styleutils.c"
  _Context_vertical_line($97,$100,$104,$109,$110); //@line 28 "../wslib/styleutils.c"
  $111 = $0; //@line 31 "../wslib/styleutils.c"
  $112 = $1; //@line 31 "../wslib/styleutils.c"
  $113 = $i; //@line 31 "../wslib/styleutils.c"
  $114 = (($112) + ($113))|0; //@line 31 "../wslib/styleutils.c"
  $115 = $2; //@line 31 "../wslib/styleutils.c"
  $116 = $4; //@line 31 "../wslib/styleutils.c"
  $117 = (($115) + ($116))|0; //@line 31 "../wslib/styleutils.c"
  $118 = $i; //@line 31 "../wslib/styleutils.c"
  $119 = (($118) + 1)|0; //@line 31 "../wslib/styleutils.c"
  $120 = (($117) - ($119))|0; //@line 31 "../wslib/styleutils.c"
  $121 = $3; //@line 31 "../wslib/styleutils.c"
  $122 = $i; //@line 31 "../wslib/styleutils.c"
  $123 = $122<<1; //@line 31 "../wslib/styleutils.c"
  $124 = (($121) - ($123))|0; //@line 31 "../wslib/styleutils.c"
  $125 = $shade_color; //@line 31 "../wslib/styleutils.c"
  _Context_horizontal_line($111,$114,$120,$124,$125); //@line 31 "../wslib/styleutils.c"
  $126 = $0; //@line 34 "../wslib/styleutils.c"
  $127 = $1; //@line 34 "../wslib/styleutils.c"
  $128 = $3; //@line 34 "../wslib/styleutils.c"
  $129 = (($127) + ($128))|0; //@line 34 "../wslib/styleutils.c"
  $130 = $i; //@line 34 "../wslib/styleutils.c"
  $131 = (($129) - ($130))|0; //@line 34 "../wslib/styleutils.c"
  $132 = (($131) - 1)|0; //@line 34 "../wslib/styleutils.c"
  $133 = $2; //@line 34 "../wslib/styleutils.c"
  $134 = $i; //@line 34 "../wslib/styleutils.c"
  $135 = (($133) + ($134))|0; //@line 34 "../wslib/styleutils.c"
  $136 = (($135) + 1)|0; //@line 34 "../wslib/styleutils.c"
  $137 = $4; //@line 34 "../wslib/styleutils.c"
  $138 = $i; //@line 34 "../wslib/styleutils.c"
  $139 = (($138) + 1)|0; //@line 34 "../wslib/styleutils.c"
  $140 = $139<<1; //@line 34 "../wslib/styleutils.c"
  $141 = (($137) - ($140))|0; //@line 34 "../wslib/styleutils.c"
  $142 = $shade_color; //@line 34 "../wslib/styleutils.c"
  _Context_vertical_line($126,$132,$136,$141,$142); //@line 34 "../wslib/styleutils.c"
  $143 = $i; //@line 22 "../wslib/styleutils.c"
  $144 = (($143) + 1)|0; //@line 22 "../wslib/styleutils.c"
  $i = $144; //@line 22 "../wslib/styleutils.c"
 }
 STACKTOP = sp;return; //@line 36 "../wslib/styleutils.c"
}
function _List_new() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $list = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = (_malloc(12)|0); //@line 13 "../wslib/list.c"
 $list = $1; //@line 13 "../wslib/list.c"
 $2 = ($1|0)!=(0|0); //@line 13 "../wslib/list.c"
 $3 = $list; //@line 18 "../wslib/list.c"
 if ($2) {
  _Object_init($3,3); //@line 18 "../wslib/list.c"
  $4 = $list; //@line 19 "../wslib/list.c"
  $5 = ((($4)) + 4|0); //@line 19 "../wslib/list.c"
  HEAP32[$5>>2] = 0; //@line 19 "../wslib/list.c"
  $6 = $list; //@line 20 "../wslib/list.c"
  $7 = ((($6)) + 8|0); //@line 20 "../wslib/list.c"
  HEAP32[$7>>2] = 0; //@line 20 "../wslib/list.c"
  $8 = $list; //@line 22 "../wslib/list.c"
  $0 = $8; //@line 22 "../wslib/list.c"
  $9 = $0; //@line 23 "../wslib/list.c"
  STACKTOP = sp;return ($9|0); //@line 23 "../wslib/list.c"
 } else {
  $0 = $3; //@line 14 "../wslib/list.c"
  $9 = $0; //@line 23 "../wslib/list.c"
  STACKTOP = sp;return ($9|0); //@line 23 "../wslib/list.c"
 }
 return (0)|0;
}
function _List_delete($list_object) {
 $list_object = $list_object|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $list = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $list_object;
 $1 = $0; //@line 137 "../wslib/list.c"
 $list = $1; //@line 137 "../wslib/list.c"
 $2 = $0; //@line 139 "../wslib/list.c"
 $3 = ($2|0)!=(0|0); //@line 139 "../wslib/list.c"
 if (!($3)) {
  STACKTOP = sp;return; //@line 148 "../wslib/list.c"
 }
 while(1) {
  $4 = $list; //@line 143 "../wslib/list.c"
  $5 = ((($4)) + 4|0); //@line 143 "../wslib/list.c"
  $6 = HEAP32[$5>>2]|0; //@line 143 "../wslib/list.c"
  $7 = ($6|0)!=(0); //@line 143 "../wslib/list.c"
  $8 = $list; //@line 144 "../wslib/list.c"
  if (!($7)) {
   break;
  }
  $9 = (_List_remove_at($8,0)|0); //@line 144 "../wslib/list.c"
  _Object_delete($9); //@line 144 "../wslib/list.c"
 }
 _free($8); //@line 147 "../wslib/list.c"
 STACKTOP = sp;return; //@line 148 "../wslib/list.c"
}
function _List_add($list,$payload) {
 $list = $list|0;
 $payload = $payload|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $current_node = 0, $new_node = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $list;
 $2 = $payload;
 $3 = $2; //@line 31 "../wslib/list.c"
 $4 = (_ListNode_new($3)|0); //@line 31 "../wslib/list.c"
 $new_node = $4; //@line 31 "../wslib/list.c"
 $5 = ($4|0)!=(0|0); //@line 31 "../wslib/list.c"
 if (!($5)) {
  $0 = 0; //@line 32 "../wslib/list.c"
  $33 = $0; //@line 57 "../wslib/list.c"
  STACKTOP = sp;return ($33|0); //@line 57 "../wslib/list.c"
 }
 $6 = $1; //@line 36 "../wslib/list.c"
 $7 = ((($6)) + 8|0); //@line 36 "../wslib/list.c"
 $8 = HEAP32[$7>>2]|0; //@line 36 "../wslib/list.c"
 $9 = ($8|0)!=(0|0); //@line 36 "../wslib/list.c"
 if ($9) {
  $13 = $1; //@line 42 "../wslib/list.c"
  $14 = ((($13)) + 8|0); //@line 42 "../wslib/list.c"
  $15 = HEAP32[$14>>2]|0; //@line 42 "../wslib/list.c"
  $current_node = $15; //@line 42 "../wslib/list.c"
  while(1) {
   $16 = $current_node; //@line 45 "../wslib/list.c"
   $17 = ((($16)) + 12|0); //@line 45 "../wslib/list.c"
   $18 = HEAP32[$17>>2]|0; //@line 45 "../wslib/list.c"
   $19 = ($18|0)!=(0|0); //@line 45 "../wslib/list.c"
   if (!($19)) {
    break;
   }
   $20 = $current_node; //@line 46 "../wslib/list.c"
   $21 = ((($20)) + 12|0); //@line 46 "../wslib/list.c"
   $22 = HEAP32[$21>>2]|0; //@line 46 "../wslib/list.c"
   $current_node = $22; //@line 46 "../wslib/list.c"
  }
  $23 = $new_node; //@line 49 "../wslib/list.c"
  $24 = $current_node; //@line 49 "../wslib/list.c"
  $25 = ((($24)) + 12|0); //@line 49 "../wslib/list.c"
  HEAP32[$25>>2] = $23; //@line 49 "../wslib/list.c"
  $26 = $current_node; //@line 50 "../wslib/list.c"
  $27 = $new_node; //@line 50 "../wslib/list.c"
  $28 = ((($27)) + 8|0); //@line 50 "../wslib/list.c"
  HEAP32[$28>>2] = $26; //@line 50 "../wslib/list.c"
 } else {
  $10 = $new_node; //@line 38 "../wslib/list.c"
  $11 = $1; //@line 38 "../wslib/list.c"
  $12 = ((($11)) + 8|0); //@line 38 "../wslib/list.c"
  HEAP32[$12>>2] = $10; //@line 38 "../wslib/list.c"
 }
 $29 = $1; //@line 54 "../wslib/list.c"
 $30 = ((($29)) + 4|0); //@line 54 "../wslib/list.c"
 $31 = HEAP32[$30>>2]|0; //@line 54 "../wslib/list.c"
 $32 = (($31) + 1)|0; //@line 54 "../wslib/list.c"
 HEAP32[$30>>2] = $32; //@line 54 "../wslib/list.c"
 $0 = 1; //@line 56 "../wslib/list.c"
 $33 = $0; //@line 57 "../wslib/list.c"
 STACKTOP = sp;return ($33|0); //@line 57 "../wslib/list.c"
}
function _List_get_at($list,$index) {
 $list = $list|0;
 $index = $index|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $current_index = 0, $current_node = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $list;
 $2 = $index;
 $3 = $1; //@line 65 "../wslib/list.c"
 $4 = ((($3)) + 4|0); //@line 65 "../wslib/list.c"
 $5 = HEAP32[$4>>2]|0; //@line 65 "../wslib/list.c"
 $6 = ($5|0)==(0); //@line 65 "../wslib/list.c"
 if (!($6)) {
  $7 = $2; //@line 65 "../wslib/list.c"
  $8 = $1; //@line 65 "../wslib/list.c"
  $9 = ((($8)) + 4|0); //@line 65 "../wslib/list.c"
  $10 = HEAP32[$9>>2]|0; //@line 65 "../wslib/list.c"
  $11 = ($7>>>0)>=($10>>>0); //@line 65 "../wslib/list.c"
  if (!($11)) {
   $12 = $1; //@line 69 "../wslib/list.c"
   $13 = ((($12)) + 8|0); //@line 69 "../wslib/list.c"
   $14 = HEAP32[$13>>2]|0; //@line 69 "../wslib/list.c"
   $current_node = $14; //@line 69 "../wslib/list.c"
   $current_index = 0; //@line 72 "../wslib/list.c"
   while(1) {
    $15 = $current_index; //@line 72 "../wslib/list.c"
    $16 = $2; //@line 72 "../wslib/list.c"
    $17 = ($15>>>0)<($16>>>0); //@line 72 "../wslib/list.c"
    $18 = $current_node; //@line 72 "../wslib/list.c"
    $19 = ($18|0)!=(0|0); //@line 72 "../wslib/list.c"
    $20 = $17 ? $19 : 0; //@line 72 "../wslib/list.c"
    $21 = $current_node; //@line 73 "../wslib/list.c"
    if (!($20)) {
     break;
    }
    $22 = ((($21)) + 12|0); //@line 73 "../wslib/list.c"
    $23 = HEAP32[$22>>2]|0; //@line 73 "../wslib/list.c"
    $current_node = $23; //@line 73 "../wslib/list.c"
    $24 = $current_index; //@line 72 "../wslib/list.c"
    $25 = (($24) + 1)|0; //@line 72 "../wslib/list.c"
    $current_index = $25; //@line 72 "../wslib/list.c"
   }
   $26 = ($21|0)!=(0|0); //@line 76 "../wslib/list.c"
   if ($26) {
    $27 = $current_node; //@line 76 "../wslib/list.c"
    $28 = ((($27)) + 4|0); //@line 76 "../wslib/list.c"
    $29 = HEAP32[$28>>2]|0; //@line 76 "../wslib/list.c"
    $30 = $29;
   } else {
    $30 = 0;
   }
   $0 = $30; //@line 76 "../wslib/list.c"
   $31 = $0; //@line 77 "../wslib/list.c"
   STACKTOP = sp;return ($31|0); //@line 77 "../wslib/list.c"
  }
 }
 $0 = 0; //@line 66 "../wslib/list.c"
 $31 = $0; //@line 77 "../wslib/list.c"
 STACKTOP = sp;return ($31|0); //@line 77 "../wslib/list.c"
}
function _List_remove_at($list,$index) {
 $list = $list|0;
 $index = $index|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $7 = 0, $8 = 0, $9 = 0, $current_index = 0, $current_node = 0, $payload = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $list;
 $2 = $index;
 $3 = $1; //@line 89 "../wslib/list.c"
 $4 = ((($3)) + 4|0); //@line 89 "../wslib/list.c"
 $5 = HEAP32[$4>>2]|0; //@line 89 "../wslib/list.c"
 $6 = ($5|0)==(0); //@line 89 "../wslib/list.c"
 if (!($6)) {
  $7 = $2; //@line 89 "../wslib/list.c"
  $8 = $1; //@line 89 "../wslib/list.c"
  $9 = ((($8)) + 4|0); //@line 89 "../wslib/list.c"
  $10 = HEAP32[$9>>2]|0; //@line 89 "../wslib/list.c"
  $11 = ($7>>>0)>=($10>>>0); //@line 89 "../wslib/list.c"
  if (!($11)) {
   $12 = $1; //@line 93 "../wslib/list.c"
   $13 = ((($12)) + 8|0); //@line 93 "../wslib/list.c"
   $14 = HEAP32[$13>>2]|0; //@line 93 "../wslib/list.c"
   $current_node = $14; //@line 93 "../wslib/list.c"
   $current_index = 0; //@line 95 "../wslib/list.c"
   while(1) {
    $15 = $current_index; //@line 95 "../wslib/list.c"
    $16 = $2; //@line 95 "../wslib/list.c"
    $17 = ($15>>>0)<($16>>>0); //@line 95 "../wslib/list.c"
    $18 = $current_node; //@line 95 "../wslib/list.c"
    $19 = ($18|0)!=(0|0); //@line 95 "../wslib/list.c"
    $20 = $17 ? $19 : 0; //@line 95 "../wslib/list.c"
    $21 = $current_node; //@line 96 "../wslib/list.c"
    if (!($20)) {
     break;
    }
    $22 = ((($21)) + 12|0); //@line 96 "../wslib/list.c"
    $23 = HEAP32[$22>>2]|0; //@line 96 "../wslib/list.c"
    $current_node = $23; //@line 96 "../wslib/list.c"
    $24 = $current_index; //@line 95 "../wslib/list.c"
    $25 = (($24) + 1)|0; //@line 95 "../wslib/list.c"
    $current_index = $25; //@line 95 "../wslib/list.c"
   }
   $26 = ($21|0)!=(0|0); //@line 103 "../wslib/list.c"
   if (!($26)) {
    $0 = 0; //@line 104 "../wslib/list.c"
    $65 = $0; //@line 129 "../wslib/list.c"
    STACKTOP = sp;return ($65|0); //@line 129 "../wslib/list.c"
   }
   $27 = $current_node; //@line 107 "../wslib/list.c"
   $28 = ((($27)) + 4|0); //@line 107 "../wslib/list.c"
   $29 = HEAP32[$28>>2]|0; //@line 107 "../wslib/list.c"
   $payload = $29; //@line 107 "../wslib/list.c"
   $30 = $current_node; //@line 110 "../wslib/list.c"
   $31 = ((($30)) + 8|0); //@line 110 "../wslib/list.c"
   $32 = HEAP32[$31>>2]|0; //@line 110 "../wslib/list.c"
   $33 = ($32|0)!=(0|0); //@line 110 "../wslib/list.c"
   if ($33) {
    $34 = $current_node; //@line 111 "../wslib/list.c"
    $35 = ((($34)) + 12|0); //@line 111 "../wslib/list.c"
    $36 = HEAP32[$35>>2]|0; //@line 111 "../wslib/list.c"
    $37 = $current_node; //@line 111 "../wslib/list.c"
    $38 = ((($37)) + 8|0); //@line 111 "../wslib/list.c"
    $39 = HEAP32[$38>>2]|0; //@line 111 "../wslib/list.c"
    $40 = ((($39)) + 12|0); //@line 111 "../wslib/list.c"
    HEAP32[$40>>2] = $36; //@line 111 "../wslib/list.c"
   }
   $41 = $current_node; //@line 113 "../wslib/list.c"
   $42 = ((($41)) + 12|0); //@line 113 "../wslib/list.c"
   $43 = HEAP32[$42>>2]|0; //@line 113 "../wslib/list.c"
   $44 = ($43|0)!=(0|0); //@line 113 "../wslib/list.c"
   if ($44) {
    $45 = $current_node; //@line 114 "../wslib/list.c"
    $46 = ((($45)) + 8|0); //@line 114 "../wslib/list.c"
    $47 = HEAP32[$46>>2]|0; //@line 114 "../wslib/list.c"
    $48 = $current_node; //@line 114 "../wslib/list.c"
    $49 = ((($48)) + 12|0); //@line 114 "../wslib/list.c"
    $50 = HEAP32[$49>>2]|0; //@line 114 "../wslib/list.c"
    $51 = ((($50)) + 8|0); //@line 114 "../wslib/list.c"
    HEAP32[$51>>2] = $47; //@line 114 "../wslib/list.c"
   }
   $52 = $2; //@line 118 "../wslib/list.c"
   $53 = ($52|0)==(0); //@line 118 "../wslib/list.c"
   if ($53) {
    $54 = $current_node; //@line 119 "../wslib/list.c"
    $55 = ((($54)) + 12|0); //@line 119 "../wslib/list.c"
    $56 = HEAP32[$55>>2]|0; //@line 119 "../wslib/list.c"
    $57 = $1; //@line 119 "../wslib/list.c"
    $58 = ((($57)) + 8|0); //@line 119 "../wslib/list.c"
    HEAP32[$58>>2] = $56; //@line 119 "../wslib/list.c"
   }
   $59 = $current_node; //@line 122 "../wslib/list.c"
   _Object_delete($59); //@line 122 "../wslib/list.c"
   $60 = $1; //@line 125 "../wslib/list.c"
   $61 = ((($60)) + 4|0); //@line 125 "../wslib/list.c"
   $62 = HEAP32[$61>>2]|0; //@line 125 "../wslib/list.c"
   $63 = (($62) + -1)|0; //@line 125 "../wslib/list.c"
   HEAP32[$61>>2] = $63; //@line 125 "../wslib/list.c"
   $64 = $payload; //@line 128 "../wslib/list.c"
   $0 = $64; //@line 128 "../wslib/list.c"
   $65 = $0; //@line 129 "../wslib/list.c"
   STACKTOP = sp;return ($65|0); //@line 129 "../wslib/list.c"
  }
 }
 $0 = 0; //@line 90 "../wslib/list.c"
 $65 = $0; //@line 129 "../wslib/list.c"
 STACKTOP = sp;return ($65|0); //@line 129 "../wslib/list.c"
}
function _AssociativeArray_new() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $associative_array = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = (_malloc(12)|0); //@line 7 "../wslib/associativearray.c"
 $associative_array = $1; //@line 6 "../wslib/associativearray.c"
 $2 = $associative_array; //@line 9 "../wslib/associativearray.c"
 $3 = ($2|0)!=(0|0); //@line 9 "../wslib/associativearray.c"
 $4 = $associative_array; //@line 12 "../wslib/associativearray.c"
 if (!($3)) {
  $0 = $4; //@line 10 "../wslib/associativearray.c"
  $21 = $0; //@line 23 "../wslib/associativearray.c"
  STACKTOP = sp;return ($21|0); //@line 23 "../wslib/associativearray.c"
 }
 _Object_init($4,4); //@line 12 "../wslib/associativearray.c"
 $5 = (_List_new()|0); //@line 13 "../wslib/associativearray.c"
 $6 = $associative_array; //@line 13 "../wslib/associativearray.c"
 $7 = ((($6)) + 4|0); //@line 13 "../wslib/associativearray.c"
 HEAP32[$7>>2] = $5; //@line 13 "../wslib/associativearray.c"
 $8 = (_List_new()|0); //@line 14 "../wslib/associativearray.c"
 $9 = $associative_array; //@line 14 "../wslib/associativearray.c"
 $10 = ((($9)) + 8|0); //@line 14 "../wslib/associativearray.c"
 HEAP32[$10>>2] = $8; //@line 14 "../wslib/associativearray.c"
 $11 = $associative_array; //@line 16 "../wslib/associativearray.c"
 $12 = ((($11)) + 4|0); //@line 16 "../wslib/associativearray.c"
 $13 = HEAP32[$12>>2]|0; //@line 16 "../wslib/associativearray.c"
 $14 = ($13|0)!=(0|0); //@line 16 "../wslib/associativearray.c"
 if ($14) {
  $15 = $associative_array; //@line 16 "../wslib/associativearray.c"
  $16 = ((($15)) + 8|0); //@line 16 "../wslib/associativearray.c"
  $17 = HEAP32[$16>>2]|0; //@line 16 "../wslib/associativearray.c"
  $18 = ($17|0)!=(0|0); //@line 16 "../wslib/associativearray.c"
  if ($18) {
   $20 = $associative_array; //@line 22 "../wslib/associativearray.c"
   $0 = $20; //@line 22 "../wslib/associativearray.c"
   $21 = $0; //@line 23 "../wslib/associativearray.c"
   STACKTOP = sp;return ($21|0); //@line 23 "../wslib/associativearray.c"
  }
 }
 $19 = $associative_array; //@line 18 "../wslib/associativearray.c"
 _Object_delete($19); //@line 18 "../wslib/associativearray.c"
 $0 = 0; //@line 19 "../wslib/associativearray.c"
 $21 = $0; //@line 23 "../wslib/associativearray.c"
 STACKTOP = sp;return ($21|0); //@line 23 "../wslib/associativearray.c"
}
function _AssociativeArray_delete_function($associative_array_object) {
 $associative_array_object = $associative_array_object|0;
 var $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $associative_array = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $associative_array_object;
 $1 = $0; //@line 27 "../wslib/associativearray.c"
 $2 = ($1|0)!=(0|0); //@line 27 "../wslib/associativearray.c"
 if (!($2)) {
  STACKTOP = sp;return; //@line 36 "../wslib/associativearray.c"
 }
 $3 = $0; //@line 31 "../wslib/associativearray.c"
 $associative_array = $3; //@line 30 "../wslib/associativearray.c"
 $4 = $associative_array; //@line 33 "../wslib/associativearray.c"
 $5 = ((($4)) + 4|0); //@line 33 "../wslib/associativearray.c"
 $6 = HEAP32[$5>>2]|0; //@line 33 "../wslib/associativearray.c"
 _Object_delete($6); //@line 33 "../wslib/associativearray.c"
 $7 = $associative_array; //@line 34 "../wslib/associativearray.c"
 $8 = ((($7)) + 8|0); //@line 34 "../wslib/associativearray.c"
 $9 = HEAP32[$8>>2]|0; //@line 34 "../wslib/associativearray.c"
 _Object_delete($9); //@line 34 "../wslib/associativearray.c"
 $10 = $0; //@line 35 "../wslib/associativearray.c"
 _Object_default_delete_function($10); //@line 35 "../wslib/associativearray.c"
 STACKTOP = sp;return; //@line 36 "../wslib/associativearray.c"
}
function _AssociativeArray_get($associative_array,$key) {
 $associative_array = $associative_array|0;
 $key = $key|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $associative_array;
 $2 = $key;
 $i = 0; //@line 42 "../wslib/associativearray.c"
 while(1) {
  $3 = $i; //@line 42 "../wslib/associativearray.c"
  $4 = $1; //@line 42 "../wslib/associativearray.c"
  $5 = ((($4)) + 4|0); //@line 42 "../wslib/associativearray.c"
  $6 = HEAP32[$5>>2]|0; //@line 42 "../wslib/associativearray.c"
  $7 = ((($6)) + 4|0); //@line 42 "../wslib/associativearray.c"
  $8 = HEAP32[$7>>2]|0; //@line 42 "../wslib/associativearray.c"
  $9 = ($3>>>0)<($8>>>0); //@line 42 "../wslib/associativearray.c"
  if (!($9)) {
   break;
  }
  $10 = $1; //@line 43 "../wslib/associativearray.c"
  $11 = ((($10)) + 4|0); //@line 43 "../wslib/associativearray.c"
  $12 = HEAP32[$11>>2]|0; //@line 43 "../wslib/associativearray.c"
  $13 = $i; //@line 43 "../wslib/associativearray.c"
  $14 = (_List_get_at($12,$13)|0); //@line 43 "../wslib/associativearray.c"
  $15 = $2; //@line 43 "../wslib/associativearray.c"
  $16 = (_String_compare($14,$15)|0); //@line 43 "../wslib/associativearray.c"
  $17 = ($16|0)!=(0); //@line 43 "../wslib/associativearray.c"
  if ($17) {
   break;
  }
  $18 = $i; //@line 42 "../wslib/associativearray.c"
  $19 = (($18) + 1)|0; //@line 42 "../wslib/associativearray.c"
  $i = $19; //@line 42 "../wslib/associativearray.c"
 }
 $20 = $i; //@line 46 "../wslib/associativearray.c"
 $21 = $1; //@line 46 "../wslib/associativearray.c"
 $22 = ((($21)) + 4|0); //@line 46 "../wslib/associativearray.c"
 $23 = HEAP32[$22>>2]|0; //@line 46 "../wslib/associativearray.c"
 $24 = ((($23)) + 4|0); //@line 46 "../wslib/associativearray.c"
 $25 = HEAP32[$24>>2]|0; //@line 46 "../wslib/associativearray.c"
 $26 = ($20|0)==($25|0); //@line 46 "../wslib/associativearray.c"
 if ($26) {
  $0 = 0; //@line 47 "../wslib/associativearray.c"
  $32 = $0; //@line 50 "../wslib/associativearray.c"
  STACKTOP = sp;return ($32|0); //@line 50 "../wslib/associativearray.c"
 } else {
  $27 = $1; //@line 49 "../wslib/associativearray.c"
  $28 = ((($27)) + 8|0); //@line 49 "../wslib/associativearray.c"
  $29 = HEAP32[$28>>2]|0; //@line 49 "../wslib/associativearray.c"
  $30 = $i; //@line 49 "../wslib/associativearray.c"
  $31 = (_List_get_at($29,$30)|0); //@line 49 "../wslib/associativearray.c"
  $0 = $31; //@line 49 "../wslib/associativearray.c"
  $32 = $0; //@line 50 "../wslib/associativearray.c"
  STACKTOP = sp;return ($32|0); //@line 50 "../wslib/associativearray.c"
 }
 return (0)|0;
}
function _AssociativeArray_add($associative_array,$key,$value) {
 $associative_array = $associative_array|0;
 $key = $key|0;
 $value = $value|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $associative_array;
 $2 = $key;
 $3 = $value;
 $4 = $1; //@line 54 "../wslib/associativearray.c"
 $5 = ((($4)) + 4|0); //@line 54 "../wslib/associativearray.c"
 $6 = HEAP32[$5>>2]|0; //@line 54 "../wslib/associativearray.c"
 $7 = $2; //@line 54 "../wslib/associativearray.c"
 $8 = (_List_add($6,$7)|0); //@line 54 "../wslib/associativearray.c"
 $9 = ($8|0)!=(0); //@line 54 "../wslib/associativearray.c"
 if ($9) {
  $10 = $1; //@line 57 "../wslib/associativearray.c"
  $11 = ((($10)) + 8|0); //@line 57 "../wslib/associativearray.c"
  $12 = HEAP32[$11>>2]|0; //@line 57 "../wslib/associativearray.c"
  $13 = $3; //@line 57 "../wslib/associativearray.c"
  $14 = (_List_add($12,$13)|0); //@line 57 "../wslib/associativearray.c"
  $0 = $14; //@line 57 "../wslib/associativearray.c"
  $15 = $0; //@line 58 "../wslib/associativearray.c"
  STACKTOP = sp;return ($15|0); //@line 58 "../wslib/associativearray.c"
 } else {
  $0 = 0; //@line 55 "../wslib/associativearray.c"
  $15 = $0; //@line 58 "../wslib/associativearray.c"
  STACKTOP = sp;return ($15|0); //@line 58 "../wslib/associativearray.c"
 }
 return (0)|0;
}
function _Context_new($width,$height,$buffer) {
 $width = $width|0;
 $height = $height|0;
 $buffer = $buffer|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $context = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $width;
 $2 = $height;
 $3 = $buffer;
 $4 = (_malloc(32)|0); //@line 16 "../wslib/context.c"
 $context = $4; //@line 16 "../wslib/context.c"
 $5 = ($4|0)!=(0|0); //@line 16 "../wslib/context.c"
 $6 = $context; //@line 20 "../wslib/context.c"
 if (!($5)) {
  $0 = $6; //@line 17 "../wslib/context.c"
  $32 = $0; //@line 39 "../wslib/context.c"
  STACKTOP = sp;return ($32|0); //@line 39 "../wslib/context.c"
 }
 _Object_init($6,5); //@line 20 "../wslib/context.c"
 $7 = (_List_new()|0); //@line 23 "../wslib/context.c"
 $8 = $context; //@line 23 "../wslib/context.c"
 $9 = ((($8)) + 24|0); //@line 23 "../wslib/context.c"
 HEAP32[$9>>2] = $7; //@line 23 "../wslib/context.c"
 $10 = ($7|0)!=(0|0); //@line 23 "../wslib/context.c"
 if ($10) {
  $12 = HEAP32[40>>2]|0; //@line 30 "../wslib/context.c"
  $13 = (($12) + 1)|0; //@line 30 "../wslib/context.c"
  HEAP32[40>>2] = $13; //@line 30 "../wslib/context.c"
  $14 = $context; //@line 30 "../wslib/context.c"
  $15 = ((($14)) + 4|0); //@line 30 "../wslib/context.c"
  HEAP32[$15>>2] = $13; //@line 30 "../wslib/context.c"
  $16 = $context; //@line 31 "../wslib/context.c"
  $17 = ((($16)) + 16|0); //@line 31 "../wslib/context.c"
  HEAP32[$17>>2] = 0; //@line 31 "../wslib/context.c"
  $18 = $context; //@line 32 "../wslib/context.c"
  $19 = ((($18)) + 20|0); //@line 32 "../wslib/context.c"
  HEAP32[$19>>2] = 0; //@line 32 "../wslib/context.c"
  $20 = $1; //@line 33 "../wslib/context.c"
  $21 = $context; //@line 33 "../wslib/context.c"
  $22 = ((($21)) + 12|0); //@line 33 "../wslib/context.c"
  HEAP16[$22>>1] = $20; //@line 33 "../wslib/context.c"
  $23 = $2; //@line 34 "../wslib/context.c"
  $24 = $context; //@line 34 "../wslib/context.c"
  $25 = ((($24)) + 14|0); //@line 34 "../wslib/context.c"
  HEAP16[$25>>1] = $23; //@line 34 "../wslib/context.c"
  $26 = $3; //@line 35 "../wslib/context.c"
  $27 = $context; //@line 35 "../wslib/context.c"
  $28 = ((($27)) + 8|0); //@line 35 "../wslib/context.c"
  HEAP32[$28>>2] = $26; //@line 35 "../wslib/context.c"
  $29 = $context; //@line 36 "../wslib/context.c"
  $30 = ((($29)) + 28|0); //@line 36 "../wslib/context.c"
  HEAP8[$30>>0] = 0; //@line 36 "../wslib/context.c"
  $31 = $context; //@line 38 "../wslib/context.c"
  $0 = $31; //@line 38 "../wslib/context.c"
  $32 = $0; //@line 39 "../wslib/context.c"
  STACKTOP = sp;return ($32|0); //@line 39 "../wslib/context.c"
 } else {
  $11 = $context; //@line 25 "../wslib/context.c"
  _free($11); //@line 25 "../wslib/context.c"
  $0 = 0; //@line 26 "../wslib/context.c"
  $32 = $0; //@line 39 "../wslib/context.c"
  STACKTOP = sp;return ($32|0); //@line 39 "../wslib/context.c"
 }
 return (0)|0;
}
function _Context_delete_function($context_object) {
 $context_object = $context_object|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $context = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context_object;
 $1 = $0; //@line 49 "../wslib/context.c"
 $context = $1; //@line 49 "../wslib/context.c"
 $2 = $0; //@line 51 "../wslib/context.c"
 $3 = ($2|0)!=(0|0); //@line 51 "../wslib/context.c"
 if (!($3)) {
  STACKTOP = sp;return; //@line 56 "../wslib/context.c"
 }
 $4 = $context; //@line 54 "../wslib/context.c"
 $5 = ((($4)) + 24|0); //@line 54 "../wslib/context.c"
 $6 = HEAP32[$5>>2]|0; //@line 54 "../wslib/context.c"
 _Object_delete($6); //@line 54 "../wslib/context.c"
 $7 = $context; //@line 55 "../wslib/context.c"
 _free($7); //@line 55 "../wslib/context.c"
 STACKTOP = sp;return; //@line 56 "../wslib/context.c"
}
function _Context_new_from($source_context) {
 $source_context = $source_context|0;
 var $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $source_context;
 $1 = $0; //@line 44 "../wslib/context.c"
 $2 = ((($1)) + 12|0); //@line 44 "../wslib/context.c"
 $3 = HEAP16[$2>>1]|0; //@line 44 "../wslib/context.c"
 $4 = $0; //@line 44 "../wslib/context.c"
 $5 = ((($4)) + 14|0); //@line 44 "../wslib/context.c"
 $6 = HEAP16[$5>>1]|0; //@line 44 "../wslib/context.c"
 $7 = $0; //@line 44 "../wslib/context.c"
 $8 = ((($7)) + 8|0); //@line 44 "../wslib/context.c"
 $9 = HEAP32[$8>>2]|0; //@line 44 "../wslib/context.c"
 $10 = (_Context_new($3,$6,$9)|0); //@line 44 "../wslib/context.c"
 STACKTOP = sp;return ($10|0); //@line 44 "../wslib/context.c"
}
function _Context_clipped_rect($context,$x,$y,$width,$height,$clip_area,$color) {
 $context = $context|0;
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 $height = $height|0;
 $clip_area = $clip_area|0;
 $color = $color|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $cur_x = 0, $max_x = 0, $max_y = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $x;
 $2 = $y;
 $3 = $width;
 $4 = $height;
 $5 = $clip_area;
 $6 = $color;
 $7 = $1; //@line 62 "../wslib/context.c"
 $8 = $3; //@line 62 "../wslib/context.c"
 $9 = (($7) + ($8))|0; //@line 62 "../wslib/context.c"
 $max_x = $9; //@line 62 "../wslib/context.c"
 $10 = $2; //@line 63 "../wslib/context.c"
 $11 = $4; //@line 63 "../wslib/context.c"
 $12 = (($10) + ($11))|0; //@line 63 "../wslib/context.c"
 $max_y = $12; //@line 63 "../wslib/context.c"
 $13 = $0; //@line 66 "../wslib/context.c"
 $14 = ((($13)) + 16|0); //@line 66 "../wslib/context.c"
 $15 = HEAP32[$14>>2]|0; //@line 66 "../wslib/context.c"
 $16 = $1; //@line 66 "../wslib/context.c"
 $17 = (($16) + ($15))|0; //@line 66 "../wslib/context.c"
 $1 = $17; //@line 66 "../wslib/context.c"
 $18 = $0; //@line 67 "../wslib/context.c"
 $19 = ((($18)) + 20|0); //@line 67 "../wslib/context.c"
 $20 = HEAP32[$19>>2]|0; //@line 67 "../wslib/context.c"
 $21 = $2; //@line 67 "../wslib/context.c"
 $22 = (($21) + ($20))|0; //@line 67 "../wslib/context.c"
 $2 = $22; //@line 67 "../wslib/context.c"
 $23 = $0; //@line 68 "../wslib/context.c"
 $24 = ((($23)) + 16|0); //@line 68 "../wslib/context.c"
 $25 = HEAP32[$24>>2]|0; //@line 68 "../wslib/context.c"
 $26 = $max_x; //@line 68 "../wslib/context.c"
 $27 = (($26) + ($25))|0; //@line 68 "../wslib/context.c"
 $max_x = $27; //@line 68 "../wslib/context.c"
 $28 = $0; //@line 69 "../wslib/context.c"
 $29 = ((($28)) + 20|0); //@line 69 "../wslib/context.c"
 $30 = HEAP32[$29>>2]|0; //@line 69 "../wslib/context.c"
 $31 = $max_y; //@line 69 "../wslib/context.c"
 $32 = (($31) + ($30))|0; //@line 69 "../wslib/context.c"
 $max_y = $32; //@line 69 "../wslib/context.c"
 $33 = $1; //@line 72 "../wslib/context.c"
 $34 = $5; //@line 72 "../wslib/context.c"
 $35 = ((($34)) + 8|0); //@line 72 "../wslib/context.c"
 $36 = HEAP32[$35>>2]|0; //@line 72 "../wslib/context.c"
 $37 = ($33|0)<($36|0); //@line 72 "../wslib/context.c"
 if ($37) {
  $38 = $5; //@line 73 "../wslib/context.c"
  $39 = ((($38)) + 8|0); //@line 73 "../wslib/context.c"
  $40 = HEAP32[$39>>2]|0; //@line 73 "../wslib/context.c"
  $1 = $40; //@line 73 "../wslib/context.c"
 }
 $41 = $2; //@line 75 "../wslib/context.c"
 $42 = $5; //@line 75 "../wslib/context.c"
 $43 = ((($42)) + 4|0); //@line 75 "../wslib/context.c"
 $44 = HEAP32[$43>>2]|0; //@line 75 "../wslib/context.c"
 $45 = ($41|0)<($44|0); //@line 75 "../wslib/context.c"
 if ($45) {
  $46 = $5; //@line 76 "../wslib/context.c"
  $47 = ((($46)) + 4|0); //@line 76 "../wslib/context.c"
  $48 = HEAP32[$47>>2]|0; //@line 76 "../wslib/context.c"
  $2 = $48; //@line 76 "../wslib/context.c"
 }
 $49 = $max_x; //@line 78 "../wslib/context.c"
 $50 = $5; //@line 78 "../wslib/context.c"
 $51 = ((($50)) + 16|0); //@line 78 "../wslib/context.c"
 $52 = HEAP32[$51>>2]|0; //@line 78 "../wslib/context.c"
 $53 = (($52) + 1)|0; //@line 78 "../wslib/context.c"
 $54 = ($49|0)>($53|0); //@line 78 "../wslib/context.c"
 if ($54) {
  $55 = $5; //@line 79 "../wslib/context.c"
  $56 = ((($55)) + 16|0); //@line 79 "../wslib/context.c"
  $57 = HEAP32[$56>>2]|0; //@line 79 "../wslib/context.c"
  $58 = (($57) + 1)|0; //@line 79 "../wslib/context.c"
  $max_x = $58; //@line 79 "../wslib/context.c"
 }
 $59 = $max_y; //@line 81 "../wslib/context.c"
 $60 = $5; //@line 81 "../wslib/context.c"
 $61 = ((($60)) + 12|0); //@line 81 "../wslib/context.c"
 $62 = HEAP32[$61>>2]|0; //@line 81 "../wslib/context.c"
 $63 = (($62) + 1)|0; //@line 81 "../wslib/context.c"
 $64 = ($59|0)>($63|0); //@line 81 "../wslib/context.c"
 if ($64) {
  $65 = $5; //@line 82 "../wslib/context.c"
  $66 = ((($65)) + 12|0); //@line 82 "../wslib/context.c"
  $67 = HEAP32[$66>>2]|0; //@line 82 "../wslib/context.c"
  $68 = (($67) + 1)|0; //@line 82 "../wslib/context.c"
  $max_y = $68; //@line 82 "../wslib/context.c"
 }
 while(1) {
  $69 = $2; //@line 86 "../wslib/context.c"
  $70 = $max_y; //@line 86 "../wslib/context.c"
  $71 = ($69|0)<($70|0); //@line 86 "../wslib/context.c"
  if (!($71)) {
   break;
  }
  $72 = $1; //@line 87 "../wslib/context.c"
  $cur_x = $72; //@line 87 "../wslib/context.c"
  while(1) {
   $73 = $cur_x; //@line 87 "../wslib/context.c"
   $74 = $max_x; //@line 87 "../wslib/context.c"
   $75 = ($73|0)<($74|0); //@line 87 "../wslib/context.c"
   if (!($75)) {
    break;
   }
   $76 = $6; //@line 88 "../wslib/context.c"
   $77 = $2; //@line 88 "../wslib/context.c"
   $78 = $0; //@line 88 "../wslib/context.c"
   $79 = ((($78)) + 12|0); //@line 88 "../wslib/context.c"
   $80 = HEAP16[$79>>1]|0; //@line 88 "../wslib/context.c"
   $81 = $80&65535; //@line 88 "../wslib/context.c"
   $82 = Math_imul($77, $81)|0; //@line 88 "../wslib/context.c"
   $83 = $cur_x; //@line 88 "../wslib/context.c"
   $84 = (($82) + ($83))|0; //@line 88 "../wslib/context.c"
   $85 = $0; //@line 88 "../wslib/context.c"
   $86 = ((($85)) + 8|0); //@line 88 "../wslib/context.c"
   $87 = HEAP32[$86>>2]|0; //@line 88 "../wslib/context.c"
   $88 = (($87) + ($84<<2)|0); //@line 88 "../wslib/context.c"
   HEAP32[$88>>2] = $76; //@line 88 "../wslib/context.c"
   $89 = $cur_x; //@line 87 "../wslib/context.c"
   $90 = (($89) + 1)|0; //@line 87 "../wslib/context.c"
   $cur_x = $90; //@line 87 "../wslib/context.c"
  }
  $91 = $2; //@line 86 "../wslib/context.c"
  $92 = (($91) + 1)|0; //@line 86 "../wslib/context.c"
  $2 = $92; //@line 86 "../wslib/context.c"
 }
 STACKTOP = sp;return; //@line 89 "../wslib/context.c"
}
function _Context_fill_rect($context,$x,$y,$width,$height,$color) {
 $context = $context|0;
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 $height = $height|0;
 $color = $color|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $clip_area = 0, $i = 0, $max_x = 0, $max_y = 0, $screen_area = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $screen_area = sp;
 $0 = $context;
 $1 = $x;
 $2 = $y;
 $3 = $width;
 $4 = $height;
 $5 = $color;
 $6 = $1; //@line 95 "../wslib/context.c"
 $7 = $3; //@line 95 "../wslib/context.c"
 $8 = (($6) + ($7))|0; //@line 95 "../wslib/context.c"
 $max_x = $8; //@line 95 "../wslib/context.c"
 $9 = $2; //@line 96 "../wslib/context.c"
 $10 = $4; //@line 96 "../wslib/context.c"
 $11 = (($9) + ($10))|0; //@line 96 "../wslib/context.c"
 $max_y = $11; //@line 96 "../wslib/context.c"
 $12 = $max_x; //@line 102 "../wslib/context.c"
 $13 = $0; //@line 102 "../wslib/context.c"
 $14 = ((($13)) + 12|0); //@line 102 "../wslib/context.c"
 $15 = HEAP16[$14>>1]|0; //@line 102 "../wslib/context.c"
 $16 = $15&65535; //@line 102 "../wslib/context.c"
 $17 = ($12|0)>($16|0); //@line 102 "../wslib/context.c"
 if ($17) {
  $18 = $0; //@line 103 "../wslib/context.c"
  $19 = ((($18)) + 12|0); //@line 103 "../wslib/context.c"
  $20 = HEAP16[$19>>1]|0; //@line 103 "../wslib/context.c"
  $21 = $20&65535; //@line 103 "../wslib/context.c"
  $max_x = $21; //@line 103 "../wslib/context.c"
 }
 $22 = $max_y; //@line 105 "../wslib/context.c"
 $23 = $0; //@line 105 "../wslib/context.c"
 $24 = ((($23)) + 14|0); //@line 105 "../wslib/context.c"
 $25 = HEAP16[$24>>1]|0; //@line 105 "../wslib/context.c"
 $26 = $25&65535; //@line 105 "../wslib/context.c"
 $27 = ($22|0)>($26|0); //@line 105 "../wslib/context.c"
 if ($27) {
  $28 = $0; //@line 106 "../wslib/context.c"
  $29 = ((($28)) + 14|0); //@line 106 "../wslib/context.c"
  $30 = HEAP16[$29>>1]|0; //@line 106 "../wslib/context.c"
  $31 = $30&65535; //@line 106 "../wslib/context.c"
  $max_y = $31; //@line 106 "../wslib/context.c"
 }
 $32 = $1; //@line 108 "../wslib/context.c"
 $33 = ($32|0)<(0); //@line 108 "../wslib/context.c"
 if ($33) {
  $1 = 0; //@line 109 "../wslib/context.c"
 }
 $34 = $2; //@line 111 "../wslib/context.c"
 $35 = ($34|0)<(0); //@line 111 "../wslib/context.c"
 if ($35) {
  $2 = 0; //@line 112 "../wslib/context.c"
 }
 $36 = $max_x; //@line 114 "../wslib/context.c"
 $37 = $1; //@line 114 "../wslib/context.c"
 $38 = (($36) - ($37))|0; //@line 114 "../wslib/context.c"
 $3 = $38; //@line 114 "../wslib/context.c"
 $39 = $max_y; //@line 115 "../wslib/context.c"
 $40 = $2; //@line 115 "../wslib/context.c"
 $41 = (($39) - ($40))|0; //@line 115 "../wslib/context.c"
 $4 = $41; //@line 115 "../wslib/context.c"
 $42 = $0; //@line 119 "../wslib/context.c"
 $43 = ((($42)) + 24|0); //@line 119 "../wslib/context.c"
 $44 = HEAP32[$43>>2]|0; //@line 119 "../wslib/context.c"
 $45 = ((($44)) + 4|0); //@line 119 "../wslib/context.c"
 $46 = HEAP32[$45>>2]|0; //@line 119 "../wslib/context.c"
 $47 = ($46|0)!=(0); //@line 119 "../wslib/context.c"
 if ($47) {
  $i = 0; //@line 121 "../wslib/context.c"
  while(1) {
   $48 = $i; //@line 121 "../wslib/context.c"
   $49 = $0; //@line 121 "../wslib/context.c"
   $50 = ((($49)) + 24|0); //@line 121 "../wslib/context.c"
   $51 = HEAP32[$50>>2]|0; //@line 121 "../wslib/context.c"
   $52 = ((($51)) + 4|0); //@line 121 "../wslib/context.c"
   $53 = HEAP32[$52>>2]|0; //@line 121 "../wslib/context.c"
   $54 = ($48>>>0)<($53>>>0); //@line 121 "../wslib/context.c"
   if (!($54)) {
    break;
   }
   $55 = $0; //@line 123 "../wslib/context.c"
   $56 = ((($55)) + 24|0); //@line 123 "../wslib/context.c"
   $57 = HEAP32[$56>>2]|0; //@line 123 "../wslib/context.c"
   $58 = $i; //@line 123 "../wslib/context.c"
   $59 = (_List_get_at($57,$58)|0); //@line 123 "../wslib/context.c"
   $clip_area = $59; //@line 123 "../wslib/context.c"
   $60 = $0; //@line 124 "../wslib/context.c"
   $61 = $1; //@line 124 "../wslib/context.c"
   $62 = $2; //@line 124 "../wslib/context.c"
   $63 = $3; //@line 124 "../wslib/context.c"
   $64 = $4; //@line 124 "../wslib/context.c"
   $65 = $clip_area; //@line 124 "../wslib/context.c"
   $66 = $5; //@line 124 "../wslib/context.c"
   _Context_clipped_rect($60,$61,$62,$63,$64,$65,$66); //@line 124 "../wslib/context.c"
   $67 = $i; //@line 121 "../wslib/context.c"
   $68 = (($67) + 1)|0; //@line 121 "../wslib/context.c"
   $i = $68; //@line 121 "../wslib/context.c"
  }
  STACKTOP = sp;return; //@line 137 "../wslib/context.c"
 } else {
  $69 = $0; //@line 128 "../wslib/context.c"
  $70 = ((($69)) + 28|0); //@line 128 "../wslib/context.c"
  $71 = HEAP8[$70>>0]|0; //@line 128 "../wslib/context.c"
  $72 = ($71<<24>>24)!=(0); //@line 128 "../wslib/context.c"
  if ($72) {
   STACKTOP = sp;return; //@line 137 "../wslib/context.c"
  }
  $73 = ((($screen_area)) + 4|0); //@line 130 "../wslib/context.c"
  HEAP32[$73>>2] = 0; //@line 130 "../wslib/context.c"
  $74 = ((($screen_area)) + 8|0); //@line 131 "../wslib/context.c"
  HEAP32[$74>>2] = 0; //@line 131 "../wslib/context.c"
  $75 = $0; //@line 132 "../wslib/context.c"
  $76 = ((($75)) + 14|0); //@line 132 "../wslib/context.c"
  $77 = HEAP16[$76>>1]|0; //@line 132 "../wslib/context.c"
  $78 = $77&65535; //@line 132 "../wslib/context.c"
  $79 = (($78) - 1)|0; //@line 132 "../wslib/context.c"
  $80 = ((($screen_area)) + 12|0); //@line 132 "../wslib/context.c"
  HEAP32[$80>>2] = $79; //@line 132 "../wslib/context.c"
  $81 = $0; //@line 133 "../wslib/context.c"
  $82 = ((($81)) + 12|0); //@line 133 "../wslib/context.c"
  $83 = HEAP16[$82>>1]|0; //@line 133 "../wslib/context.c"
  $84 = $83&65535; //@line 133 "../wslib/context.c"
  $85 = (($84) - 1)|0; //@line 133 "../wslib/context.c"
  $86 = ((($screen_area)) + 16|0); //@line 133 "../wslib/context.c"
  HEAP32[$86>>2] = $85; //@line 133 "../wslib/context.c"
  $87 = $0; //@line 134 "../wslib/context.c"
  $88 = $1; //@line 134 "../wslib/context.c"
  $89 = $2; //@line 134 "../wslib/context.c"
  $90 = $3; //@line 134 "../wslib/context.c"
  $91 = $4; //@line 134 "../wslib/context.c"
  $92 = $5; //@line 134 "../wslib/context.c"
  _Context_clipped_rect($87,$88,$89,$90,$91,$screen_area,$92); //@line 134 "../wslib/context.c"
  STACKTOP = sp;return; //@line 137 "../wslib/context.c"
 }
}
function _Context_horizontal_line($context,$x,$y,$length,$color) {
 $context = $context|0;
 $x = $x|0;
 $y = $y|0;
 $length = $length|0;
 $color = $color|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $x;
 $2 = $y;
 $3 = $length;
 $4 = $color;
 $5 = $0; //@line 143 "../wslib/context.c"
 $6 = $1; //@line 143 "../wslib/context.c"
 $7 = $2; //@line 143 "../wslib/context.c"
 $8 = $3; //@line 143 "../wslib/context.c"
 $9 = $4; //@line 143 "../wslib/context.c"
 _Context_fill_rect($5,$6,$7,$8,1,$9); //@line 143 "../wslib/context.c"
 STACKTOP = sp;return; //@line 144 "../wslib/context.c"
}
function _Context_vertical_line($context,$x,$y,$length,$color) {
 $context = $context|0;
 $x = $x|0;
 $y = $y|0;
 $length = $length|0;
 $color = $color|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $x;
 $2 = $y;
 $3 = $length;
 $4 = $color;
 $5 = $0; //@line 150 "../wslib/context.c"
 $6 = $1; //@line 150 "../wslib/context.c"
 $7 = $2; //@line 150 "../wslib/context.c"
 $8 = $3; //@line 150 "../wslib/context.c"
 $9 = $4; //@line 150 "../wslib/context.c"
 _Context_fill_rect($5,$6,$7,1,$8,$9); //@line 150 "../wslib/context.c"
 STACKTOP = sp;return; //@line 151 "../wslib/context.c"
}
function _Context_draw_rect($context,$x,$y,$width,$height,$color) {
 $context = $context|0;
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 $height = $height|0;
 $color = $color|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $x;
 $2 = $y;
 $3 = $width;
 $4 = $height;
 $5 = $color;
 $6 = $0; //@line 157 "../wslib/context.c"
 $7 = $1; //@line 157 "../wslib/context.c"
 $8 = $2; //@line 157 "../wslib/context.c"
 $9 = $3; //@line 157 "../wslib/context.c"
 $10 = $5; //@line 157 "../wslib/context.c"
 _Context_horizontal_line($6,$7,$8,$9,$10); //@line 157 "../wslib/context.c"
 $11 = $0; //@line 158 "../wslib/context.c"
 $12 = $1; //@line 158 "../wslib/context.c"
 $13 = $2; //@line 158 "../wslib/context.c"
 $14 = (($13) + 1)|0; //@line 158 "../wslib/context.c"
 $15 = $4; //@line 158 "../wslib/context.c"
 $16 = (($15) - 2)|0; //@line 158 "../wslib/context.c"
 $17 = $5; //@line 158 "../wslib/context.c"
 _Context_vertical_line($11,$12,$14,$16,$17); //@line 158 "../wslib/context.c"
 $18 = $0; //@line 159 "../wslib/context.c"
 $19 = $1; //@line 159 "../wslib/context.c"
 $20 = $2; //@line 159 "../wslib/context.c"
 $21 = $4; //@line 159 "../wslib/context.c"
 $22 = (($20) + ($21))|0; //@line 159 "../wslib/context.c"
 $23 = (($22) - 1)|0; //@line 159 "../wslib/context.c"
 $24 = $3; //@line 159 "../wslib/context.c"
 $25 = $5; //@line 159 "../wslib/context.c"
 _Context_horizontal_line($18,$19,$23,$24,$25); //@line 159 "../wslib/context.c"
 $26 = $0; //@line 160 "../wslib/context.c"
 $27 = $1; //@line 160 "../wslib/context.c"
 $28 = $3; //@line 160 "../wslib/context.c"
 $29 = (($27) + ($28))|0; //@line 160 "../wslib/context.c"
 $30 = (($29) - 1)|0; //@line 160 "../wslib/context.c"
 $31 = $2; //@line 160 "../wslib/context.c"
 $32 = (($31) + 1)|0; //@line 160 "../wslib/context.c"
 $33 = $4; //@line 160 "../wslib/context.c"
 $34 = (($33) - 2)|0; //@line 160 "../wslib/context.c"
 $35 = $5; //@line 160 "../wslib/context.c"
 _Context_vertical_line($26,$30,$32,$34,$35); //@line 160 "../wslib/context.c"
 STACKTOP = sp;return; //@line 161 "../wslib/context.c"
}
function _Context_intersect_clip_rect($context,$rect) {
 $context = $context|0;
 $rect = $rect|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $current_rect = 0, $i = 0, $intersect_rect = 0, $output_rects = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $rect;
 $2 = $0; //@line 172 "../wslib/context.c"
 $3 = ((($2)) + 28|0); //@line 172 "../wslib/context.c"
 HEAP8[$3>>0] = 1; //@line 172 "../wslib/context.c"
 $4 = (_List_new()|0); //@line 174 "../wslib/context.c"
 $output_rects = $4; //@line 174 "../wslib/context.c"
 $5 = ($4|0)!=(0|0); //@line 174 "../wslib/context.c"
 if (!($5)) {
  STACKTOP = sp;return; //@line 194 "../wslib/context.c"
 }
 $i = 0; //@line 177 "../wslib/context.c"
 while(1) {
  $6 = $i; //@line 177 "../wslib/context.c"
  $7 = $0; //@line 177 "../wslib/context.c"
  $8 = ((($7)) + 24|0); //@line 177 "../wslib/context.c"
  $9 = HEAP32[$8>>2]|0; //@line 177 "../wslib/context.c"
  $10 = ((($9)) + 4|0); //@line 177 "../wslib/context.c"
  $11 = HEAP32[$10>>2]|0; //@line 177 "../wslib/context.c"
  $12 = ($6>>>0)<($11>>>0); //@line 177 "../wslib/context.c"
  $13 = $0; //@line 179 "../wslib/context.c"
  $14 = ((($13)) + 24|0); //@line 179 "../wslib/context.c"
  $15 = HEAP32[$14>>2]|0; //@line 179 "../wslib/context.c"
  if (!($12)) {
   break;
  }
  $16 = $i; //@line 179 "../wslib/context.c"
  $17 = (_List_get_at($15,$16)|0); //@line 179 "../wslib/context.c"
  $current_rect = $17; //@line 179 "../wslib/context.c"
  $18 = $current_rect; //@line 180 "../wslib/context.c"
  $19 = $1; //@line 180 "../wslib/context.c"
  $20 = (_Rect_intersect($18,$19)|0); //@line 180 "../wslib/context.c"
  $intersect_rect = $20; //@line 180 "../wslib/context.c"
  $21 = $intersect_rect; //@line 182 "../wslib/context.c"
  $22 = ($21|0)!=(0|0); //@line 182 "../wslib/context.c"
  if ($22) {
   $23 = $output_rects; //@line 183 "../wslib/context.c"
   $24 = $intersect_rect; //@line 183 "../wslib/context.c"
   (_List_add($23,$24)|0); //@line 183 "../wslib/context.c"
  }
  $25 = $i; //@line 177 "../wslib/context.c"
  $26 = (($25) + 1)|0; //@line 177 "../wslib/context.c"
  $i = $26; //@line 177 "../wslib/context.c"
 }
 _Object_delete($15); //@line 187 "../wslib/context.c"
 $27 = $output_rects; //@line 190 "../wslib/context.c"
 $28 = $0; //@line 190 "../wslib/context.c"
 $29 = ((($28)) + 24|0); //@line 190 "../wslib/context.c"
 HEAP32[$29>>2] = $27; //@line 190 "../wslib/context.c"
 $30 = $1; //@line 193 "../wslib/context.c"
 _Object_delete($30); //@line 193 "../wslib/context.c"
 STACKTOP = sp;return; //@line 194 "../wslib/context.c"
}
function _Context_subtract_clip_rect($context,$subtracted_rect) {
 $context = $context|0;
 $subtracted_rect = $subtracted_rect|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $7 = 0, $8 = 0, $9 = 0, $cur_rect = 0, $i = 0, $split_rects = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $subtracted_rect;
 $2 = $0; //@line 205 "../wslib/context.c"
 $3 = ((($2)) + 28|0); //@line 205 "../wslib/context.c"
 HEAP8[$3>>0] = 1; //@line 205 "../wslib/context.c"
 $i = 0; //@line 207 "../wslib/context.c"
 while(1) {
  $4 = $i; //@line 207 "../wslib/context.c"
  $5 = $0; //@line 207 "../wslib/context.c"
  $6 = ((($5)) + 24|0); //@line 207 "../wslib/context.c"
  $7 = HEAP32[$6>>2]|0; //@line 207 "../wslib/context.c"
  $8 = ((($7)) + 4|0); //@line 207 "../wslib/context.c"
  $9 = HEAP32[$8>>2]|0; //@line 207 "../wslib/context.c"
  $10 = ($4>>>0)<($9>>>0); //@line 207 "../wslib/context.c"
  if (!($10)) {
   break;
  }
  $11 = $0; //@line 209 "../wslib/context.c"
  $12 = ((($11)) + 24|0); //@line 209 "../wslib/context.c"
  $13 = HEAP32[$12>>2]|0; //@line 209 "../wslib/context.c"
  $14 = $i; //@line 209 "../wslib/context.c"
  $15 = (_List_get_at($13,$14)|0); //@line 209 "../wslib/context.c"
  $cur_rect = $15; //@line 209 "../wslib/context.c"
  $16 = $cur_rect; //@line 214 "../wslib/context.c"
  $17 = ((($16)) + 8|0); //@line 214 "../wslib/context.c"
  $18 = HEAP32[$17>>2]|0; //@line 214 "../wslib/context.c"
  $19 = $1; //@line 214 "../wslib/context.c"
  $20 = ((($19)) + 16|0); //@line 214 "../wslib/context.c"
  $21 = HEAP32[$20>>2]|0; //@line 214 "../wslib/context.c"
  $22 = ($18|0)<=($21|0); //@line 214 "../wslib/context.c"
  if ($22) {
   $23 = $cur_rect; //@line 215 "../wslib/context.c"
   $24 = ((($23)) + 16|0); //@line 215 "../wslib/context.c"
   $25 = HEAP32[$24>>2]|0; //@line 215 "../wslib/context.c"
   $26 = $1; //@line 215 "../wslib/context.c"
   $27 = ((($26)) + 8|0); //@line 215 "../wslib/context.c"
   $28 = HEAP32[$27>>2]|0; //@line 215 "../wslib/context.c"
   $29 = ($25|0)>=($28|0); //@line 215 "../wslib/context.c"
   if ($29) {
    $30 = $cur_rect; //@line 216 "../wslib/context.c"
    $31 = ((($30)) + 4|0); //@line 216 "../wslib/context.c"
    $32 = HEAP32[$31>>2]|0; //@line 216 "../wslib/context.c"
    $33 = $1; //@line 216 "../wslib/context.c"
    $34 = ((($33)) + 12|0); //@line 216 "../wslib/context.c"
    $35 = HEAP32[$34>>2]|0; //@line 216 "../wslib/context.c"
    $36 = ($32|0)<=($35|0); //@line 216 "../wslib/context.c"
    if ($36) {
     $37 = $cur_rect; //@line 217 "../wslib/context.c"
     $38 = ((($37)) + 12|0); //@line 217 "../wslib/context.c"
     $39 = HEAP32[$38>>2]|0; //@line 217 "../wslib/context.c"
     $40 = $1; //@line 217 "../wslib/context.c"
     $41 = ((($40)) + 4|0); //@line 217 "../wslib/context.c"
     $42 = HEAP32[$41>>2]|0; //@line 217 "../wslib/context.c"
     $43 = ($39|0)>=($42|0); //@line 217 "../wslib/context.c"
     if ($43) {
      $46 = $0; //@line 225 "../wslib/context.c"
      $47 = ((($46)) + 24|0); //@line 225 "../wslib/context.c"
      $48 = HEAP32[$47>>2]|0; //@line 225 "../wslib/context.c"
      $49 = $i; //@line 225 "../wslib/context.c"
      (_List_remove_at($48,$49)|0); //@line 225 "../wslib/context.c"
      $50 = $cur_rect; //@line 226 "../wslib/context.c"
      $51 = $1; //@line 226 "../wslib/context.c"
      $52 = (_Rect_split($50,$51)|0); //@line 226 "../wslib/context.c"
      $split_rects = $52; //@line 226 "../wslib/context.c"
      $53 = $cur_rect; //@line 227 "../wslib/context.c"
      _Object_delete($53); //@line 227 "../wslib/context.c"
      while(1) {
       $54 = $split_rects; //@line 230 "../wslib/context.c"
       $55 = ((($54)) + 4|0); //@line 230 "../wslib/context.c"
       $56 = HEAP32[$55>>2]|0; //@line 230 "../wslib/context.c"
       $57 = ($56|0)!=(0); //@line 230 "../wslib/context.c"
       $58 = $split_rects; //@line 232 "../wslib/context.c"
       if (!($57)) {
        break;
       }
       $59 = (_List_remove_at($58,0)|0); //@line 232 "../wslib/context.c"
       $cur_rect = $59; //@line 232 "../wslib/context.c"
       $60 = $0; //@line 233 "../wslib/context.c"
       $61 = ((($60)) + 24|0); //@line 233 "../wslib/context.c"
       $62 = HEAP32[$61>>2]|0; //@line 233 "../wslib/context.c"
       $63 = $cur_rect; //@line 233 "../wslib/context.c"
       (_List_add($62,$63)|0); //@line 233 "../wslib/context.c"
      }
      _Object_delete($58); //@line 237 "../wslib/context.c"
      $i = 0; //@line 241 "../wslib/context.c"
      continue;
     }
    }
   }
  }
  $44 = $i; //@line 219 "../wslib/context.c"
  $45 = (($44) + 1)|0; //@line 219 "../wslib/context.c"
  $i = $45; //@line 219 "../wslib/context.c"
 }
 STACKTOP = sp;return; //@line 243 "../wslib/context.c"
}
function _Context_add_clip_rect($context,$added_rect) {
 $context = $context|0;
 $added_rect = $added_rect|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $added_rect;
 $2 = $0; //@line 247 "../wslib/context.c"
 $3 = $1; //@line 247 "../wslib/context.c"
 _Context_subtract_clip_rect($2,$3); //@line 247 "../wslib/context.c"
 $4 = $0; //@line 251 "../wslib/context.c"
 $5 = ((($4)) + 24|0); //@line 251 "../wslib/context.c"
 $6 = HEAP32[$5>>2]|0; //@line 251 "../wslib/context.c"
 $7 = $1; //@line 251 "../wslib/context.c"
 (_List_add($6,$7)|0); //@line 251 "../wslib/context.c"
 STACKTOP = sp;return; //@line 252 "../wslib/context.c"
}
function _Context_clear_clip_rects($context) {
 $context = $context|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $0; //@line 259 "../wslib/context.c"
 $2 = ((($1)) + 28|0); //@line 259 "../wslib/context.c"
 HEAP8[$2>>0] = 0; //@line 259 "../wslib/context.c"
 while(1) {
  $3 = $0; //@line 261 "../wslib/context.c"
  $4 = ((($3)) + 24|0); //@line 261 "../wslib/context.c"
  $5 = HEAP32[$4>>2]|0; //@line 261 "../wslib/context.c"
  $6 = ((($5)) + 4|0); //@line 261 "../wslib/context.c"
  $7 = HEAP32[$6>>2]|0; //@line 261 "../wslib/context.c"
  $8 = ($7|0)!=(0); //@line 261 "../wslib/context.c"
  if (!($8)) {
   break;
  }
  $9 = $0; //@line 262 "../wslib/context.c"
  $10 = ((($9)) + 24|0); //@line 262 "../wslib/context.c"
  $11 = HEAP32[$10>>2]|0; //@line 262 "../wslib/context.c"
  $12 = (_List_remove_at($11,0)|0); //@line 262 "../wslib/context.c"
  _Object_delete($12); //@line 262 "../wslib/context.c"
 }
 STACKTOP = sp;return; //@line 263 "../wslib/context.c"
}
function _Context_draw_char_clipped($context,$character,$x,$y,$color,$bound_rect) {
 $context = $context|0;
 $character = $character|0;
 $x = $x|0;
 $y = $y|0;
 $color = $color|0;
 $bound_rect = $bound_rect|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0;
 var $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0;
 var $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0;
 var $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0;
 var $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $count_x = 0, $count_y = 0, $font_x = 0, $font_y = 0, $off_x = 0;
 var $off_y = 0, $shift_line = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $character;
 $2 = $x;
 $3 = $y;
 $4 = $color;
 $5 = $bound_rect;
 $off_x = 0; //@line 270 "../wslib/context.c"
 $off_y = 0; //@line 271 "../wslib/context.c"
 $count_x = 8; //@line 272 "../wslib/context.c"
 $count_y = 12; //@line 273 "../wslib/context.c"
 $6 = $0; //@line 277 "../wslib/context.c"
 $7 = ((($6)) + 16|0); //@line 277 "../wslib/context.c"
 $8 = HEAP32[$7>>2]|0; //@line 277 "../wslib/context.c"
 $9 = $2; //@line 277 "../wslib/context.c"
 $10 = (($9) + ($8))|0; //@line 277 "../wslib/context.c"
 $2 = $10; //@line 277 "../wslib/context.c"
 $11 = $0; //@line 278 "../wslib/context.c"
 $12 = ((($11)) + 20|0); //@line 278 "../wslib/context.c"
 $13 = HEAP32[$12>>2]|0; //@line 278 "../wslib/context.c"
 $14 = $3; //@line 278 "../wslib/context.c"
 $15 = (($14) + ($13))|0; //@line 278 "../wslib/context.c"
 $3 = $15; //@line 278 "../wslib/context.c"
 $16 = $1; //@line 281 "../wslib/context.c"
 $17 = $16 << 24 >> 24; //@line 281 "../wslib/context.c"
 $18 = $17 & 127; //@line 281 "../wslib/context.c"
 $19 = $18&255; //@line 281 "../wslib/context.c"
 $1 = $19; //@line 281 "../wslib/context.c"
 $20 = $2; //@line 284 "../wslib/context.c"
 $21 = $5; //@line 284 "../wslib/context.c"
 $22 = ((($21)) + 16|0); //@line 284 "../wslib/context.c"
 $23 = HEAP32[$22>>2]|0; //@line 284 "../wslib/context.c"
 $24 = ($20|0)>($23|0); //@line 284 "../wslib/context.c"
 if ($24) {
  STACKTOP = sp;return; //@line 324 "../wslib/context.c"
 }
 $25 = $2; //@line 284 "../wslib/context.c"
 $26 = (($25) + 8)|0; //@line 284 "../wslib/context.c"
 $27 = $5; //@line 284 "../wslib/context.c"
 $28 = ((($27)) + 8|0); //@line 284 "../wslib/context.c"
 $29 = HEAP32[$28>>2]|0; //@line 284 "../wslib/context.c"
 $30 = ($26|0)<=($29|0); //@line 284 "../wslib/context.c"
 if ($30) {
  STACKTOP = sp;return; //@line 324 "../wslib/context.c"
 }
 $31 = $3; //@line 285 "../wslib/context.c"
 $32 = $5; //@line 285 "../wslib/context.c"
 $33 = ((($32)) + 12|0); //@line 285 "../wslib/context.c"
 $34 = HEAP32[$33>>2]|0; //@line 285 "../wslib/context.c"
 $35 = ($31|0)>($34|0); //@line 285 "../wslib/context.c"
 if ($35) {
  STACKTOP = sp;return; //@line 324 "../wslib/context.c"
 }
 $36 = $3; //@line 285 "../wslib/context.c"
 $37 = (($36) + 12)|0; //@line 285 "../wslib/context.c"
 $38 = $5; //@line 285 "../wslib/context.c"
 $39 = ((($38)) + 4|0); //@line 285 "../wslib/context.c"
 $40 = HEAP32[$39>>2]|0; //@line 285 "../wslib/context.c"
 $41 = ($37|0)<=($40|0); //@line 285 "../wslib/context.c"
 if ($41) {
  STACKTOP = sp;return; //@line 324 "../wslib/context.c"
 }
 $42 = $2; //@line 289 "../wslib/context.c"
 $43 = $5; //@line 289 "../wslib/context.c"
 $44 = ((($43)) + 8|0); //@line 289 "../wslib/context.c"
 $45 = HEAP32[$44>>2]|0; //@line 289 "../wslib/context.c"
 $46 = ($42|0)<($45|0); //@line 289 "../wslib/context.c"
 if ($46) {
  $47 = $5; //@line 290 "../wslib/context.c"
  $48 = ((($47)) + 8|0); //@line 290 "../wslib/context.c"
  $49 = HEAP32[$48>>2]|0; //@line 290 "../wslib/context.c"
  $50 = $2; //@line 290 "../wslib/context.c"
  $51 = (($49) - ($50))|0; //@line 290 "../wslib/context.c"
  $off_x = $51; //@line 290 "../wslib/context.c"
 }
 $52 = $2; //@line 292 "../wslib/context.c"
 $53 = (($52) + 8)|0; //@line 292 "../wslib/context.c"
 $54 = $5; //@line 292 "../wslib/context.c"
 $55 = ((($54)) + 16|0); //@line 292 "../wslib/context.c"
 $56 = HEAP32[$55>>2]|0; //@line 292 "../wslib/context.c"
 $57 = ($53|0)>($56|0); //@line 292 "../wslib/context.c"
 if ($57) {
  $58 = $5; //@line 293 "../wslib/context.c"
  $59 = ((($58)) + 16|0); //@line 293 "../wslib/context.c"
  $60 = HEAP32[$59>>2]|0; //@line 293 "../wslib/context.c"
  $61 = $2; //@line 293 "../wslib/context.c"
  $62 = (($60) - ($61))|0; //@line 293 "../wslib/context.c"
  $63 = (($62) + 1)|0; //@line 293 "../wslib/context.c"
  $count_x = $63; //@line 293 "../wslib/context.c"
 }
 $64 = $3; //@line 295 "../wslib/context.c"
 $65 = $5; //@line 295 "../wslib/context.c"
 $66 = ((($65)) + 4|0); //@line 295 "../wslib/context.c"
 $67 = HEAP32[$66>>2]|0; //@line 295 "../wslib/context.c"
 $68 = ($64|0)<($67|0); //@line 295 "../wslib/context.c"
 if ($68) {
  $69 = $5; //@line 296 "../wslib/context.c"
  $70 = ((($69)) + 4|0); //@line 296 "../wslib/context.c"
  $71 = HEAP32[$70>>2]|0; //@line 296 "../wslib/context.c"
  $72 = $3; //@line 296 "../wslib/context.c"
  $73 = (($71) - ($72))|0; //@line 296 "../wslib/context.c"
  $off_y = $73; //@line 296 "../wslib/context.c"
 }
 $74 = $3; //@line 298 "../wslib/context.c"
 $75 = (($74) + 12)|0; //@line 298 "../wslib/context.c"
 $76 = $5; //@line 298 "../wslib/context.c"
 $77 = ((($76)) + 12|0); //@line 298 "../wslib/context.c"
 $78 = HEAP32[$77>>2]|0; //@line 298 "../wslib/context.c"
 $79 = ($75|0)>($78|0); //@line 298 "../wslib/context.c"
 if ($79) {
  $80 = $5; //@line 299 "../wslib/context.c"
  $81 = ((($80)) + 12|0); //@line 299 "../wslib/context.c"
  $82 = HEAP32[$81>>2]|0; //@line 299 "../wslib/context.c"
  $83 = $3; //@line 299 "../wslib/context.c"
  $84 = (($82) - ($83))|0; //@line 299 "../wslib/context.c"
  $85 = (($84) + 1)|0; //@line 299 "../wslib/context.c"
  $count_y = $85; //@line 299 "../wslib/context.c"
 }
 $86 = $off_y; //@line 302 "../wslib/context.c"
 $font_y = $86; //@line 302 "../wslib/context.c"
 while(1) {
  $87 = $font_y; //@line 302 "../wslib/context.c"
  $88 = $count_y; //@line 302 "../wslib/context.c"
  $89 = ($87|0)<($88|0); //@line 302 "../wslib/context.c"
  if (!($89)) {
   break;
  }
  $90 = $font_y; //@line 308 "../wslib/context.c"
  $91 = $90<<7; //@line 308 "../wslib/context.c"
  $92 = $1; //@line 308 "../wslib/context.c"
  $93 = $92 << 24 >> 24; //@line 308 "../wslib/context.c"
  $94 = (($91) + ($93))|0; //@line 308 "../wslib/context.c"
  $95 = (3659 + ($94)|0); //@line 308 "../wslib/context.c"
  $96 = HEAP8[$95>>0]|0; //@line 308 "../wslib/context.c"
  $shift_line = $96; //@line 308 "../wslib/context.c"
  $97 = $off_x; //@line 311 "../wslib/context.c"
  $98 = $shift_line; //@line 311 "../wslib/context.c"
  $99 = $98&255; //@line 311 "../wslib/context.c"
  $100 = $99 << $97; //@line 311 "../wslib/context.c"
  $101 = $100&255; //@line 311 "../wslib/context.c"
  $shift_line = $101; //@line 311 "../wslib/context.c"
  $102 = $off_x; //@line 313 "../wslib/context.c"
  $font_x = $102; //@line 313 "../wslib/context.c"
  while(1) {
   $103 = $font_x; //@line 313 "../wslib/context.c"
   $104 = $count_x; //@line 313 "../wslib/context.c"
   $105 = ($103|0)<($104|0); //@line 313 "../wslib/context.c"
   if (!($105)) {
    break;
   }
   $106 = $shift_line; //@line 317 "../wslib/context.c"
   $107 = $106&255; //@line 317 "../wslib/context.c"
   $108 = $107 & 128; //@line 317 "../wslib/context.c"
   $109 = ($108|0)!=(0); //@line 317 "../wslib/context.c"
   if ($109) {
    $110 = $4; //@line 318 "../wslib/context.c"
    $111 = $font_y; //@line 318 "../wslib/context.c"
    $112 = $3; //@line 318 "../wslib/context.c"
    $113 = (($111) + ($112))|0; //@line 318 "../wslib/context.c"
    $114 = $0; //@line 318 "../wslib/context.c"
    $115 = ((($114)) + 12|0); //@line 318 "../wslib/context.c"
    $116 = HEAP16[$115>>1]|0; //@line 318 "../wslib/context.c"
    $117 = $116&65535; //@line 318 "../wslib/context.c"
    $118 = Math_imul($113, $117)|0; //@line 318 "../wslib/context.c"
    $119 = $font_x; //@line 318 "../wslib/context.c"
    $120 = $2; //@line 318 "../wslib/context.c"
    $121 = (($119) + ($120))|0; //@line 318 "../wslib/context.c"
    $122 = (($118) + ($121))|0; //@line 318 "../wslib/context.c"
    $123 = $0; //@line 318 "../wslib/context.c"
    $124 = ((($123)) + 8|0); //@line 318 "../wslib/context.c"
    $125 = HEAP32[$124>>2]|0; //@line 318 "../wslib/context.c"
    $126 = (($125) + ($122<<2)|0); //@line 318 "../wslib/context.c"
    HEAP32[$126>>2] = $110; //@line 318 "../wslib/context.c"
   }
   $127 = $shift_line; //@line 321 "../wslib/context.c"
   $128 = $127&255; //@line 321 "../wslib/context.c"
   $129 = $128 << 1; //@line 321 "../wslib/context.c"
   $130 = $129&255; //@line 321 "../wslib/context.c"
   $shift_line = $130; //@line 321 "../wslib/context.c"
   $131 = $font_x; //@line 313 "../wslib/context.c"
   $132 = (($131) + 1)|0; //@line 313 "../wslib/context.c"
   $font_x = $132; //@line 313 "../wslib/context.c"
  }
  $133 = $font_y; //@line 302 "../wslib/context.c"
  $134 = (($133) + 1)|0; //@line 302 "../wslib/context.c"
  $font_y = $134; //@line 302 "../wslib/context.c"
 }
 STACKTOP = sp;return; //@line 324 "../wslib/context.c"
}
function _Context_draw_char($context,$character,$x,$y,$color) {
 $context = $context|0;
 $character = $character|0;
 $x = $x|0;
 $y = $y|0;
 $color = $color|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $clip_area = 0, $i = 0, $screen_area = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $screen_area = sp;
 $0 = $context;
 $1 = $character;
 $2 = $x;
 $3 = $y;
 $4 = $color;
 $5 = $0; //@line 335 "../wslib/context.c"
 $6 = ((($5)) + 24|0); //@line 335 "../wslib/context.c"
 $7 = HEAP32[$6>>2]|0; //@line 335 "../wslib/context.c"
 $8 = ((($7)) + 4|0); //@line 335 "../wslib/context.c"
 $9 = HEAP32[$8>>2]|0; //@line 335 "../wslib/context.c"
 $10 = ($9|0)!=(0); //@line 335 "../wslib/context.c"
 if ($10) {
  $i = 0; //@line 337 "../wslib/context.c"
  while(1) {
   $11 = $i; //@line 337 "../wslib/context.c"
   $12 = $0; //@line 337 "../wslib/context.c"
   $13 = ((($12)) + 24|0); //@line 337 "../wslib/context.c"
   $14 = HEAP32[$13>>2]|0; //@line 337 "../wslib/context.c"
   $15 = ((($14)) + 4|0); //@line 337 "../wslib/context.c"
   $16 = HEAP32[$15>>2]|0; //@line 337 "../wslib/context.c"
   $17 = ($11>>>0)<($16>>>0); //@line 337 "../wslib/context.c"
   if (!($17)) {
    break;
   }
   $18 = $0; //@line 339 "../wslib/context.c"
   $19 = ((($18)) + 24|0); //@line 339 "../wslib/context.c"
   $20 = HEAP32[$19>>2]|0; //@line 339 "../wslib/context.c"
   $21 = $i; //@line 339 "../wslib/context.c"
   $22 = (_List_get_at($20,$21)|0); //@line 339 "../wslib/context.c"
   $clip_area = $22; //@line 339 "../wslib/context.c"
   $23 = $0; //@line 340 "../wslib/context.c"
   $24 = $1; //@line 340 "../wslib/context.c"
   $25 = $2; //@line 340 "../wslib/context.c"
   $26 = $3; //@line 340 "../wslib/context.c"
   $27 = $4; //@line 340 "../wslib/context.c"
   $28 = $clip_area; //@line 340 "../wslib/context.c"
   _Context_draw_char_clipped($23,$24,$25,$26,$27,$28); //@line 340 "../wslib/context.c"
   $29 = $i; //@line 337 "../wslib/context.c"
   $30 = (($29) + 1)|0; //@line 337 "../wslib/context.c"
   $i = $30; //@line 337 "../wslib/context.c"
  }
  STACKTOP = sp;return; //@line 353 "../wslib/context.c"
 } else {
  $31 = $0; //@line 344 "../wslib/context.c"
  $32 = ((($31)) + 28|0); //@line 344 "../wslib/context.c"
  $33 = HEAP8[$32>>0]|0; //@line 344 "../wslib/context.c"
  $34 = ($33<<24>>24)!=(0); //@line 344 "../wslib/context.c"
  if ($34) {
   STACKTOP = sp;return; //@line 353 "../wslib/context.c"
  }
  $35 = ((($screen_area)) + 4|0); //@line 346 "../wslib/context.c"
  HEAP32[$35>>2] = 0; //@line 346 "../wslib/context.c"
  $36 = ((($screen_area)) + 8|0); //@line 347 "../wslib/context.c"
  HEAP32[$36>>2] = 0; //@line 347 "../wslib/context.c"
  $37 = $0; //@line 348 "../wslib/context.c"
  $38 = ((($37)) + 14|0); //@line 348 "../wslib/context.c"
  $39 = HEAP16[$38>>1]|0; //@line 348 "../wslib/context.c"
  $40 = $39&65535; //@line 348 "../wslib/context.c"
  $41 = (($40) - 1)|0; //@line 348 "../wslib/context.c"
  $42 = ((($screen_area)) + 12|0); //@line 348 "../wslib/context.c"
  HEAP32[$42>>2] = $41; //@line 348 "../wslib/context.c"
  $43 = $0; //@line 349 "../wslib/context.c"
  $44 = ((($43)) + 12|0); //@line 349 "../wslib/context.c"
  $45 = HEAP16[$44>>1]|0; //@line 349 "../wslib/context.c"
  $46 = $45&65535; //@line 349 "../wslib/context.c"
  $47 = (($46) - 1)|0; //@line 349 "../wslib/context.c"
  $48 = ((($screen_area)) + 16|0); //@line 349 "../wslib/context.c"
  HEAP32[$48>>2] = $47; //@line 349 "../wslib/context.c"
  $49 = $0; //@line 350 "../wslib/context.c"
  $50 = $1; //@line 350 "../wslib/context.c"
  $51 = $2; //@line 350 "../wslib/context.c"
  $52 = $3; //@line 350 "../wslib/context.c"
  $53 = $4; //@line 350 "../wslib/context.c"
  $54 = $clip_area; //@line 350 "../wslib/context.c"
  _Context_draw_char_clipped($49,$50,$51,$52,$53,$54); //@line 350 "../wslib/context.c"
  STACKTOP = sp;return; //@line 353 "../wslib/context.c"
 }
}
function _Context_draw_text($context,$string,$x,$y,$color) {
 $context = $context|0;
 $string = $string|0;
 $x = $x|0;
 $y = $y|0;
 $color = $color|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $string;
 $2 = $x;
 $3 = $y;
 $4 = $color;
 while(1) {
  $5 = $1; //@line 358 "../wslib/context.c"
  $6 = HEAP8[$5>>0]|0; //@line 358 "../wslib/context.c"
  $7 = ($6<<24>>24)!=(0); //@line 358 "../wslib/context.c"
  if (!($7)) {
   break;
  }
  $8 = $0; //@line 359 "../wslib/context.c"
  $9 = $1; //@line 359 "../wslib/context.c"
  $10 = ((($9)) + 1|0); //@line 359 "../wslib/context.c"
  $1 = $10; //@line 359 "../wslib/context.c"
  $11 = HEAP8[$9>>0]|0; //@line 359 "../wslib/context.c"
  $12 = $2; //@line 359 "../wslib/context.c"
  $13 = $3; //@line 359 "../wslib/context.c"
  $14 = $4; //@line 359 "../wslib/context.c"
  _Context_draw_char($8,$11,$12,$13,$14); //@line 359 "../wslib/context.c"
  $15 = $2; //@line 358 "../wslib/context.c"
  $16 = (($15) + 8)|0; //@line 358 "../wslib/context.c"
  $2 = $16; //@line 358 "../wslib/context.c"
 }
 STACKTOP = sp;return; //@line 360 "../wslib/context.c"
}
function _Desktop_init($desktop,$context) {
 $desktop = $desktop|0;
 $context = $context|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $desktop;
 $2 = $context;
 $3 = $1; //@line 54 "../wslib/desktop.c"
 $4 = $2; //@line 54 "../wslib/desktop.c"
 $5 = ((($4)) + 12|0); //@line 54 "../wslib/desktop.c"
 $6 = HEAP16[$5>>1]|0; //@line 54 "../wslib/desktop.c"
 $7 = $2; //@line 54 "../wslib/desktop.c"
 $8 = ((($7)) + 14|0); //@line 54 "../wslib/desktop.c"
 $9 = HEAP16[$8>>1]|0; //@line 54 "../wslib/desktop.c"
 $10 = $2; //@line 55 "../wslib/desktop.c"
 $11 = (_Window_init($3,0,0,$6,$9,3,$10)|0); //@line 54 "../wslib/desktop.c"
 $12 = ($11|0)!=(0); //@line 54 "../wslib/desktop.c"
 if ($12) {
  $13 = $1; //@line 59 "../wslib/desktop.c"
  $14 = ((($13)) + 52|0); //@line 59 "../wslib/desktop.c"
  HEAP32[$14>>2] = 6; //@line 59 "../wslib/desktop.c"
  $15 = $1; //@line 62 "../wslib/desktop.c"
  $16 = ((($15)) + 48|0); //@line 62 "../wslib/desktop.c"
  HEAP8[$16>>0] = 0; //@line 62 "../wslib/desktop.c"
  $17 = $1; //@line 65 "../wslib/desktop.c"
  $18 = ((($17)) + 24|0); //@line 65 "../wslib/desktop.c"
  $19 = HEAP32[$18>>2]|0; //@line 65 "../wslib/desktop.c"
  $20 = ((($19)) + 12|0); //@line 65 "../wslib/desktop.c"
  $21 = HEAP16[$20>>1]|0; //@line 65 "../wslib/desktop.c"
  $22 = $21&65535; //@line 65 "../wslib/desktop.c"
  $23 = (($22|0) / 2)&-1; //@line 65 "../wslib/desktop.c"
  $24 = $23&65535; //@line 65 "../wslib/desktop.c"
  $25 = $1; //@line 65 "../wslib/desktop.c"
  $26 = ((($25)) + 88|0); //@line 65 "../wslib/desktop.c"
  HEAP16[$26>>1] = $24; //@line 65 "../wslib/desktop.c"
  $27 = $1; //@line 66 "../wslib/desktop.c"
  $28 = ((($27)) + 24|0); //@line 66 "../wslib/desktop.c"
  $29 = HEAP32[$28>>2]|0; //@line 66 "../wslib/desktop.c"
  $30 = ((($29)) + 14|0); //@line 66 "../wslib/desktop.c"
  $31 = HEAP16[$30>>1]|0; //@line 66 "../wslib/desktop.c"
  $32 = $31&65535; //@line 66 "../wslib/desktop.c"
  $33 = (($32|0) / 2)&-1; //@line 66 "../wslib/desktop.c"
  $34 = $33&65535; //@line 66 "../wslib/desktop.c"
  $35 = $1; //@line 66 "../wslib/desktop.c"
  $36 = ((($35)) + 90|0); //@line 66 "../wslib/desktop.c"
  HEAP16[$36>>1] = $34; //@line 66 "../wslib/desktop.c"
  $37 = $1; //@line 67 "../wslib/desktop.c"
  $38 = ((($37)) + 92|0); //@line 67 "../wslib/desktop.c"
  HEAP8[$38>>0] = 1; //@line 67 "../wslib/desktop.c"
  $39 = $1; //@line 70 "../wslib/desktop.c"
  _Window_mouseover($39); //@line 70 "../wslib/desktop.c"
  $0 = 1; //@line 72 "../wslib/desktop.c"
  $40 = $0; //@line 73 "../wslib/desktop.c"
  STACKTOP = sp;return ($40|0); //@line 73 "../wslib/desktop.c"
 } else {
  $0 = 0; //@line 56 "../wslib/desktop.c"
  $40 = $0; //@line 73 "../wslib/desktop.c"
  STACKTOP = sp;return ($40|0); //@line 73 "../wslib/desktop.c"
 }
 return (0)|0;
}
function _Desktop_paint_handler($desktop_window) {
 $desktop_window = $desktop_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $desktop_window;
 $1 = $0; //@line 79 "../wslib/desktop.c"
 $2 = ((($1)) + 24|0); //@line 79 "../wslib/desktop.c"
 $3 = HEAP32[$2>>2]|0; //@line 79 "../wslib/desktop.c"
 $4 = $0; //@line 79 "../wslib/desktop.c"
 $5 = ((($4)) + 24|0); //@line 79 "../wslib/desktop.c"
 $6 = HEAP32[$5>>2]|0; //@line 79 "../wslib/desktop.c"
 $7 = ((($6)) + 12|0); //@line 79 "../wslib/desktop.c"
 $8 = HEAP16[$7>>1]|0; //@line 79 "../wslib/desktop.c"
 $9 = $8&65535; //@line 79 "../wslib/desktop.c"
 $10 = $0; //@line 79 "../wslib/desktop.c"
 $11 = ((($10)) + 24|0); //@line 79 "../wslib/desktop.c"
 $12 = HEAP32[$11>>2]|0; //@line 79 "../wslib/desktop.c"
 $13 = ((($12)) + 14|0); //@line 79 "../wslib/desktop.c"
 $14 = HEAP16[$13>>1]|0; //@line 79 "../wslib/desktop.c"
 $15 = $14&65535; //@line 79 "../wslib/desktop.c"
 _Context_fill_rect($3,0,0,$9,$15,-4087285); //@line 79 "../wslib/desktop.c"
 $16 = $0; //@line 82 "../wslib/desktop.c"
 $17 = ((($16)) + 24|0); //@line 82 "../wslib/desktop.c"
 $18 = HEAP32[$17>>2]|0; //@line 82 "../wslib/desktop.c"
 $19 = $0; //@line 83 "../wslib/desktop.c"
 $20 = ((($19)) + 18|0); //@line 83 "../wslib/desktop.c"
 $21 = HEAP16[$20>>1]|0; //@line 83 "../wslib/desktop.c"
 $22 = $21&65535; //@line 83 "../wslib/desktop.c"
 $23 = (($22) - 12)|0; //@line 83 "../wslib/desktop.c"
 _Context_draw_text($18,5195,0,$23,-1); //@line 82 "../wslib/desktop.c"
 STACKTOP = sp;return; //@line 84 "../wslib/desktop.c"
}
function _Desktop_process_mouse($desktop,$mouse_x,$mouse_y,$mouse_buttons) {
 $desktop = $desktop|0;
 $mouse_x = $mouse_x|0;
 $mouse_y = $mouse_y|0;
 $mouse_buttons = $mouse_buttons|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $12 = 0;
 var $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0;
 var $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0;
 var $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0;
 var $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0;
 var $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $dirty_list = 0, $mouse_rect = 0, $x = 0, $y = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $desktop;
 $1 = $mouse_x;
 $2 = $mouse_y;
 $3 = $mouse_buttons;
 $4 = $0; //@line 96 "../wslib/desktop.c"
 $5 = $1; //@line 96 "../wslib/desktop.c"
 $6 = $2; //@line 96 "../wslib/desktop.c"
 $7 = $3; //@line 96 "../wslib/desktop.c"
 _Window_process_mouse($4,$5,$6,$7); //@line 96 "../wslib/desktop.c"
 $8 = $0; //@line 101 "../wslib/desktop.c"
 $9 = ((($8)) + 92|0); //@line 101 "../wslib/desktop.c"
 $10 = HEAP8[$9>>0]|0; //@line 101 "../wslib/desktop.c"
 $11 = ($10<<24>>24)!=(0); //@line 101 "../wslib/desktop.c"
 if (!($11)) {
  STACKTOP = sp;return; //@line 154 "../wslib/desktop.c"
 }
 $12 = (_List_new()|0); //@line 105 "../wslib/desktop.c"
 $dirty_list = $12; //@line 105 "../wslib/desktop.c"
 $13 = ($12|0)!=(0|0); //@line 105 "../wslib/desktop.c"
 if (!($13)) {
  STACKTOP = sp;return; //@line 154 "../wslib/desktop.c"
 }
 $14 = $0; //@line 108 "../wslib/desktop.c"
 $15 = ((($14)) + 90|0); //@line 108 "../wslib/desktop.c"
 $16 = HEAP16[$15>>1]|0; //@line 108 "../wslib/desktop.c"
 $17 = $16&65535; //@line 108 "../wslib/desktop.c"
 $18 = $0; //@line 108 "../wslib/desktop.c"
 $19 = ((($18)) + 88|0); //@line 108 "../wslib/desktop.c"
 $20 = HEAP16[$19>>1]|0; //@line 108 "../wslib/desktop.c"
 $21 = $20&65535; //@line 108 "../wslib/desktop.c"
 $22 = $0; //@line 109 "../wslib/desktop.c"
 $23 = ((($22)) + 90|0); //@line 109 "../wslib/desktop.c"
 $24 = HEAP16[$23>>1]|0; //@line 109 "../wslib/desktop.c"
 $25 = $24&65535; //@line 109 "../wslib/desktop.c"
 $26 = (($25) + 18)|0; //@line 109 "../wslib/desktop.c"
 $27 = (($26) - 1)|0; //@line 109 "../wslib/desktop.c"
 $28 = $0; //@line 110 "../wslib/desktop.c"
 $29 = ((($28)) + 88|0); //@line 110 "../wslib/desktop.c"
 $30 = HEAP16[$29>>1]|0; //@line 110 "../wslib/desktop.c"
 $31 = $30&65535; //@line 110 "../wslib/desktop.c"
 $32 = (($31) + 11)|0; //@line 110 "../wslib/desktop.c"
 $33 = (($32) - 1)|0; //@line 110 "../wslib/desktop.c"
 $34 = (_Rect_new($17,$21,$27,$33)|0); //@line 108 "../wslib/desktop.c"
 $mouse_rect = $34; //@line 108 "../wslib/desktop.c"
 $35 = ($34|0)!=(0|0); //@line 108 "../wslib/desktop.c"
 $36 = $dirty_list; //@line 116 "../wslib/desktop.c"
 if (!($35)) {
  _free($36); //@line 112 "../wslib/desktop.c"
  STACKTOP = sp;return; //@line 154 "../wslib/desktop.c"
 }
 $37 = $mouse_rect; //@line 116 "../wslib/desktop.c"
 (_List_add($36,$37)|0); //@line 116 "../wslib/desktop.c"
 $38 = $0; //@line 120 "../wslib/desktop.c"
 $39 = $dirty_list; //@line 120 "../wslib/desktop.c"
 _Window_paint($38,$39,1); //@line 120 "../wslib/desktop.c"
 $40 = $dirty_list; //@line 123 "../wslib/desktop.c"
 (_List_remove_at($40,0)|0); //@line 123 "../wslib/desktop.c"
 $41 = $dirty_list; //@line 124 "../wslib/desktop.c"
 _free($41); //@line 124 "../wslib/desktop.c"
 $42 = $mouse_rect; //@line 125 "../wslib/desktop.c"
 _free($42); //@line 125 "../wslib/desktop.c"
 $43 = $1; //@line 128 "../wslib/desktop.c"
 $44 = $0; //@line 128 "../wslib/desktop.c"
 $45 = ((($44)) + 88|0); //@line 128 "../wslib/desktop.c"
 HEAP16[$45>>1] = $43; //@line 128 "../wslib/desktop.c"
 $46 = $2; //@line 129 "../wslib/desktop.c"
 $47 = $0; //@line 129 "../wslib/desktop.c"
 $48 = ((($47)) + 90|0); //@line 129 "../wslib/desktop.c"
 HEAP16[$48>>1] = $46; //@line 129 "../wslib/desktop.c"
 $y = 0; //@line 133 "../wslib/desktop.c"
 while(1) {
  $49 = $y; //@line 133 "../wslib/desktop.c"
  $50 = ($49|0)<(18); //@line 133 "../wslib/desktop.c"
  if (!($50)) {
   label = 15;
   break;
  }
  $51 = $y; //@line 136 "../wslib/desktop.c"
  $52 = $2; //@line 136 "../wslib/desktop.c"
  $53 = $52&65535; //@line 136 "../wslib/desktop.c"
  $54 = (($51) + ($53))|0; //@line 136 "../wslib/desktop.c"
  $55 = $0; //@line 136 "../wslib/desktop.c"
  $56 = ((($55)) + 24|0); //@line 136 "../wslib/desktop.c"
  $57 = HEAP32[$56>>2]|0; //@line 136 "../wslib/desktop.c"
  $58 = ((($57)) + 14|0); //@line 136 "../wslib/desktop.c"
  $59 = HEAP16[$58>>1]|0; //@line 136 "../wslib/desktop.c"
  $60 = $59&65535; //@line 136 "../wslib/desktop.c"
  $61 = ($54|0)>=($60|0); //@line 136 "../wslib/desktop.c"
  if ($61) {
   label = 15;
   break;
  }
  $x = 0; //@line 139 "../wslib/desktop.c"
  while(1) {
   $62 = $x; //@line 139 "../wslib/desktop.c"
   $63 = ($62|0)<(11); //@line 139 "../wslib/desktop.c"
   if (!($63)) {
    break;
   }
   $64 = $x; //@line 142 "../wslib/desktop.c"
   $65 = $1; //@line 142 "../wslib/desktop.c"
   $66 = $65&65535; //@line 142 "../wslib/desktop.c"
   $67 = (($64) + ($66))|0; //@line 142 "../wslib/desktop.c"
   $68 = $0; //@line 142 "../wslib/desktop.c"
   $69 = ((($68)) + 24|0); //@line 142 "../wslib/desktop.c"
   $70 = HEAP32[$69>>2]|0; //@line 142 "../wslib/desktop.c"
   $71 = ((($70)) + 12|0); //@line 142 "../wslib/desktop.c"
   $72 = HEAP16[$71>>1]|0; //@line 142 "../wslib/desktop.c"
   $73 = $72&65535; //@line 142 "../wslib/desktop.c"
   $74 = ($67|0)>=($73|0); //@line 142 "../wslib/desktop.c"
   if ($74) {
    break;
   }
   $75 = $y; //@line 147 "../wslib/desktop.c"
   $76 = ($75*11)|0; //@line 147 "../wslib/desktop.c"
   $77 = $x; //@line 147 "../wslib/desktop.c"
   $78 = (($76) + ($77))|0; //@line 147 "../wslib/desktop.c"
   $79 = (44 + ($78<<2)|0); //@line 147 "../wslib/desktop.c"
   $80 = HEAP32[$79>>2]|0; //@line 147 "../wslib/desktop.c"
   $81 = $80 & -16777216; //@line 147 "../wslib/desktop.c"
   $82 = ($81|0)!=(0); //@line 147 "../wslib/desktop.c"
   if ($82) {
    $83 = $y; //@line 151 "../wslib/desktop.c"
    $84 = ($83*11)|0; //@line 151 "../wslib/desktop.c"
    $85 = $x; //@line 151 "../wslib/desktop.c"
    $86 = (($84) + ($85))|0; //@line 151 "../wslib/desktop.c"
    $87 = (44 + ($86<<2)|0); //@line 151 "../wslib/desktop.c"
    $88 = HEAP32[$87>>2]|0; //@line 151 "../wslib/desktop.c"
    $89 = $y; //@line 148 "../wslib/desktop.c"
    $90 = $2; //@line 148 "../wslib/desktop.c"
    $91 = $90&65535; //@line 148 "../wslib/desktop.c"
    $92 = (($89) + ($91))|0; //@line 148 "../wslib/desktop.c"
    $93 = $0; //@line 149 "../wslib/desktop.c"
    $94 = ((($93)) + 24|0); //@line 149 "../wslib/desktop.c"
    $95 = HEAP32[$94>>2]|0; //@line 149 "../wslib/desktop.c"
    $96 = ((($95)) + 12|0); //@line 149 "../wslib/desktop.c"
    $97 = HEAP16[$96>>1]|0; //@line 149 "../wslib/desktop.c"
    $98 = $97&65535; //@line 149 "../wslib/desktop.c"
    $99 = Math_imul($92, $98)|0; //@line 149 "../wslib/desktop.c"
    $100 = $x; //@line 150 "../wslib/desktop.c"
    $101 = $1; //@line 150 "../wslib/desktop.c"
    $102 = $101&65535; //@line 150 "../wslib/desktop.c"
    $103 = (($100) + ($102))|0; //@line 150 "../wslib/desktop.c"
    $104 = (($99) + ($103))|0; //@line 150 "../wslib/desktop.c"
    $105 = $0; //@line 148 "../wslib/desktop.c"
    $106 = ((($105)) + 24|0); //@line 148 "../wslib/desktop.c"
    $107 = HEAP32[$106>>2]|0; //@line 148 "../wslib/desktop.c"
    $108 = ((($107)) + 8|0); //@line 148 "../wslib/desktop.c"
    $109 = HEAP32[$108>>2]|0; //@line 148 "../wslib/desktop.c"
    $110 = (($109) + ($104<<2)|0); //@line 148 "../wslib/desktop.c"
    HEAP32[$110>>2] = $88; //@line 151 "../wslib/desktop.c"
   }
   $111 = $x; //@line 139 "../wslib/desktop.c"
   $112 = (($111) + 1)|0; //@line 139 "../wslib/desktop.c"
   $x = $112; //@line 139 "../wslib/desktop.c"
  }
  $113 = $y; //@line 133 "../wslib/desktop.c"
  $114 = (($113) + 1)|0; //@line 133 "../wslib/desktop.c"
  $y = $114; //@line 133 "../wslib/desktop.c"
 }
 if ((label|0) == 15) {
  STACKTOP = sp;return; //@line 154 "../wslib/desktop.c"
 }
}
function _Rect_new($top,$left,$bottom,$right) {
 $top = $top|0;
 $left = $left|0;
 $bottom = $bottom|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $rect = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $top;
 $2 = $left;
 $3 = $bottom;
 $4 = $right;
 $5 = (_malloc(20)|0); //@line 10 "../wslib/rect.c"
 $rect = $5; //@line 10 "../wslib/rect.c"
 $6 = ($5|0)!=(0|0); //@line 10 "../wslib/rect.c"
 $7 = $rect; //@line 14 "../wslib/rect.c"
 if ($6) {
  _Object_init($7,0); //@line 14 "../wslib/rect.c"
  $8 = $1; //@line 15 "../wslib/rect.c"
  $9 = $rect; //@line 15 "../wslib/rect.c"
  $10 = ((($9)) + 4|0); //@line 15 "../wslib/rect.c"
  HEAP32[$10>>2] = $8; //@line 15 "../wslib/rect.c"
  $11 = $2; //@line 16 "../wslib/rect.c"
  $12 = $rect; //@line 16 "../wslib/rect.c"
  $13 = ((($12)) + 8|0); //@line 16 "../wslib/rect.c"
  HEAP32[$13>>2] = $11; //@line 16 "../wslib/rect.c"
  $14 = $3; //@line 17 "../wslib/rect.c"
  $15 = $rect; //@line 17 "../wslib/rect.c"
  $16 = ((($15)) + 12|0); //@line 17 "../wslib/rect.c"
  HEAP32[$16>>2] = $14; //@line 17 "../wslib/rect.c"
  $17 = $4; //@line 18 "../wslib/rect.c"
  $18 = $rect; //@line 18 "../wslib/rect.c"
  $19 = ((($18)) + 16|0); //@line 18 "../wslib/rect.c"
  HEAP32[$19>>2] = $17; //@line 18 "../wslib/rect.c"
  $20 = $rect; //@line 20 "../wslib/rect.c"
  $0 = $20; //@line 20 "../wslib/rect.c"
  $21 = $0; //@line 21 "../wslib/rect.c"
  STACKTOP = sp;return ($21|0); //@line 21 "../wslib/rect.c"
 } else {
  $0 = $7; //@line 11 "../wslib/rect.c"
  $21 = $0; //@line 21 "../wslib/rect.c"
  STACKTOP = sp;return ($21|0); //@line 21 "../wslib/rect.c"
 }
 return (0)|0;
}
function _Rect_split($subject_rect,$cutting_rect) {
 $subject_rect = $subject_rect|0;
 $cutting_rect = $cutting_rect|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $17 = 0, $18 = 0, $19 = 0;
 var $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $output_rects = 0, $subject_copy = 0, $temp_rect = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $subject_copy = sp + 4|0;
 $1 = $subject_rect;
 $2 = $cutting_rect;
 $3 = (_List_new()|0); //@line 33 "../wslib/rect.c"
 $output_rects = $3; //@line 33 "../wslib/rect.c"
 $4 = ($3|0)!=(0|0); //@line 33 "../wslib/rect.c"
 if (!($4)) {
  $5 = $output_rects; //@line 34 "../wslib/rect.c"
  $0 = $5; //@line 34 "../wslib/rect.c"
  $167 = $0; //@line 146 "../wslib/rect.c"
  STACKTOP = sp;return ($167|0); //@line 146 "../wslib/rect.c"
 }
 $6 = $1; //@line 40 "../wslib/rect.c"
 $7 = ((($6)) + 4|0); //@line 40 "../wslib/rect.c"
 $8 = HEAP32[$7>>2]|0; //@line 40 "../wslib/rect.c"
 $9 = ((($subject_copy)) + 4|0); //@line 40 "../wslib/rect.c"
 HEAP32[$9>>2] = $8; //@line 40 "../wslib/rect.c"
 $10 = $1; //@line 41 "../wslib/rect.c"
 $11 = ((($10)) + 8|0); //@line 41 "../wslib/rect.c"
 $12 = HEAP32[$11>>2]|0; //@line 41 "../wslib/rect.c"
 $13 = ((($subject_copy)) + 8|0); //@line 41 "../wslib/rect.c"
 HEAP32[$13>>2] = $12; //@line 41 "../wslib/rect.c"
 $14 = $1; //@line 42 "../wslib/rect.c"
 $15 = ((($14)) + 12|0); //@line 42 "../wslib/rect.c"
 $16 = HEAP32[$15>>2]|0; //@line 42 "../wslib/rect.c"
 $17 = ((($subject_copy)) + 12|0); //@line 42 "../wslib/rect.c"
 HEAP32[$17>>2] = $16; //@line 42 "../wslib/rect.c"
 $18 = $1; //@line 43 "../wslib/rect.c"
 $19 = ((($18)) + 16|0); //@line 43 "../wslib/rect.c"
 $20 = HEAP32[$19>>2]|0; //@line 43 "../wslib/rect.c"
 $21 = ((($subject_copy)) + 16|0); //@line 43 "../wslib/rect.c"
 HEAP32[$21>>2] = $20; //@line 43 "../wslib/rect.c"
 $22 = $2; //@line 51 "../wslib/rect.c"
 $23 = ((($22)) + 8|0); //@line 51 "../wslib/rect.c"
 $24 = HEAP32[$23>>2]|0; //@line 51 "../wslib/rect.c"
 $25 = ((($subject_copy)) + 8|0); //@line 51 "../wslib/rect.c"
 $26 = HEAP32[$25>>2]|0; //@line 51 "../wslib/rect.c"
 $27 = ($24|0)>($26|0); //@line 51 "../wslib/rect.c"
 do {
  if ($27) {
   $28 = $2; //@line 51 "../wslib/rect.c"
   $29 = ((($28)) + 8|0); //@line 51 "../wslib/rect.c"
   $30 = HEAP32[$29>>2]|0; //@line 51 "../wslib/rect.c"
   $31 = ((($subject_copy)) + 16|0); //@line 51 "../wslib/rect.c"
   $32 = HEAP32[$31>>2]|0; //@line 51 "../wslib/rect.c"
   $33 = ($30|0)<=($32|0); //@line 51 "../wslib/rect.c"
   if ($33) {
    $34 = ((($subject_copy)) + 4|0); //@line 55 "../wslib/rect.c"
    $35 = HEAP32[$34>>2]|0; //@line 55 "../wslib/rect.c"
    $36 = ((($subject_copy)) + 8|0); //@line 55 "../wslib/rect.c"
    $37 = HEAP32[$36>>2]|0; //@line 55 "../wslib/rect.c"
    $38 = ((($subject_copy)) + 12|0); //@line 56 "../wslib/rect.c"
    $39 = HEAP32[$38>>2]|0; //@line 56 "../wslib/rect.c"
    $40 = $2; //@line 56 "../wslib/rect.c"
    $41 = ((($40)) + 8|0); //@line 56 "../wslib/rect.c"
    $42 = HEAP32[$41>>2]|0; //@line 56 "../wslib/rect.c"
    $43 = (($42) - 1)|0; //@line 56 "../wslib/rect.c"
    $44 = (_Rect_new($35,$37,$39,$43)|0); //@line 55 "../wslib/rect.c"
    $temp_rect = $44; //@line 55 "../wslib/rect.c"
    $45 = ($44|0)!=(0|0); //@line 55 "../wslib/rect.c"
    $46 = $output_rects; //@line 65 "../wslib/rect.c"
    if ($45) {
     $47 = $temp_rect; //@line 65 "../wslib/rect.c"
     (_List_add($46,$47)|0); //@line 65 "../wslib/rect.c"
     $48 = $2; //@line 68 "../wslib/rect.c"
     $49 = ((($48)) + 8|0); //@line 68 "../wslib/rect.c"
     $50 = HEAP32[$49>>2]|0; //@line 68 "../wslib/rect.c"
     $51 = ((($subject_copy)) + 8|0); //@line 68 "../wslib/rect.c"
     HEAP32[$51>>2] = $50; //@line 68 "../wslib/rect.c"
     break;
    }
    _free($46); //@line 59 "../wslib/rect.c"
    $0 = 0; //@line 61 "../wslib/rect.c"
    $167 = $0; //@line 146 "../wslib/rect.c"
    STACKTOP = sp;return ($167|0); //@line 146 "../wslib/rect.c"
   }
  }
 } while(0);
 $52 = $2; //@line 72 "../wslib/rect.c"
 $53 = ((($52)) + 4|0); //@line 72 "../wslib/rect.c"
 $54 = HEAP32[$53>>2]|0; //@line 72 "../wslib/rect.c"
 $55 = ((($subject_copy)) + 4|0); //@line 72 "../wslib/rect.c"
 $56 = HEAP32[$55>>2]|0; //@line 72 "../wslib/rect.c"
 $57 = ($54|0)>($56|0); //@line 72 "../wslib/rect.c"
 do {
  if ($57) {
   $58 = $2; //@line 72 "../wslib/rect.c"
   $59 = ((($58)) + 4|0); //@line 72 "../wslib/rect.c"
   $60 = HEAP32[$59>>2]|0; //@line 72 "../wslib/rect.c"
   $61 = ((($subject_copy)) + 12|0); //@line 72 "../wslib/rect.c"
   $62 = HEAP32[$61>>2]|0; //@line 72 "../wslib/rect.c"
   $63 = ($60|0)<=($62|0); //@line 72 "../wslib/rect.c"
   if ($63) {
    $64 = ((($subject_copy)) + 4|0); //@line 76 "../wslib/rect.c"
    $65 = HEAP32[$64>>2]|0; //@line 76 "../wslib/rect.c"
    $66 = ((($subject_copy)) + 8|0); //@line 76 "../wslib/rect.c"
    $67 = HEAP32[$66>>2]|0; //@line 76 "../wslib/rect.c"
    $68 = $2; //@line 77 "../wslib/rect.c"
    $69 = ((($68)) + 4|0); //@line 77 "../wslib/rect.c"
    $70 = HEAP32[$69>>2]|0; //@line 77 "../wslib/rect.c"
    $71 = (($70) - 1)|0; //@line 77 "../wslib/rect.c"
    $72 = ((($subject_copy)) + 16|0); //@line 77 "../wslib/rect.c"
    $73 = HEAP32[$72>>2]|0; //@line 77 "../wslib/rect.c"
    $74 = (_Rect_new($65,$67,$71,$73)|0); //@line 76 "../wslib/rect.c"
    $temp_rect = $74; //@line 76 "../wslib/rect.c"
    $75 = ($74|0)!=(0|0); //@line 76 "../wslib/rect.c"
    if ($75) {
     $84 = $output_rects; //@line 90 "../wslib/rect.c"
     $85 = $temp_rect; //@line 90 "../wslib/rect.c"
     (_List_add($84,$85)|0); //@line 90 "../wslib/rect.c"
     $86 = $2; //@line 93 "../wslib/rect.c"
     $87 = ((($86)) + 4|0); //@line 93 "../wslib/rect.c"
     $88 = HEAP32[$87>>2]|0; //@line 93 "../wslib/rect.c"
     $89 = ((($subject_copy)) + 4|0); //@line 93 "../wslib/rect.c"
     HEAP32[$89>>2] = $88; //@line 93 "../wslib/rect.c"
     break;
    }
    while(1) {
     $76 = $output_rects; //@line 81 "../wslib/rect.c"
     $77 = ((($76)) + 4|0); //@line 81 "../wslib/rect.c"
     $78 = HEAP32[$77>>2]|0; //@line 81 "../wslib/rect.c"
     $79 = ($78|0)!=(0); //@line 81 "../wslib/rect.c"
     if (!($79)) {
      break;
     }
     $80 = $temp_rect; //@line 82 "../wslib/rect.c"
     _free($80); //@line 82 "../wslib/rect.c"
     $81 = $output_rects; //@line 81 "../wslib/rect.c"
     $82 = (_List_remove_at($81,0)|0); //@line 81 "../wslib/rect.c"
     $temp_rect = $82; //@line 81 "../wslib/rect.c"
    }
    $83 = $output_rects; //@line 84 "../wslib/rect.c"
    _free($83); //@line 84 "../wslib/rect.c"
    $0 = 0; //@line 86 "../wslib/rect.c"
    $167 = $0; //@line 146 "../wslib/rect.c"
    STACKTOP = sp;return ($167|0); //@line 146 "../wslib/rect.c"
   }
  }
 } while(0);
 $90 = $2; //@line 97 "../wslib/rect.c"
 $91 = ((($90)) + 16|0); //@line 97 "../wslib/rect.c"
 $92 = HEAP32[$91>>2]|0; //@line 97 "../wslib/rect.c"
 $93 = ((($subject_copy)) + 8|0); //@line 97 "../wslib/rect.c"
 $94 = HEAP32[$93>>2]|0; //@line 97 "../wslib/rect.c"
 $95 = ($92|0)>=($94|0); //@line 97 "../wslib/rect.c"
 do {
  if ($95) {
   $96 = $2; //@line 97 "../wslib/rect.c"
   $97 = ((($96)) + 16|0); //@line 97 "../wslib/rect.c"
   $98 = HEAP32[$97>>2]|0; //@line 97 "../wslib/rect.c"
   $99 = ((($subject_copy)) + 16|0); //@line 97 "../wslib/rect.c"
   $100 = HEAP32[$99>>2]|0; //@line 97 "../wslib/rect.c"
   $101 = ($98|0)<($100|0); //@line 97 "../wslib/rect.c"
   if ($101) {
    $102 = ((($subject_copy)) + 4|0); //@line 101 "../wslib/rect.c"
    $103 = HEAP32[$102>>2]|0; //@line 101 "../wslib/rect.c"
    $104 = $2; //@line 101 "../wslib/rect.c"
    $105 = ((($104)) + 16|0); //@line 101 "../wslib/rect.c"
    $106 = HEAP32[$105>>2]|0; //@line 101 "../wslib/rect.c"
    $107 = (($106) + 1)|0; //@line 101 "../wslib/rect.c"
    $108 = ((($subject_copy)) + 12|0); //@line 102 "../wslib/rect.c"
    $109 = HEAP32[$108>>2]|0; //@line 102 "../wslib/rect.c"
    $110 = ((($subject_copy)) + 16|0); //@line 102 "../wslib/rect.c"
    $111 = HEAP32[$110>>2]|0; //@line 102 "../wslib/rect.c"
    $112 = (_Rect_new($103,$107,$109,$111)|0); //@line 101 "../wslib/rect.c"
    $temp_rect = $112; //@line 101 "../wslib/rect.c"
    $113 = ($112|0)!=(0|0); //@line 101 "../wslib/rect.c"
    if ($113) {
     $122 = $output_rects; //@line 114 "../wslib/rect.c"
     $123 = $temp_rect; //@line 114 "../wslib/rect.c"
     (_List_add($122,$123)|0); //@line 114 "../wslib/rect.c"
     $124 = $2; //@line 117 "../wslib/rect.c"
     $125 = ((($124)) + 16|0); //@line 117 "../wslib/rect.c"
     $126 = HEAP32[$125>>2]|0; //@line 117 "../wslib/rect.c"
     $127 = ((($subject_copy)) + 16|0); //@line 117 "../wslib/rect.c"
     HEAP32[$127>>2] = $126; //@line 117 "../wslib/rect.c"
     break;
    }
    while(1) {
     $114 = $output_rects; //@line 105 "../wslib/rect.c"
     $115 = ((($114)) + 4|0); //@line 105 "../wslib/rect.c"
     $116 = HEAP32[$115>>2]|0; //@line 105 "../wslib/rect.c"
     $117 = ($116|0)!=(0); //@line 105 "../wslib/rect.c"
     if (!($117)) {
      break;
     }
     $118 = $temp_rect; //@line 106 "../wslib/rect.c"
     _free($118); //@line 106 "../wslib/rect.c"
     $119 = $output_rects; //@line 105 "../wslib/rect.c"
     $120 = (_List_remove_at($119,0)|0); //@line 105 "../wslib/rect.c"
     $temp_rect = $120; //@line 105 "../wslib/rect.c"
    }
    $121 = $output_rects; //@line 108 "../wslib/rect.c"
    _free($121); //@line 108 "../wslib/rect.c"
    $0 = 0; //@line 110 "../wslib/rect.c"
    $167 = $0; //@line 146 "../wslib/rect.c"
    STACKTOP = sp;return ($167|0); //@line 146 "../wslib/rect.c"
   }
  }
 } while(0);
 $128 = $2; //@line 121 "../wslib/rect.c"
 $129 = ((($128)) + 12|0); //@line 121 "../wslib/rect.c"
 $130 = HEAP32[$129>>2]|0; //@line 121 "../wslib/rect.c"
 $131 = ((($subject_copy)) + 4|0); //@line 121 "../wslib/rect.c"
 $132 = HEAP32[$131>>2]|0; //@line 121 "../wslib/rect.c"
 $133 = ($130|0)>=($132|0); //@line 121 "../wslib/rect.c"
 do {
  if ($133) {
   $134 = $2; //@line 121 "../wslib/rect.c"
   $135 = ((($134)) + 12|0); //@line 121 "../wslib/rect.c"
   $136 = HEAP32[$135>>2]|0; //@line 121 "../wslib/rect.c"
   $137 = ((($subject_copy)) + 12|0); //@line 121 "../wslib/rect.c"
   $138 = HEAP32[$137>>2]|0; //@line 121 "../wslib/rect.c"
   $139 = ($136|0)<($138|0); //@line 121 "../wslib/rect.c"
   if ($139) {
    $140 = $2; //@line 125 "../wslib/rect.c"
    $141 = ((($140)) + 12|0); //@line 125 "../wslib/rect.c"
    $142 = HEAP32[$141>>2]|0; //@line 125 "../wslib/rect.c"
    $143 = (($142) + 1)|0; //@line 125 "../wslib/rect.c"
    $144 = ((($subject_copy)) + 8|0); //@line 125 "../wslib/rect.c"
    $145 = HEAP32[$144>>2]|0; //@line 125 "../wslib/rect.c"
    $146 = ((($subject_copy)) + 12|0); //@line 126 "../wslib/rect.c"
    $147 = HEAP32[$146>>2]|0; //@line 126 "../wslib/rect.c"
    $148 = ((($subject_copy)) + 16|0); //@line 126 "../wslib/rect.c"
    $149 = HEAP32[$148>>2]|0; //@line 126 "../wslib/rect.c"
    $150 = (_Rect_new($143,$145,$147,$149)|0); //@line 125 "../wslib/rect.c"
    $temp_rect = $150; //@line 125 "../wslib/rect.c"
    $151 = ($150|0)!=(0|0); //@line 125 "../wslib/rect.c"
    if ($151) {
     $160 = $output_rects; //@line 138 "../wslib/rect.c"
     $161 = $temp_rect; //@line 138 "../wslib/rect.c"
     (_List_add($160,$161)|0); //@line 138 "../wslib/rect.c"
     $162 = $2; //@line 141 "../wslib/rect.c"
     $163 = ((($162)) + 12|0); //@line 141 "../wslib/rect.c"
     $164 = HEAP32[$163>>2]|0; //@line 141 "../wslib/rect.c"
     $165 = ((($subject_copy)) + 12|0); //@line 141 "../wslib/rect.c"
     HEAP32[$165>>2] = $164; //@line 141 "../wslib/rect.c"
     break;
    }
    while(1) {
     $152 = $output_rects; //@line 129 "../wslib/rect.c"
     $153 = ((($152)) + 4|0); //@line 129 "../wslib/rect.c"
     $154 = HEAP32[$153>>2]|0; //@line 129 "../wslib/rect.c"
     $155 = ($154|0)!=(0); //@line 129 "../wslib/rect.c"
     if (!($155)) {
      break;
     }
     $156 = $temp_rect; //@line 130 "../wslib/rect.c"
     _free($156); //@line 130 "../wslib/rect.c"
     $157 = $output_rects; //@line 129 "../wslib/rect.c"
     $158 = (_List_remove_at($157,0)|0); //@line 129 "../wslib/rect.c"
     $temp_rect = $158; //@line 129 "../wslib/rect.c"
    }
    $159 = $output_rects; //@line 132 "../wslib/rect.c"
    _free($159); //@line 132 "../wslib/rect.c"
    $0 = 0; //@line 134 "../wslib/rect.c"
    $167 = $0; //@line 146 "../wslib/rect.c"
    STACKTOP = sp;return ($167|0); //@line 146 "../wslib/rect.c"
   }
  }
 } while(0);
 $166 = $output_rects; //@line 145 "../wslib/rect.c"
 $0 = $166; //@line 145 "../wslib/rect.c"
 $167 = $0; //@line 146 "../wslib/rect.c"
 STACKTOP = sp;return ($167|0); //@line 146 "../wslib/rect.c"
}
function _Rect_intersect($rect_a,$rect_b) {
 $rect_a = $rect_a|0;
 $rect_b = $rect_b|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0;
 var $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0;
 var $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0;
 var $97 = 0, $98 = 0, $99 = 0, $result_rect = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $rect_a;
 $2 = $rect_b;
 $3 = $1; //@line 152 "../wslib/rect.c"
 $4 = ((($3)) + 8|0); //@line 152 "../wslib/rect.c"
 $5 = HEAP32[$4>>2]|0; //@line 152 "../wslib/rect.c"
 $6 = $2; //@line 152 "../wslib/rect.c"
 $7 = ((($6)) + 16|0); //@line 152 "../wslib/rect.c"
 $8 = HEAP32[$7>>2]|0; //@line 152 "../wslib/rect.c"
 $9 = ($5|0)<=($8|0); //@line 152 "../wslib/rect.c"
 if ($9) {
  $10 = $1; //@line 153 "../wslib/rect.c"
  $11 = ((($10)) + 16|0); //@line 153 "../wslib/rect.c"
  $12 = HEAP32[$11>>2]|0; //@line 153 "../wslib/rect.c"
  $13 = $2; //@line 153 "../wslib/rect.c"
  $14 = ((($13)) + 8|0); //@line 153 "../wslib/rect.c"
  $15 = HEAP32[$14>>2]|0; //@line 153 "../wslib/rect.c"
  $16 = ($12|0)>=($15|0); //@line 153 "../wslib/rect.c"
  if ($16) {
   $17 = $1; //@line 154 "../wslib/rect.c"
   $18 = ((($17)) + 4|0); //@line 154 "../wslib/rect.c"
   $19 = HEAP32[$18>>2]|0; //@line 154 "../wslib/rect.c"
   $20 = $2; //@line 154 "../wslib/rect.c"
   $21 = ((($20)) + 12|0); //@line 154 "../wslib/rect.c"
   $22 = HEAP32[$21>>2]|0; //@line 154 "../wslib/rect.c"
   $23 = ($19|0)<=($22|0); //@line 154 "../wslib/rect.c"
   if ($23) {
    $24 = $1; //@line 155 "../wslib/rect.c"
    $25 = ((($24)) + 12|0); //@line 155 "../wslib/rect.c"
    $26 = HEAP32[$25>>2]|0; //@line 155 "../wslib/rect.c"
    $27 = $2; //@line 155 "../wslib/rect.c"
    $28 = ((($27)) + 4|0); //@line 155 "../wslib/rect.c"
    $29 = HEAP32[$28>>2]|0; //@line 155 "../wslib/rect.c"
    $30 = ($26|0)>=($29|0); //@line 155 "../wslib/rect.c"
    if ($30) {
     $31 = $1; //@line 158 "../wslib/rect.c"
     $32 = ((($31)) + 4|0); //@line 158 "../wslib/rect.c"
     $33 = HEAP32[$32>>2]|0; //@line 158 "../wslib/rect.c"
     $34 = $1; //@line 158 "../wslib/rect.c"
     $35 = ((($34)) + 8|0); //@line 158 "../wslib/rect.c"
     $36 = HEAP32[$35>>2]|0; //@line 158 "../wslib/rect.c"
     $37 = $1; //@line 159 "../wslib/rect.c"
     $38 = ((($37)) + 12|0); //@line 159 "../wslib/rect.c"
     $39 = HEAP32[$38>>2]|0; //@line 159 "../wslib/rect.c"
     $40 = $1; //@line 159 "../wslib/rect.c"
     $41 = ((($40)) + 16|0); //@line 159 "../wslib/rect.c"
     $42 = HEAP32[$41>>2]|0; //@line 159 "../wslib/rect.c"
     $43 = (_Rect_new($33,$36,$39,$42)|0); //@line 158 "../wslib/rect.c"
     $result_rect = $43; //@line 158 "../wslib/rect.c"
     $44 = ($43|0)!=(0|0); //@line 158 "../wslib/rect.c"
     if (!($44)) {
      $0 = 0; //@line 160 "../wslib/rect.c"
      $122 = $0; //@line 175 "../wslib/rect.c"
      STACKTOP = sp;return ($122|0); //@line 175 "../wslib/rect.c"
     }
     $45 = $2; //@line 162 "../wslib/rect.c"
     $46 = ((($45)) + 8|0); //@line 162 "../wslib/rect.c"
     $47 = HEAP32[$46>>2]|0; //@line 162 "../wslib/rect.c"
     $48 = $result_rect; //@line 162 "../wslib/rect.c"
     $49 = ((($48)) + 8|0); //@line 162 "../wslib/rect.c"
     $50 = HEAP32[$49>>2]|0; //@line 162 "../wslib/rect.c"
     $51 = ($47|0)>($50|0); //@line 162 "../wslib/rect.c"
     if ($51) {
      $52 = $2; //@line 162 "../wslib/rect.c"
      $53 = ((($52)) + 8|0); //@line 162 "../wslib/rect.c"
      $54 = HEAP32[$53>>2]|0; //@line 162 "../wslib/rect.c"
      $55 = $result_rect; //@line 162 "../wslib/rect.c"
      $56 = ((($55)) + 16|0); //@line 162 "../wslib/rect.c"
      $57 = HEAP32[$56>>2]|0; //@line 162 "../wslib/rect.c"
      $58 = ($54|0)<=($57|0); //@line 162 "../wslib/rect.c"
      if ($58) {
       $59 = $2; //@line 163 "../wslib/rect.c"
       $60 = ((($59)) + 8|0); //@line 163 "../wslib/rect.c"
       $61 = HEAP32[$60>>2]|0; //@line 163 "../wslib/rect.c"
       $62 = $result_rect; //@line 163 "../wslib/rect.c"
       $63 = ((($62)) + 8|0); //@line 163 "../wslib/rect.c"
       HEAP32[$63>>2] = $61; //@line 163 "../wslib/rect.c"
      }
     }
     $64 = $2; //@line 165 "../wslib/rect.c"
     $65 = ((($64)) + 4|0); //@line 165 "../wslib/rect.c"
     $66 = HEAP32[$65>>2]|0; //@line 165 "../wslib/rect.c"
     $67 = $result_rect; //@line 165 "../wslib/rect.c"
     $68 = ((($67)) + 4|0); //@line 165 "../wslib/rect.c"
     $69 = HEAP32[$68>>2]|0; //@line 165 "../wslib/rect.c"
     $70 = ($66|0)>($69|0); //@line 165 "../wslib/rect.c"
     if ($70) {
      $71 = $2; //@line 165 "../wslib/rect.c"
      $72 = ((($71)) + 4|0); //@line 165 "../wslib/rect.c"
      $73 = HEAP32[$72>>2]|0; //@line 165 "../wslib/rect.c"
      $74 = $result_rect; //@line 165 "../wslib/rect.c"
      $75 = ((($74)) + 12|0); //@line 165 "../wslib/rect.c"
      $76 = HEAP32[$75>>2]|0; //@line 165 "../wslib/rect.c"
      $77 = ($73|0)<=($76|0); //@line 165 "../wslib/rect.c"
      if ($77) {
       $78 = $2; //@line 166 "../wslib/rect.c"
       $79 = ((($78)) + 4|0); //@line 166 "../wslib/rect.c"
       $80 = HEAP32[$79>>2]|0; //@line 166 "../wslib/rect.c"
       $81 = $result_rect; //@line 166 "../wslib/rect.c"
       $82 = ((($81)) + 4|0); //@line 166 "../wslib/rect.c"
       HEAP32[$82>>2] = $80; //@line 166 "../wslib/rect.c"
      }
     }
     $83 = $2; //@line 168 "../wslib/rect.c"
     $84 = ((($83)) + 16|0); //@line 168 "../wslib/rect.c"
     $85 = HEAP32[$84>>2]|0; //@line 168 "../wslib/rect.c"
     $86 = $result_rect; //@line 168 "../wslib/rect.c"
     $87 = ((($86)) + 8|0); //@line 168 "../wslib/rect.c"
     $88 = HEAP32[$87>>2]|0; //@line 168 "../wslib/rect.c"
     $89 = ($85|0)>=($88|0); //@line 168 "../wslib/rect.c"
     if ($89) {
      $90 = $2; //@line 168 "../wslib/rect.c"
      $91 = ((($90)) + 16|0); //@line 168 "../wslib/rect.c"
      $92 = HEAP32[$91>>2]|0; //@line 168 "../wslib/rect.c"
      $93 = $result_rect; //@line 168 "../wslib/rect.c"
      $94 = ((($93)) + 16|0); //@line 168 "../wslib/rect.c"
      $95 = HEAP32[$94>>2]|0; //@line 168 "../wslib/rect.c"
      $96 = ($92|0)<($95|0); //@line 168 "../wslib/rect.c"
      if ($96) {
       $97 = $2; //@line 169 "../wslib/rect.c"
       $98 = ((($97)) + 16|0); //@line 169 "../wslib/rect.c"
       $99 = HEAP32[$98>>2]|0; //@line 169 "../wslib/rect.c"
       $100 = $result_rect; //@line 169 "../wslib/rect.c"
       $101 = ((($100)) + 16|0); //@line 169 "../wslib/rect.c"
       HEAP32[$101>>2] = $99; //@line 169 "../wslib/rect.c"
      }
     }
     $102 = $2; //@line 171 "../wslib/rect.c"
     $103 = ((($102)) + 12|0); //@line 171 "../wslib/rect.c"
     $104 = HEAP32[$103>>2]|0; //@line 171 "../wslib/rect.c"
     $105 = $result_rect; //@line 171 "../wslib/rect.c"
     $106 = ((($105)) + 4|0); //@line 171 "../wslib/rect.c"
     $107 = HEAP32[$106>>2]|0; //@line 171 "../wslib/rect.c"
     $108 = ($104|0)>=($107|0); //@line 171 "../wslib/rect.c"
     if ($108) {
      $109 = $2; //@line 171 "../wslib/rect.c"
      $110 = ((($109)) + 12|0); //@line 171 "../wslib/rect.c"
      $111 = HEAP32[$110>>2]|0; //@line 171 "../wslib/rect.c"
      $112 = $result_rect; //@line 171 "../wslib/rect.c"
      $113 = ((($112)) + 12|0); //@line 171 "../wslib/rect.c"
      $114 = HEAP32[$113>>2]|0; //@line 171 "../wslib/rect.c"
      $115 = ($111|0)<($114|0); //@line 171 "../wslib/rect.c"
      if ($115) {
       $116 = $2; //@line 172 "../wslib/rect.c"
       $117 = ((($116)) + 12|0); //@line 172 "../wslib/rect.c"
       $118 = HEAP32[$117>>2]|0; //@line 172 "../wslib/rect.c"
       $119 = $result_rect; //@line 172 "../wslib/rect.c"
       $120 = ((($119)) + 12|0); //@line 172 "../wslib/rect.c"
       HEAP32[$120>>2] = $118; //@line 172 "../wslib/rect.c"
      }
     }
     $121 = $result_rect; //@line 174 "../wslib/rect.c"
     $0 = $121; //@line 174 "../wslib/rect.c"
     $122 = $0; //@line 175 "../wslib/rect.c"
     STACKTOP = sp;return ($122|0); //@line 175 "../wslib/rect.c"
    }
   }
  }
 }
 $0 = 0; //@line 156 "../wslib/rect.c"
 $122 = $0; //@line 175 "../wslib/rect.c"
 STACKTOP = sp;return ($122|0); //@line 175 "../wslib/rect.c"
}
function _Window_init($window,$x,$y,$width,$height,$flags,$context) {
 $window = $window|0;
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 $height = $height|0;
 $flags = $flags|0;
 $context = $context|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $window;
 $2 = $x;
 $3 = $y;
 $4 = $width;
 $5 = $height;
 $6 = $flags;
 $7 = $context;
 $8 = $1; //@line 74 "../wslib/window.c"
 _Object_init($8,7); //@line 74 "../wslib/window.c"
 $9 = (_List_new()|0); //@line 78 "../wslib/window.c"
 $10 = $1; //@line 78 "../wslib/window.c"
 $11 = ((($10)) + 40|0); //@line 78 "../wslib/window.c"
 HEAP32[$11>>2] = $9; //@line 78 "../wslib/window.c"
 $12 = ($9|0)!=(0|0); //@line 78 "../wslib/window.c"
 if (!($12)) {
  $0 = 0; //@line 79 "../wslib/window.c"
  $73 = $0; //@line 108 "../wslib/window.c"
  STACKTOP = sp;return ($73|0); //@line 108 "../wslib/window.c"
 }
 $13 = HEAP32[836>>2]|0; //@line 82 "../wslib/window.c"
 $14 = (($13) + 1)|0; //@line 82 "../wslib/window.c"
 HEAP32[836>>2] = $14; //@line 82 "../wslib/window.c"
 $15 = $1; //@line 82 "../wslib/window.c"
 $16 = ((($15)) + 8|0); //@line 82 "../wslib/window.c"
 HEAP32[$16>>2] = $14; //@line 82 "../wslib/window.c"
 $17 = $2; //@line 83 "../wslib/window.c"
 $18 = $1; //@line 83 "../wslib/window.c"
 $19 = ((($18)) + 12|0); //@line 83 "../wslib/window.c"
 HEAP16[$19>>1] = $17; //@line 83 "../wslib/window.c"
 $20 = $3; //@line 84 "../wslib/window.c"
 $21 = $1; //@line 84 "../wslib/window.c"
 $22 = ((($21)) + 14|0); //@line 84 "../wslib/window.c"
 HEAP16[$22>>1] = $20; //@line 84 "../wslib/window.c"
 $23 = $4; //@line 85 "../wslib/window.c"
 $24 = $1; //@line 85 "../wslib/window.c"
 $25 = ((($24)) + 16|0); //@line 85 "../wslib/window.c"
 HEAP16[$25>>1] = $23; //@line 85 "../wslib/window.c"
 $26 = $5; //@line 86 "../wslib/window.c"
 $27 = $1; //@line 86 "../wslib/window.c"
 $28 = ((($27)) + 18|0); //@line 86 "../wslib/window.c"
 HEAP16[$28>>1] = $26; //@line 86 "../wslib/window.c"
 $29 = $7; //@line 87 "../wslib/window.c"
 $30 = ($29|0)!=(0|0); //@line 87 "../wslib/window.c"
 $31 = $7; //@line 87 "../wslib/window.c"
 if ($30) {
  $32 = (_Context_new_from($31)|0); //@line 87 "../wslib/window.c"
  $35 = $32;
 } else {
  $35 = $31;
 }
 $33 = $1; //@line 87 "../wslib/window.c"
 $34 = ((($33)) + 24|0); //@line 87 "../wslib/window.c"
 HEAP32[$34>>2] = $35; //@line 87 "../wslib/window.c"
 $36 = $6; //@line 88 "../wslib/window.c"
 $37 = $1; //@line 88 "../wslib/window.c"
 $38 = ((($37)) + 20|0); //@line 88 "../wslib/window.c"
 HEAP16[$38>>1] = $36; //@line 88 "../wslib/window.c"
 $39 = $1; //@line 89 "../wslib/window.c"
 $40 = ((($39)) + 4|0); //@line 89 "../wslib/window.c"
 HEAP32[$40>>2] = 0; //@line 89 "../wslib/window.c"
 $41 = $1; //@line 90 "../wslib/window.c"
 $42 = ((($41)) + 28|0); //@line 90 "../wslib/window.c"
 HEAP32[$42>>2] = 0; //@line 90 "../wslib/window.c"
 $43 = $1; //@line 91 "../wslib/window.c"
 $44 = ((($43)) + 44|0); //@line 91 "../wslib/window.c"
 HEAP16[$44>>1] = 0; //@line 91 "../wslib/window.c"
 $45 = $1; //@line 92 "../wslib/window.c"
 $46 = ((($45)) + 46|0); //@line 92 "../wslib/window.c"
 HEAP16[$46>>1] = 0; //@line 92 "../wslib/window.c"
 $47 = $1; //@line 93 "../wslib/window.c"
 $48 = ((($47)) + 48|0); //@line 93 "../wslib/window.c"
 HEAP8[$48>>0] = 0; //@line 93 "../wslib/window.c"
 $49 = $1; //@line 94 "../wslib/window.c"
 $50 = ((($49)) + 49|0); //@line 94 "../wslib/window.c"
 HEAP8[$50>>0] = 0; //@line 94 "../wslib/window.c"
 $51 = $1; //@line 95 "../wslib/window.c"
 $52 = ((($51)) + 52|0); //@line 95 "../wslib/window.c"
 HEAP32[$52>>2] = 8; //@line 95 "../wslib/window.c"
 $53 = $1; //@line 96 "../wslib/window.c"
 $54 = ((($53)) + 56|0); //@line 96 "../wslib/window.c"
 HEAP32[$54>>2] = 0; //@line 96 "../wslib/window.c"
 $55 = $1; //@line 97 "../wslib/window.c"
 $56 = ((($55)) + 60|0); //@line 97 "../wslib/window.c"
 HEAP32[$56>>2] = 0; //@line 97 "../wslib/window.c"
 $57 = $1; //@line 98 "../wslib/window.c"
 $58 = ((($57)) + 64|0); //@line 98 "../wslib/window.c"
 HEAP32[$58>>2] = 0; //@line 98 "../wslib/window.c"
 $59 = $1; //@line 99 "../wslib/window.c"
 $60 = ((($59)) + 68|0); //@line 99 "../wslib/window.c"
 HEAP32[$60>>2] = 0; //@line 99 "../wslib/window.c"
 $61 = $1; //@line 100 "../wslib/window.c"
 $62 = ((($61)) + 72|0); //@line 100 "../wslib/window.c"
 HEAP32[$62>>2] = 0; //@line 100 "../wslib/window.c"
 $63 = $1; //@line 101 "../wslib/window.c"
 $64 = ((($63)) + 76|0); //@line 101 "../wslib/window.c"
 HEAP32[$64>>2] = 0; //@line 101 "../wslib/window.c"
 $65 = $1; //@line 102 "../wslib/window.c"
 $66 = ((($65)) + 80|0); //@line 102 "../wslib/window.c"
 HEAP32[$66>>2] = 9; //@line 102 "../wslib/window.c"
 $67 = $1; //@line 103 "../wslib/window.c"
 $68 = ((($67)) + 32|0); //@line 103 "../wslib/window.c"
 HEAP32[$68>>2] = 0; //@line 103 "../wslib/window.c"
 $69 = $1; //@line 104 "../wslib/window.c"
 $70 = ((($69)) + 36|0); //@line 104 "../wslib/window.c"
 HEAP32[$70>>2] = 0; //@line 104 "../wslib/window.c"
 $71 = $1; //@line 105 "../wslib/window.c"
 $72 = ((($71)) + 84|0); //@line 105 "../wslib/window.c"
 HEAP32[$72>>2] = 0; //@line 105 "../wslib/window.c"
 $0 = 1; //@line 107 "../wslib/window.c"
 $73 = $0; //@line 108 "../wslib/window.c"
 STACKTOP = sp;return ($73|0); //@line 108 "../wslib/window.c"
}
function _Window_delete_function($window_object) {
 $window_object = $window_object|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0;
 var $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0;
 var $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0;
 var $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0;
 var $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $i = 0, $window = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window_object;
 $1 = $0; //@line 1002 "../wslib/window.c"
 $window = $1; //@line 1002 "../wslib/window.c"
 $2 = $0; //@line 1004 "../wslib/window.c"
 $3 = ($2|0)!=(0|0); //@line 1004 "../wslib/window.c"
 if (!($3)) {
  STACKTOP = sp;return; //@line 1045 "../wslib/window.c"
 }
 $4 = $window; //@line 1007 "../wslib/window.c"
 _Window_hide($4); //@line 1007 "../wslib/window.c"
 $5 = $window; //@line 1009 "../wslib/window.c"
 $6 = ((($5)) + 40|0); //@line 1009 "../wslib/window.c"
 $7 = HEAP32[$6>>2]|0; //@line 1009 "../wslib/window.c"
 _Object_delete($7); //@line 1009 "../wslib/window.c"
 $8 = $window; //@line 1011 "../wslib/window.c"
 $9 = ((($8)) + 4|0); //@line 1011 "../wslib/window.c"
 $10 = HEAP32[$9>>2]|0; //@line 1011 "../wslib/window.c"
 $11 = ($10|0)!=(0|0); //@line 1011 "../wslib/window.c"
 if ($11) {
  $i = 0; //@line 1013 "../wslib/window.c"
  while(1) {
   $12 = $i; //@line 1014 "../wslib/window.c"
   $13 = $window; //@line 1014 "../wslib/window.c"
   $14 = ((($13)) + 4|0); //@line 1014 "../wslib/window.c"
   $15 = HEAP32[$14>>2]|0; //@line 1014 "../wslib/window.c"
   $16 = ((($15)) + 40|0); //@line 1014 "../wslib/window.c"
   $17 = HEAP32[$16>>2]|0; //@line 1014 "../wslib/window.c"
   $18 = ((($17)) + 4|0); //@line 1014 "../wslib/window.c"
   $19 = HEAP32[$18>>2]|0; //@line 1014 "../wslib/window.c"
   $20 = ($12>>>0)<($19>>>0); //@line 1014 "../wslib/window.c"
   if (!($20)) {
    break;
   }
   $21 = $window; //@line 1015 "../wslib/window.c"
   $22 = ((($21)) + 4|0); //@line 1015 "../wslib/window.c"
   $23 = HEAP32[$22>>2]|0; //@line 1015 "../wslib/window.c"
   $24 = ((($23)) + 40|0); //@line 1015 "../wslib/window.c"
   $25 = HEAP32[$24>>2]|0; //@line 1015 "../wslib/window.c"
   $26 = $i; //@line 1015 "../wslib/window.c"
   $27 = (_List_get_at($25,$26)|0); //@line 1015 "../wslib/window.c"
   $28 = $window; //@line 1015 "../wslib/window.c"
   $29 = ($27|0)!=($28|0); //@line 1015 "../wslib/window.c"
   if (!($29)) {
    break;
   }
   $30 = $i; //@line 1016 "../wslib/window.c"
   $31 = (($30) + 1)|0; //@line 1016 "../wslib/window.c"
   $i = $31; //@line 1016 "../wslib/window.c"
  }
  $32 = $i; //@line 1018 "../wslib/window.c"
  $33 = $window; //@line 1018 "../wslib/window.c"
  $34 = ((($33)) + 4|0); //@line 1018 "../wslib/window.c"
  $35 = HEAP32[$34>>2]|0; //@line 1018 "../wslib/window.c"
  $36 = ((($35)) + 40|0); //@line 1018 "../wslib/window.c"
  $37 = HEAP32[$36>>2]|0; //@line 1018 "../wslib/window.c"
  $38 = ((($37)) + 4|0); //@line 1018 "../wslib/window.c"
  $39 = HEAP32[$38>>2]|0; //@line 1018 "../wslib/window.c"
  $40 = ($32>>>0)<($39>>>0); //@line 1018 "../wslib/window.c"
  if ($40) {
   $41 = $window; //@line 1019 "../wslib/window.c"
   $42 = ((($41)) + 4|0); //@line 1019 "../wslib/window.c"
   $43 = HEAP32[$42>>2]|0; //@line 1019 "../wslib/window.c"
   $44 = ((($43)) + 40|0); //@line 1019 "../wslib/window.c"
   $45 = HEAP32[$44>>2]|0; //@line 1019 "../wslib/window.c"
   $46 = $i; //@line 1019 "../wslib/window.c"
   (_List_remove_at($45,$46)|0); //@line 1019 "../wslib/window.c"
  }
  $47 = $window; //@line 1021 "../wslib/window.c"
  $48 = ((($47)) + 4|0); //@line 1021 "../wslib/window.c"
  $49 = HEAP32[$48>>2]|0; //@line 1021 "../wslib/window.c"
  $50 = ((($49)) + 32|0); //@line 1021 "../wslib/window.c"
  $51 = HEAP32[$50>>2]|0; //@line 1021 "../wslib/window.c"
  $52 = $window; //@line 1021 "../wslib/window.c"
  $53 = ($51|0)==($52|0); //@line 1021 "../wslib/window.c"
  do {
   if ($53) {
    $54 = $window; //@line 1023 "../wslib/window.c"
    $55 = ((($54)) + 4|0); //@line 1023 "../wslib/window.c"
    $56 = HEAP32[$55>>2]|0; //@line 1023 "../wslib/window.c"
    $57 = ((($56)) + 40|0); //@line 1023 "../wslib/window.c"
    $58 = HEAP32[$57>>2]|0; //@line 1023 "../wslib/window.c"
    $59 = ((($58)) + 4|0); //@line 1023 "../wslib/window.c"
    $60 = HEAP32[$59>>2]|0; //@line 1023 "../wslib/window.c"
    $61 = ($60|0)!=(0); //@line 1023 "../wslib/window.c"
    $62 = $window; //@line 1026 "../wslib/window.c"
    $63 = ((($62)) + 4|0); //@line 1026 "../wslib/window.c"
    $64 = HEAP32[$63>>2]|0; //@line 1026 "../wslib/window.c"
    if ($61) {
     $65 = ((($64)) + 40|0); //@line 1026 "../wslib/window.c"
     $66 = HEAP32[$65>>2]|0; //@line 1026 "../wslib/window.c"
     $67 = $window; //@line 1027 "../wslib/window.c"
     $68 = ((($67)) + 4|0); //@line 1027 "../wslib/window.c"
     $69 = HEAP32[$68>>2]|0; //@line 1027 "../wslib/window.c"
     $70 = ((($69)) + 40|0); //@line 1027 "../wslib/window.c"
     $71 = HEAP32[$70>>2]|0; //@line 1027 "../wslib/window.c"
     $72 = ((($71)) + 4|0); //@line 1027 "../wslib/window.c"
     $73 = HEAP32[$72>>2]|0; //@line 1027 "../wslib/window.c"
     $74 = (($73) - 1)|0; //@line 1027 "../wslib/window.c"
     $75 = (_List_get_at($66,$74)|0); //@line 1026 "../wslib/window.c"
     $76 = $window; //@line 1025 "../wslib/window.c"
     $77 = ((($76)) + 4|0); //@line 1025 "../wslib/window.c"
     $78 = HEAP32[$77>>2]|0; //@line 1025 "../wslib/window.c"
     $79 = ((($78)) + 32|0); //@line 1025 "../wslib/window.c"
     HEAP32[$79>>2] = $75; //@line 1025 "../wslib/window.c"
     $80 = $window; //@line 1029 "../wslib/window.c"
     $81 = ((($80)) + 4|0); //@line 1029 "../wslib/window.c"
     $82 = HEAP32[$81>>2]|0; //@line 1029 "../wslib/window.c"
     $83 = ((($82)) + 32|0); //@line 1029 "../wslib/window.c"
     $84 = HEAP32[$83>>2]|0; //@line 1029 "../wslib/window.c"
     _Window_update_title($84); //@line 1029 "../wslib/window.c"
     break;
    } else {
     $85 = ((($64)) + 32|0); //@line 1032 "../wslib/window.c"
     HEAP32[$85>>2] = 0; //@line 1032 "../wslib/window.c"
     break;
    }
   }
  } while(0);
  $86 = $window; //@line 1036 "../wslib/window.c"
  $87 = ((($86)) + 4|0); //@line 1036 "../wslib/window.c"
  $88 = HEAP32[$87>>2]|0; //@line 1036 "../wslib/window.c"
  $89 = ((($88)) + 36|0); //@line 1036 "../wslib/window.c"
  $90 = HEAP32[$89>>2]|0; //@line 1036 "../wslib/window.c"
  $91 = $window; //@line 1036 "../wslib/window.c"
  $92 = ($90|0)==($91|0); //@line 1036 "../wslib/window.c"
  if ($92) {
   $93 = $window; //@line 1037 "../wslib/window.c"
   $94 = ((($93)) + 4|0); //@line 1037 "../wslib/window.c"
   $95 = HEAP32[$94>>2]|0; //@line 1037 "../wslib/window.c"
   $96 = ((($95)) + 36|0); //@line 1037 "../wslib/window.c"
   HEAP32[$96>>2] = 0; //@line 1037 "../wslib/window.c"
  }
  $97 = $window; //@line 1039 "../wslib/window.c"
  $98 = ((($97)) + 4|0); //@line 1039 "../wslib/window.c"
  $99 = HEAP32[$98>>2]|0; //@line 1039 "../wslib/window.c"
  $100 = ((($99)) + 28|0); //@line 1039 "../wslib/window.c"
  $101 = HEAP32[$100>>2]|0; //@line 1039 "../wslib/window.c"
  $102 = $window; //@line 1039 "../wslib/window.c"
  $103 = ($101|0)==($102|0); //@line 1039 "../wslib/window.c"
  if ($103) {
   $104 = $window; //@line 1040 "../wslib/window.c"
   $105 = ((($104)) + 4|0); //@line 1040 "../wslib/window.c"
   $106 = HEAP32[$105>>2]|0; //@line 1040 "../wslib/window.c"
   $107 = ((($106)) + 28|0); //@line 1040 "../wslib/window.c"
   HEAP32[$107>>2] = 0; //@line 1040 "../wslib/window.c"
  }
 }
 $108 = $window; //@line 1043 "../wslib/window.c"
 $109 = ((($108)) + 24|0); //@line 1043 "../wslib/window.c"
 $110 = HEAP32[$109>>2]|0; //@line 1043 "../wslib/window.c"
 _Object_delete($110); //@line 1043 "../wslib/window.c"
 $111 = $window; //@line 1044 "../wslib/window.c"
 _free($111); //@line 1044 "../wslib/window.c"
 STACKTOP = sp;return; //@line 1045 "../wslib/window.c"
}
function _Window_paint_handler($window) {
 $window = $window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $0; //@line 515 "../wslib/window.c"
 $2 = ((($1)) + 24|0); //@line 515 "../wslib/window.c"
 $3 = HEAP32[$2>>2]|0; //@line 515 "../wslib/window.c"
 $4 = $0; //@line 516 "../wslib/window.c"
 $5 = ((($4)) + 16|0); //@line 516 "../wslib/window.c"
 $6 = HEAP16[$5>>1]|0; //@line 516 "../wslib/window.c"
 $7 = $6&65535; //@line 516 "../wslib/window.c"
 $8 = $0; //@line 516 "../wslib/window.c"
 $9 = ((($8)) + 18|0); //@line 516 "../wslib/window.c"
 $10 = HEAP16[$9>>1]|0; //@line 516 "../wslib/window.c"
 $11 = $10&65535; //@line 516 "../wslib/window.c"
 _Context_fill_rect($3,0,0,$7,$11,-7746578); //@line 515 "../wslib/window.c"
 STACKTOP = sp;return; //@line 517 "../wslib/window.c"
}
function _Window_move_function($window,$new_x,$new_y) {
 $window = $window|0;
 $new_x = $new_x|0;
 $new_y = $new_y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $dirty_list = 0, $dirty_windows = 0;
 var $new_window_rect = 0, $old_x = 0, $old_y = 0, $replacement_list = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $new_window_rect = sp + 12|0;
 $0 = $window;
 $1 = $new_x;
 $2 = $new_y;
 $3 = $0; //@line 655 "../wslib/window.c"
 $4 = ((($3)) + 12|0); //@line 655 "../wslib/window.c"
 $5 = HEAP16[$4>>1]|0; //@line 655 "../wslib/window.c"
 $6 = $5 << 16 >> 16; //@line 655 "../wslib/window.c"
 $old_x = $6; //@line 655 "../wslib/window.c"
 $7 = $0; //@line 656 "../wslib/window.c"
 $8 = ((($7)) + 14|0); //@line 656 "../wslib/window.c"
 $9 = HEAP16[$8>>1]|0; //@line 656 "../wslib/window.c"
 $10 = $9 << 16 >> 16; //@line 656 "../wslib/window.c"
 $old_y = $10; //@line 656 "../wslib/window.c"
 $11 = $0; //@line 662 "../wslib/window.c"
 _Window_raise($11,0); //@line 662 "../wslib/window.c"
 $12 = $0; //@line 666 "../wslib/window.c"
 $13 = $0; //@line 666 "../wslib/window.c"
 $14 = ((($13)) + 24|0); //@line 666 "../wslib/window.c"
 $15 = HEAP32[$14>>2]|0; //@line 666 "../wslib/window.c"
 _Window_apply_bound_clipping($12,$15,0,0); //@line 666 "../wslib/window.c"
 $16 = $1; //@line 669 "../wslib/window.c"
 $17 = $16&65535; //@line 669 "../wslib/window.c"
 $18 = $0; //@line 669 "../wslib/window.c"
 $19 = ((($18)) + 12|0); //@line 669 "../wslib/window.c"
 HEAP16[$19>>1] = $17; //@line 669 "../wslib/window.c"
 $20 = $2; //@line 670 "../wslib/window.c"
 $21 = $20&65535; //@line 670 "../wslib/window.c"
 $22 = $0; //@line 670 "../wslib/window.c"
 $23 = ((($22)) + 14|0); //@line 670 "../wslib/window.c"
 HEAP16[$23>>1] = $21; //@line 670 "../wslib/window.c"
 $24 = $0; //@line 673 "../wslib/window.c"
 $25 = (_Window_screen_y($24)|0); //@line 673 "../wslib/window.c"
 $26 = ((($new_window_rect)) + 4|0); //@line 673 "../wslib/window.c"
 HEAP32[$26>>2] = $25; //@line 673 "../wslib/window.c"
 $27 = $0; //@line 674 "../wslib/window.c"
 $28 = (_Window_screen_x($27)|0); //@line 674 "../wslib/window.c"
 $29 = ((($new_window_rect)) + 8|0); //@line 674 "../wslib/window.c"
 HEAP32[$29>>2] = $28; //@line 674 "../wslib/window.c"
 $30 = ((($new_window_rect)) + 4|0); //@line 675 "../wslib/window.c"
 $31 = HEAP32[$30>>2]|0; //@line 675 "../wslib/window.c"
 $32 = $0; //@line 675 "../wslib/window.c"
 $33 = ((($32)) + 18|0); //@line 675 "../wslib/window.c"
 $34 = HEAP16[$33>>1]|0; //@line 675 "../wslib/window.c"
 $35 = $34&65535; //@line 675 "../wslib/window.c"
 $36 = (($31) + ($35))|0; //@line 675 "../wslib/window.c"
 $37 = (($36) - 1)|0; //@line 675 "../wslib/window.c"
 $38 = ((($new_window_rect)) + 12|0); //@line 675 "../wslib/window.c"
 HEAP32[$38>>2] = $37; //@line 675 "../wslib/window.c"
 $39 = ((($new_window_rect)) + 8|0); //@line 676 "../wslib/window.c"
 $40 = HEAP32[$39>>2]|0; //@line 676 "../wslib/window.c"
 $41 = $0; //@line 676 "../wslib/window.c"
 $42 = ((($41)) + 16|0); //@line 676 "../wslib/window.c"
 $43 = HEAP16[$42>>1]|0; //@line 676 "../wslib/window.c"
 $44 = $43&65535; //@line 676 "../wslib/window.c"
 $45 = (($40) + ($44))|0; //@line 676 "../wslib/window.c"
 $46 = (($45) - 1)|0; //@line 676 "../wslib/window.c"
 $47 = ((($new_window_rect)) + 16|0); //@line 676 "../wslib/window.c"
 HEAP32[$47>>2] = $46; //@line 676 "../wslib/window.c"
 $48 = $old_x; //@line 679 "../wslib/window.c"
 $49 = $48&65535; //@line 679 "../wslib/window.c"
 $50 = $0; //@line 679 "../wslib/window.c"
 $51 = ((($50)) + 12|0); //@line 679 "../wslib/window.c"
 HEAP16[$51>>1] = $49; //@line 679 "../wslib/window.c"
 $52 = $old_y; //@line 680 "../wslib/window.c"
 $53 = $52&65535; //@line 680 "../wslib/window.c"
 $54 = $0; //@line 680 "../wslib/window.c"
 $55 = ((($54)) + 14|0); //@line 680 "../wslib/window.c"
 HEAP16[$55>>1] = $53; //@line 680 "../wslib/window.c"
 $56 = $0; //@line 684 "../wslib/window.c"
 $57 = ((($56)) + 24|0); //@line 684 "../wslib/window.c"
 $58 = HEAP32[$57>>2]|0; //@line 684 "../wslib/window.c"
 _Context_subtract_clip_rect($58,$new_window_rect); //@line 684 "../wslib/window.c"
 $59 = (_List_new()|0); //@line 691 "../wslib/window.c"
 $replacement_list = $59; //@line 691 "../wslib/window.c"
 $60 = ($59|0)!=(0|0); //@line 691 "../wslib/window.c"
 $61 = $0; //@line 697 "../wslib/window.c"
 $62 = ((($61)) + 24|0); //@line 697 "../wslib/window.c"
 $63 = HEAP32[$62>>2]|0; //@line 697 "../wslib/window.c"
 if (!($60)) {
  _Context_clear_clip_rects($63); //@line 693 "../wslib/window.c"
  STACKTOP = sp;return; //@line 721 "../wslib/window.c"
 }
 $64 = ((($63)) + 24|0); //@line 697 "../wslib/window.c"
 $65 = HEAP32[$64>>2]|0; //@line 697 "../wslib/window.c"
 $dirty_list = $65; //@line 697 "../wslib/window.c"
 $66 = $replacement_list; //@line 698 "../wslib/window.c"
 $67 = $0; //@line 698 "../wslib/window.c"
 $68 = ((($67)) + 24|0); //@line 698 "../wslib/window.c"
 $69 = HEAP32[$68>>2]|0; //@line 698 "../wslib/window.c"
 $70 = ((($69)) + 24|0); //@line 698 "../wslib/window.c"
 HEAP32[$70>>2] = $66; //@line 698 "../wslib/window.c"
 $71 = $0; //@line 701 "../wslib/window.c"
 $72 = ((($71)) + 4|0); //@line 701 "../wslib/window.c"
 $73 = HEAP32[$72>>2]|0; //@line 701 "../wslib/window.c"
 $74 = $0; //@line 701 "../wslib/window.c"
 $75 = (_Window_get_windows_below($73,$74)|0); //@line 701 "../wslib/window.c"
 $dirty_windows = $75; //@line 701 "../wslib/window.c"
 $76 = $1; //@line 703 "../wslib/window.c"
 $77 = $76&65535; //@line 703 "../wslib/window.c"
 $78 = $0; //@line 703 "../wslib/window.c"
 $79 = ((($78)) + 12|0); //@line 703 "../wslib/window.c"
 HEAP16[$79>>1] = $77; //@line 703 "../wslib/window.c"
 $80 = $2; //@line 704 "../wslib/window.c"
 $81 = $80&65535; //@line 704 "../wslib/window.c"
 $82 = $0; //@line 704 "../wslib/window.c"
 $83 = ((($82)) + 14|0); //@line 704 "../wslib/window.c"
 HEAP16[$83>>1] = $81; //@line 704 "../wslib/window.c"
 while(1) {
  $84 = $dirty_windows; //@line 708 "../wslib/window.c"
  $85 = ((($84)) + 4|0); //@line 708 "../wslib/window.c"
  $86 = HEAP32[$85>>2]|0; //@line 708 "../wslib/window.c"
  $87 = ($86|0)!=(0); //@line 708 "../wslib/window.c"
  if (!($87)) {
   break;
  }
  $88 = $dirty_windows; //@line 709 "../wslib/window.c"
  $89 = (_List_remove_at($88,0)|0); //@line 709 "../wslib/window.c"
  $90 = $dirty_list; //@line 709 "../wslib/window.c"
  _Window_paint($89,$90,1); //@line 709 "../wslib/window.c"
 }
 $91 = $0; //@line 712 "../wslib/window.c"
 $92 = ((($91)) + 4|0); //@line 712 "../wslib/window.c"
 $93 = HEAP32[$92>>2]|0; //@line 712 "../wslib/window.c"
 $94 = $dirty_list; //@line 712 "../wslib/window.c"
 _Window_paint($93,$94,0); //@line 712 "../wslib/window.c"
 $95 = $dirty_list; //@line 715 "../wslib/window.c"
 _Object_delete($95); //@line 715 "../wslib/window.c"
 $96 = $dirty_windows; //@line 716 "../wslib/window.c"
 _Object_delete($96); //@line 716 "../wslib/window.c"
 $97 = $0; //@line 720 "../wslib/window.c"
 _Window_paint($97,0,1); //@line 720 "../wslib/window.c"
 STACKTOP = sp;return; //@line 721 "../wslib/window.c"
}
function _Window_mousedown($window,$x,$y) {
 $window = $window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 112 "../wslib/window.c"
 $4 = ((($3)) + 49|0); //@line 112 "../wslib/window.c"
 $5 = HEAP8[$4>>0]|0; //@line 112 "../wslib/window.c"
 $6 = $5&255; //@line 112 "../wslib/window.c"
 $7 = ($6|0)!=(2); //@line 112 "../wslib/window.c"
 if ($7) {
  STACKTOP = sp;return; //@line 119 "../wslib/window.c"
 }
 $8 = $0; //@line 115 "../wslib/window.c"
 $9 = ((($8)) + 49|0); //@line 115 "../wslib/window.c"
 HEAP8[$9>>0] = 3; //@line 115 "../wslib/window.c"
 $10 = $0; //@line 117 "../wslib/window.c"
 $11 = ((($10)) + 56|0); //@line 117 "../wslib/window.c"
 $12 = HEAP32[$11>>2]|0; //@line 117 "../wslib/window.c"
 $13 = ($12|0)!=(0|0); //@line 117 "../wslib/window.c"
 if (!($13)) {
  STACKTOP = sp;return; //@line 119 "../wslib/window.c"
 }
 $14 = $0; //@line 118 "../wslib/window.c"
 $15 = ((($14)) + 56|0); //@line 118 "../wslib/window.c"
 $16 = HEAP32[$15>>2]|0; //@line 118 "../wslib/window.c"
 $17 = $0; //@line 118 "../wslib/window.c"
 $18 = $1; //@line 118 "../wslib/window.c"
 $19 = $2; //@line 118 "../wslib/window.c"
 FUNCTION_TABLE_viii[$16 & 63]($17,$18,$19); //@line 118 "../wslib/window.c"
 STACKTOP = sp;return; //@line 119 "../wslib/window.c"
}
function _Window_mouseup($window,$x,$y) {
 $window = $window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 123 "../wslib/window.c"
 $4 = ((($3)) + 60|0); //@line 123 "../wslib/window.c"
 $5 = HEAP32[$4>>2]|0; //@line 123 "../wslib/window.c"
 $6 = ($5|0)!=(0|0); //@line 123 "../wslib/window.c"
 if ($6) {
  $7 = $0; //@line 124 "../wslib/window.c"
  $8 = ((($7)) + 60|0); //@line 124 "../wslib/window.c"
  $9 = HEAP32[$8>>2]|0; //@line 124 "../wslib/window.c"
  $10 = $0; //@line 124 "../wslib/window.c"
  $11 = $1; //@line 124 "../wslib/window.c"
  $12 = $2; //@line 124 "../wslib/window.c"
  FUNCTION_TABLE_viii[$9 & 63]($10,$11,$12); //@line 124 "../wslib/window.c"
 }
 $13 = $0; //@line 126 "../wslib/window.c"
 $14 = ((($13)) + 49|0); //@line 126 "../wslib/window.c"
 $15 = HEAP8[$14>>0]|0; //@line 126 "../wslib/window.c"
 $16 = $15&255; //@line 126 "../wslib/window.c"
 $17 = ($16|0)==(3); //@line 126 "../wslib/window.c"
 if (!($17)) {
  $21 = $0; //@line 129 "../wslib/window.c"
  $22 = ((($21)) + 49|0); //@line 129 "../wslib/window.c"
  HEAP8[$22>>0] = 1; //@line 129 "../wslib/window.c"
  STACKTOP = sp;return; //@line 130 "../wslib/window.c"
 }
 $18 = $0; //@line 127 "../wslib/window.c"
 $19 = $1; //@line 127 "../wslib/window.c"
 $20 = $2; //@line 127 "../wslib/window.c"
 _Window_mouseclick($18,$19,$20); //@line 127 "../wslib/window.c"
 $21 = $0; //@line 129 "../wslib/window.c"
 $22 = ((($21)) + 49|0); //@line 129 "../wslib/window.c"
 HEAP8[$22>>0] = 1; //@line 129 "../wslib/window.c"
 STACKTOP = sp;return; //@line 130 "../wslib/window.c"
}
function _Window_mouseclick($window,$x,$y) {
 $window = $window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 167 "../wslib/window.c"
 $4 = ((($3)) + 76|0); //@line 167 "../wslib/window.c"
 $5 = HEAP32[$4>>2]|0; //@line 167 "../wslib/window.c"
 $6 = ($5|0)!=(0|0); //@line 167 "../wslib/window.c"
 if (!($6)) {
  STACKTOP = sp;return; //@line 169 "../wslib/window.c"
 }
 $7 = $0; //@line 168 "../wslib/window.c"
 $8 = ((($7)) + 76|0); //@line 168 "../wslib/window.c"
 $9 = HEAP32[$8>>2]|0; //@line 168 "../wslib/window.c"
 $10 = $0; //@line 168 "../wslib/window.c"
 $11 = $1; //@line 168 "../wslib/window.c"
 $12 = $2; //@line 168 "../wslib/window.c"
 FUNCTION_TABLE_viii[$9 & 63]($10,$11,$12); //@line 168 "../wslib/window.c"
 STACKTOP = sp;return; //@line 169 "../wslib/window.c"
}
function _Window_mouseover($window) {
 $window = $window|0;
 var $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $0; //@line 134 "../wslib/window.c"
 $2 = ((($1)) + 49|0); //@line 134 "../wslib/window.c"
 HEAP8[$2>>0] = 1; //@line 134 "../wslib/window.c"
 $3 = $0; //@line 136 "../wslib/window.c"
 $4 = ((($3)) + 64|0); //@line 136 "../wslib/window.c"
 $5 = HEAP32[$4>>2]|0; //@line 136 "../wslib/window.c"
 $6 = ($5|0)!=(0|0); //@line 136 "../wslib/window.c"
 if (!($6)) {
  STACKTOP = sp;return; //@line 138 "../wslib/window.c"
 }
 $7 = $0; //@line 137 "../wslib/window.c"
 $8 = ((($7)) + 64|0); //@line 137 "../wslib/window.c"
 $9 = HEAP32[$8>>2]|0; //@line 137 "../wslib/window.c"
 $10 = $0; //@line 137 "../wslib/window.c"
 FUNCTION_TABLE_vi[$9 & 63]($10); //@line 137 "../wslib/window.c"
 STACKTOP = sp;return; //@line 138 "../wslib/window.c"
}
function _Window_mouseout($window) {
 $window = $window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $old_click_cycle = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $0; //@line 142 "../wslib/window.c"
 $2 = ((($1)) + 49|0); //@line 142 "../wslib/window.c"
 $3 = HEAP8[$2>>0]|0; //@line 142 "../wslib/window.c"
 $4 = $3&255; //@line 142 "../wslib/window.c"
 $old_click_cycle = $4; //@line 142 "../wslib/window.c"
 $5 = $0; //@line 144 "../wslib/window.c"
 $6 = ((($5)) + 49|0); //@line 144 "../wslib/window.c"
 HEAP8[$6>>0] = 0; //@line 144 "../wslib/window.c"
 $7 = $old_click_cycle; //@line 146 "../wslib/window.c"
 $8 = ($7|0)==(3); //@line 146 "../wslib/window.c"
 if ($8) {
  $9 = $0; //@line 147 "../wslib/window.c"
  _Window_mouseup($9,0,0); //@line 147 "../wslib/window.c"
 }
 $10 = $0; //@line 149 "../wslib/window.c"
 $11 = ((($10)) + 36|0); //@line 149 "../wslib/window.c"
 $12 = HEAP32[$11>>2]|0; //@line 149 "../wslib/window.c"
 $13 = ($12|0)!=(0|0); //@line 149 "../wslib/window.c"
 if ($13) {
  $14 = $0; //@line 151 "../wslib/window.c"
  $15 = ((($14)) + 36|0); //@line 151 "../wslib/window.c"
  $16 = HEAP32[$15>>2]|0; //@line 151 "../wslib/window.c"
  _Window_mouseout($16); //@line 151 "../wslib/window.c"
  $17 = $0; //@line 152 "../wslib/window.c"
  $18 = ((($17)) + 36|0); //@line 152 "../wslib/window.c"
  HEAP32[$18>>2] = 0; //@line 152 "../wslib/window.c"
 }
 $19 = $0; //@line 155 "../wslib/window.c"
 $20 = ((($19)) + 68|0); //@line 155 "../wslib/window.c"
 $21 = HEAP32[$20>>2]|0; //@line 155 "../wslib/window.c"
 $22 = ($21|0)!=(0|0); //@line 155 "../wslib/window.c"
 if (!($22)) {
  STACKTOP = sp;return; //@line 157 "../wslib/window.c"
 }
 $23 = $0; //@line 156 "../wslib/window.c"
 $24 = ((($23)) + 68|0); //@line 156 "../wslib/window.c"
 $25 = HEAP32[$24>>2]|0; //@line 156 "../wslib/window.c"
 $26 = $0; //@line 156 "../wslib/window.c"
 FUNCTION_TABLE_vi[$25 & 63]($26); //@line 156 "../wslib/window.c"
 STACKTOP = sp;return; //@line 157 "../wslib/window.c"
}
function _Window_mousemove($window,$x,$y) {
 $window = $window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 161 "../wslib/window.c"
 $4 = ((($3)) + 72|0); //@line 161 "../wslib/window.c"
 $5 = HEAP32[$4>>2]|0; //@line 161 "../wslib/window.c"
 $6 = ($5|0)!=(0|0); //@line 161 "../wslib/window.c"
 if (!($6)) {
  STACKTOP = sp;return; //@line 163 "../wslib/window.c"
 }
 $7 = $0; //@line 162 "../wslib/window.c"
 $8 = ((($7)) + 72|0); //@line 162 "../wslib/window.c"
 $9 = HEAP32[$8>>2]|0; //@line 162 "../wslib/window.c"
 $10 = $0; //@line 162 "../wslib/window.c"
 $11 = $1; //@line 162 "../wslib/window.c"
 $12 = $2; //@line 162 "../wslib/window.c"
 FUNCTION_TABLE_viii[$9 & 63]($10,$11,$12); //@line 162 "../wslib/window.c"
 STACKTOP = sp;return; //@line 163 "../wslib/window.c"
}
function _Window_screen_x($window) {
 $window = $window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $window;
 $2 = $1; //@line 174 "../wslib/window.c"
 $3 = ((($2)) + 4|0); //@line 174 "../wslib/window.c"
 $4 = HEAP32[$3>>2]|0; //@line 174 "../wslib/window.c"
 $5 = ($4|0)!=(0|0); //@line 174 "../wslib/window.c"
 $6 = $1; //@line 175 "../wslib/window.c"
 $7 = ((($6)) + 12|0); //@line 175 "../wslib/window.c"
 $8 = HEAP16[$7>>1]|0; //@line 175 "../wslib/window.c"
 $9 = $8 << 16 >> 16; //@line 175 "../wslib/window.c"
 if ($5) {
  $10 = $1; //@line 175 "../wslib/window.c"
  $11 = ((($10)) + 4|0); //@line 175 "../wslib/window.c"
  $12 = HEAP32[$11>>2]|0; //@line 175 "../wslib/window.c"
  $13 = (_Window_screen_x($12)|0); //@line 175 "../wslib/window.c"
  $14 = (($9) + ($13))|0; //@line 175 "../wslib/window.c"
  $0 = $14; //@line 175 "../wslib/window.c"
  $15 = $0; //@line 178 "../wslib/window.c"
  STACKTOP = sp;return ($15|0); //@line 178 "../wslib/window.c"
 } else {
  $0 = $9; //@line 177 "../wslib/window.c"
  $15 = $0; //@line 178 "../wslib/window.c"
  STACKTOP = sp;return ($15|0); //@line 178 "../wslib/window.c"
 }
 return (0)|0;
}
function _Window_screen_y($window) {
 $window = $window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $window;
 $2 = $1; //@line 183 "../wslib/window.c"
 $3 = ((($2)) + 4|0); //@line 183 "../wslib/window.c"
 $4 = HEAP32[$3>>2]|0; //@line 183 "../wslib/window.c"
 $5 = ($4|0)!=(0|0); //@line 183 "../wslib/window.c"
 $6 = $1; //@line 184 "../wslib/window.c"
 $7 = ((($6)) + 14|0); //@line 184 "../wslib/window.c"
 $8 = HEAP16[$7>>1]|0; //@line 184 "../wslib/window.c"
 $9 = $8 << 16 >> 16; //@line 184 "../wslib/window.c"
 if ($5) {
  $10 = $1; //@line 184 "../wslib/window.c"
  $11 = ((($10)) + 4|0); //@line 184 "../wslib/window.c"
  $12 = HEAP32[$11>>2]|0; //@line 184 "../wslib/window.c"
  $13 = (_Window_screen_y($12)|0); //@line 184 "../wslib/window.c"
  $14 = (($9) + ($13))|0; //@line 184 "../wslib/window.c"
  $0 = $14; //@line 184 "../wslib/window.c"
  $15 = $0; //@line 187 "../wslib/window.c"
  STACKTOP = sp;return ($15|0); //@line 187 "../wslib/window.c"
 } else {
  $0 = $9; //@line 186 "../wslib/window.c"
  $15 = $0; //@line 187 "../wslib/window.c"
  STACKTOP = sp;return ($15|0); //@line 187 "../wslib/window.c"
 }
 return (0)|0;
}
function _Window_draw_border($window) {
 $window = $window|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0;
 var $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0;
 var $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0;
 var $99 = 0, $screen_x = 0, $screen_y = 0, $tb_color = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $0; //@line 192 "../wslib/window.c"
 $2 = (_Window_screen_x($1)|0); //@line 192 "../wslib/window.c"
 $screen_x = $2; //@line 192 "../wslib/window.c"
 $3 = $0; //@line 193 "../wslib/window.c"
 $4 = (_Window_screen_y($3)|0); //@line 193 "../wslib/window.c"
 $screen_y = $4; //@line 193 "../wslib/window.c"
 $5 = $0; //@line 196 "../wslib/window.c"
 $6 = ((($5)) + 24|0); //@line 196 "../wslib/window.c"
 $7 = HEAP32[$6>>2]|0; //@line 196 "../wslib/window.c"
 $8 = $screen_x; //@line 196 "../wslib/window.c"
 $9 = $screen_y; //@line 196 "../wslib/window.c"
 $10 = $0; //@line 196 "../wslib/window.c"
 $11 = ((($10)) + 16|0); //@line 196 "../wslib/window.c"
 $12 = HEAP16[$11>>1]|0; //@line 196 "../wslib/window.c"
 $13 = $12&65535; //@line 196 "../wslib/window.c"
 $14 = $0; //@line 197 "../wslib/window.c"
 $15 = ((($14)) + 18|0); //@line 197 "../wslib/window.c"
 $16 = HEAP16[$15>>1]|0; //@line 197 "../wslib/window.c"
 $17 = $16&65535; //@line 197 "../wslib/window.c"
 _draw_panel($7,$8,$9,$13,$17,-7746578,1,0); //@line 196 "../wslib/window.c"
 $18 = $0; //@line 200 "../wslib/window.c"
 $19 = ((($18)) + 24|0); //@line 200 "../wslib/window.c"
 $20 = HEAP32[$19>>2]|0; //@line 200 "../wslib/window.c"
 $21 = $screen_x; //@line 200 "../wslib/window.c"
 $22 = (($21) + 3)|0; //@line 200 "../wslib/window.c"
 $23 = $screen_y; //@line 200 "../wslib/window.c"
 $24 = (($23) + 3)|0; //@line 200 "../wslib/window.c"
 $25 = $0; //@line 200 "../wslib/window.c"
 $26 = ((($25)) + 16|0); //@line 200 "../wslib/window.c"
 $27 = HEAP16[$26>>1]|0; //@line 200 "../wslib/window.c"
 $28 = $27&65535; //@line 200 "../wslib/window.c"
 $29 = (($28) - 6)|0; //@line 200 "../wslib/window.c"
 _draw_panel($20,$22,$24,$29,22,-7746578,1,1); //@line 200 "../wslib/window.c"
 $30 = $0; //@line 204 "../wslib/window.c"
 $31 = ((($30)) + 24|0); //@line 204 "../wslib/window.c"
 $32 = HEAP32[$31>>2]|0; //@line 204 "../wslib/window.c"
 $33 = $screen_x; //@line 204 "../wslib/window.c"
 $34 = (($33) + 3)|0; //@line 204 "../wslib/window.c"
 $35 = $screen_y; //@line 204 "../wslib/window.c"
 $36 = (($35) + 27)|0; //@line 204 "../wslib/window.c"
 $37 = $0; //@line 204 "../wslib/window.c"
 $38 = ((($37)) + 16|0); //@line 204 "../wslib/window.c"
 $39 = HEAP16[$38>>1]|0; //@line 204 "../wslib/window.c"
 $40 = $39&65535; //@line 204 "../wslib/window.c"
 $41 = (($40) - 6)|0; //@line 204 "../wslib/window.c"
 $42 = $0; //@line 205 "../wslib/window.c"
 $43 = ((($42)) + 18|0); //@line 205 "../wslib/window.c"
 $44 = HEAP16[$43>>1]|0; //@line 205 "../wslib/window.c"
 $45 = $44&65535; //@line 205 "../wslib/window.c"
 $46 = (($45) - 30)|0; //@line 205 "../wslib/window.c"
 _draw_panel($32,$34,$36,$41,$46,-7746578,1,1); //@line 204 "../wslib/window.c"
 $47 = $0; //@line 208 "../wslib/window.c"
 $48 = ((($47)) + 24|0); //@line 208 "../wslib/window.c"
 $49 = HEAP32[$48>>2]|0; //@line 208 "../wslib/window.c"
 $50 = $screen_x; //@line 208 "../wslib/window.c"
 $51 = (($50) + 1)|0; //@line 208 "../wslib/window.c"
 $52 = $screen_y; //@line 208 "../wslib/window.c"
 $53 = (($52) + 1)|0; //@line 208 "../wslib/window.c"
 $54 = $0; //@line 209 "../wslib/window.c"
 $55 = ((($54)) + 18|0); //@line 209 "../wslib/window.c"
 $56 = HEAP16[$55>>1]|0; //@line 209 "../wslib/window.c"
 $57 = $56&65535; //@line 209 "../wslib/window.c"
 $58 = (($57) - 2)|0; //@line 209 "../wslib/window.c"
 _Context_fill_rect($49,$51,$53,2,$58,-7746578); //@line 208 "../wslib/window.c"
 $59 = $0; //@line 212 "../wslib/window.c"
 $60 = ((($59)) + 24|0); //@line 212 "../wslib/window.c"
 $61 = HEAP32[$60>>2]|0; //@line 212 "../wslib/window.c"
 $62 = $screen_x; //@line 212 "../wslib/window.c"
 $63 = $0; //@line 212 "../wslib/window.c"
 $64 = ((($63)) + 16|0); //@line 212 "../wslib/window.c"
 $65 = HEAP16[$64>>1]|0; //@line 212 "../wslib/window.c"
 $66 = $65&65535; //@line 212 "../wslib/window.c"
 $67 = (($62) + ($66))|0; //@line 212 "../wslib/window.c"
 $68 = (($67) - 3)|0; //@line 212 "../wslib/window.c"
 $69 = $screen_y; //@line 213 "../wslib/window.c"
 $70 = (($69) + 1)|0; //@line 213 "../wslib/window.c"
 $71 = $0; //@line 213 "../wslib/window.c"
 $72 = ((($71)) + 18|0); //@line 213 "../wslib/window.c"
 $73 = HEAP16[$72>>1]|0; //@line 213 "../wslib/window.c"
 $74 = $73&65535; //@line 213 "../wslib/window.c"
 $75 = (($74) - 2)|0; //@line 213 "../wslib/window.c"
 _Context_fill_rect($61,$68,$70,2,$75,-7746578); //@line 212 "../wslib/window.c"
 $76 = $0; //@line 216 "../wslib/window.c"
 $77 = ((($76)) + 24|0); //@line 216 "../wslib/window.c"
 $78 = HEAP32[$77>>2]|0; //@line 216 "../wslib/window.c"
 $79 = $screen_x; //@line 216 "../wslib/window.c"
 $80 = (($79) + 3)|0; //@line 216 "../wslib/window.c"
 $81 = $screen_y; //@line 216 "../wslib/window.c"
 $82 = (($81) + 1)|0; //@line 216 "../wslib/window.c"
 $83 = $0; //@line 217 "../wslib/window.c"
 $84 = ((($83)) + 16|0); //@line 217 "../wslib/window.c"
 $85 = HEAP16[$84>>1]|0; //@line 217 "../wslib/window.c"
 $86 = $85&65535; //@line 217 "../wslib/window.c"
 $87 = (($86) - 6)|0; //@line 217 "../wslib/window.c"
 _Context_fill_rect($78,$80,$82,$87,2,-7746578); //@line 216 "../wslib/window.c"
 $88 = $0; //@line 220 "../wslib/window.c"
 $89 = ((($88)) + 24|0); //@line 220 "../wslib/window.c"
 $90 = HEAP32[$89>>2]|0; //@line 220 "../wslib/window.c"
 $91 = $screen_x; //@line 220 "../wslib/window.c"
 $92 = (($91) + 3)|0; //@line 220 "../wslib/window.c"
 $93 = $screen_y; //@line 220 "../wslib/window.c"
 $94 = (($93) + 25)|0; //@line 220 "../wslib/window.c"
 $95 = $0; //@line 221 "../wslib/window.c"
 $96 = ((($95)) + 16|0); //@line 221 "../wslib/window.c"
 $97 = HEAP16[$96>>1]|0; //@line 221 "../wslib/window.c"
 $98 = $97&65535; //@line 221 "../wslib/window.c"
 $99 = (($98) - 6)|0; //@line 221 "../wslib/window.c"
 _Context_fill_rect($90,$92,$94,$99,2,-7746578); //@line 220 "../wslib/window.c"
 $100 = $0; //@line 224 "../wslib/window.c"
 $101 = ((($100)) + 24|0); //@line 224 "../wslib/window.c"
 $102 = HEAP32[$101>>2]|0; //@line 224 "../wslib/window.c"
 $103 = $screen_x; //@line 224 "../wslib/window.c"
 $104 = (($103) + 3)|0; //@line 224 "../wslib/window.c"
 $105 = $screen_y; //@line 224 "../wslib/window.c"
 $106 = $0; //@line 224 "../wslib/window.c"
 $107 = ((($106)) + 18|0); //@line 224 "../wslib/window.c"
 $108 = HEAP16[$107>>1]|0; //@line 224 "../wslib/window.c"
 $109 = $108&65535; //@line 224 "../wslib/window.c"
 $110 = (($105) + ($109))|0; //@line 224 "../wslib/window.c"
 $111 = (($110) - 3)|0; //@line 224 "../wslib/window.c"
 $112 = $0; //@line 225 "../wslib/window.c"
 $113 = ((($112)) + 16|0); //@line 225 "../wslib/window.c"
 $114 = HEAP16[$113>>1]|0; //@line 225 "../wslib/window.c"
 $115 = $114&65535; //@line 225 "../wslib/window.c"
 $116 = (($115) - 6)|0; //@line 225 "../wslib/window.c"
 _Context_fill_rect($102,$104,$111,$116,2,-7746578); //@line 224 "../wslib/window.c"
 $117 = $0; //@line 228 "../wslib/window.c"
 $118 = ((($117)) + 24|0); //@line 228 "../wslib/window.c"
 $119 = HEAP32[$118>>2]|0; //@line 228 "../wslib/window.c"
 $120 = $screen_x; //@line 228 "../wslib/window.c"
 $121 = $0; //@line 228 "../wslib/window.c"
 $122 = ((($121)) + 16|0); //@line 228 "../wslib/window.c"
 $123 = HEAP16[$122>>1]|0; //@line 228 "../wslib/window.c"
 $124 = $123&65535; //@line 228 "../wslib/window.c"
 $125 = (($120) + ($124))|0; //@line 228 "../wslib/window.c"
 $126 = (($125) - 24)|0; //@line 228 "../wslib/window.c"
 $127 = $screen_y; //@line 228 "../wslib/window.c"
 $128 = (($127) + 4)|0; //@line 228 "../wslib/window.c"
 _draw_panel($119,$126,$128,20,20,-7746578,1,0); //@line 228 "../wslib/window.c"
 $129 = $0; //@line 230 "../wslib/window.c"
 $130 = ((($129)) + 24|0); //@line 230 "../wslib/window.c"
 $131 = HEAP32[$130>>2]|0; //@line 230 "../wslib/window.c"
 $132 = $screen_x; //@line 230 "../wslib/window.c"
 $133 = $0; //@line 230 "../wslib/window.c"
 $134 = ((($133)) + 16|0); //@line 230 "../wslib/window.c"
 $135 = HEAP16[$134>>1]|0; //@line 230 "../wslib/window.c"
 $136 = $135&65535; //@line 230 "../wslib/window.c"
 $137 = (($132) + ($136))|0; //@line 230 "../wslib/window.c"
 $138 = (($137) - 23)|0; //@line 230 "../wslib/window.c"
 $139 = $screen_y; //@line 231 "../wslib/window.c"
 $140 = (($139) + 5)|0; //@line 231 "../wslib/window.c"
 _Context_fill_rect($131,$138,$140,18,18,-7746578); //@line 230 "../wslib/window.c"
 $141 = $0; //@line 234 "../wslib/window.c"
 $142 = ((($141)) + 4|0); //@line 234 "../wslib/window.c"
 $143 = HEAP32[$142>>2]|0; //@line 234 "../wslib/window.c"
 $144 = ((($143)) + 32|0); //@line 234 "../wslib/window.c"
 $145 = HEAP32[$144>>2]|0; //@line 234 "../wslib/window.c"
 $146 = $0; //@line 234 "../wslib/window.c"
 $147 = ($145|0)==($146|0); //@line 234 "../wslib/window.c"
 if ($147) {
  $tb_color = -16777034; //@line 235 "../wslib/window.c"
  $148 = $0; //@line 239 "../wslib/window.c"
  $149 = ((($148)) + 24|0); //@line 239 "../wslib/window.c"
  $150 = HEAP32[$149>>2]|0; //@line 239 "../wslib/window.c"
  $151 = $screen_x; //@line 239 "../wslib/window.c"
  $152 = (($151) + 4)|0; //@line 239 "../wslib/window.c"
  $153 = $screen_y; //@line 239 "../wslib/window.c"
  $154 = (($153) + 4)|0; //@line 239 "../wslib/window.c"
  $155 = $0; //@line 240 "../wslib/window.c"
  $156 = ((($155)) + 16|0); //@line 240 "../wslib/window.c"
  $157 = HEAP16[$156>>1]|0; //@line 240 "../wslib/window.c"
  $158 = $157&65535; //@line 240 "../wslib/window.c"
  $159 = (($158) - 28)|0; //@line 240 "../wslib/window.c"
  $160 = $tb_color; //@line 240 "../wslib/window.c"
  _Context_fill_rect($150,$152,$154,$159,20,$160); //@line 239 "../wslib/window.c"
  $161 = $0; //@line 243 "../wslib/window.c"
  $162 = ((($161)) + 24|0); //@line 243 "../wslib/window.c"
  $163 = HEAP32[$162>>2]|0; //@line 243 "../wslib/window.c"
  $164 = $0; //@line 243 "../wslib/window.c"
  $165 = ((($164)) + 84|0); //@line 243 "../wslib/window.c"
  $166 = HEAP32[$165>>2]|0; //@line 243 "../wslib/window.c"
  $167 = $screen_x; //@line 243 "../wslib/window.c"
  $168 = (14 + ($167))|0; //@line 243 "../wslib/window.c"
  $169 = (($168) - 6)|0; //@line 243 "../wslib/window.c"
  $170 = $screen_y; //@line 244 "../wslib/window.c"
  $171 = (14 + ($170))|0; //@line 244 "../wslib/window.c"
  $172 = (($171) - 6)|0; //@line 244 "../wslib/window.c"
  $173 = $0; //@line 245 "../wslib/window.c"
  $174 = ((($173)) + 4|0); //@line 245 "../wslib/window.c"
  $175 = HEAP32[$174>>2]|0; //@line 245 "../wslib/window.c"
  $176 = ((($175)) + 32|0); //@line 245 "../wslib/window.c"
  $177 = HEAP32[$176>>2]|0; //@line 245 "../wslib/window.c"
  $178 = $0; //@line 245 "../wslib/window.c"
  $179 = ($177|0)==($178|0); //@line 245 "../wslib/window.c"
  $180 = $179 ? -1 : -14325878; //@line 245 "../wslib/window.c"
  _Context_draw_text($163,$166,$169,$172,$180); //@line 243 "../wslib/window.c"
  STACKTOP = sp;return; //@line 248 "../wslib/window.c"
 } else {
  $tb_color = -7746578; //@line 237 "../wslib/window.c"
  $148 = $0; //@line 239 "../wslib/window.c"
  $149 = ((($148)) + 24|0); //@line 239 "../wslib/window.c"
  $150 = HEAP32[$149>>2]|0; //@line 239 "../wslib/window.c"
  $151 = $screen_x; //@line 239 "../wslib/window.c"
  $152 = (($151) + 4)|0; //@line 239 "../wslib/window.c"
  $153 = $screen_y; //@line 239 "../wslib/window.c"
  $154 = (($153) + 4)|0; //@line 239 "../wslib/window.c"
  $155 = $0; //@line 240 "../wslib/window.c"
  $156 = ((($155)) + 16|0); //@line 240 "../wslib/window.c"
  $157 = HEAP16[$156>>1]|0; //@line 240 "../wslib/window.c"
  $158 = $157&65535; //@line 240 "../wslib/window.c"
  $159 = (($158) - 28)|0; //@line 240 "../wslib/window.c"
  $160 = $tb_color; //@line 240 "../wslib/window.c"
  _Context_fill_rect($150,$152,$154,$159,20,$160); //@line 239 "../wslib/window.c"
  $161 = $0; //@line 243 "../wslib/window.c"
  $162 = ((($161)) + 24|0); //@line 243 "../wslib/window.c"
  $163 = HEAP32[$162>>2]|0; //@line 243 "../wslib/window.c"
  $164 = $0; //@line 243 "../wslib/window.c"
  $165 = ((($164)) + 84|0); //@line 243 "../wslib/window.c"
  $166 = HEAP32[$165>>2]|0; //@line 243 "../wslib/window.c"
  $167 = $screen_x; //@line 243 "../wslib/window.c"
  $168 = (14 + ($167))|0; //@line 243 "../wslib/window.c"
  $169 = (($168) - 6)|0; //@line 243 "../wslib/window.c"
  $170 = $screen_y; //@line 244 "../wslib/window.c"
  $171 = (14 + ($170))|0; //@line 244 "../wslib/window.c"
  $172 = (($171) - 6)|0; //@line 244 "../wslib/window.c"
  $173 = $0; //@line 245 "../wslib/window.c"
  $174 = ((($173)) + 4|0); //@line 245 "../wslib/window.c"
  $175 = HEAP32[$174>>2]|0; //@line 245 "../wslib/window.c"
  $176 = ((($175)) + 32|0); //@line 245 "../wslib/window.c"
  $177 = HEAP32[$176>>2]|0; //@line 245 "../wslib/window.c"
  $178 = $0; //@line 245 "../wslib/window.c"
  $179 = ($177|0)==($178|0); //@line 245 "../wslib/window.c"
  $180 = $179 ? -1 : -14325878; //@line 245 "../wslib/window.c"
  _Context_draw_text($163,$166,$169,$172,$180); //@line 243 "../wslib/window.c"
  STACKTOP = sp;return; //@line 248 "../wslib/window.c"
 }
}
function _Window_apply_bound_clipping($window,$context,$in_recursion,$dirty_regions) {
 $window = $window|0;
 $context = $context|0;
 $in_recursion = $in_recursion|0;
 $dirty_regions = $dirty_regions|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $clip_windows = 0, $clipping_window = 0, $clone_dirty_rect = 0, $current_dirty_rect = 0;
 var $i = 0, $or$cond = 0, $screen_x = 0, $screen_y = 0, $temp_rect = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $context;
 $2 = $in_recursion;
 $3 = $dirty_regions;
 $4 = $1; //@line 259 "../wslib/window.c"
 $5 = ($4|0)!=(0|0); //@line 259 "../wslib/window.c"
 if (!($5)) {
  STACKTOP = sp;return; //@line 348 "../wslib/window.c"
 }
 $6 = $0; //@line 268 "../wslib/window.c"
 $7 = (_Window_screen_x($6)|0); //@line 268 "../wslib/window.c"
 $screen_x = $7; //@line 268 "../wslib/window.c"
 $8 = $0; //@line 269 "../wslib/window.c"
 $9 = (_Window_screen_y($8)|0); //@line 269 "../wslib/window.c"
 $screen_y = $9; //@line 269 "../wslib/window.c"
 $10 = $0; //@line 271 "../wslib/window.c"
 $11 = ((($10)) + 20|0); //@line 271 "../wslib/window.c"
 $12 = HEAP16[$11>>1]|0; //@line 271 "../wslib/window.c"
 $13 = $12&65535; //@line 271 "../wslib/window.c"
 $14 = $13 & 1; //@line 271 "../wslib/window.c"
 $15 = ($14|0)==(0); //@line 271 "../wslib/window.c"
 $16 = $2;
 $17 = ($16|0)!=(0); //@line 271 "../wslib/window.c"
 $or$cond = $15 & $17; //@line 271 "../wslib/window.c"
 if ($or$cond) {
  $18 = $screen_x; //@line 274 "../wslib/window.c"
  $19 = (($18) + 4)|0; //@line 274 "../wslib/window.c"
  $screen_x = $19; //@line 274 "../wslib/window.c"
  $20 = $screen_y; //@line 275 "../wslib/window.c"
  $21 = (($20) + 28)|0; //@line 275 "../wslib/window.c"
  $screen_y = $21; //@line 275 "../wslib/window.c"
  $22 = $screen_y; //@line 276 "../wslib/window.c"
  $23 = $screen_x; //@line 276 "../wslib/window.c"
  $24 = $screen_y; //@line 277 "../wslib/window.c"
  $25 = $0; //@line 277 "../wslib/window.c"
  $26 = ((($25)) + 18|0); //@line 277 "../wslib/window.c"
  $27 = HEAP16[$26>>1]|0; //@line 277 "../wslib/window.c"
  $28 = $27&65535; //@line 277 "../wslib/window.c"
  $29 = (($24) + ($28))|0; //@line 277 "../wslib/window.c"
  $30 = (($29) - 28)|0; //@line 277 "../wslib/window.c"
  $31 = (($30) - 4)|0; //@line 277 "../wslib/window.c"
  $32 = (($31) - 1)|0; //@line 277 "../wslib/window.c"
  $33 = $screen_x; //@line 278 "../wslib/window.c"
  $34 = $0; //@line 278 "../wslib/window.c"
  $35 = ((($34)) + 16|0); //@line 278 "../wslib/window.c"
  $36 = HEAP16[$35>>1]|0; //@line 278 "../wslib/window.c"
  $37 = $36&65535; //@line 278 "../wslib/window.c"
  $38 = (($33) + ($37))|0; //@line 278 "../wslib/window.c"
  $39 = (($38) - 8)|0; //@line 278 "../wslib/window.c"
  $40 = (($39) - 1)|0; //@line 278 "../wslib/window.c"
  $41 = (_Rect_new($22,$23,$32,$40)|0); //@line 276 "../wslib/window.c"
  $temp_rect = $41; //@line 276 "../wslib/window.c"
 } else {
  $42 = $screen_y; //@line 281 "../wslib/window.c"
  $43 = $screen_x; //@line 281 "../wslib/window.c"
  $44 = $screen_y; //@line 281 "../wslib/window.c"
  $45 = $0; //@line 281 "../wslib/window.c"
  $46 = ((($45)) + 18|0); //@line 281 "../wslib/window.c"
  $47 = HEAP16[$46>>1]|0; //@line 281 "../wslib/window.c"
  $48 = $47&65535; //@line 281 "../wslib/window.c"
  $49 = (($44) + ($48))|0; //@line 281 "../wslib/window.c"
  $50 = (($49) - 1)|0; //@line 281 "../wslib/window.c"
  $51 = $screen_x; //@line 282 "../wslib/window.c"
  $52 = $0; //@line 282 "../wslib/window.c"
  $53 = ((($52)) + 16|0); //@line 282 "../wslib/window.c"
  $54 = HEAP16[$53>>1]|0; //@line 282 "../wslib/window.c"
  $55 = $54&65535; //@line 282 "../wslib/window.c"
  $56 = (($51) + ($55))|0; //@line 282 "../wslib/window.c"
  $57 = (($56) - 1)|0; //@line 282 "../wslib/window.c"
  $58 = (_Rect_new($42,$43,$50,$57)|0); //@line 281 "../wslib/window.c"
  $temp_rect = $58; //@line 281 "../wslib/window.c"
 }
 $59 = $0; //@line 291 "../wslib/window.c"
 $60 = ((($59)) + 4|0); //@line 291 "../wslib/window.c"
 $61 = HEAP32[$60>>2]|0; //@line 291 "../wslib/window.c"
 $62 = ($61|0)!=(0|0); //@line 291 "../wslib/window.c"
 if ($62) {
  $94 = $0; //@line 321 "../wslib/window.c"
  $95 = ((($94)) + 4|0); //@line 321 "../wslib/window.c"
  $96 = HEAP32[$95>>2]|0; //@line 321 "../wslib/window.c"
  $97 = $1; //@line 321 "../wslib/window.c"
  $98 = $3; //@line 321 "../wslib/window.c"
  _Window_apply_bound_clipping($96,$97,1,$98); //@line 321 "../wslib/window.c"
  $99 = $1; //@line 325 "../wslib/window.c"
  $100 = $temp_rect; //@line 325 "../wslib/window.c"
  _Context_intersect_clip_rect($99,$100); //@line 325 "../wslib/window.c"
  $101 = $0; //@line 328 "../wslib/window.c"
  $102 = ((($101)) + 4|0); //@line 328 "../wslib/window.c"
  $103 = HEAP32[$102>>2]|0; //@line 328 "../wslib/window.c"
  $104 = $0; //@line 328 "../wslib/window.c"
  $105 = (_Window_get_windows_above($103,$104)|0); //@line 328 "../wslib/window.c"
  $clip_windows = $105; //@line 328 "../wslib/window.c"
  while(1) {
   $106 = $clip_windows; //@line 330 "../wslib/window.c"
   $107 = ((($106)) + 4|0); //@line 330 "../wslib/window.c"
   $108 = HEAP32[$107>>2]|0; //@line 330 "../wslib/window.c"
   $109 = ($108|0)!=(0); //@line 330 "../wslib/window.c"
   $110 = $clip_windows; //@line 332 "../wslib/window.c"
   if (!($109)) {
    break;
   }
   $111 = (_List_remove_at($110,0)|0); //@line 332 "../wslib/window.c"
   $clipping_window = $111; //@line 332 "../wslib/window.c"
   $112 = $clipping_window; //@line 336 "../wslib/window.c"
   $113 = (_Window_screen_x($112)|0); //@line 336 "../wslib/window.c"
   $screen_x = $113; //@line 336 "../wslib/window.c"
   $114 = $clipping_window; //@line 337 "../wslib/window.c"
   $115 = (_Window_screen_y($114)|0); //@line 337 "../wslib/window.c"
   $screen_y = $115; //@line 337 "../wslib/window.c"
   $116 = $screen_y; //@line 339 "../wslib/window.c"
   $117 = $screen_x; //@line 339 "../wslib/window.c"
   $118 = $screen_y; //@line 340 "../wslib/window.c"
   $119 = $clipping_window; //@line 340 "../wslib/window.c"
   $120 = ((($119)) + 18|0); //@line 340 "../wslib/window.c"
   $121 = HEAP16[$120>>1]|0; //@line 340 "../wslib/window.c"
   $122 = $121&65535; //@line 340 "../wslib/window.c"
   $123 = (($118) + ($122))|0; //@line 340 "../wslib/window.c"
   $124 = (($123) - 1)|0; //@line 340 "../wslib/window.c"
   $125 = $screen_x; //@line 341 "../wslib/window.c"
   $126 = $clipping_window; //@line 341 "../wslib/window.c"
   $127 = ((($126)) + 16|0); //@line 341 "../wslib/window.c"
   $128 = HEAP16[$127>>1]|0; //@line 341 "../wslib/window.c"
   $129 = $128&65535; //@line 341 "../wslib/window.c"
   $130 = (($125) + ($129))|0; //@line 341 "../wslib/window.c"
   $131 = (($130) - 1)|0; //@line 341 "../wslib/window.c"
   $132 = (_Rect_new($116,$117,$124,$131)|0); //@line 339 "../wslib/window.c"
   $temp_rect = $132; //@line 339 "../wslib/window.c"
   $133 = $1; //@line 342 "../wslib/window.c"
   $134 = $temp_rect; //@line 342 "../wslib/window.c"
   _Context_subtract_clip_rect($133,$134); //@line 342 "../wslib/window.c"
   $135 = $temp_rect; //@line 343 "../wslib/window.c"
   _Object_delete($135); //@line 343 "../wslib/window.c"
  }
  _Object_delete($110); //@line 347 "../wslib/window.c"
  STACKTOP = sp;return; //@line 348 "../wslib/window.c"
 }
 $63 = $3; //@line 293 "../wslib/window.c"
 $64 = ($63|0)!=(0|0); //@line 293 "../wslib/window.c"
 if (!($64)) {
  $92 = $1; //@line 314 "../wslib/window.c"
  $93 = $temp_rect; //@line 314 "../wslib/window.c"
  _Context_add_clip_rect($92,$93); //@line 314 "../wslib/window.c"
  STACKTOP = sp;return; //@line 348 "../wslib/window.c"
 }
 $i = 0; //@line 296 "../wslib/window.c"
 while(1) {
  $65 = $i; //@line 296 "../wslib/window.c"
  $66 = $3; //@line 296 "../wslib/window.c"
  $67 = ((($66)) + 4|0); //@line 296 "../wslib/window.c"
  $68 = HEAP32[$67>>2]|0; //@line 296 "../wslib/window.c"
  $69 = ($65>>>0)<($68>>>0); //@line 296 "../wslib/window.c"
  if (!($69)) {
   break;
  }
  $70 = $3; //@line 299 "../wslib/window.c"
  $71 = $i; //@line 299 "../wslib/window.c"
  $72 = (_List_get_at($70,$71)|0); //@line 299 "../wslib/window.c"
  $current_dirty_rect = $72; //@line 299 "../wslib/window.c"
  $73 = $current_dirty_rect; //@line 300 "../wslib/window.c"
  $74 = ((($73)) + 4|0); //@line 300 "../wslib/window.c"
  $75 = HEAP32[$74>>2]|0; //@line 300 "../wslib/window.c"
  $76 = $current_dirty_rect; //@line 301 "../wslib/window.c"
  $77 = ((($76)) + 8|0); //@line 301 "../wslib/window.c"
  $78 = HEAP32[$77>>2]|0; //@line 301 "../wslib/window.c"
  $79 = $current_dirty_rect; //@line 302 "../wslib/window.c"
  $80 = ((($79)) + 12|0); //@line 302 "../wslib/window.c"
  $81 = HEAP32[$80>>2]|0; //@line 302 "../wslib/window.c"
  $82 = $current_dirty_rect; //@line 303 "../wslib/window.c"
  $83 = ((($82)) + 16|0); //@line 303 "../wslib/window.c"
  $84 = HEAP32[$83>>2]|0; //@line 303 "../wslib/window.c"
  $85 = (_Rect_new($75,$78,$81,$84)|0); //@line 300 "../wslib/window.c"
  $clone_dirty_rect = $85; //@line 300 "../wslib/window.c"
  $86 = $1; //@line 306 "../wslib/window.c"
  $87 = $clone_dirty_rect; //@line 306 "../wslib/window.c"
  _Context_add_clip_rect($86,$87); //@line 306 "../wslib/window.c"
  $88 = $i; //@line 296 "../wslib/window.c"
  $89 = (($88) + 1)|0; //@line 296 "../wslib/window.c"
  $i = $89; //@line 296 "../wslib/window.c"
 }
 $90 = $1; //@line 310 "../wslib/window.c"
 $91 = $temp_rect; //@line 310 "../wslib/window.c"
 _Context_intersect_clip_rect($90,$91); //@line 310 "../wslib/window.c"
 STACKTOP = sp;return; //@line 348 "../wslib/window.c"
}
function _Window_get_windows_above($parent,$child) {
 $parent = $parent|0;
 $child = $child|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0;
 var $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $current_window = 0, $i = 0, $return_list = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $parent;
 $2 = $child;
 $3 = (_List_new()|0); //@line 527 "../wslib/window.c"
 $return_list = $3; //@line 527 "../wslib/window.c"
 $4 = ($3|0)!=(0|0); //@line 527 "../wslib/window.c"
 if (!($4)) {
  $5 = $return_list; //@line 528 "../wslib/window.c"
  $0 = $5; //@line 528 "../wslib/window.c"
  $107 = $0; //@line 557 "../wslib/window.c"
  STACKTOP = sp;return ($107|0); //@line 557 "../wslib/window.c"
 }
 $i = 0; //@line 533 "../wslib/window.c"
 while(1) {
  $6 = $i; //@line 533 "../wslib/window.c"
  $7 = $1; //@line 533 "../wslib/window.c"
  $8 = ((($7)) + 40|0); //@line 533 "../wslib/window.c"
  $9 = HEAP32[$8>>2]|0; //@line 533 "../wslib/window.c"
  $10 = ((($9)) + 4|0); //@line 533 "../wslib/window.c"
  $11 = HEAP32[$10>>2]|0; //@line 533 "../wslib/window.c"
  $12 = ($6>>>0)<($11>>>0); //@line 533 "../wslib/window.c"
  if (!($12)) {
   break;
  }
  $13 = $2; //@line 534 "../wslib/window.c"
  $14 = $1; //@line 534 "../wslib/window.c"
  $15 = ((($14)) + 40|0); //@line 534 "../wslib/window.c"
  $16 = HEAP32[$15>>2]|0; //@line 534 "../wslib/window.c"
  $17 = $i; //@line 534 "../wslib/window.c"
  $18 = (_List_get_at($16,$17)|0); //@line 534 "../wslib/window.c"
  $19 = ($13|0)==($18|0); //@line 534 "../wslib/window.c"
  if ($19) {
   break;
  }
  $20 = $i; //@line 533 "../wslib/window.c"
  $21 = (($20) + 1)|0; //@line 533 "../wslib/window.c"
  $i = $21; //@line 533 "../wslib/window.c"
 }
 $22 = $i; //@line 541 "../wslib/window.c"
 $23 = (($22) + 1)|0; //@line 541 "../wslib/window.c"
 $i = $23; //@line 541 "../wslib/window.c"
 while(1) {
  $24 = $i; //@line 541 "../wslib/window.c"
  $25 = $1; //@line 541 "../wslib/window.c"
  $26 = ((($25)) + 40|0); //@line 541 "../wslib/window.c"
  $27 = HEAP32[$26>>2]|0; //@line 541 "../wslib/window.c"
  $28 = ((($27)) + 4|0); //@line 541 "../wslib/window.c"
  $29 = HEAP32[$28>>2]|0; //@line 541 "../wslib/window.c"
  $30 = ($24>>>0)<($29>>>0); //@line 541 "../wslib/window.c"
  if (!($30)) {
   break;
  }
  $31 = $1; //@line 543 "../wslib/window.c"
  $32 = ((($31)) + 40|0); //@line 543 "../wslib/window.c"
  $33 = HEAP32[$32>>2]|0; //@line 543 "../wslib/window.c"
  $34 = $i; //@line 543 "../wslib/window.c"
  $35 = (_List_get_at($33,$34)|0); //@line 543 "../wslib/window.c"
  $current_window = $35; //@line 543 "../wslib/window.c"
  $36 = $current_window; //@line 545 "../wslib/window.c"
  $37 = ((($36)) + 20|0); //@line 545 "../wslib/window.c"
  $38 = HEAP16[$37>>1]|0; //@line 545 "../wslib/window.c"
  $39 = $38&65535; //@line 545 "../wslib/window.c"
  $40 = $39 & 8; //@line 545 "../wslib/window.c"
  $41 = ($40|0)!=(0); //@line 545 "../wslib/window.c"
  if (!($41)) {
   $42 = $current_window; //@line 549 "../wslib/window.c"
   $43 = ((($42)) + 12|0); //@line 549 "../wslib/window.c"
   $44 = HEAP16[$43>>1]|0; //@line 549 "../wslib/window.c"
   $45 = $44 << 16 >> 16; //@line 549 "../wslib/window.c"
   $46 = $2; //@line 549 "../wslib/window.c"
   $47 = ((($46)) + 12|0); //@line 549 "../wslib/window.c"
   $48 = HEAP16[$47>>1]|0; //@line 549 "../wslib/window.c"
   $49 = $48 << 16 >> 16; //@line 549 "../wslib/window.c"
   $50 = $2; //@line 549 "../wslib/window.c"
   $51 = ((($50)) + 16|0); //@line 549 "../wslib/window.c"
   $52 = HEAP16[$51>>1]|0; //@line 549 "../wslib/window.c"
   $53 = $52&65535; //@line 549 "../wslib/window.c"
   $54 = (($49) + ($53))|0; //@line 549 "../wslib/window.c"
   $55 = (($54) - 1)|0; //@line 549 "../wslib/window.c"
   $56 = ($45|0)<=($55|0); //@line 549 "../wslib/window.c"
   if ($56) {
    $57 = $current_window; //@line 550 "../wslib/window.c"
    $58 = ((($57)) + 12|0); //@line 550 "../wslib/window.c"
    $59 = HEAP16[$58>>1]|0; //@line 550 "../wslib/window.c"
    $60 = $59 << 16 >> 16; //@line 550 "../wslib/window.c"
    $61 = $current_window; //@line 550 "../wslib/window.c"
    $62 = ((($61)) + 16|0); //@line 550 "../wslib/window.c"
    $63 = HEAP16[$62>>1]|0; //@line 550 "../wslib/window.c"
    $64 = $63&65535; //@line 550 "../wslib/window.c"
    $65 = (($60) + ($64))|0; //@line 550 "../wslib/window.c"
    $66 = (($65) - 1)|0; //@line 550 "../wslib/window.c"
    $67 = $2; //@line 550 "../wslib/window.c"
    $68 = ((($67)) + 12|0); //@line 550 "../wslib/window.c"
    $69 = HEAP16[$68>>1]|0; //@line 550 "../wslib/window.c"
    $70 = $69 << 16 >> 16; //@line 550 "../wslib/window.c"
    $71 = ($66|0)>=($70|0); //@line 550 "../wslib/window.c"
    if ($71) {
     $72 = $current_window; //@line 551 "../wslib/window.c"
     $73 = ((($72)) + 14|0); //@line 551 "../wslib/window.c"
     $74 = HEAP16[$73>>1]|0; //@line 551 "../wslib/window.c"
     $75 = $74 << 16 >> 16; //@line 551 "../wslib/window.c"
     $76 = $2; //@line 551 "../wslib/window.c"
     $77 = ((($76)) + 14|0); //@line 551 "../wslib/window.c"
     $78 = HEAP16[$77>>1]|0; //@line 551 "../wslib/window.c"
     $79 = $78 << 16 >> 16; //@line 551 "../wslib/window.c"
     $80 = $2; //@line 551 "../wslib/window.c"
     $81 = ((($80)) + 18|0); //@line 551 "../wslib/window.c"
     $82 = HEAP16[$81>>1]|0; //@line 551 "../wslib/window.c"
     $83 = $82&65535; //@line 551 "../wslib/window.c"
     $84 = (($79) + ($83))|0; //@line 551 "../wslib/window.c"
     $85 = (($84) - 1)|0; //@line 551 "../wslib/window.c"
     $86 = ($75|0)<=($85|0); //@line 551 "../wslib/window.c"
     if ($86) {
      $87 = $current_window; //@line 552 "../wslib/window.c"
      $88 = ((($87)) + 14|0); //@line 552 "../wslib/window.c"
      $89 = HEAP16[$88>>1]|0; //@line 552 "../wslib/window.c"
      $90 = $89 << 16 >> 16; //@line 552 "../wslib/window.c"
      $91 = $current_window; //@line 552 "../wslib/window.c"
      $92 = ((($91)) + 18|0); //@line 552 "../wslib/window.c"
      $93 = HEAP16[$92>>1]|0; //@line 552 "../wslib/window.c"
      $94 = $93&65535; //@line 552 "../wslib/window.c"
      $95 = (($90) + ($94))|0; //@line 552 "../wslib/window.c"
      $96 = (($95) - 1)|0; //@line 552 "../wslib/window.c"
      $97 = $2; //@line 552 "../wslib/window.c"
      $98 = ((($97)) + 14|0); //@line 552 "../wslib/window.c"
      $99 = HEAP16[$98>>1]|0; //@line 552 "../wslib/window.c"
      $100 = $99 << 16 >> 16; //@line 552 "../wslib/window.c"
      $101 = ($96|0)>=($100|0); //@line 552 "../wslib/window.c"
      if ($101) {
       $102 = $return_list; //@line 553 "../wslib/window.c"
       $103 = $current_window; //@line 553 "../wslib/window.c"
       (_List_add($102,$103)|0); //@line 553 "../wslib/window.c"
      }
     }
    }
   }
  }
  $104 = $i; //@line 541 "../wslib/window.c"
  $105 = (($104) + 1)|0; //@line 541 "../wslib/window.c"
  $i = $105; //@line 541 "../wslib/window.c"
 }
 $106 = $return_list; //@line 556 "../wslib/window.c"
 $0 = $106; //@line 556 "../wslib/window.c"
 $107 = $0; //@line 557 "../wslib/window.c"
 STACKTOP = sp;return ($107|0); //@line 557 "../wslib/window.c"
}
function _Window_update_title($window) {
 $window = $window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $0; //@line 354 "../wslib/window.c"
 $2 = ((($1)) + 24|0); //@line 354 "../wslib/window.c"
 $3 = HEAP32[$2>>2]|0; //@line 354 "../wslib/window.c"
 $4 = ($3|0)!=(0|0); //@line 354 "../wslib/window.c"
 if (!($4)) {
  STACKTOP = sp;return; //@line 366 "../wslib/window.c"
 }
 $5 = $0; //@line 355 "../wslib/window.c"
 $6 = ((($5)) + 20|0); //@line 355 "../wslib/window.c"
 $7 = HEAP16[$6>>1]|0; //@line 355 "../wslib/window.c"
 $8 = $7&65535; //@line 355 "../wslib/window.c"
 $9 = $8 & 8; //@line 355 "../wslib/window.c"
 $10 = ($9|0)!=(0); //@line 355 "../wslib/window.c"
 if ($10) {
  STACKTOP = sp;return; //@line 366 "../wslib/window.c"
 }
 $11 = $0; //@line 356 "../wslib/window.c"
 $12 = ((($11)) + 20|0); //@line 356 "../wslib/window.c"
 $13 = HEAP16[$12>>1]|0; //@line 356 "../wslib/window.c"
 $14 = $13&65535; //@line 356 "../wslib/window.c"
 $15 = $14 & 1; //@line 356 "../wslib/window.c"
 $16 = ($15|0)!=(0); //@line 356 "../wslib/window.c"
 if ($16) {
  STACKTOP = sp;return; //@line 366 "../wslib/window.c"
 }
 $17 = $0; //@line 360 "../wslib/window.c"
 $18 = $0; //@line 360 "../wslib/window.c"
 $19 = ((($18)) + 24|0); //@line 360 "../wslib/window.c"
 $20 = HEAP32[$19>>2]|0; //@line 360 "../wslib/window.c"
 _Window_apply_bound_clipping($17,$20,0,0); //@line 360 "../wslib/window.c"
 $21 = $0; //@line 363 "../wslib/window.c"
 _Window_draw_border($21); //@line 363 "../wslib/window.c"
 $22 = $0; //@line 365 "../wslib/window.c"
 $23 = ((($22)) + 24|0); //@line 365 "../wslib/window.c"
 $24 = HEAP32[$23>>2]|0; //@line 365 "../wslib/window.c"
 _Context_clear_clip_rects($24); //@line 365 "../wslib/window.c"
 STACKTOP = sp;return; //@line 366 "../wslib/window.c"
}
function _Window_invalidate($window,$top,$left,$bottom,$right) {
 $window = $window|0;
 $top = $top|0;
 $left = $left|0;
 $bottom = $bottom|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $dirty_rect = 0, $dirty_regions = 0, $origin_x = 0;
 var $origin_y = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $top;
 $2 = $left;
 $3 = $bottom;
 $4 = $right;
 $5 = $0; //@line 376 "../wslib/window.c"
 $6 = (_Window_screen_x($5)|0); //@line 376 "../wslib/window.c"
 $origin_x = $6; //@line 376 "../wslib/window.c"
 $7 = $0; //@line 377 "../wslib/window.c"
 $8 = (_Window_screen_y($7)|0); //@line 377 "../wslib/window.c"
 $origin_y = $8; //@line 377 "../wslib/window.c"
 $9 = $origin_y; //@line 378 "../wslib/window.c"
 $10 = $1; //@line 378 "../wslib/window.c"
 $11 = (($10) + ($9))|0; //@line 378 "../wslib/window.c"
 $1 = $11; //@line 378 "../wslib/window.c"
 $12 = $origin_y; //@line 379 "../wslib/window.c"
 $13 = $3; //@line 379 "../wslib/window.c"
 $14 = (($13) + ($12))|0; //@line 379 "../wslib/window.c"
 $3 = $14; //@line 379 "../wslib/window.c"
 $15 = $origin_x; //@line 380 "../wslib/window.c"
 $16 = $2; //@line 380 "../wslib/window.c"
 $17 = (($16) + ($15))|0; //@line 380 "../wslib/window.c"
 $2 = $17; //@line 380 "../wslib/window.c"
 $18 = $origin_x; //@line 381 "../wslib/window.c"
 $19 = $4; //@line 381 "../wslib/window.c"
 $20 = (($19) + ($18))|0; //@line 381 "../wslib/window.c"
 $4 = $20; //@line 381 "../wslib/window.c"
 $21 = (_List_new()|0); //@line 384 "../wslib/window.c"
 $dirty_regions = $21; //@line 384 "../wslib/window.c"
 $22 = ($21|0)!=(0|0); //@line 384 "../wslib/window.c"
 if (!($22)) {
  STACKTOP = sp;return; //@line 403 "../wslib/window.c"
 }
 $23 = $1; //@line 387 "../wslib/window.c"
 $24 = $2; //@line 387 "../wslib/window.c"
 $25 = $3; //@line 387 "../wslib/window.c"
 $26 = $4; //@line 387 "../wslib/window.c"
 $27 = (_Rect_new($23,$24,$25,$26)|0); //@line 387 "../wslib/window.c"
 $dirty_rect = $27; //@line 387 "../wslib/window.c"
 $28 = ($27|0)!=(0|0); //@line 387 "../wslib/window.c"
 $29 = $dirty_regions; //@line 393 "../wslib/window.c"
 if (!($28)) {
  _Object_delete($29); //@line 389 "../wslib/window.c"
  STACKTOP = sp;return; //@line 403 "../wslib/window.c"
 }
 $30 = $dirty_rect; //@line 393 "../wslib/window.c"
 $31 = (_List_add($29,$30)|0); //@line 393 "../wslib/window.c"
 $32 = ($31|0)!=(0); //@line 393 "../wslib/window.c"
 if ($32) {
  $34 = $0; //@line 399 "../wslib/window.c"
  $35 = $dirty_regions; //@line 399 "../wslib/window.c"
  _Window_paint($34,$35,0); //@line 399 "../wslib/window.c"
  $36 = $dirty_regions; //@line 402 "../wslib/window.c"
  _Object_delete($36); //@line 402 "../wslib/window.c"
  STACKTOP = sp;return; //@line 403 "../wslib/window.c"
 } else {
  $33 = $dirty_regions; //@line 395 "../wslib/window.c"
  _Object_delete($33); //@line 395 "../wslib/window.c"
  STACKTOP = sp;return; //@line 403 "../wslib/window.c"
 }
}
function _Window_paint($window,$dirty_regions,$paint_children) {
 $window = $window|0;
 $dirty_regions = $dirty_regions|0;
 $paint_children = $paint_children|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0;
 var $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $child_screen_x = 0;
 var $child_screen_y = 0, $current_child = 0, $i = 0, $j = 0, $screen_x = 0, $screen_y = 0, $temp_rect = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $dirty_regions;
 $2 = $paint_children;
 $3 = $0; //@line 413 "../wslib/window.c"
 $4 = ((($3)) + 24|0); //@line 413 "../wslib/window.c"
 $5 = HEAP32[$4>>2]|0; //@line 413 "../wslib/window.c"
 $6 = ($5|0)!=(0|0); //@line 413 "../wslib/window.c"
 if (!($6)) {
  STACKTOP = sp;return; //@line 509 "../wslib/window.c"
 }
 $7 = $0; //@line 413 "../wslib/window.c"
 $8 = ((($7)) + 20|0); //@line 413 "../wslib/window.c"
 $9 = HEAP16[$8>>1]|0; //@line 413 "../wslib/window.c"
 $10 = $9&65535; //@line 413 "../wslib/window.c"
 $11 = $10 & 8; //@line 413 "../wslib/window.c"
 $12 = ($11|0)!=(0); //@line 413 "../wslib/window.c"
 if ($12) {
  STACKTOP = sp;return; //@line 509 "../wslib/window.c"
 }
 $13 = $0; //@line 417 "../wslib/window.c"
 $14 = $0; //@line 417 "../wslib/window.c"
 $15 = ((($14)) + 24|0); //@line 417 "../wslib/window.c"
 $16 = HEAP32[$15>>2]|0; //@line 417 "../wslib/window.c"
 $17 = $1; //@line 417 "../wslib/window.c"
 _Window_apply_bound_clipping($13,$16,0,$17); //@line 417 "../wslib/window.c"
 $18 = $0; //@line 420 "../wslib/window.c"
 $19 = (_Window_screen_x($18)|0); //@line 420 "../wslib/window.c"
 $screen_x = $19; //@line 420 "../wslib/window.c"
 $20 = $0; //@line 421 "../wslib/window.c"
 $21 = (_Window_screen_y($20)|0); //@line 421 "../wslib/window.c"
 $screen_y = $21; //@line 421 "../wslib/window.c"
 $22 = $0; //@line 425 "../wslib/window.c"
 $23 = ((($22)) + 20|0); //@line 425 "../wslib/window.c"
 $24 = HEAP16[$23>>1]|0; //@line 425 "../wslib/window.c"
 $25 = $24&65535; //@line 425 "../wslib/window.c"
 $26 = $25 & 1; //@line 425 "../wslib/window.c"
 $27 = ($26|0)!=(0); //@line 425 "../wslib/window.c"
 if (!($27)) {
  $28 = $0; //@line 428 "../wslib/window.c"
  _Window_draw_border($28); //@line 428 "../wslib/window.c"
  $29 = $screen_x; //@line 431 "../wslib/window.c"
  $30 = (($29) + 4)|0; //@line 431 "../wslib/window.c"
  $screen_x = $30; //@line 431 "../wslib/window.c"
  $31 = $screen_y; //@line 432 "../wslib/window.c"
  $32 = (($31) + 28)|0; //@line 432 "../wslib/window.c"
  $screen_y = $32; //@line 432 "../wslib/window.c"
  $33 = $screen_y; //@line 433 "../wslib/window.c"
  $34 = $screen_x; //@line 433 "../wslib/window.c"
  $35 = $screen_y; //@line 434 "../wslib/window.c"
  $36 = $0; //@line 434 "../wslib/window.c"
  $37 = ((($36)) + 18|0); //@line 434 "../wslib/window.c"
  $38 = HEAP16[$37>>1]|0; //@line 434 "../wslib/window.c"
  $39 = $38&65535; //@line 434 "../wslib/window.c"
  $40 = (($35) + ($39))|0; //@line 434 "../wslib/window.c"
  $41 = (($40) - 28)|0; //@line 434 "../wslib/window.c"
  $42 = (($41) - 4)|0; //@line 434 "../wslib/window.c"
  $43 = (($42) - 1)|0; //@line 434 "../wslib/window.c"
  $44 = $screen_x; //@line 435 "../wslib/window.c"
  $45 = $0; //@line 435 "../wslib/window.c"
  $46 = ((($45)) + 16|0); //@line 435 "../wslib/window.c"
  $47 = HEAP16[$46>>1]|0; //@line 435 "../wslib/window.c"
  $48 = $47&65535; //@line 435 "../wslib/window.c"
  $49 = (($44) + ($48))|0; //@line 435 "../wslib/window.c"
  $50 = (($49) - 8)|0; //@line 435 "../wslib/window.c"
  $51 = (($50) - 1)|0; //@line 435 "../wslib/window.c"
  $52 = (_Rect_new($33,$34,$43,$51)|0); //@line 433 "../wslib/window.c"
  $temp_rect = $52; //@line 433 "../wslib/window.c"
  $53 = $0; //@line 436 "../wslib/window.c"
  $54 = ((($53)) + 24|0); //@line 436 "../wslib/window.c"
  $55 = HEAP32[$54>>2]|0; //@line 436 "../wslib/window.c"
  $56 = $temp_rect; //@line 436 "../wslib/window.c"
  _Context_intersect_clip_rect($55,$56); //@line 436 "../wslib/window.c"
 }
 $i = 0; //@line 444 "../wslib/window.c"
 while(1) {
  $57 = $i; //@line 444 "../wslib/window.c"
  $58 = $0; //@line 444 "../wslib/window.c"
  $59 = ((($58)) + 40|0); //@line 444 "../wslib/window.c"
  $60 = HEAP32[$59>>2]|0; //@line 444 "../wslib/window.c"
  $61 = ((($60)) + 4|0); //@line 444 "../wslib/window.c"
  $62 = HEAP32[$61>>2]|0; //@line 444 "../wslib/window.c"
  $63 = ($57>>>0)<($62>>>0); //@line 444 "../wslib/window.c"
  if (!($63)) {
   break;
  }
  $64 = $0; //@line 446 "../wslib/window.c"
  $65 = ((($64)) + 40|0); //@line 446 "../wslib/window.c"
  $66 = HEAP32[$65>>2]|0; //@line 446 "../wslib/window.c"
  $67 = $i; //@line 446 "../wslib/window.c"
  $68 = (_List_get_at($66,$67)|0); //@line 446 "../wslib/window.c"
  $current_child = $68; //@line 446 "../wslib/window.c"
  $69 = $current_child; //@line 448 "../wslib/window.c"
  $70 = ((($69)) + 20|0); //@line 448 "../wslib/window.c"
  $71 = HEAP16[$70>>1]|0; //@line 448 "../wslib/window.c"
  $72 = $71&65535; //@line 448 "../wslib/window.c"
  $73 = $72 & 8; //@line 448 "../wslib/window.c"
  $74 = ($73|0)!=(0); //@line 448 "../wslib/window.c"
  if (!($74)) {
   $75 = $current_child; //@line 451 "../wslib/window.c"
   $76 = (_Window_screen_x($75)|0); //@line 451 "../wslib/window.c"
   $child_screen_x = $76; //@line 451 "../wslib/window.c"
   $77 = $current_child; //@line 452 "../wslib/window.c"
   $78 = (_Window_screen_y($77)|0); //@line 452 "../wslib/window.c"
   $child_screen_y = $78; //@line 452 "../wslib/window.c"
   $79 = $child_screen_y; //@line 454 "../wslib/window.c"
   $80 = $child_screen_x; //@line 454 "../wslib/window.c"
   $81 = $child_screen_y; //@line 455 "../wslib/window.c"
   $82 = $current_child; //@line 455 "../wslib/window.c"
   $83 = ((($82)) + 18|0); //@line 455 "../wslib/window.c"
   $84 = HEAP16[$83>>1]|0; //@line 455 "../wslib/window.c"
   $85 = $84&65535; //@line 455 "../wslib/window.c"
   $86 = (($81) + ($85))|0; //@line 455 "../wslib/window.c"
   $87 = (($86) - 1)|0; //@line 455 "../wslib/window.c"
   $88 = $child_screen_x; //@line 456 "../wslib/window.c"
   $89 = $current_child; //@line 456 "../wslib/window.c"
   $90 = ((($89)) + 16|0); //@line 456 "../wslib/window.c"
   $91 = HEAP16[$90>>1]|0; //@line 456 "../wslib/window.c"
   $92 = $91&65535; //@line 456 "../wslib/window.c"
   $93 = (($88) + ($92))|0; //@line 456 "../wslib/window.c"
   $94 = (($93) - 1)|0; //@line 456 "../wslib/window.c"
   $95 = (_Rect_new($79,$80,$87,$94)|0); //@line 454 "../wslib/window.c"
   $temp_rect = $95; //@line 454 "../wslib/window.c"
   $96 = $0; //@line 457 "../wslib/window.c"
   $97 = ((($96)) + 24|0); //@line 457 "../wslib/window.c"
   $98 = HEAP32[$97>>2]|0; //@line 457 "../wslib/window.c"
   $99 = $temp_rect; //@line 457 "../wslib/window.c"
   _Context_subtract_clip_rect($98,$99); //@line 457 "../wslib/window.c"
   $100 = $temp_rect; //@line 458 "../wslib/window.c"
   _Object_delete($100); //@line 458 "../wslib/window.c"
  }
  $101 = $i; //@line 444 "../wslib/window.c"
  $102 = (($101) + 1)|0; //@line 444 "../wslib/window.c"
  $i = $102; //@line 444 "../wslib/window.c"
 }
 $103 = $screen_x; //@line 463 "../wslib/window.c"
 $104 = $0; //@line 463 "../wslib/window.c"
 $105 = ((($104)) + 24|0); //@line 463 "../wslib/window.c"
 $106 = HEAP32[$105>>2]|0; //@line 463 "../wslib/window.c"
 $107 = ((($106)) + 16|0); //@line 463 "../wslib/window.c"
 HEAP32[$107>>2] = $103; //@line 463 "../wslib/window.c"
 $108 = $screen_y; //@line 464 "../wslib/window.c"
 $109 = $0; //@line 464 "../wslib/window.c"
 $110 = ((($109)) + 24|0); //@line 464 "../wslib/window.c"
 $111 = HEAP32[$110>>2]|0; //@line 464 "../wslib/window.c"
 $112 = ((($111)) + 20|0); //@line 464 "../wslib/window.c"
 HEAP32[$112>>2] = $108; //@line 464 "../wslib/window.c"
 $113 = $0; //@line 465 "../wslib/window.c"
 $114 = ((($113)) + 52|0); //@line 465 "../wslib/window.c"
 $115 = HEAP32[$114>>2]|0; //@line 465 "../wslib/window.c"
 $116 = $0; //@line 465 "../wslib/window.c"
 FUNCTION_TABLE_vi[$115 & 63]($116); //@line 465 "../wslib/window.c"
 $117 = $0; //@line 468 "../wslib/window.c"
 $118 = ((($117)) + 24|0); //@line 468 "../wslib/window.c"
 $119 = HEAP32[$118>>2]|0; //@line 468 "../wslib/window.c"
 _Context_clear_clip_rects($119); //@line 468 "../wslib/window.c"
 $120 = $0; //@line 469 "../wslib/window.c"
 $121 = ((($120)) + 24|0); //@line 469 "../wslib/window.c"
 $122 = HEAP32[$121>>2]|0; //@line 469 "../wslib/window.c"
 $123 = ((($122)) + 16|0); //@line 469 "../wslib/window.c"
 HEAP32[$123>>2] = 0; //@line 469 "../wslib/window.c"
 $124 = $0; //@line 470 "../wslib/window.c"
 $125 = ((($124)) + 24|0); //@line 470 "../wslib/window.c"
 $126 = HEAP32[$125>>2]|0; //@line 470 "../wslib/window.c"
 $127 = ((($126)) + 20|0); //@line 470 "../wslib/window.c"
 HEAP32[$127>>2] = 0; //@line 470 "../wslib/window.c"
 $128 = $2; //@line 476 "../wslib/window.c"
 $129 = ($128<<24>>24)!=(0); //@line 476 "../wslib/window.c"
 if (!($129)) {
  STACKTOP = sp;return; //@line 509 "../wslib/window.c"
 }
 $i = 0; //@line 479 "../wslib/window.c"
 while(1) {
  $130 = $i; //@line 479 "../wslib/window.c"
  $131 = $0; //@line 479 "../wslib/window.c"
  $132 = ((($131)) + 40|0); //@line 479 "../wslib/window.c"
  $133 = HEAP32[$132>>2]|0; //@line 479 "../wslib/window.c"
  $134 = ((($133)) + 4|0); //@line 479 "../wslib/window.c"
  $135 = HEAP32[$134>>2]|0; //@line 479 "../wslib/window.c"
  $136 = ($130>>>0)<($135>>>0); //@line 479 "../wslib/window.c"
  if (!($136)) {
   break;
  }
  $137 = $0; //@line 481 "../wslib/window.c"
  $138 = ((($137)) + 40|0); //@line 481 "../wslib/window.c"
  $139 = HEAP32[$138>>2]|0; //@line 481 "../wslib/window.c"
  $140 = $i; //@line 481 "../wslib/window.c"
  $141 = (_List_get_at($139,$140)|0); //@line 481 "../wslib/window.c"
  $current_child = $141; //@line 481 "../wslib/window.c"
  $142 = $1; //@line 483 "../wslib/window.c"
  $143 = ($142|0)!=(0|0); //@line 483 "../wslib/window.c"
  if ($143) {
   $j = 0; //@line 487 "../wslib/window.c"
   while(1) {
    $144 = $j; //@line 487 "../wslib/window.c"
    $145 = $1; //@line 487 "../wslib/window.c"
    $146 = ((($145)) + 4|0); //@line 487 "../wslib/window.c"
    $147 = HEAP32[$146>>2]|0; //@line 487 "../wslib/window.c"
    $148 = ($144>>>0)<($147>>>0); //@line 487 "../wslib/window.c"
    if (!($148)) {
     break;
    }
    $149 = $1; //@line 489 "../wslib/window.c"
    $150 = $j; //@line 489 "../wslib/window.c"
    $151 = (_List_get_at($149,$150)|0); //@line 489 "../wslib/window.c"
    $temp_rect = $151; //@line 489 "../wslib/window.c"
    $152 = $current_child; //@line 491 "../wslib/window.c"
    $153 = (_Window_screen_x($152)|0); //@line 491 "../wslib/window.c"
    $screen_x = $153; //@line 491 "../wslib/window.c"
    $154 = $current_child; //@line 492 "../wslib/window.c"
    $155 = (_Window_screen_y($154)|0); //@line 492 "../wslib/window.c"
    $screen_y = $155; //@line 492 "../wslib/window.c"
    $156 = $temp_rect; //@line 494 "../wslib/window.c"
    $157 = ((($156)) + 8|0); //@line 494 "../wslib/window.c"
    $158 = HEAP32[$157>>2]|0; //@line 494 "../wslib/window.c"
    $159 = $screen_x; //@line 494 "../wslib/window.c"
    $160 = $current_child; //@line 494 "../wslib/window.c"
    $161 = ((($160)) + 16|0); //@line 494 "../wslib/window.c"
    $162 = HEAP16[$161>>1]|0; //@line 494 "../wslib/window.c"
    $163 = $162&65535; //@line 494 "../wslib/window.c"
    $164 = (($159) + ($163))|0; //@line 494 "../wslib/window.c"
    $165 = (($164) - 1)|0; //@line 494 "../wslib/window.c"
    $166 = ($158|0)<=($165|0); //@line 494 "../wslib/window.c"
    if ($166) {
     $167 = $temp_rect; //@line 495 "../wslib/window.c"
     $168 = ((($167)) + 16|0); //@line 495 "../wslib/window.c"
     $169 = HEAP32[$168>>2]|0; //@line 495 "../wslib/window.c"
     $170 = $screen_x; //@line 495 "../wslib/window.c"
     $171 = ($169|0)>=($170|0); //@line 495 "../wslib/window.c"
     if ($171) {
      $172 = $temp_rect; //@line 496 "../wslib/window.c"
      $173 = ((($172)) + 4|0); //@line 496 "../wslib/window.c"
      $174 = HEAP32[$173>>2]|0; //@line 496 "../wslib/window.c"
      $175 = $screen_y; //@line 496 "../wslib/window.c"
      $176 = $current_child; //@line 496 "../wslib/window.c"
      $177 = ((($176)) + 18|0); //@line 496 "../wslib/window.c"
      $178 = HEAP16[$177>>1]|0; //@line 496 "../wslib/window.c"
      $179 = $178&65535; //@line 496 "../wslib/window.c"
      $180 = (($175) + ($179))|0; //@line 496 "../wslib/window.c"
      $181 = (($180) - 1)|0; //@line 496 "../wslib/window.c"
      $182 = ($174|0)<=($181|0); //@line 496 "../wslib/window.c"
      if ($182) {
       $183 = $temp_rect; //@line 497 "../wslib/window.c"
       $184 = ((($183)) + 12|0); //@line 497 "../wslib/window.c"
       $185 = HEAP32[$184>>2]|0; //@line 497 "../wslib/window.c"
       $186 = $screen_y; //@line 497 "../wslib/window.c"
       $187 = ($185|0)>=($186|0); //@line 497 "../wslib/window.c"
       if ($187) {
        break;
       }
      }
     }
    }
    $188 = $j; //@line 487 "../wslib/window.c"
    $189 = (($188) + 1)|0; //@line 487 "../wslib/window.c"
    $j = $189; //@line 487 "../wslib/window.c"
   }
   $190 = $j; //@line 502 "../wslib/window.c"
   $191 = $1; //@line 502 "../wslib/window.c"
   $192 = ((($191)) + 4|0); //@line 502 "../wslib/window.c"
   $193 = HEAP32[$192>>2]|0; //@line 502 "../wslib/window.c"
   $194 = ($190|0)==($193|0); //@line 502 "../wslib/window.c"
   if (!($194)) {
    label = 22;
   }
  } else {
   label = 22;
  }
  if ((label|0) == 22) {
   label = 0;
   $195 = $current_child; //@line 507 "../wslib/window.c"
   $196 = $1; //@line 507 "../wslib/window.c"
   _Window_paint($195,$196,1); //@line 507 "../wslib/window.c"
  }
  $197 = $i; //@line 479 "../wslib/window.c"
  $198 = (($197) + 1)|0; //@line 479 "../wslib/window.c"
  $i = $198; //@line 479 "../wslib/window.c"
 }
 STACKTOP = sp;return; //@line 509 "../wslib/window.c"
}
function _Window_get_windows_below($parent,$child) {
 $parent = $parent|0;
 $child = $child|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0, $97 = 0, $98 = 0, $99 = 0, $current_window = 0, $i = 0, $return_list = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $parent;
 $2 = $child;
 $3 = (_List_new()|0); //@line 569 "../wslib/window.c"
 $return_list = $3; //@line 569 "../wslib/window.c"
 $4 = ($3|0)!=(0|0); //@line 569 "../wslib/window.c"
 if (!($4)) {
  $5 = $return_list; //@line 570 "../wslib/window.c"
  $0 = $5; //@line 570 "../wslib/window.c"
  $103 = $0; //@line 599 "../wslib/window.c"
  STACKTOP = sp;return ($103|0); //@line 599 "../wslib/window.c"
 }
 $6 = $1; //@line 575 "../wslib/window.c"
 $7 = ((($6)) + 40|0); //@line 575 "../wslib/window.c"
 $8 = HEAP32[$7>>2]|0; //@line 575 "../wslib/window.c"
 $9 = ((($8)) + 4|0); //@line 575 "../wslib/window.c"
 $10 = HEAP32[$9>>2]|0; //@line 575 "../wslib/window.c"
 $11 = (($10) - 1)|0; //@line 575 "../wslib/window.c"
 $i = $11; //@line 575 "../wslib/window.c"
 while(1) {
  $12 = $i; //@line 575 "../wslib/window.c"
  $13 = ($12|0)>(-1); //@line 575 "../wslib/window.c"
  if (!($13)) {
   break;
  }
  $14 = $2; //@line 576 "../wslib/window.c"
  $15 = $1; //@line 576 "../wslib/window.c"
  $16 = ((($15)) + 40|0); //@line 576 "../wslib/window.c"
  $17 = HEAP32[$16>>2]|0; //@line 576 "../wslib/window.c"
  $18 = $i; //@line 576 "../wslib/window.c"
  $19 = (_List_get_at($17,$18)|0); //@line 576 "../wslib/window.c"
  $20 = ($14|0)==($19|0); //@line 576 "../wslib/window.c"
  if ($20) {
   break;
  }
  $21 = $i; //@line 575 "../wslib/window.c"
  $22 = (($21) + -1)|0; //@line 575 "../wslib/window.c"
  $i = $22; //@line 575 "../wslib/window.c"
 }
 $23 = $i; //@line 583 "../wslib/window.c"
 $24 = (($23) + -1)|0; //@line 583 "../wslib/window.c"
 $i = $24; //@line 583 "../wslib/window.c"
 while(1) {
  $25 = $i; //@line 583 "../wslib/window.c"
  $26 = ($25|0)>(-1); //@line 583 "../wslib/window.c"
  if (!($26)) {
   break;
  }
  $27 = $1; //@line 585 "../wslib/window.c"
  $28 = ((($27)) + 40|0); //@line 585 "../wslib/window.c"
  $29 = HEAP32[$28>>2]|0; //@line 585 "../wslib/window.c"
  $30 = $i; //@line 585 "../wslib/window.c"
  $31 = (_List_get_at($29,$30)|0); //@line 585 "../wslib/window.c"
  $current_window = $31; //@line 585 "../wslib/window.c"
  $32 = $current_window; //@line 587 "../wslib/window.c"
  $33 = ((($32)) + 20|0); //@line 587 "../wslib/window.c"
  $34 = HEAP16[$33>>1]|0; //@line 587 "../wslib/window.c"
  $35 = $34&65535; //@line 587 "../wslib/window.c"
  $36 = $35 & 8; //@line 587 "../wslib/window.c"
  $37 = ($36|0)!=(0); //@line 587 "../wslib/window.c"
  if (!($37)) {
   $38 = $current_window; //@line 591 "../wslib/window.c"
   $39 = ((($38)) + 12|0); //@line 591 "../wslib/window.c"
   $40 = HEAP16[$39>>1]|0; //@line 591 "../wslib/window.c"
   $41 = $40 << 16 >> 16; //@line 591 "../wslib/window.c"
   $42 = $2; //@line 591 "../wslib/window.c"
   $43 = ((($42)) + 12|0); //@line 591 "../wslib/window.c"
   $44 = HEAP16[$43>>1]|0; //@line 591 "../wslib/window.c"
   $45 = $44 << 16 >> 16; //@line 591 "../wslib/window.c"
   $46 = $2; //@line 591 "../wslib/window.c"
   $47 = ((($46)) + 16|0); //@line 591 "../wslib/window.c"
   $48 = HEAP16[$47>>1]|0; //@line 591 "../wslib/window.c"
   $49 = $48&65535; //@line 591 "../wslib/window.c"
   $50 = (($45) + ($49))|0; //@line 591 "../wslib/window.c"
   $51 = (($50) - 1)|0; //@line 591 "../wslib/window.c"
   $52 = ($41|0)<=($51|0); //@line 591 "../wslib/window.c"
   if ($52) {
    $53 = $current_window; //@line 592 "../wslib/window.c"
    $54 = ((($53)) + 12|0); //@line 592 "../wslib/window.c"
    $55 = HEAP16[$54>>1]|0; //@line 592 "../wslib/window.c"
    $56 = $55 << 16 >> 16; //@line 592 "../wslib/window.c"
    $57 = $current_window; //@line 592 "../wslib/window.c"
    $58 = ((($57)) + 16|0); //@line 592 "../wslib/window.c"
    $59 = HEAP16[$58>>1]|0; //@line 592 "../wslib/window.c"
    $60 = $59&65535; //@line 592 "../wslib/window.c"
    $61 = (($56) + ($60))|0; //@line 592 "../wslib/window.c"
    $62 = (($61) - 1)|0; //@line 592 "../wslib/window.c"
    $63 = $2; //@line 592 "../wslib/window.c"
    $64 = ((($63)) + 12|0); //@line 592 "../wslib/window.c"
    $65 = HEAP16[$64>>1]|0; //@line 592 "../wslib/window.c"
    $66 = $65 << 16 >> 16; //@line 592 "../wslib/window.c"
    $67 = ($62|0)>=($66|0); //@line 592 "../wslib/window.c"
    if ($67) {
     $68 = $current_window; //@line 593 "../wslib/window.c"
     $69 = ((($68)) + 14|0); //@line 593 "../wslib/window.c"
     $70 = HEAP16[$69>>1]|0; //@line 593 "../wslib/window.c"
     $71 = $70 << 16 >> 16; //@line 593 "../wslib/window.c"
     $72 = $2; //@line 593 "../wslib/window.c"
     $73 = ((($72)) + 14|0); //@line 593 "../wslib/window.c"
     $74 = HEAP16[$73>>1]|0; //@line 593 "../wslib/window.c"
     $75 = $74 << 16 >> 16; //@line 593 "../wslib/window.c"
     $76 = $2; //@line 593 "../wslib/window.c"
     $77 = ((($76)) + 18|0); //@line 593 "../wslib/window.c"
     $78 = HEAP16[$77>>1]|0; //@line 593 "../wslib/window.c"
     $79 = $78&65535; //@line 593 "../wslib/window.c"
     $80 = (($75) + ($79))|0; //@line 593 "../wslib/window.c"
     $81 = (($80) - 1)|0; //@line 593 "../wslib/window.c"
     $82 = ($71|0)<=($81|0); //@line 593 "../wslib/window.c"
     if ($82) {
      $83 = $current_window; //@line 594 "../wslib/window.c"
      $84 = ((($83)) + 14|0); //@line 594 "../wslib/window.c"
      $85 = HEAP16[$84>>1]|0; //@line 594 "../wslib/window.c"
      $86 = $85 << 16 >> 16; //@line 594 "../wslib/window.c"
      $87 = $current_window; //@line 594 "../wslib/window.c"
      $88 = ((($87)) + 18|0); //@line 594 "../wslib/window.c"
      $89 = HEAP16[$88>>1]|0; //@line 594 "../wslib/window.c"
      $90 = $89&65535; //@line 594 "../wslib/window.c"
      $91 = (($86) + ($90))|0; //@line 594 "../wslib/window.c"
      $92 = (($91) - 1)|0; //@line 594 "../wslib/window.c"
      $93 = $2; //@line 594 "../wslib/window.c"
      $94 = ((($93)) + 14|0); //@line 594 "../wslib/window.c"
      $95 = HEAP16[$94>>1]|0; //@line 594 "../wslib/window.c"
      $96 = $95 << 16 >> 16; //@line 594 "../wslib/window.c"
      $97 = ($92|0)>=($96|0); //@line 594 "../wslib/window.c"
      if ($97) {
       $98 = $return_list; //@line 595 "../wslib/window.c"
       $99 = $current_window; //@line 595 "../wslib/window.c"
       (_List_add($98,$99)|0); //@line 595 "../wslib/window.c"
      }
     }
    }
   }
  }
  $100 = $i; //@line 583 "../wslib/window.c"
  $101 = (($100) + -1)|0; //@line 583 "../wslib/window.c"
  $i = $101; //@line 583 "../wslib/window.c"
 }
 $102 = $return_list; //@line 598 "../wslib/window.c"
 $0 = $102; //@line 598 "../wslib/window.c"
 $103 = $0; //@line 599 "../wslib/window.c"
 STACKTOP = sp;return ($103|0); //@line 599 "../wslib/window.c"
}
function _Window_raise($window,$do_draw) {
 $window = $window|0;
 $do_draw = $do_draw|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $last_active = 0, $parent = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $do_draw;
 $last_active = 0; //@line 606 "../wslib/window.c"
 $2 = $0; //@line 608 "../wslib/window.c"
 $3 = ((($2)) + 20|0); //@line 608 "../wslib/window.c"
 $4 = HEAP16[$3>>1]|0; //@line 608 "../wslib/window.c"
 $5 = $4&65535; //@line 608 "../wslib/window.c"
 $6 = $5 & 2; //@line 608 "../wslib/window.c"
 $7 = ($6|0)!=(0); //@line 608 "../wslib/window.c"
 if ($7) {
  STACKTOP = sp;return; //@line 641 "../wslib/window.c"
 }
 $8 = $0; //@line 611 "../wslib/window.c"
 $9 = ((($8)) + 4|0); //@line 611 "../wslib/window.c"
 $10 = HEAP32[$9>>2]|0; //@line 611 "../wslib/window.c"
 $11 = ($10|0)!=(0|0); //@line 611 "../wslib/window.c"
 if (!($11)) {
  STACKTOP = sp;return; //@line 641 "../wslib/window.c"
 }
 $12 = $0; //@line 614 "../wslib/window.c"
 $13 = ((($12)) + 4|0); //@line 614 "../wslib/window.c"
 $14 = HEAP32[$13>>2]|0; //@line 614 "../wslib/window.c"
 $parent = $14; //@line 614 "../wslib/window.c"
 $15 = $parent; //@line 616 "../wslib/window.c"
 $16 = ((($15)) + 32|0); //@line 616 "../wslib/window.c"
 $17 = HEAP32[$16>>2]|0; //@line 616 "../wslib/window.c"
 $18 = $0; //@line 616 "../wslib/window.c"
 $19 = ($17|0)==($18|0); //@line 616 "../wslib/window.c"
 if ($19) {
  STACKTOP = sp;return; //@line 641 "../wslib/window.c"
 }
 $20 = $parent; //@line 619 "../wslib/window.c"
 $21 = ((($20)) + 32|0); //@line 619 "../wslib/window.c"
 $22 = HEAP32[$21>>2]|0; //@line 619 "../wslib/window.c"
 $last_active = $22; //@line 619 "../wslib/window.c"
 $i = 0; //@line 622 "../wslib/window.c"
 while(1) {
  $23 = $i; //@line 622 "../wslib/window.c"
  $24 = $parent; //@line 622 "../wslib/window.c"
  $25 = ((($24)) + 40|0); //@line 622 "../wslib/window.c"
  $26 = HEAP32[$25>>2]|0; //@line 622 "../wslib/window.c"
  $27 = ((($26)) + 4|0); //@line 622 "../wslib/window.c"
  $28 = HEAP32[$27>>2]|0; //@line 622 "../wslib/window.c"
  $29 = ($23>>>0)<($28>>>0); //@line 622 "../wslib/window.c"
  if (!($29)) {
   break;
  }
  $30 = $parent; //@line 623 "../wslib/window.c"
  $31 = ((($30)) + 40|0); //@line 623 "../wslib/window.c"
  $32 = HEAP32[$31>>2]|0; //@line 623 "../wslib/window.c"
  $33 = $i; //@line 623 "../wslib/window.c"
  $34 = (_List_get_at($32,$33)|0); //@line 623 "../wslib/window.c"
  $35 = $0; //@line 623 "../wslib/window.c"
  $36 = ($34|0)==($35|0); //@line 623 "../wslib/window.c"
  if ($36) {
   break;
  }
  $37 = $i; //@line 622 "../wslib/window.c"
  $38 = (($37) + 1)|0; //@line 622 "../wslib/window.c"
  $i = $38; //@line 622 "../wslib/window.c"
 }
 $39 = $parent; //@line 626 "../wslib/window.c"
 $40 = ((($39)) + 40|0); //@line 626 "../wslib/window.c"
 $41 = HEAP32[$40>>2]|0; //@line 626 "../wslib/window.c"
 $42 = $i; //@line 626 "../wslib/window.c"
 (_List_remove_at($41,$42)|0); //@line 626 "../wslib/window.c"
 $43 = $parent; //@line 627 "../wslib/window.c"
 $44 = ((($43)) + 40|0); //@line 627 "../wslib/window.c"
 $45 = HEAP32[$44>>2]|0; //@line 627 "../wslib/window.c"
 $46 = $0; //@line 627 "../wslib/window.c"
 (_List_add($45,$46)|0); //@line 627 "../wslib/window.c"
 $47 = $0; //@line 630 "../wslib/window.c"
 $48 = $parent; //@line 630 "../wslib/window.c"
 $49 = ((($48)) + 32|0); //@line 630 "../wslib/window.c"
 HEAP32[$49>>2] = $47; //@line 630 "../wslib/window.c"
 $50 = $1; //@line 633 "../wslib/window.c"
 $51 = ($50<<24>>24)!=(0); //@line 633 "../wslib/window.c"
 if (!($51)) {
  STACKTOP = sp;return; //@line 641 "../wslib/window.c"
 }
 $52 = $0; //@line 636 "../wslib/window.c"
 _Window_paint($52,0,1); //@line 636 "../wslib/window.c"
 $53 = $last_active; //@line 639 "../wslib/window.c"
 $54 = ($53|0)!=(0|0); //@line 639 "../wslib/window.c"
 if (!($54)) {
  STACKTOP = sp;return; //@line 641 "../wslib/window.c"
 }
 $55 = $last_active; //@line 640 "../wslib/window.c"
 _Window_update_title($55); //@line 640 "../wslib/window.c"
 STACKTOP = sp;return; //@line 641 "../wslib/window.c"
}
function _Window_move($window,$new_x,$new_y) {
 $window = $window|0;
 $new_x = $new_x|0;
 $new_y = $new_y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $new_x;
 $2 = $new_y;
 $3 = $0; //@line 645 "../wslib/window.c"
 $4 = ((($3)) + 80|0); //@line 645 "../wslib/window.c"
 $5 = HEAP32[$4>>2]|0; //@line 645 "../wslib/window.c"
 $6 = ($5|0)!=(0|0); //@line 645 "../wslib/window.c"
 $7 = $0; //@line 646 "../wslib/window.c"
 if ($6) {
  $8 = ((($7)) + 80|0); //@line 646 "../wslib/window.c"
  $9 = HEAP32[$8>>2]|0; //@line 646 "../wslib/window.c"
  $10 = $0; //@line 646 "../wslib/window.c"
  $11 = $1; //@line 646 "../wslib/window.c"
  $12 = $2; //@line 646 "../wslib/window.c"
  FUNCTION_TABLE_viii[$9 & 63]($10,$11,$12); //@line 646 "../wslib/window.c"
  STACKTOP = sp;return; //@line 649 "../wslib/window.c"
 } else {
  $13 = $1; //@line 648 "../wslib/window.c"
  $14 = $2; //@line 648 "../wslib/window.c"
  _Window_move_function($7,$13,$14); //@line 648 "../wslib/window.c"
  STACKTOP = sp;return; //@line 649 "../wslib/window.c"
 }
}
function _Window_process_mouse($window,$mouse_x,$mouse_y,$mouse_buttons) {
 $window = $window|0;
 $mouse_x = $mouse_x|0;
 $mouse_y = $mouse_y|0;
 $mouse_buttons = $mouse_buttons|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0;
 var $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0;
 var $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0;
 var $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0;
 var $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0;
 var $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0;
 var $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $child = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $mouse_x;
 $2 = $mouse_y;
 $3 = $mouse_buttons;
 $4 = $0; //@line 730 "../wslib/window.c"
 $5 = ((($4)) + 28|0); //@line 730 "../wslib/window.c"
 $6 = HEAP32[$5>>2]|0; //@line 730 "../wslib/window.c"
 $7 = ($6|0)!=(0|0); //@line 730 "../wslib/window.c"
 do {
  if ($7) {
   $8 = $3; //@line 732 "../wslib/window.c"
   $9 = ($8<<24>>24)!=(0); //@line 732 "../wslib/window.c"
   $10 = $0; //@line 735 "../wslib/window.c"
   $11 = ((($10)) + 28|0); //@line 735 "../wslib/window.c"
   if (!($9)) {
    HEAP32[$11>>2] = 0; //@line 740 "../wslib/window.c"
    break;
   }
   $12 = HEAP32[$11>>2]|0; //@line 735 "../wslib/window.c"
   $13 = $1; //@line 735 "../wslib/window.c"
   $14 = $13&65535; //@line 735 "../wslib/window.c"
   $15 = $0; //@line 735 "../wslib/window.c"
   $16 = ((($15)) + 44|0); //@line 735 "../wslib/window.c"
   $17 = HEAP16[$16>>1]|0; //@line 735 "../wslib/window.c"
   $18 = $17&65535; //@line 735 "../wslib/window.c"
   $19 = (($14) - ($18))|0; //@line 735 "../wslib/window.c"
   $20 = $2; //@line 736 "../wslib/window.c"
   $21 = $20&65535; //@line 736 "../wslib/window.c"
   $22 = $0; //@line 736 "../wslib/window.c"
   $23 = ((($22)) + 46|0); //@line 736 "../wslib/window.c"
   $24 = HEAP16[$23>>1]|0; //@line 736 "../wslib/window.c"
   $25 = $24&65535; //@line 736 "../wslib/window.c"
   $26 = (($21) - ($25))|0; //@line 736 "../wslib/window.c"
   _Window_move($12,$19,$26); //@line 735 "../wslib/window.c"
   STACKTOP = sp;return; //@line 830 "../wslib/window.c"
  }
 } while(0);
 $27 = $0; //@line 747 "../wslib/window.c"
 $28 = ((($27)) + 40|0); //@line 747 "../wslib/window.c"
 $29 = HEAP32[$28>>2]|0; //@line 747 "../wslib/window.c"
 $30 = ((($29)) + 4|0); //@line 747 "../wslib/window.c"
 $31 = HEAP32[$30>>2]|0; //@line 747 "../wslib/window.c"
 $32 = (($31) - 1)|0; //@line 747 "../wslib/window.c"
 $i = $32; //@line 747 "../wslib/window.c"
 while(1) {
  $33 = $i; //@line 747 "../wslib/window.c"
  $34 = ($33|0)>=(0); //@line 747 "../wslib/window.c"
  if (!($34)) {
   break;
  }
  $35 = $0; //@line 749 "../wslib/window.c"
  $36 = ((($35)) + 40|0); //@line 749 "../wslib/window.c"
  $37 = HEAP32[$36>>2]|0; //@line 749 "../wslib/window.c"
  $38 = $i; //@line 749 "../wslib/window.c"
  $39 = (_List_get_at($37,$38)|0); //@line 749 "../wslib/window.c"
  $child = $39; //@line 749 "../wslib/window.c"
  $40 = $1; //@line 752 "../wslib/window.c"
  $41 = $40&65535; //@line 752 "../wslib/window.c"
  $42 = $child; //@line 752 "../wslib/window.c"
  $43 = ((($42)) + 12|0); //@line 752 "../wslib/window.c"
  $44 = HEAP16[$43>>1]|0; //@line 752 "../wslib/window.c"
  $45 = $44 << 16 >> 16; //@line 752 "../wslib/window.c"
  $46 = ($41|0)>=($45|0); //@line 752 "../wslib/window.c"
  if ($46) {
   $47 = $1; //@line 752 "../wslib/window.c"
   $48 = $47&65535; //@line 752 "../wslib/window.c"
   $49 = $child; //@line 752 "../wslib/window.c"
   $50 = ((($49)) + 12|0); //@line 752 "../wslib/window.c"
   $51 = HEAP16[$50>>1]|0; //@line 752 "../wslib/window.c"
   $52 = $51 << 16 >> 16; //@line 752 "../wslib/window.c"
   $53 = $child; //@line 752 "../wslib/window.c"
   $54 = ((($53)) + 16|0); //@line 752 "../wslib/window.c"
   $55 = HEAP16[$54>>1]|0; //@line 752 "../wslib/window.c"
   $56 = $55&65535; //@line 752 "../wslib/window.c"
   $57 = (($52) + ($56))|0; //@line 752 "../wslib/window.c"
   $58 = ($48|0)<($57|0); //@line 752 "../wslib/window.c"
   if ($58) {
    $59 = $2; //@line 753 "../wslib/window.c"
    $60 = $59&65535; //@line 753 "../wslib/window.c"
    $61 = $child; //@line 753 "../wslib/window.c"
    $62 = ((($61)) + 14|0); //@line 753 "../wslib/window.c"
    $63 = HEAP16[$62>>1]|0; //@line 753 "../wslib/window.c"
    $64 = $63 << 16 >> 16; //@line 753 "../wslib/window.c"
    $65 = ($60|0)>=($64|0); //@line 753 "../wslib/window.c"
    if ($65) {
     $66 = $2; //@line 753 "../wslib/window.c"
     $67 = $66&65535; //@line 753 "../wslib/window.c"
     $68 = $child; //@line 753 "../wslib/window.c"
     $69 = ((($68)) + 14|0); //@line 753 "../wslib/window.c"
     $70 = HEAP16[$69>>1]|0; //@line 753 "../wslib/window.c"
     $71 = $70 << 16 >> 16; //@line 753 "../wslib/window.c"
     $72 = $child; //@line 753 "../wslib/window.c"
     $73 = ((($72)) + 18|0); //@line 753 "../wslib/window.c"
     $74 = HEAP16[$73>>1]|0; //@line 753 "../wslib/window.c"
     $75 = $74&65535; //@line 753 "../wslib/window.c"
     $76 = (($71) + ($75))|0; //@line 753 "../wslib/window.c"
     $77 = ($67|0)<($76|0); //@line 753 "../wslib/window.c"
     if ($77) {
      $78 = $child; //@line 754 "../wslib/window.c"
      $79 = ((($78)) + 20|0); //@line 754 "../wslib/window.c"
      $80 = HEAP16[$79>>1]|0; //@line 754 "../wslib/window.c"
      $81 = $80&65535; //@line 754 "../wslib/window.c"
      $82 = $81 & 8; //@line 754 "../wslib/window.c"
      $83 = ($82|0)!=(0); //@line 754 "../wslib/window.c"
      if (!($83)) {
       label = 12;
       break;
      }
     }
    }
   }
  }
  $166 = $i; //@line 747 "../wslib/window.c"
  $167 = (($166) + -1)|0; //@line 747 "../wslib/window.c"
  $i = $167; //@line 747 "../wslib/window.c"
 }
 do {
  if ((label|0) == 12) {
   $84 = $child; //@line 758 "../wslib/window.c"
   $85 = $0; //@line 758 "../wslib/window.c"
   $86 = ((($85)) + 36|0); //@line 758 "../wslib/window.c"
   $87 = HEAP32[$86>>2]|0; //@line 758 "../wslib/window.c"
   $88 = ($84|0)!=($87|0); //@line 758 "../wslib/window.c"
   if ($88) {
    $89 = $0; //@line 760 "../wslib/window.c"
    $90 = ((($89)) + 36|0); //@line 760 "../wslib/window.c"
    $91 = HEAP32[$90>>2]|0; //@line 760 "../wslib/window.c"
    $92 = ($91|0)!=(0|0); //@line 760 "../wslib/window.c"
    $93 = $0; //@line 761 "../wslib/window.c"
    if ($92) {
     $94 = ((($93)) + 36|0); //@line 761 "../wslib/window.c"
     $95 = HEAP32[$94>>2]|0; //@line 761 "../wslib/window.c"
     _Window_mouseout($95); //@line 761 "../wslib/window.c"
    } else {
     _Window_mouseout($93); //@line 763 "../wslib/window.c"
    }
    $96 = $child; //@line 765 "../wslib/window.c"
    $97 = $0; //@line 765 "../wslib/window.c"
    $98 = ((($97)) + 36|0); //@line 765 "../wslib/window.c"
    HEAP32[$98>>2] = $96; //@line 765 "../wslib/window.c"
    $99 = $0; //@line 766 "../wslib/window.c"
    $100 = ((($99)) + 36|0); //@line 766 "../wslib/window.c"
    $101 = HEAP32[$100>>2]|0; //@line 766 "../wslib/window.c"
    _Window_mouseover($101); //@line 766 "../wslib/window.c"
   }
   $102 = $3; //@line 770 "../wslib/window.c"
   $103 = $102&255; //@line 770 "../wslib/window.c"
   $104 = ($103|0)!=(0); //@line 770 "../wslib/window.c"
   if ($104) {
    $105 = $0; //@line 770 "../wslib/window.c"
    $106 = ((($105)) + 48|0); //@line 770 "../wslib/window.c"
    $107 = HEAP8[$106>>0]|0; //@line 770 "../wslib/window.c"
    $108 = ($107<<24>>24)!=(0); //@line 770 "../wslib/window.c"
    if (!($108)) {
     $109 = $child; //@line 774 "../wslib/window.c"
     _Window_raise($109,1); //@line 774 "../wslib/window.c"
     $110 = $child; //@line 779 "../wslib/window.c"
     $111 = ((($110)) + 20|0); //@line 779 "../wslib/window.c"
     $112 = HEAP16[$111>>1]|0; //@line 779 "../wslib/window.c"
     $113 = $112&65535; //@line 779 "../wslib/window.c"
     $114 = $113 & 4; //@line 779 "../wslib/window.c"
     $115 = ($114|0)!=(0); //@line 779 "../wslib/window.c"
     if (!($115)) {
      $116 = $child; //@line 780 "../wslib/window.c"
      $117 = ((($116)) + 20|0); //@line 780 "../wslib/window.c"
      $118 = HEAP16[$117>>1]|0; //@line 780 "../wslib/window.c"
      $119 = $118&65535; //@line 780 "../wslib/window.c"
      $120 = $119 & 4; //@line 780 "../wslib/window.c"
      $121 = ($120|0)!=(0); //@line 780 "../wslib/window.c"
      if ($121) {
       break;
      }
      $122 = $child; //@line 780 "../wslib/window.c"
      $123 = ((($122)) + 20|0); //@line 780 "../wslib/window.c"
      $124 = HEAP16[$123>>1]|0; //@line 780 "../wslib/window.c"
      $125 = $124&65535; //@line 780 "../wslib/window.c"
      $126 = $125 & 1; //@line 780 "../wslib/window.c"
      $127 = ($126|0)!=(0); //@line 780 "../wslib/window.c"
      if ($127) {
       break;
      }
      $128 = $2; //@line 781 "../wslib/window.c"
      $129 = $128&65535; //@line 781 "../wslib/window.c"
      $130 = $child; //@line 781 "../wslib/window.c"
      $131 = ((($130)) + 14|0); //@line 781 "../wslib/window.c"
      $132 = HEAP16[$131>>1]|0; //@line 781 "../wslib/window.c"
      $133 = $132 << 16 >> 16; //@line 781 "../wslib/window.c"
      $134 = ($129|0)>=($133|0); //@line 781 "../wslib/window.c"
      if (!($134)) {
       break;
      }
      $135 = $2; //@line 781 "../wslib/window.c"
      $136 = $135&65535; //@line 781 "../wslib/window.c"
      $137 = $child; //@line 781 "../wslib/window.c"
      $138 = ((($137)) + 14|0); //@line 781 "../wslib/window.c"
      $139 = HEAP16[$138>>1]|0; //@line 781 "../wslib/window.c"
      $140 = $139 << 16 >> 16; //@line 781 "../wslib/window.c"
      $141 = (($140) + 28)|0; //@line 781 "../wslib/window.c"
      $142 = ($136|0)<($141|0); //@line 781 "../wslib/window.c"
      if (!($142)) {
       break;
      }
     }
     $143 = $1; //@line 786 "../wslib/window.c"
     $144 = $143&65535; //@line 786 "../wslib/window.c"
     $145 = $child; //@line 786 "../wslib/window.c"
     $146 = ((($145)) + 12|0); //@line 786 "../wslib/window.c"
     $147 = HEAP16[$146>>1]|0; //@line 786 "../wslib/window.c"
     $148 = $147 << 16 >> 16; //@line 786 "../wslib/window.c"
     $149 = (($144) - ($148))|0; //@line 786 "../wslib/window.c"
     $150 = $149&65535; //@line 786 "../wslib/window.c"
     $151 = $0; //@line 786 "../wslib/window.c"
     $152 = ((($151)) + 44|0); //@line 786 "../wslib/window.c"
     HEAP16[$152>>1] = $150; //@line 786 "../wslib/window.c"
     $153 = $2; //@line 787 "../wslib/window.c"
     $154 = $153&65535; //@line 787 "../wslib/window.c"
     $155 = $child; //@line 787 "../wslib/window.c"
     $156 = ((($155)) + 14|0); //@line 787 "../wslib/window.c"
     $157 = HEAP16[$156>>1]|0; //@line 787 "../wslib/window.c"
     $158 = $157 << 16 >> 16; //@line 787 "../wslib/window.c"
     $159 = (($154) - ($158))|0; //@line 787 "../wslib/window.c"
     $160 = $159&65535; //@line 787 "../wslib/window.c"
     $161 = $0; //@line 787 "../wslib/window.c"
     $162 = ((($161)) + 46|0); //@line 787 "../wslib/window.c"
     HEAP16[$162>>1] = $160; //@line 787 "../wslib/window.c"
     $163 = $child; //@line 788 "../wslib/window.c"
     $164 = $0; //@line 788 "../wslib/window.c"
     $165 = ((($164)) + 28|0); //@line 788 "../wslib/window.c"
     HEAP32[$165>>2] = $163; //@line 788 "../wslib/window.c"
    }
   }
  }
 } while(0);
 $168 = $i; //@line 796 "../wslib/window.c"
 $169 = ($168|0)<(0); //@line 796 "../wslib/window.c"
 if ($169) {
  $170 = $0; //@line 799 "../wslib/window.c"
  $171 = ((($170)) + 36|0); //@line 799 "../wslib/window.c"
  $172 = HEAP32[$171>>2]|0; //@line 799 "../wslib/window.c"
  $173 = ($172|0)!=(0|0); //@line 799 "../wslib/window.c"
  if ($173) {
   $174 = $0; //@line 801 "../wslib/window.c"
   $175 = ((($174)) + 36|0); //@line 801 "../wslib/window.c"
   $176 = HEAP32[$175>>2]|0; //@line 801 "../wslib/window.c"
   _Window_mouseout($176); //@line 801 "../wslib/window.c"
   $177 = $0; //@line 802 "../wslib/window.c"
   $178 = ((($177)) + 36|0); //@line 802 "../wslib/window.c"
   HEAP32[$178>>2] = 0; //@line 802 "../wslib/window.c"
   $179 = $0; //@line 805 "../wslib/window.c"
   _Window_mouseover($179); //@line 805 "../wslib/window.c"
  }
  $180 = $3; //@line 809 "../wslib/window.c"
  $181 = $180&255; //@line 809 "../wslib/window.c"
  $182 = ($181|0)!=(0); //@line 809 "../wslib/window.c"
  if ($182) {
   $183 = $0; //@line 809 "../wslib/window.c"
   $184 = ((($183)) + 48|0); //@line 809 "../wslib/window.c"
   $185 = HEAP8[$184>>0]|0; //@line 809 "../wslib/window.c"
   $186 = ($185<<24>>24)!=(0); //@line 809 "../wslib/window.c"
   if (!($186)) {
    $187 = $0; //@line 810 "../wslib/window.c"
    $188 = $1; //@line 810 "../wslib/window.c"
    $189 = $188&65535; //@line 810 "../wslib/window.c"
    $190 = $2; //@line 810 "../wslib/window.c"
    $191 = $190&65535; //@line 810 "../wslib/window.c"
    _Window_mousedown($187,$189,$191); //@line 810 "../wslib/window.c"
   }
  }
  $192 = $3; //@line 812 "../wslib/window.c"
  $193 = ($192<<24>>24)!=(0); //@line 812 "../wslib/window.c"
  if (!($193)) {
   $194 = $0; //@line 812 "../wslib/window.c"
   $195 = ((($194)) + 48|0); //@line 812 "../wslib/window.c"
   $196 = HEAP8[$195>>0]|0; //@line 812 "../wslib/window.c"
   $197 = $196&255; //@line 812 "../wslib/window.c"
   $198 = ($197|0)!=(0); //@line 812 "../wslib/window.c"
   if ($198) {
    $199 = $0; //@line 813 "../wslib/window.c"
    $200 = $1; //@line 813 "../wslib/window.c"
    $201 = $200&65535; //@line 813 "../wslib/window.c"
    $202 = $2; //@line 813 "../wslib/window.c"
    $203 = $202&65535; //@line 813 "../wslib/window.c"
    _Window_mouseup($199,$201,$203); //@line 813 "../wslib/window.c"
   }
  }
  $204 = $0; //@line 815 "../wslib/window.c"
  $205 = $1; //@line 815 "../wslib/window.c"
  $206 = $205&65535; //@line 815 "../wslib/window.c"
  $207 = $2; //@line 815 "../wslib/window.c"
  $208 = $207&65535; //@line 815 "../wslib/window.c"
  _Window_mousemove($204,$206,$208); //@line 815 "../wslib/window.c"
 } else {
  $209 = $child; //@line 819 "../wslib/window.c"
  $210 = $1; //@line 819 "../wslib/window.c"
  $211 = $210&65535; //@line 819 "../wslib/window.c"
  $212 = $child; //@line 819 "../wslib/window.c"
  $213 = ((($212)) + 12|0); //@line 819 "../wslib/window.c"
  $214 = HEAP16[$213>>1]|0; //@line 819 "../wslib/window.c"
  $215 = $214 << 16 >> 16; //@line 819 "../wslib/window.c"
  $216 = (($211) - ($215))|0; //@line 819 "../wslib/window.c"
  $217 = $216&65535; //@line 819 "../wslib/window.c"
  $218 = $2; //@line 819 "../wslib/window.c"
  $219 = $218&65535; //@line 819 "../wslib/window.c"
  $220 = $child; //@line 819 "../wslib/window.c"
  $221 = ((($220)) + 14|0); //@line 819 "../wslib/window.c"
  $222 = HEAP16[$221>>1]|0; //@line 819 "../wslib/window.c"
  $223 = $222 << 16 >> 16; //@line 819 "../wslib/window.c"
  $224 = (($219) - ($223))|0; //@line 819 "../wslib/window.c"
  $225 = $224&65535; //@line 819 "../wslib/window.c"
  $226 = $3; //@line 819 "../wslib/window.c"
  _Window_process_mouse($209,$217,$225,$226); //@line 819 "../wslib/window.c"
  $227 = $child; //@line 822 "../wslib/window.c"
  $228 = ((($227)) + 20|0); //@line 822 "../wslib/window.c"
  $229 = HEAP16[$228>>1]|0; //@line 822 "../wslib/window.c"
  $230 = $229&65535; //@line 822 "../wslib/window.c"
  $231 = $230 & 4; //@line 822 "../wslib/window.c"
  $232 = ($231|0)!=(0); //@line 822 "../wslib/window.c"
  if ($232) {
   $233 = $0; //@line 822 "../wslib/window.c"
   $234 = ((($233)) + 28|0); //@line 822 "../wslib/window.c"
   $235 = HEAP32[$234>>2]|0; //@line 822 "../wslib/window.c"
   $236 = $child; //@line 822 "../wslib/window.c"
   $237 = ($235|0)==($236|0); //@line 822 "../wslib/window.c"
   if ($237) {
    $238 = $child; //@line 822 "../wslib/window.c"
    $239 = ((($238)) + 36|0); //@line 822 "../wslib/window.c"
    $240 = HEAP32[$239>>2]|0; //@line 822 "../wslib/window.c"
    $241 = ($240|0)!=(0|0); //@line 822 "../wslib/window.c"
    if ($241) {
     $242 = $0; //@line 823 "../wslib/window.c"
     $243 = ((($242)) + 28|0); //@line 823 "../wslib/window.c"
     HEAP32[$243>>2] = 0; //@line 823 "../wslib/window.c"
    }
   }
  }
 }
 $244 = $3; //@line 827 "../wslib/window.c"
 $245 = $0; //@line 827 "../wslib/window.c"
 $246 = ((($245)) + 48|0); //@line 827 "../wslib/window.c"
 HEAP8[$246>>0] = $244; //@line 827 "../wslib/window.c"
 $247 = $0; //@line 828 "../wslib/window.c"
 $248 = ((($247)) + 49|0); //@line 828 "../wslib/window.c"
 $249 = HEAP8[$248>>0]|0; //@line 828 "../wslib/window.c"
 $250 = $249&255; //@line 828 "../wslib/window.c"
 $251 = ($250|0)==(1); //@line 828 "../wslib/window.c"
 if (!($251)) {
  STACKTOP = sp;return; //@line 830 "../wslib/window.c"
 }
 $252 = $0; //@line 829 "../wslib/window.c"
 $253 = ((($252)) + 49|0); //@line 829 "../wslib/window.c"
 HEAP8[$253>>0] = 2; //@line 829 "../wslib/window.c"
 STACKTOP = sp;return; //@line 830 "../wslib/window.c"
}
function _Window_update_context($window,$context) {
 $window = $window|0;
 $context = $context|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $old_context = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $context;
 $2 = $0; //@line 835 "../wslib/window.c"
 $3 = ((($2)) + 24|0); //@line 835 "../wslib/window.c"
 $4 = HEAP32[$3>>2]|0; //@line 835 "../wslib/window.c"
 $old_context = $4; //@line 835 "../wslib/window.c"
 $5 = $1; //@line 837 "../wslib/window.c"
 $6 = ($5|0)!=(0|0); //@line 837 "../wslib/window.c"
 $7 = $1; //@line 837 "../wslib/window.c"
 if ($6) {
  $8 = (_Context_new_from($7)|0); //@line 837 "../wslib/window.c"
  $11 = $8;
 } else {
  $11 = $7;
 }
 $9 = $0; //@line 837 "../wslib/window.c"
 $10 = ((($9)) + 24|0); //@line 837 "../wslib/window.c"
 HEAP32[$10>>2] = $11; //@line 837 "../wslib/window.c"
 $i = 0; //@line 839 "../wslib/window.c"
 while(1) {
  $12 = $i; //@line 839 "../wslib/window.c"
  $13 = $0; //@line 839 "../wslib/window.c"
  $14 = ((($13)) + 40|0); //@line 839 "../wslib/window.c"
  $15 = HEAP32[$14>>2]|0; //@line 839 "../wslib/window.c"
  $16 = ((($15)) + 4|0); //@line 839 "../wslib/window.c"
  $17 = HEAP32[$16>>2]|0; //@line 839 "../wslib/window.c"
  $18 = ($12>>>0)<($17>>>0); //@line 839 "../wslib/window.c"
  if (!($18)) {
   break;
  }
  $19 = $0; //@line 840 "../wslib/window.c"
  $20 = ((($19)) + 40|0); //@line 840 "../wslib/window.c"
  $21 = HEAP32[$20>>2]|0; //@line 840 "../wslib/window.c"
  $22 = $i; //@line 840 "../wslib/window.c"
  $23 = (_List_get_at($21,$22)|0); //@line 840 "../wslib/window.c"
  $24 = $1; //@line 840 "../wslib/window.c"
  _Window_update_context($23,$24); //@line 840 "../wslib/window.c"
  $25 = $i; //@line 839 "../wslib/window.c"
  $26 = (($25) + 1)|0; //@line 839 "../wslib/window.c"
  $i = $26; //@line 839 "../wslib/window.c"
 }
 $27 = $old_context; //@line 842 "../wslib/window.c"
 $28 = ($27|0)!=(0|0); //@line 842 "../wslib/window.c"
 if (!($28)) {
  STACKTOP = sp;return; //@line 844 "../wslib/window.c"
 }
 $29 = $old_context; //@line 843 "../wslib/window.c"
 _Object_delete($29); //@line 843 "../wslib/window.c"
 STACKTOP = sp;return; //@line 844 "../wslib/window.c"
}
function _Window_insert_child($window,$child) {
 $window = $window|0;
 $child = $child|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $child;
 $2 = $0; //@line 849 "../wslib/window.c"
 $3 = $1; //@line 849 "../wslib/window.c"
 $4 = ((($3)) + 4|0); //@line 849 "../wslib/window.c"
 HEAP32[$4>>2] = $2; //@line 849 "../wslib/window.c"
 $5 = $0; //@line 850 "../wslib/window.c"
 $6 = ((($5)) + 40|0); //@line 850 "../wslib/window.c"
 $7 = HEAP32[$6>>2]|0; //@line 850 "../wslib/window.c"
 $8 = $1; //@line 850 "../wslib/window.c"
 (_List_add($7,$8)|0); //@line 850 "../wslib/window.c"
 $9 = $1; //@line 851 "../wslib/window.c"
 $10 = $0; //@line 851 "../wslib/window.c"
 $11 = ((($10)) + 24|0); //@line 851 "../wslib/window.c"
 $12 = HEAP32[$11>>2]|0; //@line 851 "../wslib/window.c"
 _Window_update_context($9,$12); //@line 851 "../wslib/window.c"
 $13 = $1; //@line 852 "../wslib/window.c"
 _Window_raise($13,1); //@line 852 "../wslib/window.c"
 STACKTOP = sp;return; //@line 853 "../wslib/window.c"
}
function _Window_hide($window) {
 $window = $window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $dirty_list = 0, $dirty_rect = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $0; //@line 963 "../wslib/window.c"
 $2 = ((($1)) + 4|0); //@line 963 "../wslib/window.c"
 $3 = HEAP32[$2>>2]|0; //@line 963 "../wslib/window.c"
 $4 = ($3|0)!=(0|0); //@line 963 "../wslib/window.c"
 if (!($4)) {
  STACKTOP = sp;return; //@line 987 "../wslib/window.c"
 }
 $5 = $0; //@line 963 "../wslib/window.c"
 $6 = ((($5)) + 20|0); //@line 963 "../wslib/window.c"
 $7 = HEAP16[$6>>1]|0; //@line 963 "../wslib/window.c"
 $8 = $7&65535; //@line 963 "../wslib/window.c"
 $9 = $8 & 8; //@line 963 "../wslib/window.c"
 $10 = ($9|0)!=(0); //@line 963 "../wslib/window.c"
 if ($10) {
  STACKTOP = sp;return; //@line 987 "../wslib/window.c"
 }
 $11 = $0; //@line 966 "../wslib/window.c"
 $12 = ((($11)) + 20|0); //@line 966 "../wslib/window.c"
 $13 = HEAP16[$12>>1]|0; //@line 966 "../wslib/window.c"
 $14 = $13&65535; //@line 966 "../wslib/window.c"
 $15 = $14 | 8; //@line 966 "../wslib/window.c"
 $16 = $15&65535; //@line 966 "../wslib/window.c"
 HEAP16[$12>>1] = $16; //@line 966 "../wslib/window.c"
 $17 = (_List_new()|0); //@line 969 "../wslib/window.c"
 $dirty_list = $17; //@line 969 "../wslib/window.c"
 $18 = ($17|0)!=(0|0); //@line 969 "../wslib/window.c"
 if (!($18)) {
  STACKTOP = sp;return; //@line 987 "../wslib/window.c"
 }
 $19 = $0; //@line 972 "../wslib/window.c"
 $20 = (_Window_screen_y($19)|0); //@line 972 "../wslib/window.c"
 $21 = $0; //@line 972 "../wslib/window.c"
 $22 = (_Window_screen_x($21)|0); //@line 972 "../wslib/window.c"
 $23 = $0; //@line 973 "../wslib/window.c"
 $24 = (_Window_screen_y($23)|0); //@line 973 "../wslib/window.c"
 $25 = $0; //@line 973 "../wslib/window.c"
 $26 = ((($25)) + 18|0); //@line 973 "../wslib/window.c"
 $27 = HEAP16[$26>>1]|0; //@line 973 "../wslib/window.c"
 $28 = $27&65535; //@line 973 "../wslib/window.c"
 $29 = (($24) + ($28))|0; //@line 973 "../wslib/window.c"
 $30 = (($29) - 1)|0; //@line 973 "../wslib/window.c"
 $31 = $0; //@line 974 "../wslib/window.c"
 $32 = (_Window_screen_x($31)|0); //@line 974 "../wslib/window.c"
 $33 = $0; //@line 974 "../wslib/window.c"
 $34 = ((($33)) + 16|0); //@line 974 "../wslib/window.c"
 $35 = HEAP16[$34>>1]|0; //@line 974 "../wslib/window.c"
 $36 = $35&65535; //@line 974 "../wslib/window.c"
 $37 = (($32) + ($36))|0; //@line 974 "../wslib/window.c"
 $38 = (($37) - 1)|0; //@line 974 "../wslib/window.c"
 $39 = (_Rect_new($20,$22,$30,$38)|0); //@line 972 "../wslib/window.c"
 $dirty_rect = $39; //@line 972 "../wslib/window.c"
 $40 = ($39|0)!=(0|0); //@line 972 "../wslib/window.c"
 $41 = $dirty_list; //@line 980 "../wslib/window.c"
 if ($40) {
  $42 = $dirty_rect; //@line 980 "../wslib/window.c"
  (_List_add($41,$42)|0); //@line 980 "../wslib/window.c"
  $43 = $0; //@line 984 "../wslib/window.c"
  $44 = ((($43)) + 4|0); //@line 984 "../wslib/window.c"
  $45 = HEAP32[$44>>2]|0; //@line 984 "../wslib/window.c"
  $46 = $dirty_list; //@line 984 "../wslib/window.c"
  _Window_paint($45,$46,1); //@line 984 "../wslib/window.c"
  $47 = $dirty_list; //@line 986 "../wslib/window.c"
  _Object_delete($47); //@line 986 "../wslib/window.c"
  STACKTOP = sp;return; //@line 987 "../wslib/window.c"
 } else {
  _Object_delete($41); //@line 976 "../wslib/window.c"
  STACKTOP = sp;return; //@line 987 "../wslib/window.c"
 }
}
function _Window_resize($window,$w,$h) {
 $window = $window|0;
 $w = $w|0;
 $h = $h|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $window;
 $1 = $w;
 $2 = $h;
 $3 = $1; //@line 1049 "../wslib/window.c"
 $4 = $3&65535; //@line 1049 "../wslib/window.c"
 $5 = $0; //@line 1049 "../wslib/window.c"
 $6 = ((($5)) + 16|0); //@line 1049 "../wslib/window.c"
 HEAP16[$6>>1] = $4; //@line 1049 "../wslib/window.c"
 $7 = $2; //@line 1050 "../wslib/window.c"
 $8 = $7&65535; //@line 1050 "../wslib/window.c"
 $9 = $0; //@line 1050 "../wslib/window.c"
 $10 = ((($9)) + 18|0); //@line 1050 "../wslib/window.c"
 HEAP16[$10>>1] = $8; //@line 1050 "../wslib/window.c"
 $11 = $0; //@line 1052 "../wslib/window.c"
 _Window_paint($11,0,1); //@line 1052 "../wslib/window.c"
 STACKTOP = sp;return; //@line 1053 "../wslib/window.c"
}
function _Module_new($constructor,$name) {
 $constructor = $constructor|0;
 $name = $name|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $module = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $constructor;
 $2 = $name;
 $3 = (_malloc(12)|0); //@line 7 "../core/module.c"
 $module = $3; //@line 7 "../core/module.c"
 $4 = ($3|0)!=(0|0); //@line 7 "../core/module.c"
 $5 = $module; //@line 10 "../core/module.c"
 if (!($4)) {
  $0 = $5; //@line 8 "../core/module.c"
  $15 = $0; //@line 20 "../core/module.c"
  STACKTOP = sp;return ($15|0); //@line 20 "../core/module.c"
 }
 _Object_init($5,10); //@line 10 "../core/module.c"
 $6 = $1; //@line 11 "../core/module.c"
 $7 = $module; //@line 11 "../core/module.c"
 $8 = ((($7)) + 4|0); //@line 11 "../core/module.c"
 HEAP32[$8>>2] = $6; //@line 11 "../core/module.c"
 $9 = $2; //@line 13 "../core/module.c"
 $10 = (_String_new($9)|0); //@line 13 "../core/module.c"
 $11 = $module; //@line 13 "../core/module.c"
 $12 = ((($11)) + 8|0); //@line 13 "../core/module.c"
 HEAP32[$12>>2] = $10; //@line 13 "../core/module.c"
 $13 = ($10|0)!=(0|0); //@line 13 "../core/module.c"
 $14 = $module; //@line 19 "../core/module.c"
 if ($13) {
  $0 = $14; //@line 19 "../core/module.c"
  $15 = $0; //@line 20 "../core/module.c"
  STACKTOP = sp;return ($15|0); //@line 20 "../core/module.c"
 } else {
  _Object_delete($14); //@line 15 "../core/module.c"
  $0 = 0; //@line 16 "../core/module.c"
  $15 = $0; //@line 20 "../core/module.c"
  STACKTOP = sp;return ($15|0); //@line 20 "../core/module.c"
 }
 return (0)|0;
}
function _Module_delete_function($module_object) {
 $module_object = $module_object|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $module = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $module_object;
 $1 = $0; //@line 24 "../core/module.c"
 $2 = ($1|0)!=(0|0); //@line 24 "../core/module.c"
 if (!($2)) {
  STACKTOP = sp;return; //@line 31 "../core/module.c"
 }
 $3 = $0; //@line 27 "../core/module.c"
 $module = $3; //@line 27 "../core/module.c"
 $4 = $module; //@line 29 "../core/module.c"
 $5 = ((($4)) + 8|0); //@line 29 "../core/module.c"
 $6 = HEAP32[$5>>2]|0; //@line 29 "../core/module.c"
 _Object_delete($6); //@line 29 "../core/module.c"
 $7 = $0; //@line 30 "../core/module.c"
 _Object_default_delete_function($7); //@line 30 "../core/module.c"
 STACKTOP = sp;return; //@line 31 "../core/module.c"
}
function _PatchCore_new() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $patch = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = (_malloc(20)|0); //@line 13 "../core/patchcore.c"
 $patch = $1; //@line 13 "../core/patchcore.c"
 $2 = ($1|0)!=(0|0); //@line 13 "../core/patchcore.c"
 $3 = $patch; //@line 16 "../core/patchcore.c"
 if (!($2)) {
  $0 = $3; //@line 14 "../core/patchcore.c"
  $29 = $0; //@line 29 "../core/patchcore.c"
  STACKTOP = sp;return ($29|0); //@line 29 "../core/patchcore.c"
 }
 _Object_init($3,11); //@line 16 "../core/patchcore.c"
 $4 = (_AssociativeArray_new()|0); //@line 17 "../core/patchcore.c"
 $5 = $patch; //@line 17 "../core/patchcore.c"
 $6 = ((($5)) + 8|0); //@line 17 "../core/patchcore.c"
 HEAP32[$6>>2] = $4; //@line 17 "../core/patchcore.c"
 $7 = (_List_new()|0); //@line 18 "../core/patchcore.c"
 $8 = $patch; //@line 18 "../core/patchcore.c"
 $9 = ((($8)) + 12|0); //@line 18 "../core/patchcore.c"
 HEAP32[$9>>2] = $7; //@line 18 "../core/patchcore.c"
 $10 = $patch; //@line 19 "../core/patchcore.c"
 $11 = ((($10)) + 4|0); //@line 19 "../core/patchcore.c"
 HEAP32[$11>>2] = 0; //@line 19 "../core/patchcore.c"
 $12 = (_List_new()|0); //@line 20 "../core/patchcore.c"
 $13 = $patch; //@line 20 "../core/patchcore.c"
 $14 = ((($13)) + 16|0); //@line 20 "../core/patchcore.c"
 HEAP32[$14>>2] = $12; //@line 20 "../core/patchcore.c"
 $15 = $patch; //@line 22 "../core/patchcore.c"
 $16 = ((($15)) + 8|0); //@line 22 "../core/patchcore.c"
 $17 = HEAP32[$16>>2]|0; //@line 22 "../core/patchcore.c"
 $18 = ($17|0)!=(0|0); //@line 22 "../core/patchcore.c"
 if ($18) {
  $19 = $patch; //@line 22 "../core/patchcore.c"
  $20 = ((($19)) + 12|0); //@line 22 "../core/patchcore.c"
  $21 = HEAP32[$20>>2]|0; //@line 22 "../core/patchcore.c"
  $22 = ($21|0)!=(0|0); //@line 22 "../core/patchcore.c"
  if ($22) {
   $23 = $patch; //@line 22 "../core/patchcore.c"
   $24 = ((($23)) + 16|0); //@line 22 "../core/patchcore.c"
   $25 = HEAP32[$24>>2]|0; //@line 22 "../core/patchcore.c"
   $26 = ($25|0)!=(0|0); //@line 22 "../core/patchcore.c"
   if ($26) {
    $28 = $patch; //@line 28 "../core/patchcore.c"
    $0 = $28; //@line 28 "../core/patchcore.c"
    $29 = $0; //@line 29 "../core/patchcore.c"
    STACKTOP = sp;return ($29|0); //@line 29 "../core/patchcore.c"
   }
  }
 }
 $27 = $patch; //@line 24 "../core/patchcore.c"
 _Object_delete($27); //@line 24 "../core/patchcore.c"
 $0 = 0; //@line 25 "../core/patchcore.c"
 $29 = $0; //@line 29 "../core/patchcore.c"
 STACKTOP = sp;return ($29|0); //@line 29 "../core/patchcore.c"
}
function _PatchCore_delete_function($patch_object) {
 $patch_object = $patch_object|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $patch = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_object;
 $1 = $0; //@line 157 "../core/patchcore.c"
 $patch = $1; //@line 157 "../core/patchcore.c"
 $2 = $patch; //@line 159 "../core/patchcore.c"
 $3 = ((($2)) + 8|0); //@line 159 "../core/patchcore.c"
 $4 = HEAP32[$3>>2]|0; //@line 159 "../core/patchcore.c"
 _Object_delete($4); //@line 159 "../core/patchcore.c"
 $5 = $patch; //@line 160 "../core/patchcore.c"
 $6 = ((($5)) + 12|0); //@line 160 "../core/patchcore.c"
 $7 = HEAP32[$6>>2]|0; //@line 160 "../core/patchcore.c"
 _Object_delete($7); //@line 160 "../core/patchcore.c"
 $8 = $patch; //@line 161 "../core/patchcore.c"
 $9 = ((($8)) + 4|0); //@line 161 "../core/patchcore.c"
 $10 = HEAP32[$9>>2]|0; //@line 161 "../core/patchcore.c"
 _Object_delete($10); //@line 161 "../core/patchcore.c"
 $11 = $patch; //@line 162 "../core/patchcore.c"
 $12 = ((($11)) + 16|0); //@line 162 "../core/patchcore.c"
 $13 = HEAP32[$12>>2]|0; //@line 162 "../core/patchcore.c"
 _Object_delete($13); //@line 162 "../core/patchcore.c"
 $14 = $0; //@line 163 "../core/patchcore.c"
 _Object_default_delete_function($14); //@line 163 "../core/patchcore.c"
 STACKTOP = sp;return; //@line 164 "../core/patchcore.c"
}
function _PatchCore_install_module($patch,$module) {
 $patch = $patch|0;
 $module = $module|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch;
 $1 = $module;
 $2 = $0; //@line 33 "../core/patchcore.c"
 $3 = ((($2)) + 8|0); //@line 33 "../core/patchcore.c"
 $4 = HEAP32[$3>>2]|0; //@line 33 "../core/patchcore.c"
 $5 = $1; //@line 33 "../core/patchcore.c"
 $6 = ((($5)) + 8|0); //@line 33 "../core/patchcore.c"
 $7 = HEAP32[$6>>2]|0; //@line 33 "../core/patchcore.c"
 $8 = $1; //@line 33 "../core/patchcore.c"
 $9 = (_AssociativeArray_add($4,$7,$8)|0); //@line 33 "../core/patchcore.c"
 STACKTOP = sp;return ($9|0); //@line 33 "../core/patchcore.c"
}
function _PatchCore_next_spawn_x($patch) {
 $patch = $patch|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch;
 STACKTOP = sp;return 0; //@line 38 "../core/patchcore.c"
}
function _PatchCore_next_spawn_y($patch) {
 $patch = $patch|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch;
 STACKTOP = sp;return 0; //@line 43 "../core/patchcore.c"
}
function _Patch_mouse_callback($desktop_object,$mouse_x,$mouse_y,$mouse_buttons) {
 $desktop_object = $desktop_object|0;
 $mouse_x = $mouse_x|0;
 $mouse_y = $mouse_y|0;
 $mouse_buttons = $mouse_buttons|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $desktop_object;
 $1 = $mouse_x;
 $2 = $mouse_y;
 $3 = $mouse_buttons;
 $4 = $0; //@line 49 "../core/patchcore.c"
 $5 = $1; //@line 49 "../core/patchcore.c"
 $6 = $2; //@line 49 "../core/patchcore.c"
 $7 = $3; //@line 49 "../core/patchcore.c"
 _Desktop_process_mouse($4,$5,$6,$7); //@line 49 "../core/patchcore.c"
 STACKTOP = sp;return; //@line 50 "../core/patchcore.c"
}
function _Patch_resize_callback($desktop_object,$w,$h) {
 $desktop_object = $desktop_object|0;
 $w = $w|0;
 $h = $h|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $desktop_object;
 $1 = $w;
 $2 = $h;
 $3 = $0; //@line 55 "../core/patchcore.c"
 $4 = $0; //@line 55 "../core/patchcore.c"
 $5 = ((($4)) + 100|0); //@line 55 "../core/patchcore.c"
 $6 = HEAP32[$5>>2]|0; //@line 55 "../core/patchcore.c"
 _Window_update_context($3,$6); //@line 55 "../core/patchcore.c"
 $7 = $0; //@line 56 "../core/patchcore.c"
 $8 = $1; //@line 56 "../core/patchcore.c"
 $9 = $2; //@line 56 "../core/patchcore.c"
 _Window_resize($7,$8,$9); //@line 56 "../core/patchcore.c"
 STACKTOP = sp;return; //@line 57 "../core/patchcore.c"
}
function _PatchCore_start($patch) {
 $patch = $patch|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch;
 $1 = $0; //@line 62 "../core/patchcore.c"
 $2 = (_MasterOut_new()|0); //@line 62 "../core/patchcore.c"
 (_PatchCore_install_module($1,$2)|0); //@line 62 "../core/patchcore.c"
 $3 = $0; //@line 63 "../core/patchcore.c"
 $4 = (_Noise_new()|0); //@line 63 "../core/patchcore.c"
 (_PatchCore_install_module($3,$4)|0); //@line 63 "../core/patchcore.c"
 $5 = $0; //@line 64 "../core/patchcore.c"
 $6 = (_Sine_new()|0); //@line 64 "../core/patchcore.c"
 (_PatchCore_install_module($5,$6)|0); //@line 64 "../core/patchcore.c"
 $7 = $0; //@line 65 "../core/patchcore.c"
 $8 = (_PitchKnob_new()|0); //@line 65 "../core/patchcore.c"
 (_PatchCore_install_module($7,$8)|0); //@line 65 "../core/patchcore.c"
 $9 = $0; //@line 66 "../core/patchcore.c"
 $10 = (_Sequence_new()|0); //@line 66 "../core/patchcore.c"
 (_PatchCore_install_module($9,$10)|0); //@line 66 "../core/patchcore.c"
 $11 = $0; //@line 67 "../core/patchcore.c"
 $12 = (_Square_new()|0); //@line 67 "../core/patchcore.c"
 (_PatchCore_install_module($11,$12)|0); //@line 67 "../core/patchcore.c"
 $13 = $0; //@line 69 "../core/patchcore.c"
 $14 = (_PatchDesktop_new($13)|0); //@line 69 "../core/patchcore.c"
 $15 = $0; //@line 69 "../core/patchcore.c"
 $16 = ((($15)) + 4|0); //@line 69 "../core/patchcore.c"
 HEAP32[$16>>2] = $14; //@line 69 "../core/patchcore.c"
 $17 = $0; //@line 70 "../core/patchcore.c"
 $18 = ((($17)) + 4|0); //@line 70 "../core/patchcore.c"
 $19 = HEAP32[$18>>2]|0; //@line 70 "../core/patchcore.c"
 _PlatformWrapper_install_resize_callback($19,12); //@line 70 "../core/patchcore.c"
 $20 = $0; //@line 71 "../core/patchcore.c"
 $21 = ((($20)) + 4|0); //@line 71 "../core/patchcore.c"
 $22 = HEAP32[$21>>2]|0; //@line 71 "../core/patchcore.c"
 _PlatformWrapper_install_mouse_callback($22,13); //@line 71 "../core/patchcore.c"
 $23 = $0; //@line 73 "../core/patchcore.c"
 $24 = ((($23)) + 4|0); //@line 73 "../core/patchcore.c"
 $25 = HEAP32[$24>>2]|0; //@line 73 "../core/patchcore.c"
 _Window_paint($25,0,1); //@line 73 "../core/patchcore.c"
 $26 = $0; //@line 75 "../core/patchcore.c"
 $27 = (_AudioHandler_new(14,$26)|0); //@line 75 "../core/patchcore.c"
 _PlatformWrapper_install_audio_handler($27); //@line 75 "../core/patchcore.c"
 STACKTOP = sp;return; //@line 76 "../core/patchcore.c"
}
function _PatchCore_pull_sample($patch_object,$sample_l,$sample_r) {
 $patch_object = $patch_object|0;
 $sample_l = $sample_l|0;
 $sample_r = $sample_r|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0.0, $2 = 0, $20 = 0, $21 = 0.0, $22 = 0.0, $23 = 0.0, $24 = 0, $25 = 0.0, $26 = 0.0;
 var $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $patch = 0, $source = 0, $temp_l = 0, $temp_r = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $temp_l = sp + 8|0;
 $temp_r = sp;
 $0 = $patch_object;
 $1 = $sample_l;
 $2 = $sample_r;
 $3 = $0; //@line 139 "../core/patchcore.c"
 $patch = $3; //@line 139 "../core/patchcore.c"
 $4 = $2; //@line 141 "../core/patchcore.c"
 HEAPF64[$4>>3] = 0.0; //@line 141 "../core/patchcore.c"
 $5 = $1; //@line 142 "../core/patchcore.c"
 HEAPF64[$5>>3] = 0.0; //@line 142 "../core/patchcore.c"
 $i = 0; //@line 144 "../core/patchcore.c"
 while(1) {
  $6 = $i; //@line 144 "../core/patchcore.c"
  $7 = $patch; //@line 144 "../core/patchcore.c"
  $8 = ((($7)) + 12|0); //@line 144 "../core/patchcore.c"
  $9 = HEAP32[$8>>2]|0; //@line 144 "../core/patchcore.c"
  $10 = ((($9)) + 4|0); //@line 144 "../core/patchcore.c"
  $11 = HEAP32[$10>>2]|0; //@line 144 "../core/patchcore.c"
  $12 = ($6>>>0)<($11>>>0); //@line 144 "../core/patchcore.c"
  if (!($12)) {
   break;
  }
  $13 = $patch; //@line 146 "../core/patchcore.c"
  $14 = ((($13)) + 12|0); //@line 146 "../core/patchcore.c"
  $15 = HEAP32[$14>>2]|0; //@line 146 "../core/patchcore.c"
  $16 = $i; //@line 146 "../core/patchcore.c"
  $17 = (_List_get_at($15,$16)|0); //@line 146 "../core/patchcore.c"
  $source = $17; //@line 146 "../core/patchcore.c"
  $18 = $source; //@line 148 "../core/patchcore.c"
  (_IO_pull_sample($18,$temp_l,$temp_r)|0); //@line 148 "../core/patchcore.c"
  $19 = +HEAPF64[$temp_r>>3]; //@line 149 "../core/patchcore.c"
  $20 = $2; //@line 149 "../core/patchcore.c"
  $21 = +HEAPF64[$20>>3]; //@line 149 "../core/patchcore.c"
  $22 = $21 + $19; //@line 149 "../core/patchcore.c"
  HEAPF64[$20>>3] = $22; //@line 149 "../core/patchcore.c"
  $23 = +HEAPF64[$temp_l>>3]; //@line 150 "../core/patchcore.c"
  $24 = $1; //@line 150 "../core/patchcore.c"
  $25 = +HEAPF64[$24>>3]; //@line 150 "../core/patchcore.c"
  $26 = $25 + $23; //@line 150 "../core/patchcore.c"
  HEAPF64[$24>>3] = $26; //@line 150 "../core/patchcore.c"
  $27 = $i; //@line 144 "../core/patchcore.c"
  $28 = (($27) + 1)|0; //@line 144 "../core/patchcore.c"
  $i = $28; //@line 144 "../core/patchcore.c"
 }
 STACKTOP = sp;return; //@line 152 "../core/patchcore.c"
}
function _PatchCore_add_source($patch,$source) {
 $patch = $patch|0;
 $source = $source|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch;
 $2 = $source;
 $3 = $2; //@line 81 "../core/patchcore.c"
 $4 = ((($3)) + 100|0); //@line 81 "../core/patchcore.c"
 $5 = HEAP32[$4>>2]|0; //@line 81 "../core/patchcore.c"
 $6 = ($5|0)!=(0); //@line 81 "../core/patchcore.c"
 if ($6) {
  $7 = $1; //@line 84 "../core/patchcore.c"
  $8 = ((($7)) + 12|0); //@line 84 "../core/patchcore.c"
  $9 = HEAP32[$8>>2]|0; //@line 84 "../core/patchcore.c"
  $10 = $2; //@line 84 "../core/patchcore.c"
  $11 = (_List_add($9,$10)|0); //@line 84 "../core/patchcore.c"
  $0 = $11; //@line 84 "../core/patchcore.c"
  $12 = $0; //@line 85 "../core/patchcore.c"
  STACKTOP = sp;return ($12|0); //@line 85 "../core/patchcore.c"
 } else {
  $0 = 0; //@line 82 "../core/patchcore.c"
  $12 = $0; //@line 85 "../core/patchcore.c"
  STACKTOP = sp;return ($12|0); //@line 85 "../core/patchcore.c"
 }
 return (0)|0;
}
function _PatchCore_get_module_list($patch) {
 $patch = $patch|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch;
 $1 = $0; //@line 103 "../core/patchcore.c"
 $2 = ((($1)) + 8|0); //@line 103 "../core/patchcore.c"
 $3 = HEAP32[$2>>2]|0; //@line 103 "../core/patchcore.c"
 $4 = ((($3)) + 4|0); //@line 103 "../core/patchcore.c"
 $5 = HEAP32[$4>>2]|0; //@line 103 "../core/patchcore.c"
 STACKTOP = sp;return ($5|0); //@line 103 "../core/patchcore.c"
}
function _PatchCore_connect_action($patch,$io) {
 $patch = $patch|0;
 $io = $io|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch;
 $1 = $io;
 $2 = $0; //@line 108 "../core/patchcore.c"
 $3 = ((($2)) + 4|0); //@line 108 "../core/patchcore.c"
 $4 = HEAP32[$3>>2]|0; //@line 108 "../core/patchcore.c"
 $5 = $1; //@line 108 "../core/patchcore.c"
 _PatchDesktop_connect_action($4,$5); //@line 108 "../core/patchcore.c"
 STACKTOP = sp;return; //@line 109 "../core/patchcore.c"
}
function _PatchCore_destroy_menu($patch) {
 $patch = $patch|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch;
 $1 = $0; //@line 113 "../core/patchcore.c"
 $2 = ((($1)) + 4|0); //@line 113 "../core/patchcore.c"
 $3 = HEAP32[$2>>2]|0; //@line 113 "../core/patchcore.c"
 $4 = ((($3)) + 116|0); //@line 113 "../core/patchcore.c"
 $5 = HEAP32[$4>>2]|0; //@line 113 "../core/patchcore.c"
 _Object_delete($5); //@line 113 "../core/patchcore.c"
 $6 = $0; //@line 114 "../core/patchcore.c"
 $7 = ((($6)) + 4|0); //@line 114 "../core/patchcore.c"
 $8 = HEAP32[$7>>2]|0; //@line 114 "../core/patchcore.c"
 $9 = ((($8)) + 116|0); //@line 114 "../core/patchcore.c"
 HEAP32[$9>>2] = 0; //@line 114 "../core/patchcore.c"
 STACKTOP = sp;return; //@line 115 "../core/patchcore.c"
}
function _PatchCore_instantiate_module($patch,$module_name) {
 $patch = $patch|0;
 $module_name = $module_name|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $module = 0, $window = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch;
 $1 = $module_name;
 $2 = $0; //@line 122 "../core/patchcore.c"
 $3 = ((($2)) + 8|0); //@line 122 "../core/patchcore.c"
 $4 = HEAP32[$3>>2]|0; //@line 122 "../core/patchcore.c"
 $5 = $1; //@line 122 "../core/patchcore.c"
 $6 = (_AssociativeArray_get($4,$5)|0); //@line 122 "../core/patchcore.c"
 $module = $6; //@line 122 "../core/patchcore.c"
 $7 = $module; //@line 123 "../core/patchcore.c"
 $8 = ($7|0)!=(0|0); //@line 123 "../core/patchcore.c"
 if (!($8)) {
  STACKTOP = sp;return; //@line 132 "../core/patchcore.c"
 }
 $9 = $module; //@line 126 "../core/patchcore.c"
 $10 = ((($9)) + 4|0); //@line 126 "../core/patchcore.c"
 $11 = HEAP32[$10>>2]|0; //@line 126 "../core/patchcore.c"
 $12 = $0; //@line 126 "../core/patchcore.c"
 $13 = (FUNCTION_TABLE_ii[$11 & 63]($12)|0); //@line 126 "../core/patchcore.c"
 $window = $13; //@line 126 "../core/patchcore.c"
 $14 = $window; //@line 127 "../core/patchcore.c"
 $15 = ($14|0)!=(0|0); //@line 127 "../core/patchcore.c"
 if (!($15)) {
  STACKTOP = sp;return; //@line 132 "../core/patchcore.c"
 }
 $16 = $0; //@line 130 "../core/patchcore.c"
 $17 = ((($16)) + 4|0); //@line 130 "../core/patchcore.c"
 $18 = HEAP32[$17>>2]|0; //@line 130 "../core/patchcore.c"
 $19 = $window; //@line 130 "../core/patchcore.c"
 _Window_insert_child($18,$19); //@line 130 "../core/patchcore.c"
 $20 = $window; //@line 131 "../core/patchcore.c"
 $21 = $0; //@line 131 "../core/patchcore.c"
 $22 = (_PatchCore_next_spawn_x($21)|0); //@line 131 "../core/patchcore.c"
 $23 = $0; //@line 131 "../core/patchcore.c"
 $24 = (_PatchCore_next_spawn_y($23)|0); //@line 131 "../core/patchcore.c"
 _Window_move($20,$22,$24); //@line 131 "../core/patchcore.c"
 STACKTOP = sp;return; //@line 132 "../core/patchcore.c"
}
function _Output_initial_sample_pull_handler($io,$l_sample,$r_sample) {
 $io = $io|0;
 $l_sample = $l_sample|0;
 $r_sample = $r_sample|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $io;
 $1 = $l_sample;
 $2 = $r_sample;
 $3 = $2; //@line 8 "../core/io.c"
 HEAPF64[$3>>3] = 0.0; //@line 8 "../core/io.c"
 $4 = $1; //@line 8 "../core/io.c"
 HEAPF64[$4>>3] = 0.0; //@line 8 "../core/io.c"
 STACKTOP = sp;return 1; //@line 10 "../core/io.c"
}
function _Input_sample_pull_handler($io,$l_sample,$r_sample) {
 $io = $io|0;
 $l_sample = $l_sample|0;
 $r_sample = $r_sample|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $io;
 $2 = $l_sample;
 $3 = $r_sample;
 $4 = $1; //@line 15 "../core/io.c"
 $5 = ((($4)) + 92|0); //@line 15 "../core/io.c"
 $6 = HEAP32[$5>>2]|0; //@line 15 "../core/io.c"
 $7 = ($6|0)!=(0|0); //@line 15 "../core/io.c"
 if ($7) {
  $8 = $1; //@line 16 "../core/io.c"
  $9 = ((($8)) + 92|0); //@line 16 "../core/io.c"
  $10 = HEAP32[$9>>2]|0; //@line 16 "../core/io.c"
  $11 = $2; //@line 16 "../core/io.c"
  $12 = $3; //@line 16 "../core/io.c"
  $13 = (_IO_pull_sample($10,$11,$12)|0); //@line 16 "../core/io.c"
  $0 = $13; //@line 16 "../core/io.c"
  $16 = $0; //@line 21 "../core/io.c"
  STACKTOP = sp;return ($16|0); //@line 21 "../core/io.c"
 } else {
  $14 = $3; //@line 18 "../core/io.c"
  HEAPF64[$14>>3] = 0.0; //@line 18 "../core/io.c"
  $15 = $2; //@line 18 "../core/io.c"
  HEAPF64[$15>>3] = 0.0; //@line 18 "../core/io.c"
  $0 = 1; //@line 20 "../core/io.c"
  $16 = $0; //@line 21 "../core/io.c"
  STACKTOP = sp;return ($16|0); //@line 21 "../core/io.c"
 }
 return (0)|0;
}
function _IO_pull_sample($io,$l_sample,$r_sample) {
 $io = $io|0;
 $l_sample = $l_sample|0;
 $r_sample = $r_sample|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $io;
 $1 = $l_sample;
 $2 = $r_sample;
 $3 = $0; //@line 97 "../core/io.c"
 $4 = ((($3)) + 104|0); //@line 97 "../core/io.c"
 $5 = HEAP32[$4>>2]|0; //@line 97 "../core/io.c"
 $6 = $0; //@line 97 "../core/io.c"
 $7 = $1; //@line 97 "../core/io.c"
 $8 = $2; //@line 97 "../core/io.c"
 $9 = (FUNCTION_TABLE_iiii[$5 & 63]($6,$7,$8)|0); //@line 97 "../core/io.c"
 STACKTOP = sp;return ($9|0); //@line 97 "../core/io.c"
}
function _IO_new($patch_core,$param_object,$x,$y,$is_output) {
 $patch_core = $patch_core|0;
 $param_object = $param_object|0;
 $x = $x|0;
 $y = $y|0;
 $is_output = $is_output|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $io = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = $param_object;
 $3 = $x;
 $4 = $y;
 $5 = $is_output;
 $6 = (_malloc(108)|0); //@line 25 "../core/io.c"
 $io = $6; //@line 25 "../core/io.c"
 $7 = $io; //@line 27 "../core/io.c"
 $8 = ($7|0)!=(0|0); //@line 27 "../core/io.c"
 $9 = $io; //@line 30 "../core/io.c"
 if (!($8)) {
  $0 = $9; //@line 28 "../core/io.c"
  $25 = $0; //@line 40 "../core/io.c"
  STACKTOP = sp;return ($25|0); //@line 40 "../core/io.c"
 }
 $10 = $1; //@line 30 "../core/io.c"
 $11 = $2; //@line 30 "../core/io.c"
 $12 = $3; //@line 30 "../core/io.c"
 $13 = $4; //@line 30 "../core/io.c"
 $14 = $5; //@line 30 "../core/io.c"
 $15 = (_IO_init($9,$10,$11,$12,$13,$14)|0); //@line 30 "../core/io.c"
 $16 = ($15|0)!=(0); //@line 30 "../core/io.c"
 if (!($16)) {
  $17 = $io; //@line 32 "../core/io.c"
  _Object_delete($17); //@line 32 "../core/io.c"
  $0 = 0; //@line 33 "../core/io.c"
  $25 = $0; //@line 40 "../core/io.c"
  STACKTOP = sp;return ($25|0); //@line 40 "../core/io.c"
 }
 $18 = $5; //@line 36 "../core/io.c"
 $19 = ($18|0)!=(0); //@line 36 "../core/io.c"
 if (!($19)) {
  $20 = $1; //@line 37 "../core/io.c"
  $21 = ((($20)) + 16|0); //@line 37 "../core/io.c"
  $22 = HEAP32[$21>>2]|0; //@line 37 "../core/io.c"
  $23 = $io; //@line 37 "../core/io.c"
  (_List_add($22,$23)|0); //@line 37 "../core/io.c"
 }
 $24 = $io; //@line 39 "../core/io.c"
 $0 = $24; //@line 39 "../core/io.c"
 $25 = $0; //@line 40 "../core/io.c"
 STACKTOP = sp;return ($25|0); //@line 40 "../core/io.c"
}
function _IO_init($io,$patch_core,$param_object,$x,$y,$is_output) {
 $io = $io|0;
 $patch_core = $patch_core|0;
 $param_object = $param_object|0;
 $x = $x|0;
 $y = $y|0;
 $is_output = $is_output|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $io;
 $2 = $patch_core;
 $3 = $param_object;
 $4 = $x;
 $5 = $y;
 $6 = $is_output;
 $7 = $1; //@line 44 "../core/io.c"
 $8 = $4; //@line 44 "../core/io.c"
 $9 = (($8) - 3)|0; //@line 44 "../core/io.c"
 $10 = $9&65535; //@line 44 "../core/io.c"
 $11 = $5; //@line 44 "../core/io.c"
 $12 = (($11) - 3)|0; //@line 44 "../core/io.c"
 $13 = $12&65535; //@line 44 "../core/io.c"
 $14 = (_Window_init($7,$10,$13,6,6,3,0)|0); //@line 44 "../core/io.c"
 $15 = ($14|0)!=(0); //@line 44 "../core/io.c"
 if (!($15)) {
  $0 = 0; //@line 46 "../core/io.c"
  $35 = $0; //@line 62 "../core/io.c"
  STACKTOP = sp;return ($35|0); //@line 62 "../core/io.c"
 }
 $16 = $1; //@line 49 "../core/io.c"
 $17 = ((($16)) + 52|0); //@line 49 "../core/io.c"
 HEAP32[$17>>2] = 15; //@line 49 "../core/io.c"
 $18 = $1; //@line 50 "../core/io.c"
 $19 = ((($18)) + 76|0); //@line 50 "../core/io.c"
 HEAP32[$19>>2] = 16; //@line 50 "../core/io.c"
 $20 = $2; //@line 51 "../core/io.c"
 $21 = $1; //@line 51 "../core/io.c"
 $22 = ((($21)) + 88|0); //@line 51 "../core/io.c"
 HEAP32[$22>>2] = $20; //@line 51 "../core/io.c"
 $23 = $3; //@line 52 "../core/io.c"
 $24 = $1; //@line 52 "../core/io.c"
 $25 = ((($24)) + 96|0); //@line 52 "../core/io.c"
 HEAP32[$25>>2] = $23; //@line 52 "../core/io.c"
 $26 = $1; //@line 53 "../core/io.c"
 $27 = ((($26)) + 92|0); //@line 53 "../core/io.c"
 HEAP32[$27>>2] = 0; //@line 53 "../core/io.c"
 $28 = $6; //@line 54 "../core/io.c"
 $29 = $1; //@line 54 "../core/io.c"
 $30 = ((($29)) + 100|0); //@line 54 "../core/io.c"
 HEAP32[$30>>2] = $28; //@line 54 "../core/io.c"
 $31 = $6; //@line 56 "../core/io.c"
 $32 = ($31|0)!=(0); //@line 56 "../core/io.c"
 $33 = $1; //@line 57 "../core/io.c"
 $34 = ((($33)) + 104|0); //@line 57 "../core/io.c"
 if ($32) {
  HEAP32[$34>>2] = 17; //@line 57 "../core/io.c"
 } else {
  HEAP32[$34>>2] = 18; //@line 59 "../core/io.c"
 }
 $0 = 1; //@line 61 "../core/io.c"
 $35 = $0; //@line 62 "../core/io.c"
 STACKTOP = sp;return ($35|0); //@line 62 "../core/io.c"
}
function _IO_paint_handler($io_window) {
 $io_window = $io_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $io = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $io_window;
 $1 = $0; //@line 66 "../core/io.c"
 $io = $1; //@line 66 "../core/io.c"
 $2 = $0; //@line 68 "../core/io.c"
 $3 = ((($2)) + 24|0); //@line 68 "../core/io.c"
 $4 = HEAP32[$3>>2]|0; //@line 68 "../core/io.c"
 $5 = $io; //@line 69 "../core/io.c"
 $6 = ((($5)) + 92|0); //@line 69 "../core/io.c"
 $7 = HEAP32[$6>>2]|0; //@line 69 "../core/io.c"
 $8 = ($7|0)!=(0|0); //@line 69 "../core/io.c"
 $9 = $8 ? -16726016 : -10197916; //@line 69 "../core/io.c"
 _Context_fill_rect($4,2,2,2,2,$9); //@line 68 "../core/io.c"
 $10 = $0; //@line 70 "../core/io.c"
 $11 = ((($10)) + 24|0); //@line 70 "../core/io.c"
 $12 = HEAP32[$11>>2]|0; //@line 70 "../core/io.c"
 _Context_draw_rect($12,0,0,6,6,-16777216); //@line 70 "../core/io.c"
 $13 = $0; //@line 71 "../core/io.c"
 $14 = ((($13)) + 24|0); //@line 71 "../core/io.c"
 $15 = HEAP32[$14>>2]|0; //@line 71 "../core/io.c"
 _Context_draw_rect($15,1,1,4,4,-16777216); //@line 71 "../core/io.c"
 STACKTOP = sp;return; //@line 72 "../core/io.c"
}
function _IO_mouseclick_handler($io_window,$x,$y) {
 $io_window = $io_window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $io = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $io_window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 76 "../core/io.c"
 $io = $3; //@line 76 "../core/io.c"
 $4 = $io; //@line 78 "../core/io.c"
 $5 = ((($4)) + 92|0); //@line 78 "../core/io.c"
 $6 = HEAP32[$5>>2]|0; //@line 78 "../core/io.c"
 $7 = ($6|0)!=(0|0); //@line 78 "../core/io.c"
 if (!($7)) {
  $31 = $io; //@line 87 "../core/io.c"
  $32 = ((($31)) + 88|0); //@line 87 "../core/io.c"
  $33 = HEAP32[$32>>2]|0; //@line 87 "../core/io.c"
  $34 = $io; //@line 87 "../core/io.c"
  _PatchCore_connect_action($33,$34); //@line 87 "../core/io.c"
  STACKTOP = sp;return; //@line 88 "../core/io.c"
 }
 $8 = $io; //@line 80 "../core/io.c"
 $9 = ((($8)) + 92|0); //@line 80 "../core/io.c"
 $10 = HEAP32[$9>>2]|0; //@line 80 "../core/io.c"
 $11 = ((($10)) + 92|0); //@line 80 "../core/io.c"
 HEAP32[$11>>2] = 0; //@line 80 "../core/io.c"
 $12 = $io; //@line 81 "../core/io.c"
 $13 = ((($12)) + 92|0); //@line 81 "../core/io.c"
 $14 = HEAP32[$13>>2]|0; //@line 81 "../core/io.c"
 $15 = $io; //@line 82 "../core/io.c"
 $16 = ((($15)) + 92|0); //@line 82 "../core/io.c"
 $17 = HEAP32[$16>>2]|0; //@line 82 "../core/io.c"
 $18 = ((($17)) + 18|0); //@line 82 "../core/io.c"
 $19 = HEAP16[$18>>1]|0; //@line 82 "../core/io.c"
 $20 = $19&65535; //@line 82 "../core/io.c"
 $21 = (($20) - 1)|0; //@line 82 "../core/io.c"
 $22 = $io; //@line 83 "../core/io.c"
 $23 = ((($22)) + 92|0); //@line 83 "../core/io.c"
 $24 = HEAP32[$23>>2]|0; //@line 83 "../core/io.c"
 $25 = ((($24)) + 16|0); //@line 83 "../core/io.c"
 $26 = HEAP16[$25>>1]|0; //@line 83 "../core/io.c"
 $27 = $26&65535; //@line 83 "../core/io.c"
 $28 = (($27) - 1)|0; //@line 83 "../core/io.c"
 _Window_invalidate($14,0,0,$21,$28); //@line 81 "../core/io.c"
 $29 = $io; //@line 84 "../core/io.c"
 $30 = ((($29)) + 92|0); //@line 84 "../core/io.c"
 HEAP32[$30>>2] = 0; //@line 84 "../core/io.c"
 $31 = $io; //@line 87 "../core/io.c"
 $32 = ((($31)) + 88|0); //@line 87 "../core/io.c"
 $33 = HEAP32[$32>>2]|0; //@line 87 "../core/io.c"
 $34 = $io; //@line 87 "../core/io.c"
 _PatchCore_connect_action($33,$34); //@line 87 "../core/io.c"
 STACKTOP = sp;return; //@line 88 "../core/io.c"
}
function _IO_connect($io,$connected_io) {
 $io = $io|0;
 $connected_io = $connected_io|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $io;
 $1 = $connected_io;
 $2 = $1; //@line 92 "../core/io.c"
 $3 = $0; //@line 92 "../core/io.c"
 $4 = ((($3)) + 92|0); //@line 92 "../core/io.c"
 HEAP32[$4>>2] = $2; //@line 92 "../core/io.c"
 STACKTOP = sp;return; //@line 93 "../core/io.c"
}
function _AudioHandler_new($function,$parent_object) {
 $function = $function|0;
 $parent_object = $parent_object|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $audio_handler = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $function;
 $2 = $parent_object;
 $3 = (_malloc(12)|0); //@line 7 "../platform/audiohandler.c"
 $audio_handler = $3; //@line 7 "../platform/audiohandler.c"
 $4 = ($3|0)!=(0|0); //@line 7 "../platform/audiohandler.c"
 $5 = $audio_handler; //@line 10 "../platform/audiohandler.c"
 if ($4) {
  _Object_init($5,0); //@line 10 "../platform/audiohandler.c"
  $6 = $1; //@line 11 "../platform/audiohandler.c"
  $7 = $audio_handler; //@line 11 "../platform/audiohandler.c"
  $8 = ((($7)) + 4|0); //@line 11 "../platform/audiohandler.c"
  HEAP32[$8>>2] = $6; //@line 11 "../platform/audiohandler.c"
  $9 = $2; //@line 12 "../platform/audiohandler.c"
  $10 = $audio_handler; //@line 12 "../platform/audiohandler.c"
  $11 = ((($10)) + 8|0); //@line 12 "../platform/audiohandler.c"
  HEAP32[$11>>2] = $9; //@line 12 "../platform/audiohandler.c"
  $12 = $audio_handler; //@line 14 "../platform/audiohandler.c"
  $0 = $12; //@line 14 "../platform/audiohandler.c"
  $13 = $0; //@line 15 "../platform/audiohandler.c"
  STACKTOP = sp;return ($13|0); //@line 15 "../platform/audiohandler.c"
 } else {
  $0 = $5; //@line 8 "../platform/audiohandler.c"
  $13 = $0; //@line 15 "../platform/audiohandler.c"
  STACKTOP = sp;return ($13|0); //@line 15 "../platform/audiohandler.c"
 }
 return (0)|0;
}
function _Unit_init($unit,$patch_core) {
 $unit = $unit|0;
 $patch_core = $patch_core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $unit;
 $2 = $patch_core;
 $3 = $1; //@line 36 "../core/unit.c"
 $4 = (_Frame_init($3,0,0,100,100)|0); //@line 36 "../core/unit.c"
 $5 = ($4|0)!=(0); //@line 36 "../core/unit.c"
 if ($5) {
  $6 = $2; //@line 39 "../core/unit.c"
  $7 = $1; //@line 39 "../core/unit.c"
  $8 = ((($7)) + 88|0); //@line 39 "../core/unit.c"
  HEAP32[$8>>2] = $6; //@line 39 "../core/unit.c"
  $9 = $1; //@line 40 "../core/unit.c"
  $10 = ((($9)) + 80|0); //@line 40 "../core/unit.c"
  $11 = HEAP32[$10>>2]|0; //@line 40 "../core/unit.c"
  $12 = $1; //@line 40 "../core/unit.c"
  $13 = ((($12)) + 92|0); //@line 40 "../core/unit.c"
  HEAP32[$13>>2] = $11; //@line 40 "../core/unit.c"
  $14 = $1; //@line 41 "../core/unit.c"
  $15 = ((($14)) + 80|0); //@line 41 "../core/unit.c"
  HEAP32[$15>>2] = 19; //@line 41 "../core/unit.c"
  $0 = 1; //@line 43 "../core/unit.c"
  $16 = $0; //@line 44 "../core/unit.c"
  STACKTOP = sp;return ($16|0); //@line 44 "../core/unit.c"
 } else {
  $0 = 0; //@line 37 "../core/unit.c"
  $16 = $0; //@line 44 "../core/unit.c"
  STACKTOP = sp;return ($16|0); //@line 44 "../core/unit.c"
 }
 return (0)|0;
}
function _Unit_move_function($unit_window,$x,$y) {
 $unit_window = $unit_window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $unit = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $unit_window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 21 "../core/unit.c"
 $unit = $3; //@line 21 "../core/unit.c"
 $4 = $unit; //@line 23 "../core/unit.c"
 $5 = ((($4)) + 92|0); //@line 23 "../core/unit.c"
 $6 = HEAP32[$5>>2]|0; //@line 23 "../core/unit.c"
 $7 = $0; //@line 23 "../core/unit.c"
 $8 = $1; //@line 23 "../core/unit.c"
 $9 = $2; //@line 23 "../core/unit.c"
 FUNCTION_TABLE_viii[$6 & 63]($7,$8,$9); //@line 23 "../core/unit.c"
 $10 = $0; //@line 26 "../core/unit.c"
 $11 = ((($10)) + 4|0); //@line 26 "../core/unit.c"
 $12 = HEAP32[$11>>2]|0; //@line 26 "../core/unit.c"
 $13 = ($12|0)!=(0|0); //@line 26 "../core/unit.c"
 if (!($13)) {
  STACKTOP = sp;return; //@line 32 "../core/unit.c"
 }
 $14 = $0; //@line 28 "../core/unit.c"
 $15 = ((($14)) + 4|0); //@line 28 "../core/unit.c"
 $16 = HEAP32[$15>>2]|0; //@line 28 "../core/unit.c"
 $17 = $0; //@line 29 "../core/unit.c"
 $18 = ((($17)) + 4|0); //@line 29 "../core/unit.c"
 $19 = HEAP32[$18>>2]|0; //@line 29 "../core/unit.c"
 $20 = ((($19)) + 18|0); //@line 29 "../core/unit.c"
 $21 = HEAP16[$20>>1]|0; //@line 29 "../core/unit.c"
 $22 = $21&65535; //@line 29 "../core/unit.c"
 $23 = (($22) - 1)|0; //@line 29 "../core/unit.c"
 $24 = $0; //@line 30 "../core/unit.c"
 $25 = ((($24)) + 4|0); //@line 30 "../core/unit.c"
 $26 = HEAP32[$25>>2]|0; //@line 30 "../core/unit.c"
 $27 = ((($26)) + 16|0); //@line 30 "../core/unit.c"
 $28 = HEAP16[$27>>1]|0; //@line 30 "../core/unit.c"
 $29 = $28&65535; //@line 30 "../core/unit.c"
 $30 = (($29) - 1)|0; //@line 30 "../core/unit.c"
 _Window_invalidate($16,0,0,$23,$30); //@line 28 "../core/unit.c"
 STACKTOP = sp;return; //@line 32 "../core/unit.c"
}
function _Unit_create_io($unit,$x,$y,$is_output) {
 $unit = $unit|0;
 $x = $x|0;
 $y = $y|0;
 $is_output = $is_output|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $io = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $unit;
 $2 = $x;
 $3 = $y;
 $4 = $is_output;
 $5 = $1; //@line 48 "../core/unit.c"
 $6 = ((($5)) + 88|0); //@line 48 "../core/unit.c"
 $7 = HEAP32[$6>>2]|0; //@line 48 "../core/unit.c"
 $8 = $1; //@line 48 "../core/unit.c"
 $9 = $2; //@line 48 "../core/unit.c"
 $10 = $3; //@line 48 "../core/unit.c"
 $11 = $4; //@line 48 "../core/unit.c"
 $12 = $11&255; //@line 48 "../core/unit.c"
 $13 = (_IO_new($7,$8,$9,$10,$12)|0); //@line 48 "../core/unit.c"
 $io = $13; //@line 48 "../core/unit.c"
 $14 = $io; //@line 50 "../core/unit.c"
 $15 = ($14|0)!=(0|0); //@line 50 "../core/unit.c"
 if ($15) {
  $17 = $1; //@line 53 "../core/unit.c"
  $18 = $io; //@line 53 "../core/unit.c"
  _Window_insert_child($17,$18); //@line 53 "../core/unit.c"
  $19 = $io; //@line 55 "../core/unit.c"
  $0 = $19; //@line 55 "../core/unit.c"
  $20 = $0; //@line 56 "../core/unit.c"
  STACKTOP = sp;return ($20|0); //@line 56 "../core/unit.c"
 } else {
  $16 = $io; //@line 51 "../core/unit.c"
  $0 = $16; //@line 51 "../core/unit.c"
  $20 = $0; //@line 56 "../core/unit.c"
  STACKTOP = sp;return ($20|0); //@line 56 "../core/unit.c"
 }
 return (0)|0;
}
function _Unit_create_output($unit,$x,$y) {
 $unit = $unit|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $io = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $unit;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 60 "../core/unit.c"
 $4 = $1; //@line 60 "../core/unit.c"
 $5 = $2; //@line 60 "../core/unit.c"
 $6 = (_Unit_create_io($3,$4,$5,1)|0); //@line 60 "../core/unit.c"
 $io = $6; //@line 60 "../core/unit.c"
 $7 = $io; //@line 62 "../core/unit.c"
 STACKTOP = sp;return ($7|0); //@line 62 "../core/unit.c"
}
function _Unit_create_input($unit,$x,$y) {
 $unit = $unit|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $unit;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 67 "../core/unit.c"
 $4 = $1; //@line 67 "../core/unit.c"
 $5 = $2; //@line 67 "../core/unit.c"
 $6 = (_Unit_create_io($3,$4,$5,0)|0); //@line 67 "../core/unit.c"
 STACKTOP = sp;return ($6|0); //@line 67 "../core/unit.c"
}
function _Unit_delete($unit_object) {
 $unit_object = $unit_object|0;
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $unit_object;
 $1 = $0; //@line 72 "../core/unit.c"
 _Window_delete_function($1); //@line 72 "../core/unit.c"
 STACKTOP = sp;return; //@line 73 "../core/unit.c"
}
function _Frame_new($x,$y,$width,$height) {
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 $height = $height|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $frame = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $x;
 $2 = $y;
 $3 = $width;
 $4 = $height;
 $5 = (_malloc(88)|0); //@line 6 "../uilib/frame.c"
 $frame = $5; //@line 6 "../uilib/frame.c"
 $6 = ($5|0)!=(0|0); //@line 6 "../uilib/frame.c"
 $7 = $frame; //@line 9 "../uilib/frame.c"
 do {
  if ($6) {
   $8 = $1; //@line 9 "../uilib/frame.c"
   $9 = $2; //@line 9 "../uilib/frame.c"
   $10 = $3; //@line 9 "../uilib/frame.c"
   $11 = $4; //@line 9 "../uilib/frame.c"
   $12 = (_Frame_init($7,$8,$9,$10,$11)|0); //@line 9 "../uilib/frame.c"
   $13 = ($12|0)!=(0); //@line 9 "../uilib/frame.c"
   $14 = $frame; //@line 15 "../uilib/frame.c"
   if ($13) {
    $0 = $14; //@line 15 "../uilib/frame.c"
    break;
   } else {
    _free($14); //@line 11 "../uilib/frame.c"
    $0 = 0; //@line 12 "../uilib/frame.c"
    break;
   }
  } else {
   $0 = $7; //@line 7 "../uilib/frame.c"
  }
 } while(0);
 $15 = $0; //@line 16 "../uilib/frame.c"
 STACKTOP = sp;return ($15|0); //@line 16 "../uilib/frame.c"
}
function _Frame_init($frame,$x,$y,$width,$height) {
 $frame = $frame|0;
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 $height = $height|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $frame;
 $2 = $x;
 $3 = $y;
 $4 = $width;
 $5 = $height;
 $6 = $1; //@line 20 "../uilib/frame.c"
 $7 = $2; //@line 20 "../uilib/frame.c"
 $8 = $7&65535; //@line 20 "../uilib/frame.c"
 $9 = $3; //@line 20 "../uilib/frame.c"
 $10 = $9&65535; //@line 20 "../uilib/frame.c"
 $11 = $4; //@line 20 "../uilib/frame.c"
 $12 = $11&65535; //@line 20 "../uilib/frame.c"
 $13 = $5; //@line 20 "../uilib/frame.c"
 $14 = $13&65535; //@line 20 "../uilib/frame.c"
 $15 = (_Window_init($6,$8,$10,$12,$14,5,0)|0); //@line 20 "../uilib/frame.c"
 $16 = ($15|0)!=(0); //@line 20 "../uilib/frame.c"
 if ($16) {
  $17 = $1; //@line 24 "../uilib/frame.c"
  $18 = ((($17)) + 52|0); //@line 24 "../uilib/frame.c"
  HEAP32[$18>>2] = 20; //@line 24 "../uilib/frame.c"
  $0 = 1; //@line 26 "../uilib/frame.c"
  $19 = $0; //@line 27 "../uilib/frame.c"
  STACKTOP = sp;return ($19|0); //@line 27 "../uilib/frame.c"
 } else {
  $0 = 0; //@line 22 "../uilib/frame.c"
  $19 = $0; //@line 27 "../uilib/frame.c"
  STACKTOP = sp;return ($19|0); //@line 27 "../uilib/frame.c"
 }
 return (0)|0;
}
function _Frame_paint_handler($frame_window) {
 $frame_window = $frame_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $frame_window;
 $1 = $0; //@line 31 "../uilib/frame.c"
 $2 = ((($1)) + 24|0); //@line 31 "../uilib/frame.c"
 $3 = HEAP32[$2>>2]|0; //@line 31 "../uilib/frame.c"
 $4 = $0; //@line 31 "../uilib/frame.c"
 $5 = ((($4)) + 16|0); //@line 31 "../uilib/frame.c"
 $6 = HEAP16[$5>>1]|0; //@line 31 "../uilib/frame.c"
 $7 = $6&65535; //@line 31 "../uilib/frame.c"
 $8 = (($7) - 4)|0; //@line 31 "../uilib/frame.c"
 $9 = $0; //@line 32 "../uilib/frame.c"
 $10 = ((($9)) + 18|0); //@line 32 "../uilib/frame.c"
 $11 = HEAP16[$10>>1]|0; //@line 32 "../uilib/frame.c"
 $12 = $11&65535; //@line 32 "../uilib/frame.c"
 $13 = (($12) - 4)|0; //@line 32 "../uilib/frame.c"
 _Context_fill_rect($3,2,2,$8,$13,-4610661); //@line 31 "../uilib/frame.c"
 $14 = $0; //@line 33 "../uilib/frame.c"
 $15 = ((($14)) + 24|0); //@line 33 "../uilib/frame.c"
 $16 = HEAP32[$15>>2]|0; //@line 33 "../uilib/frame.c"
 $17 = $0; //@line 33 "../uilib/frame.c"
 $18 = ((($17)) + 16|0); //@line 33 "../uilib/frame.c"
 $19 = HEAP16[$18>>1]|0; //@line 33 "../uilib/frame.c"
 $20 = $19&65535; //@line 33 "../uilib/frame.c"
 $21 = $0; //@line 34 "../uilib/frame.c"
 $22 = ((($21)) + 18|0); //@line 34 "../uilib/frame.c"
 $23 = HEAP16[$22>>1]|0; //@line 34 "../uilib/frame.c"
 $24 = $23&65535; //@line 34 "../uilib/frame.c"
 _Context_draw_rect($16,0,0,$20,$24,-16777216); //@line 33 "../uilib/frame.c"
 $25 = $0; //@line 35 "../uilib/frame.c"
 $26 = ((($25)) + 24|0); //@line 35 "../uilib/frame.c"
 $27 = HEAP32[$26>>2]|0; //@line 35 "../uilib/frame.c"
 $28 = $0; //@line 35 "../uilib/frame.c"
 $29 = ((($28)) + 16|0); //@line 35 "../uilib/frame.c"
 $30 = HEAP16[$29>>1]|0; //@line 35 "../uilib/frame.c"
 $31 = $30&65535; //@line 35 "../uilib/frame.c"
 $32 = (($31) - 2)|0; //@line 35 "../uilib/frame.c"
 $33 = $0; //@line 36 "../uilib/frame.c"
 $34 = ((($33)) + 18|0); //@line 36 "../uilib/frame.c"
 $35 = HEAP16[$34>>1]|0; //@line 36 "../uilib/frame.c"
 $36 = $35&65535; //@line 36 "../uilib/frame.c"
 $37 = (($36) - 2)|0; //@line 36 "../uilib/frame.c"
 _Context_draw_rect($27,1,1,$32,$37,-16777216); //@line 35 "../uilib/frame.c"
 STACKTOP = sp;return; //@line 37 "../uilib/frame.c"
}
function _MenuEntry_new($text,$click_action) {
 $text = $text|0;
 $click_action = $click_action|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $menu_entry = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $text;
 $2 = $click_action;
 $3 = (_malloc(96)|0); //@line 7 "../uilib/menuentry.c"
 $menu_entry = $3; //@line 7 "../uilib/menuentry.c"
 $4 = ($3|0)!=(0|0); //@line 7 "../uilib/menuentry.c"
 $5 = $menu_entry; //@line 10 "../uilib/menuentry.c"
 if (!($4)) {
  $0 = $5; //@line 8 "../uilib/menuentry.c"
  $28 = $0; //@line 31 "../uilib/menuentry.c"
  STACKTOP = sp;return ($28|0); //@line 31 "../uilib/menuentry.c"
 }
 $6 = (_Window_init($5,0,0,100,14,3,0)|0); //@line 10 "../uilib/menuentry.c"
 $7 = ($6|0)!=(0); //@line 10 "../uilib/menuentry.c"
 $8 = $menu_entry; //@line 16 "../uilib/menuentry.c"
 if (!($7)) {
  _Object_delete($8); //@line 12 "../uilib/menuentry.c"
  $0 = 0; //@line 13 "../uilib/menuentry.c"
  $28 = $0; //@line 31 "../uilib/menuentry.c"
  STACKTOP = sp;return ($28|0); //@line 31 "../uilib/menuentry.c"
 }
 _Object_init($8,21); //@line 16 "../uilib/menuentry.c"
 $9 = $1; //@line 18 "../uilib/menuentry.c"
 $10 = ((($9)) + 4|0); //@line 18 "../uilib/menuentry.c"
 $11 = HEAP32[$10>>2]|0; //@line 18 "../uilib/menuentry.c"
 $12 = (_String_new($11)|0); //@line 18 "../uilib/menuentry.c"
 $13 = $menu_entry; //@line 18 "../uilib/menuentry.c"
 $14 = ((($13)) + 88|0); //@line 18 "../uilib/menuentry.c"
 HEAP32[$14>>2] = $12; //@line 18 "../uilib/menuentry.c"
 $15 = ($12|0)!=(0|0); //@line 18 "../uilib/menuentry.c"
 $16 = $menu_entry; //@line 24 "../uilib/menuentry.c"
 if ($15) {
  $17 = ((($16)) + 92|0); //@line 24 "../uilib/menuentry.c"
  HEAP32[$17>>2] = 0; //@line 24 "../uilib/menuentry.c"
  $18 = $menu_entry; //@line 25 "../uilib/menuentry.c"
  $19 = ((($18)) + 52|0); //@line 25 "../uilib/menuentry.c"
  HEAP32[$19>>2] = 22; //@line 25 "../uilib/menuentry.c"
  $20 = $2; //@line 26 "../uilib/menuentry.c"
  $21 = $menu_entry; //@line 26 "../uilib/menuentry.c"
  $22 = ((($21)) + 76|0); //@line 26 "../uilib/menuentry.c"
  HEAP32[$22>>2] = $20; //@line 26 "../uilib/menuentry.c"
  $23 = $menu_entry; //@line 27 "../uilib/menuentry.c"
  $24 = ((($23)) + 64|0); //@line 27 "../uilib/menuentry.c"
  HEAP32[$24>>2] = 23; //@line 27 "../uilib/menuentry.c"
  $25 = $menu_entry; //@line 28 "../uilib/menuentry.c"
  $26 = ((($25)) + 68|0); //@line 28 "../uilib/menuentry.c"
  HEAP32[$26>>2] = 24; //@line 28 "../uilib/menuentry.c"
  $27 = $menu_entry; //@line 30 "../uilib/menuentry.c"
  $0 = $27; //@line 30 "../uilib/menuentry.c"
  $28 = $0; //@line 31 "../uilib/menuentry.c"
  STACKTOP = sp;return ($28|0); //@line 31 "../uilib/menuentry.c"
 } else {
  _Object_delete($16); //@line 20 "../uilib/menuentry.c"
  $0 = 0; //@line 21 "../uilib/menuentry.c"
  $28 = $0; //@line 31 "../uilib/menuentry.c"
  STACKTOP = sp;return ($28|0); //@line 31 "../uilib/menuentry.c"
 }
 return (0)|0;
}
function _MenuEntry_delete_function($menu_entry_object) {
 $menu_entry_object = $menu_entry_object|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $menu_entry = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $menu_entry_object;
 $1 = $0; //@line 66 "../uilib/menuentry.c"
 $2 = ($1|0)!=(0|0); //@line 66 "../uilib/menuentry.c"
 if (!($2)) {
  STACKTOP = sp;return; //@line 73 "../uilib/menuentry.c"
 }
 $3 = $0; //@line 69 "../uilib/menuentry.c"
 $menu_entry = $3; //@line 69 "../uilib/menuentry.c"
 $4 = $menu_entry; //@line 71 "../uilib/menuentry.c"
 $5 = ((($4)) + 88|0); //@line 71 "../uilib/menuentry.c"
 $6 = HEAP32[$5>>2]|0; //@line 71 "../uilib/menuentry.c"
 _Object_delete($6); //@line 71 "../uilib/menuentry.c"
 $7 = $0; //@line 72 "../uilib/menuentry.c"
 _Window_delete_function($7); //@line 72 "../uilib/menuentry.c"
 STACKTOP = sp;return; //@line 73 "../uilib/menuentry.c"
}
function _MenuEntry_paint_handler($menu_entry_window) {
 $menu_entry_window = $menu_entry_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $menu_entry = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $menu_entry_window;
 $1 = $0; //@line 54 "../uilib/menuentry.c"
 $menu_entry = $1; //@line 54 "../uilib/menuentry.c"
 $2 = $0; //@line 57 "../uilib/menuentry.c"
 $3 = ((($2)) + 24|0); //@line 57 "../uilib/menuentry.c"
 $4 = HEAP32[$3>>2]|0; //@line 57 "../uilib/menuentry.c"
 $5 = $0; //@line 57 "../uilib/menuentry.c"
 $6 = ((($5)) + 16|0); //@line 57 "../uilib/menuentry.c"
 $7 = HEAP16[$6>>1]|0; //@line 57 "../uilib/menuentry.c"
 $8 = $7&65535; //@line 57 "../uilib/menuentry.c"
 $9 = $0; //@line 58 "../uilib/menuentry.c"
 $10 = ((($9)) + 18|0); //@line 58 "../uilib/menuentry.c"
 $11 = HEAP16[$10>>1]|0; //@line 58 "../uilib/menuentry.c"
 $12 = $11&65535; //@line 58 "../uilib/menuentry.c"
 $13 = $menu_entry; //@line 59 "../uilib/menuentry.c"
 $14 = ((($13)) + 92|0); //@line 59 "../uilib/menuentry.c"
 $15 = HEAP32[$14>>2]|0; //@line 59 "../uilib/menuentry.c"
 $16 = ($15|0)!=(0); //@line 59 "../uilib/menuentry.c"
 $17 = $16 ? -16777216 : -4610661; //@line 59 "../uilib/menuentry.c"
 _Context_fill_rect($4,0,0,$8,$12,$17); //@line 57 "../uilib/menuentry.c"
 $18 = $0; //@line 60 "../uilib/menuentry.c"
 $19 = ((($18)) + 24|0); //@line 60 "../uilib/menuentry.c"
 $20 = HEAP32[$19>>2]|0; //@line 60 "../uilib/menuentry.c"
 $21 = $menu_entry; //@line 60 "../uilib/menuentry.c"
 $22 = ((($21)) + 88|0); //@line 60 "../uilib/menuentry.c"
 $23 = HEAP32[$22>>2]|0; //@line 60 "../uilib/menuentry.c"
 $24 = ((($23)) + 4|0); //@line 60 "../uilib/menuentry.c"
 $25 = HEAP32[$24>>2]|0; //@line 60 "../uilib/menuentry.c"
 $26 = $menu_entry; //@line 61 "../uilib/menuentry.c"
 $27 = ((($26)) + 92|0); //@line 61 "../uilib/menuentry.c"
 $28 = HEAP32[$27>>2]|0; //@line 61 "../uilib/menuentry.c"
 $29 = ($28|0)!=(0); //@line 61 "../uilib/menuentry.c"
 $30 = $29 ? -1 : -16777216; //@line 61 "../uilib/menuentry.c"
 _Context_draw_text($20,$25,1,1,$30); //@line 60 "../uilib/menuentry.c"
 STACKTOP = sp;return; //@line 62 "../uilib/menuentry.c"
}
function _MenuEntry_mouseover_handler($menu_entry_window) {
 $menu_entry_window = $menu_entry_window|0;
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $menu_entry_window;
 $1 = $0; //@line 44 "../uilib/menuentry.c"
 _MenuEntry_toggle_over($1,1); //@line 44 "../uilib/menuentry.c"
 STACKTOP = sp;return; //@line 45 "../uilib/menuentry.c"
}
function _MenuEntry_mouseout_handler($menu_entry_window) {
 $menu_entry_window = $menu_entry_window|0;
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $menu_entry_window;
 $1 = $0; //@line 49 "../uilib/menuentry.c"
 _MenuEntry_toggle_over($1,0); //@line 49 "../uilib/menuentry.c"
 STACKTOP = sp;return; //@line 50 "../uilib/menuentry.c"
}
function _MenuEntry_toggle_over($menu_entry_window,$over) {
 $menu_entry_window = $menu_entry_window|0;
 $over = $over|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $menu_entry = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $menu_entry_window;
 $1 = $over;
 $2 = $0; //@line 35 "../uilib/menuentry.c"
 $menu_entry = $2; //@line 35 "../uilib/menuentry.c"
 $3 = $1; //@line 37 "../uilib/menuentry.c"
 $4 = $menu_entry; //@line 37 "../uilib/menuentry.c"
 $5 = ((($4)) + 92|0); //@line 37 "../uilib/menuentry.c"
 HEAP32[$5>>2] = $3; //@line 37 "../uilib/menuentry.c"
 $6 = $0; //@line 38 "../uilib/menuentry.c"
 $7 = $0; //@line 38 "../uilib/menuentry.c"
 $8 = ((($7)) + 18|0); //@line 38 "../uilib/menuentry.c"
 $9 = HEAP16[$8>>1]|0; //@line 38 "../uilib/menuentry.c"
 $10 = $9&65535; //@line 38 "../uilib/menuentry.c"
 $11 = (($10) - 1)|0; //@line 38 "../uilib/menuentry.c"
 $12 = $0; //@line 39 "../uilib/menuentry.c"
 $13 = ((($12)) + 16|0); //@line 39 "../uilib/menuentry.c"
 $14 = HEAP16[$13>>1]|0; //@line 39 "../uilib/menuentry.c"
 $15 = $14&65535; //@line 39 "../uilib/menuentry.c"
 $16 = (($15) - 1)|0; //@line 39 "../uilib/menuentry.c"
 _Window_invalidate($6,0,0,$11,$16); //@line 38 "../uilib/menuentry.c"
 STACKTOP = sp;return; //@line 40 "../uilib/menuentry.c"
}
function _SessionMenu_new($patch_core,$x,$y) {
 $patch_core = $patch_core|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $i = 0, $session_menu = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = $x;
 $3 = $y;
 $4 = (_malloc(96)|0); //@line 7 "../widgets/sessionmenu.c"
 $session_menu = $4; //@line 7 "../widgets/sessionmenu.c"
 $5 = $session_menu; //@line 9 "../widgets/sessionmenu.c"
 $6 = ($5|0)!=(0|0); //@line 9 "../widgets/sessionmenu.c"
 $7 = $session_menu; //@line 12 "../widgets/sessionmenu.c"
 if (!($6)) {
  $0 = $7; //@line 10 "../widgets/sessionmenu.c"
  $40 = $0; //@line 28 "../widgets/sessionmenu.c"
  STACKTOP = sp;return ($40|0); //@line 28 "../widgets/sessionmenu.c"
 }
 $8 = $2; //@line 12 "../widgets/sessionmenu.c"
 $9 = $3; //@line 12 "../widgets/sessionmenu.c"
 $10 = (_Menu_init($7,$8,$9,200)|0); //@line 12 "../widgets/sessionmenu.c"
 $11 = ($10|0)!=(0); //@line 12 "../widgets/sessionmenu.c"
 if (!($11)) {
  $12 = $session_menu; //@line 14 "../widgets/sessionmenu.c"
  _Object_delete($12); //@line 14 "../widgets/sessionmenu.c"
  $0 = 0; //@line 15 "../widgets/sessionmenu.c"
  $40 = $0; //@line 28 "../widgets/sessionmenu.c"
  STACKTOP = sp;return ($40|0); //@line 28 "../widgets/sessionmenu.c"
 }
 $13 = $1; //@line 18 "../widgets/sessionmenu.c"
 $14 = $session_menu; //@line 18 "../widgets/sessionmenu.c"
 $15 = ((($14)) + 88|0); //@line 18 "../widgets/sessionmenu.c"
 HEAP32[$15>>2] = $13; //@line 18 "../widgets/sessionmenu.c"
 $16 = $1; //@line 19 "../widgets/sessionmenu.c"
 $17 = (_PatchCore_get_module_list($16)|0); //@line 19 "../widgets/sessionmenu.c"
 $18 = $session_menu; //@line 19 "../widgets/sessionmenu.c"
 $19 = ((($18)) + 92|0); //@line 19 "../widgets/sessionmenu.c"
 HEAP32[$19>>2] = $17; //@line 19 "../widgets/sessionmenu.c"
 $i = 0; //@line 23 "../widgets/sessionmenu.c"
 while(1) {
  $20 = $session_menu; //@line 23 "../widgets/sessionmenu.c"
  $21 = ((($20)) + 92|0); //@line 23 "../widgets/sessionmenu.c"
  $22 = HEAP32[$21>>2]|0; //@line 23 "../widgets/sessionmenu.c"
  $23 = ($22|0)!=(0|0); //@line 23 "../widgets/sessionmenu.c"
  if ($23) {
   $24 = $i; //@line 23 "../widgets/sessionmenu.c"
   $25 = $session_menu; //@line 23 "../widgets/sessionmenu.c"
   $26 = ((($25)) + 92|0); //@line 23 "../widgets/sessionmenu.c"
   $27 = HEAP32[$26>>2]|0; //@line 23 "../widgets/sessionmenu.c"
   $28 = ((($27)) + 4|0); //@line 23 "../widgets/sessionmenu.c"
   $29 = HEAP32[$28>>2]|0; //@line 23 "../widgets/sessionmenu.c"
   $30 = ($24>>>0)<($29>>>0); //@line 23 "../widgets/sessionmenu.c"
   $41 = $30;
  } else {
   $41 = 0;
  }
  $31 = $session_menu; //@line 24 "../widgets/sessionmenu.c"
  if (!($41)) {
   break;
  }
  $32 = $session_menu; //@line 25 "../widgets/sessionmenu.c"
  $33 = ((($32)) + 92|0); //@line 25 "../widgets/sessionmenu.c"
  $34 = HEAP32[$33>>2]|0; //@line 25 "../widgets/sessionmenu.c"
  $35 = $i; //@line 25 "../widgets/sessionmenu.c"
  $36 = (_List_get_at($34,$35)|0); //@line 25 "../widgets/sessionmenu.c"
  $37 = (_MenuEntry_new($36,25)|0); //@line 25 "../widgets/sessionmenu.c"
  _Menu_add_entry($31,$37); //@line 24 "../widgets/sessionmenu.c"
  $38 = $i; //@line 23 "../widgets/sessionmenu.c"
  $39 = (($38) + 1)|0; //@line 23 "../widgets/sessionmenu.c"
  $i = $39; //@line 23 "../widgets/sessionmenu.c"
 }
 $0 = $31; //@line 27 "../widgets/sessionmenu.c"
 $40 = $0; //@line 28 "../widgets/sessionmenu.c"
 STACKTOP = sp;return ($40|0); //@line 28 "../widgets/sessionmenu.c"
}
function _SessionMenu_mouseclick_function($session_menu_entry_window,$x,$y) {
 $session_menu_entry_window = $session_menu_entry_window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var $menu_entry = 0, $session_menu = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $session_menu_entry_window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 32 "../widgets/sessionmenu.c"
 $4 = ((($3)) + 4|0); //@line 32 "../widgets/sessionmenu.c"
 $5 = HEAP32[$4>>2]|0; //@line 32 "../widgets/sessionmenu.c"
 $6 = ($5|0)!=(0|0); //@line 32 "../widgets/sessionmenu.c"
 if (!($6)) {
  STACKTOP = sp;return; //@line 40 "../widgets/sessionmenu.c"
 }
 $7 = $0; //@line 35 "../widgets/sessionmenu.c"
 $menu_entry = $7; //@line 35 "../widgets/sessionmenu.c"
 $8 = $0; //@line 36 "../widgets/sessionmenu.c"
 $9 = ((($8)) + 4|0); //@line 36 "../widgets/sessionmenu.c"
 $10 = HEAP32[$9>>2]|0; //@line 36 "../widgets/sessionmenu.c"
 $session_menu = $10; //@line 36 "../widgets/sessionmenu.c"
 $11 = $session_menu; //@line 38 "../widgets/sessionmenu.c"
 $12 = ((($11)) + 88|0); //@line 38 "../widgets/sessionmenu.c"
 $13 = HEAP32[$12>>2]|0; //@line 38 "../widgets/sessionmenu.c"
 $14 = $menu_entry; //@line 38 "../widgets/sessionmenu.c"
 $15 = ((($14)) + 88|0); //@line 38 "../widgets/sessionmenu.c"
 $16 = HEAP32[$15>>2]|0; //@line 38 "../widgets/sessionmenu.c"
 _PatchCore_instantiate_module($13,$16); //@line 38 "../widgets/sessionmenu.c"
 $17 = $session_menu; //@line 39 "../widgets/sessionmenu.c"
 $18 = ((($17)) + 88|0); //@line 39 "../widgets/sessionmenu.c"
 $19 = HEAP32[$18>>2]|0; //@line 39 "../widgets/sessionmenu.c"
 _PatchCore_destroy_menu($19); //@line 39 "../widgets/sessionmenu.c"
 STACKTOP = sp;return; //@line 40 "../widgets/sessionmenu.c"
}
function _Slider_knob_move($knob_window,$x,$y) {
 $knob_window = $knob_window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $knob = 0, $slider = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $knob_window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 5 "../uilib/slider.c"
 $knob = $3; //@line 5 "../uilib/slider.c"
 $4 = $knob; //@line 6 "../uilib/slider.c"
 $5 = ((($4)) + 4|0); //@line 6 "../uilib/slider.c"
 $6 = HEAP32[$5>>2]|0; //@line 6 "../uilib/slider.c"
 $slider = $6; //@line 6 "../uilib/slider.c"
 $7 = $slider; //@line 8 "../uilib/slider.c"
 $8 = ($7|0)!=(0|0); //@line 8 "../uilib/slider.c"
 if (!($8)) {
  STACKTOP = sp;return; //@line 19 "../uilib/slider.c"
 }
 $9 = $2; //@line 11 "../uilib/slider.c"
 $10 = ($9|0)<(0); //@line 11 "../uilib/slider.c"
 if ($10) {
  $2 = 0; //@line 12 "../uilib/slider.c"
 }
 $11 = $2; //@line 14 "../uilib/slider.c"
 $12 = $slider; //@line 14 "../uilib/slider.c"
 $13 = ((($12)) + 18|0); //@line 14 "../uilib/slider.c"
 $14 = HEAP16[$13>>1]|0; //@line 14 "../uilib/slider.c"
 $15 = $14&65535; //@line 14 "../uilib/slider.c"
 $16 = (($15) - 10)|0; //@line 14 "../uilib/slider.c"
 $17 = ($11|0)>($16|0); //@line 14 "../uilib/slider.c"
 if ($17) {
  $18 = $slider; //@line 15 "../uilib/slider.c"
  $19 = ((($18)) + 18|0); //@line 15 "../uilib/slider.c"
  $20 = HEAP16[$19>>1]|0; //@line 15 "../uilib/slider.c"
  $21 = $20&65535; //@line 15 "../uilib/slider.c"
  $22 = (($21) - 10)|0; //@line 15 "../uilib/slider.c"
  $2 = $22; //@line 15 "../uilib/slider.c"
 }
 $23 = $slider; //@line 17 "../uilib/slider.c"
 $24 = ((($23)) + 120|0); //@line 17 "../uilib/slider.c"
 $25 = HEAP32[$24>>2]|0; //@line 17 "../uilib/slider.c"
 $26 = ($25|0)!=(0|0); //@line 17 "../uilib/slider.c"
 if (!($26)) {
  STACKTOP = sp;return; //@line 19 "../uilib/slider.c"
 }
 $27 = $slider; //@line 18 "../uilib/slider.c"
 $28 = ((($27)) + 120|0); //@line 18 "../uilib/slider.c"
 $29 = HEAP32[$28>>2]|0; //@line 18 "../uilib/slider.c"
 $30 = $0; //@line 18 "../uilib/slider.c"
 $31 = $2; //@line 18 "../uilib/slider.c"
 FUNCTION_TABLE_viii[$29 & 63]($30,0,$31); //@line 18 "../uilib/slider.c"
 STACKTOP = sp;return; //@line 19 "../uilib/slider.c"
}
function _Slider_new($x,$y,$width,$height,$min,$max) {
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 $height = $height|0;
 $min = +$min;
 $max = +$max;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0.0, $33 = 0, $34 = 0, $35 = 0.0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0.0, $50 = 0, $51 = 0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0, $slider = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $x;
 $2 = $y;
 $3 = $width;
 $4 = $height;
 $5 = $min;
 $6 = $max;
 $7 = (_malloc(128)|0); //@line 25 "../uilib/slider.c"
 $slider = $7; //@line 25 "../uilib/slider.c"
 $8 = ($7|0)!=(0|0); //@line 25 "../uilib/slider.c"
 $9 = $slider; //@line 28 "../uilib/slider.c"
 if (!($8)) {
  $0 = $9; //@line 26 "../uilib/slider.c"
  $51 = $0; //@line 50 "../uilib/slider.c"
  STACKTOP = sp;return ($51|0); //@line 50 "../uilib/slider.c"
 }
 $10 = $1; //@line 28 "../uilib/slider.c"
 $11 = $10&65535; //@line 28 "../uilib/slider.c"
 $12 = $2; //@line 28 "../uilib/slider.c"
 $13 = $12&65535; //@line 28 "../uilib/slider.c"
 $14 = $3; //@line 28 "../uilib/slider.c"
 $15 = $14&65535; //@line 28 "../uilib/slider.c"
 $16 = $4; //@line 28 "../uilib/slider.c"
 $17 = $16&65535; //@line 28 "../uilib/slider.c"
 $18 = (_Window_init($9,$11,$13,$15,$17,1,0)|0); //@line 28 "../uilib/slider.c"
 $19 = ($18|0)!=(0); //@line 28 "../uilib/slider.c"
 if (!($19)) {
  $20 = $slider; //@line 30 "../uilib/slider.c"
  _free($20); //@line 30 "../uilib/slider.c"
  $0 = 0; //@line 31 "../uilib/slider.c"
  $51 = $0; //@line 50 "../uilib/slider.c"
  STACKTOP = sp;return ($51|0); //@line 50 "../uilib/slider.c"
 }
 $21 = $3; //@line 34 "../uilib/slider.c"
 $22 = (_Frame_new(0,0,$21,10)|0); //@line 34 "../uilib/slider.c"
 $23 = $slider; //@line 34 "../uilib/slider.c"
 $24 = ((($23)) + 88|0); //@line 34 "../uilib/slider.c"
 HEAP32[$24>>2] = $22; //@line 34 "../uilib/slider.c"
 $25 = ($22|0)!=(0|0); //@line 34 "../uilib/slider.c"
 $26 = $slider; //@line 40 "../uilib/slider.c"
 if ($25) {
  $27 = $slider; //@line 40 "../uilib/slider.c"
  $28 = ((($27)) + 88|0); //@line 40 "../uilib/slider.c"
  $29 = HEAP32[$28>>2]|0; //@line 40 "../uilib/slider.c"
  _Window_insert_child($26,$29); //@line 40 "../uilib/slider.c"
  $30 = $slider; //@line 42 "../uilib/slider.c"
  $31 = ((($30)) + 96|0); //@line 42 "../uilib/slider.c"
  HEAPF64[$31>>3] = 0.0; //@line 42 "../uilib/slider.c"
  $32 = $5; //@line 43 "../uilib/slider.c"
  $33 = $slider; //@line 43 "../uilib/slider.c"
  $34 = ((($33)) + 104|0); //@line 43 "../uilib/slider.c"
  HEAPF64[$34>>3] = $32; //@line 43 "../uilib/slider.c"
  $35 = $6; //@line 44 "../uilib/slider.c"
  $36 = $slider; //@line 44 "../uilib/slider.c"
  $37 = ((($36)) + 112|0); //@line 44 "../uilib/slider.c"
  HEAPF64[$37>>3] = $35; //@line 44 "../uilib/slider.c"
  $38 = $slider; //@line 45 "../uilib/slider.c"
  $39 = ((($38)) + 88|0); //@line 45 "../uilib/slider.c"
  $40 = HEAP32[$39>>2]|0; //@line 45 "../uilib/slider.c"
  $41 = ((($40)) + 80|0); //@line 45 "../uilib/slider.c"
  $42 = HEAP32[$41>>2]|0; //@line 45 "../uilib/slider.c"
  $43 = $slider; //@line 45 "../uilib/slider.c"
  $44 = ((($43)) + 120|0); //@line 45 "../uilib/slider.c"
  HEAP32[$44>>2] = $42; //@line 45 "../uilib/slider.c"
  $45 = $slider; //@line 46 "../uilib/slider.c"
  $46 = ((($45)) + 88|0); //@line 46 "../uilib/slider.c"
  $47 = HEAP32[$46>>2]|0; //@line 46 "../uilib/slider.c"
  $48 = ((($47)) + 80|0); //@line 46 "../uilib/slider.c"
  HEAP32[$48>>2] = 26; //@line 46 "../uilib/slider.c"
  $49 = $slider; //@line 47 "../uilib/slider.c"
  HEAP32[$49>>2] = 27; //@line 47 "../uilib/slider.c"
  $50 = $slider; //@line 49 "../uilib/slider.c"
  $0 = $50; //@line 49 "../uilib/slider.c"
  $51 = $0; //@line 50 "../uilib/slider.c"
  STACKTOP = sp;return ($51|0); //@line 50 "../uilib/slider.c"
 } else {
  _Object_delete($26); //@line 36 "../uilib/slider.c"
  $0 = 0; //@line 37 "../uilib/slider.c"
  $51 = $0; //@line 50 "../uilib/slider.c"
  STACKTOP = sp;return ($51|0); //@line 50 "../uilib/slider.c"
 }
 return (0)|0;
}
function _Slider_delete_function($slider_object) {
 $slider_object = $slider_object|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $slider = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $slider_object;
 $1 = $0; //@line 79 "../uilib/slider.c"
 $slider = $1; //@line 79 "../uilib/slider.c"
 $2 = $slider; //@line 81 "../uilib/slider.c"
 $3 = ((($2)) + 88|0); //@line 81 "../uilib/slider.c"
 $4 = HEAP32[$3>>2]|0; //@line 81 "../uilib/slider.c"
 _Object_delete($4); //@line 81 "../uilib/slider.c"
 $5 = $0; //@line 82 "../uilib/slider.c"
 _Window_delete_function($5); //@line 82 "../uilib/slider.c"
 STACKTOP = sp;return; //@line 83 "../uilib/slider.c"
}
function _Slider_get_value($slider) {
 $slider = $slider|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0, $16 = 0.0, $17 = 0.0, $18 = 0.0, $19 = 0.0, $2 = 0, $20 = 0.0, $21 = 0, $22 = 0, $23 = 0.0, $24 = 0, $25 = 0, $26 = 0.0;
 var $27 = 0.0, $28 = 0.0, $29 = 0.0, $3 = 0, $30 = 0.0, $31 = 0.0, $32 = 0.0, $33 = 0, $34 = 0, $35 = 0.0, $36 = 0.0, $4 = 0, $5 = 0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0, $height = 0.0, $x = 0.0, $y = 0.0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $slider;
 $1 = $0; //@line 54 "../uilib/slider.c"
 $2 = ((($1)) + 88|0); //@line 54 "../uilib/slider.c"
 $3 = HEAP32[$2>>2]|0; //@line 54 "../uilib/slider.c"
 $4 = ((($3)) + 14|0); //@line 54 "../uilib/slider.c"
 $5 = HEAP16[$4>>1]|0; //@line 54 "../uilib/slider.c"
 $6 = (+($5<<16>>16)); //@line 54 "../uilib/slider.c"
 $y = $6; //@line 54 "../uilib/slider.c"
 $7 = $0; //@line 55 "../uilib/slider.c"
 $8 = ((($7)) + 88|0); //@line 55 "../uilib/slider.c"
 $9 = HEAP32[$8>>2]|0; //@line 55 "../uilib/slider.c"
 $10 = ((($9)) + 12|0); //@line 55 "../uilib/slider.c"
 $11 = HEAP16[$10>>1]|0; //@line 55 "../uilib/slider.c"
 $12 = (+($11<<16>>16)); //@line 55 "../uilib/slider.c"
 $x = $12; //@line 55 "../uilib/slider.c"
 $13 = $0; //@line 56 "../uilib/slider.c"
 $14 = ((($13)) + 18|0); //@line 56 "../uilib/slider.c"
 $15 = HEAP16[$14>>1]|0; //@line 56 "../uilib/slider.c"
 $16 = (+($15&65535)); //@line 56 "../uilib/slider.c"
 $height = $16; //@line 56 "../uilib/slider.c"
 $17 = $y; //@line 58 "../uilib/slider.c"
 $18 = $height; //@line 58 "../uilib/slider.c"
 $19 = $17 - $18; //@line 58 "../uilib/slider.c"
 $20 = $19 + 10.0; //@line 58 "../uilib/slider.c"
 $21 = $0; //@line 58 "../uilib/slider.c"
 $22 = ((($21)) + 112|0); //@line 58 "../uilib/slider.c"
 $23 = +HEAPF64[$22>>3]; //@line 58 "../uilib/slider.c"
 $24 = $0; //@line 58 "../uilib/slider.c"
 $25 = ((($24)) + 104|0); //@line 58 "../uilib/slider.c"
 $26 = +HEAPF64[$25>>3]; //@line 58 "../uilib/slider.c"
 $27 = $23 - $26; //@line 58 "../uilib/slider.c"
 $28 = $20 * $27; //@line 58 "../uilib/slider.c"
 $29 = $height; //@line 58 "../uilib/slider.c"
 $30 = $29 - 10.0; //@line 58 "../uilib/slider.c"
 $31 = -$30; //@line 58 "../uilib/slider.c"
 $32 = $28 / $31; //@line 58 "../uilib/slider.c"
 $33 = $0; //@line 58 "../uilib/slider.c"
 $34 = ((($33)) + 104|0); //@line 58 "../uilib/slider.c"
 $35 = +HEAPF64[$34>>3]; //@line 58 "../uilib/slider.c"
 $36 = $32 - $35; //@line 58 "../uilib/slider.c"
 STACKTOP = sp;return (+$36); //@line 58 "../uilib/slider.c"
}
function _MasterOut_new() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_Module_new(28,5224)|0); //@line 6 "../units/masterout.c"
 return ($0|0); //@line 6 "../units/masterout.c"
}
function _MasterOut_constructor($patch_core) {
 $patch_core = $patch_core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $master_out = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = (_malloc(108)|0); //@line 52 "../units/masterout.c"
 $master_out = $2; //@line 52 "../units/masterout.c"
 $3 = $master_out; //@line 54 "../units/masterout.c"
 $4 = ($3|0)!=(0|0); //@line 54 "../units/masterout.c"
 $5 = $master_out; //@line 57 "../units/masterout.c"
 if (!($4)) {
  $0 = $5; //@line 55 "../units/masterout.c"
  $51 = $0; //@line 82 "../units/masterout.c"
  STACKTOP = sp;return ($51|0); //@line 82 "../units/masterout.c"
 }
 $6 = $1; //@line 57 "../units/masterout.c"
 $7 = (_Unit_init($5,$6)|0); //@line 57 "../units/masterout.c"
 $8 = ($7|0)!=(0); //@line 57 "../units/masterout.c"
 $9 = $master_out; //@line 63 "../units/masterout.c"
 if (!($8)) {
  _Object_delete($9); //@line 59 "../units/masterout.c"
  $0 = 0; //@line 60 "../units/masterout.c"
  $51 = $0; //@line 82 "../units/masterout.c"
  STACKTOP = sp;return ($51|0); //@line 82 "../units/masterout.c"
 }
 _Object_init($9,29); //@line 63 "../units/masterout.c"
 $10 = (_Slider_new(10,10,30,130,0.0,1.0)|0); //@line 64 "../units/masterout.c"
 $11 = $master_out; //@line 64 "../units/masterout.c"
 $12 = ((($11)) + 96|0); //@line 64 "../units/masterout.c"
 HEAP32[$12>>2] = $10; //@line 64 "../units/masterout.c"
 $13 = $master_out; //@line 65 "../units/masterout.c"
 $14 = (_Unit_create_input($13,5,75)|0); //@line 65 "../units/masterout.c"
 $15 = $master_out; //@line 65 "../units/masterout.c"
 $16 = ((($15)) + 100|0); //@line 65 "../units/masterout.c"
 HEAP32[$16>>2] = $14; //@line 65 "../units/masterout.c"
 $17 = $1; //@line 66 "../units/masterout.c"
 $18 = $master_out; //@line 66 "../units/masterout.c"
 $19 = (_IO_new($17,$18,0,0,1)|0); //@line 66 "../units/masterout.c"
 $20 = $master_out; //@line 66 "../units/masterout.c"
 $21 = ((($20)) + 104|0); //@line 66 "../units/masterout.c"
 HEAP32[$21>>2] = $19; //@line 66 "../units/masterout.c"
 $22 = $master_out; //@line 68 "../units/masterout.c"
 $23 = ((($22)) + 96|0); //@line 68 "../units/masterout.c"
 $24 = HEAP32[$23>>2]|0; //@line 68 "../units/masterout.c"
 $25 = ($24|0)!=(0|0); //@line 68 "../units/masterout.c"
 if ($25) {
  $26 = $master_out; //@line 68 "../units/masterout.c"
  $27 = ((($26)) + 100|0); //@line 68 "../units/masterout.c"
  $28 = HEAP32[$27>>2]|0; //@line 68 "../units/masterout.c"
  $29 = ($28|0)!=(0|0); //@line 68 "../units/masterout.c"
  if ($29) {
   $30 = $master_out; //@line 68 "../units/masterout.c"
   $31 = ((($30)) + 104|0); //@line 68 "../units/masterout.c"
   $32 = HEAP32[$31>>2]|0; //@line 68 "../units/masterout.c"
   $33 = ($32|0)!=(0|0); //@line 68 "../units/masterout.c"
   if ($33) {
    $35 = $master_out; //@line 74 "../units/masterout.c"
    $36 = $master_out; //@line 74 "../units/masterout.c"
    $37 = ((($36)) + 96|0); //@line 74 "../units/masterout.c"
    $38 = HEAP32[$37>>2]|0; //@line 74 "../units/masterout.c"
    _Window_insert_child($35,$38); //@line 74 "../units/masterout.c"
    $39 = $master_out; //@line 75 "../units/masterout.c"
    _Window_resize($39,200,150); //@line 75 "../units/masterout.c"
    $40 = $master_out; //@line 77 "../units/masterout.c"
    $41 = ((($40)) + 104|0); //@line 77 "../units/masterout.c"
    $42 = HEAP32[$41>>2]|0; //@line 77 "../units/masterout.c"
    $43 = ((($42)) + 104|0); //@line 77 "../units/masterout.c"
    HEAP32[$43>>2] = 30; //@line 77 "../units/masterout.c"
    $44 = $master_out; //@line 78 "../units/masterout.c"
    $45 = ((($44)) + 52|0); //@line 78 "../units/masterout.c"
    HEAP32[$45>>2] = 31; //@line 78 "../units/masterout.c"
    $46 = $1; //@line 79 "../units/masterout.c"
    $47 = $master_out; //@line 79 "../units/masterout.c"
    $48 = ((($47)) + 104|0); //@line 79 "../units/masterout.c"
    $49 = HEAP32[$48>>2]|0; //@line 79 "../units/masterout.c"
    (_PatchCore_add_source($46,$49)|0); //@line 79 "../units/masterout.c"
    $50 = $master_out; //@line 81 "../units/masterout.c"
    $0 = $50; //@line 81 "../units/masterout.c"
    $51 = $0; //@line 82 "../units/masterout.c"
    STACKTOP = sp;return ($51|0); //@line 82 "../units/masterout.c"
   }
  }
 }
 $34 = $master_out; //@line 70 "../units/masterout.c"
 _Object_delete($34); //@line 70 "../units/masterout.c"
 $0 = 0; //@line 71 "../units/masterout.c"
 $51 = $0; //@line 82 "../units/masterout.c"
 STACKTOP = sp;return ($51|0); //@line 82 "../units/masterout.c"
}
function _db2gain($value) {
 $value = +$value;
 var $0 = 0.0, $1 = 0.0, $10 = 0.0, $11 = 0.0, $12 = 0.0, $13 = 0.0, $14 = 0.0, $15 = 0.0, $16 = 0.0, $17 = 0.0, $18 = 0.0, $19 = 0.0, $2 = 0.0, $20 = 0.0, $3 = 0.0, $4 = 0.0, $5 = 0.0, $6 = 0.0, $7 = 0.0, $8 = 0.0;
 var $9 = 0.0, $db_value = 0.0, $gain_value = 0.0, $max_db = 0.0, $min_db = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $value;
 $max_db = 10.0; //@line 11 "../units/masterout.c"
 $min_db = -80.0; //@line 12 "../units/masterout.c"
 $1 = $max_db; //@line 13 "../units/masterout.c"
 $2 = $min_db; //@line 13 "../units/masterout.c"
 $3 = $1 - $2; //@line 13 "../units/masterout.c"
 $4 = $0; //@line 13 "../units/masterout.c"
 $5 = $3 * $4; //@line 13 "../units/masterout.c"
 $6 = $min_db; //@line 13 "../units/masterout.c"
 $7 = $5 + $6; //@line 13 "../units/masterout.c"
 $db_value = $7; //@line 13 "../units/masterout.c"
 $8 = $db_value; //@line 14 "../units/masterout.c"
 $9 = $8 / 20.0; //@line 14 "../units/masterout.c"
 $10 = (+Math_pow(10.0,(+$9))); //@line 14 "../units/masterout.c"
 $11 = $min_db; //@line 14 "../units/masterout.c"
 $12 = $11 / 20.0; //@line 14 "../units/masterout.c"
 $13 = (+Math_pow(10.0,(+$12))); //@line 14 "../units/masterout.c"
 $14 = $10 - $13; //@line 14 "../units/masterout.c"
 $15 = $min_db; //@line 14 "../units/masterout.c"
 $16 = $15 / 20.0; //@line 14 "../units/masterout.c"
 $17 = (+Math_pow(10.0,(+$16))); //@line 14 "../units/masterout.c"
 $18 = 1.0 - $17; //@line 14 "../units/masterout.c"
 $19 = $14 / $18; //@line 14 "../units/masterout.c"
 $gain_value = $19; //@line 14 "../units/masterout.c"
 $20 = $gain_value; //@line 16 "../units/masterout.c"
 STACKTOP = sp;return (+$20); //@line 16 "../units/masterout.c"
}
function _MasterOut_pull_sample_handler($io,$sample_l,$sample_r) {
 $io = $io|0;
 $sample_l = $sample_l|0;
 $sample_r = $sample_r|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0.0, $16 = 0.0, $17 = 0, $18 = 0.0, $19 = 0.0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0.0, $24 = 0.0, $25 = 0, $26 = 0.0;
 var $27 = 0.0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $master_out = 0, $retval = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $io;
 $1 = $sample_l;
 $2 = $sample_r;
 $3 = $0; //@line 21 "../units/masterout.c"
 $4 = ((($3)) + 96|0); //@line 21 "../units/masterout.c"
 $5 = HEAP32[$4>>2]|0; //@line 21 "../units/masterout.c"
 $master_out = $5; //@line 21 "../units/masterout.c"
 $6 = $master_out; //@line 23 "../units/masterout.c"
 $7 = ((($6)) + 100|0); //@line 23 "../units/masterout.c"
 $8 = HEAP32[$7>>2]|0; //@line 23 "../units/masterout.c"
 $9 = $1; //@line 23 "../units/masterout.c"
 $10 = $2; //@line 23 "../units/masterout.c"
 $11 = (_IO_pull_sample($8,$9,$10)|0); //@line 23 "../units/masterout.c"
 $retval = $11; //@line 23 "../units/masterout.c"
 $12 = $master_out; //@line 25 "../units/masterout.c"
 $13 = ((($12)) + 96|0); //@line 25 "../units/masterout.c"
 $14 = HEAP32[$13>>2]|0; //@line 25 "../units/masterout.c"
 $15 = (+_Slider_get_value($14)); //@line 25 "../units/masterout.c"
 $16 = (+_db2gain($15)); //@line 25 "../units/masterout.c"
 $17 = $1; //@line 25 "../units/masterout.c"
 $18 = +HEAPF64[$17>>3]; //@line 25 "../units/masterout.c"
 $19 = $18 * $16; //@line 25 "../units/masterout.c"
 HEAPF64[$17>>3] = $19; //@line 25 "../units/masterout.c"
 $20 = $master_out; //@line 26 "../units/masterout.c"
 $21 = ((($20)) + 96|0); //@line 26 "../units/masterout.c"
 $22 = HEAP32[$21>>2]|0; //@line 26 "../units/masterout.c"
 $23 = (+_Slider_get_value($22)); //@line 26 "../units/masterout.c"
 $24 = (+_db2gain($23)); //@line 26 "../units/masterout.c"
 $25 = $2; //@line 26 "../units/masterout.c"
 $26 = +HEAPF64[$25>>3]; //@line 26 "../units/masterout.c"
 $27 = $26 * $24; //@line 26 "../units/masterout.c"
 HEAPF64[$25>>3] = $27; //@line 26 "../units/masterout.c"
 $28 = $retval; //@line 28 "../units/masterout.c"
 STACKTOP = sp;return ($28|0); //@line 28 "../units/masterout.c"
}
function _MasterOut_delete_function($master_out_object) {
 $master_out_object = $master_out_object|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $master_out = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $master_out_object;
 $1 = $0; //@line 33 "../units/masterout.c"
 $master_out = $1; //@line 33 "../units/masterout.c"
 $2 = $master_out; //@line 37 "../units/masterout.c"
 $3 = ((($2)) + 104|0); //@line 37 "../units/masterout.c"
 $4 = HEAP32[$3>>2]|0; //@line 37 "../units/masterout.c"
 _Object_delete($4); //@line 37 "../units/masterout.c"
 $5 = $0; //@line 38 "../units/masterout.c"
 _Unit_delete($5); //@line 38 "../units/masterout.c"
 STACKTOP = sp;return; //@line 39 "../units/masterout.c"
}
function _MasterOut_paint_handler($master_out_window) {
 $master_out_window = $master_out_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $master_out_window;
 $1 = $0; //@line 43 "../units/masterout.c"
 _Frame_paint_handler($1); //@line 43 "../units/masterout.c"
 $2 = $0; //@line 44 "../units/masterout.c"
 $3 = ((($2)) + 24|0); //@line 44 "../units/masterout.c"
 $4 = HEAP32[$3>>2]|0; //@line 44 "../units/masterout.c"
 $5 = $0; //@line 45 "../units/masterout.c"
 $6 = ((($5)) + 16|0); //@line 45 "../units/masterout.c"
 $7 = HEAP16[$6>>1]|0; //@line 45 "../units/masterout.c"
 $8 = $7&65535; //@line 45 "../units/masterout.c"
 $9 = (($8|0) / 2)&-1; //@line 45 "../units/masterout.c"
 $10 = (($9) - 40)|0; //@line 45 "../units/masterout.c"
 $11 = $0; //@line 46 "../units/masterout.c"
 $12 = ((($11)) + 18|0); //@line 46 "../units/masterout.c"
 $13 = HEAP16[$12>>1]|0; //@line 46 "../units/masterout.c"
 $14 = $13&65535; //@line 46 "../units/masterout.c"
 $15 = (($14|0) / 2)&-1; //@line 46 "../units/masterout.c"
 $16 = (($15) - 6)|0; //@line 46 "../units/masterout.c"
 _Context_draw_text($4,5224,$10,$16,-16777216); //@line 44 "../units/masterout.c"
 STACKTOP = sp;return; //@line 48 "../units/masterout.c"
}
function _Noise_new() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_Module_new(32,5235)|0); //@line 8 "../units/noise.c"
 return ($0|0); //@line 8 "../units/noise.c"
}
function _Noise_constructor($patch_core) {
 $patch_core = $patch_core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $noise = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = (_malloc(100)|0); //@line 42 "../units/noise.c"
 $noise = $2; //@line 42 "../units/noise.c"
 $3 = $noise; //@line 44 "../units/noise.c"
 $4 = ($3|0)!=(0|0); //@line 44 "../units/noise.c"
 $5 = $noise; //@line 47 "../units/noise.c"
 if (!($4)) {
  $0 = $5; //@line 45 "../units/noise.c"
  $25 = $0; //@line 66 "../units/noise.c"
  STACKTOP = sp;return ($25|0); //@line 66 "../units/noise.c"
 }
 $6 = $1; //@line 47 "../units/noise.c"
 $7 = (_Unit_init($5,$6)|0); //@line 47 "../units/noise.c"
 $8 = ($7|0)!=(0); //@line 47 "../units/noise.c"
 $9 = $noise; //@line 53 "../units/noise.c"
 if (!($8)) {
  _Object_delete($9); //@line 49 "../units/noise.c"
  $0 = 0; //@line 50 "../units/noise.c"
  $25 = $0; //@line 66 "../units/noise.c"
  STACKTOP = sp;return ($25|0); //@line 66 "../units/noise.c"
 }
 $10 = (_Unit_create_output($9,195,75)|0); //@line 53 "../units/noise.c"
 $11 = $noise; //@line 53 "../units/noise.c"
 $12 = ((($11)) + 96|0); //@line 53 "../units/noise.c"
 HEAP32[$12>>2] = $10; //@line 53 "../units/noise.c"
 $13 = $noise; //@line 54 "../units/noise.c"
 _Window_resize($13,200,150); //@line 54 "../units/noise.c"
 $14 = $noise; //@line 56 "../units/noise.c"
 $15 = ((($14)) + 96|0); //@line 56 "../units/noise.c"
 $16 = HEAP32[$15>>2]|0; //@line 56 "../units/noise.c"
 $17 = ($16|0)!=(0|0); //@line 56 "../units/noise.c"
 $18 = $noise; //@line 62 "../units/noise.c"
 if ($17) {
  $19 = ((($18)) + 96|0); //@line 62 "../units/noise.c"
  $20 = HEAP32[$19>>2]|0; //@line 62 "../units/noise.c"
  $21 = ((($20)) + 104|0); //@line 62 "../units/noise.c"
  HEAP32[$21>>2] = 33; //@line 62 "../units/noise.c"
  $22 = $noise; //@line 63 "../units/noise.c"
  $23 = ((($22)) + 52|0); //@line 63 "../units/noise.c"
  HEAP32[$23>>2] = 34; //@line 63 "../units/noise.c"
  $24 = $noise; //@line 65 "../units/noise.c"
  $0 = $24; //@line 65 "../units/noise.c"
  $25 = $0; //@line 66 "../units/noise.c"
  STACKTOP = sp;return ($25|0); //@line 66 "../units/noise.c"
 } else {
  _Object_delete($18); //@line 58 "../units/noise.c"
  $0 = 0; //@line 59 "../units/noise.c"
  $25 = $0; //@line 66 "../units/noise.c"
  STACKTOP = sp;return ($25|0); //@line 66 "../units/noise.c"
 }
 return (0)|0;
}
function _double_rand() {
 var $0 = 0, $1 = 0, $2 = 0.0, $3 = 0.0, $4 = 0.0, $5 = 0.0, $t = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $t = sp;
 $0 = (_time(($t|0))|0); //@line 15 "../units/noise.c"
 _srand($0); //@line 15 "../units/noise.c"
 $1 = (_rand()|0); //@line 16 "../units/noise.c"
 $2 = (+($1|0)); //@line 16 "../units/noise.c"
 $3 = $2 / 2147483647.0; //@line 16 "../units/noise.c"
 $4 = $3 - 0.5; //@line 16 "../units/noise.c"
 $5 = $4 * 2.0; //@line 16 "../units/noise.c"
 STACKTOP = sp;return (+$5); //@line 16 "../units/noise.c"
}
function _Noise_pull_sample_handler($io,$sample_l,$sample_r) {
 $io = $io|0;
 $sample_l = $sample_l|0;
 $sample_r = $sample_r|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0.0, $7 = 0, $8 = 0.0, $9 = 0, $noise = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $io;
 $1 = $sample_l;
 $2 = $sample_r;
 $3 = $0; //@line 22 "../units/noise.c"
 $4 = ((($3)) + 96|0); //@line 22 "../units/noise.c"
 $5 = HEAP32[$4>>2]|0; //@line 22 "../units/noise.c"
 $noise = $5; //@line 22 "../units/noise.c"
 $6 = (+_double_rand()); //@line 25 "../units/noise.c"
 $7 = $1; //@line 25 "../units/noise.c"
 HEAPF64[$7>>3] = $6; //@line 25 "../units/noise.c"
 $8 = (+_double_rand()); //@line 26 "../units/noise.c"
 $9 = $2; //@line 26 "../units/noise.c"
 HEAPF64[$9>>3] = $8; //@line 26 "../units/noise.c"
 STACKTOP = sp;return 1; //@line 28 "../units/noise.c"
}
function _Noise_paint_handler($noise_window) {
 $noise_window = $noise_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $noise_window;
 $1 = $0; //@line 33 "../units/noise.c"
 _Frame_paint_handler($1); //@line 33 "../units/noise.c"
 $2 = $0; //@line 34 "../units/noise.c"
 $3 = ((($2)) + 24|0); //@line 34 "../units/noise.c"
 $4 = HEAP32[$3>>2]|0; //@line 34 "../units/noise.c"
 $5 = $0; //@line 35 "../units/noise.c"
 $6 = ((($5)) + 16|0); //@line 35 "../units/noise.c"
 $7 = HEAP16[$6>>1]|0; //@line 35 "../units/noise.c"
 $8 = $7&65535; //@line 35 "../units/noise.c"
 $9 = (($8|0) / 2)&-1; //@line 35 "../units/noise.c"
 $10 = (($9) - 20)|0; //@line 35 "../units/noise.c"
 $11 = $0; //@line 36 "../units/noise.c"
 $12 = ((($11)) + 18|0); //@line 36 "../units/noise.c"
 $13 = HEAP16[$12>>1]|0; //@line 36 "../units/noise.c"
 $14 = $13&65535; //@line 36 "../units/noise.c"
 $15 = (($14|0) / 2)&-1; //@line 36 "../units/noise.c"
 $16 = (($15) - 6)|0; //@line 36 "../units/noise.c"
 _Context_draw_text($4,5235,$10,$16,-16777216); //@line 34 "../units/noise.c"
 STACKTOP = sp;return; //@line 38 "../units/noise.c"
}
function _PitchKnob_new() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_Module_new(35,5241)|0); //@line 6 "../units/pitchknob.c"
 return ($0|0); //@line 6 "../units/pitchknob.c"
}
function _PitchKnob_constructor($patch_core) {
 $patch_core = $patch_core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $pitch_knob = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = (_malloc(104)|0); //@line 21 "../units/pitchknob.c"
 $pitch_knob = $2; //@line 21 "../units/pitchknob.c"
 $3 = $pitch_knob; //@line 23 "../units/pitchknob.c"
 $4 = ($3|0)!=(0|0); //@line 23 "../units/pitchknob.c"
 $5 = $pitch_knob; //@line 26 "../units/pitchknob.c"
 if (!($4)) {
  $0 = $5; //@line 24 "../units/pitchknob.c"
  $40 = $0; //@line 49 "../units/pitchknob.c"
  STACKTOP = sp;return ($40|0); //@line 49 "../units/pitchknob.c"
 }
 $6 = $1; //@line 26 "../units/pitchknob.c"
 $7 = (_Unit_init($5,$6)|0); //@line 26 "../units/pitchknob.c"
 $8 = ($7|0)!=(0); //@line 26 "../units/pitchknob.c"
 if (!($8)) {
  $9 = $pitch_knob; //@line 28 "../units/pitchknob.c"
  _Object_delete($9); //@line 28 "../units/pitchknob.c"
  $0 = 0; //@line 29 "../units/pitchknob.c"
  $40 = $0; //@line 49 "../units/pitchknob.c"
  STACKTOP = sp;return ($40|0); //@line 49 "../units/pitchknob.c"
 }
 $10 = (_Slider_new(10,10,30,130,0.0,1.0)|0); //@line 32 "../units/pitchknob.c"
 $11 = $pitch_knob; //@line 32 "../units/pitchknob.c"
 $12 = ((($11)) + 100|0); //@line 32 "../units/pitchknob.c"
 HEAP32[$12>>2] = $10; //@line 32 "../units/pitchknob.c"
 $13 = $pitch_knob; //@line 34 "../units/pitchknob.c"
 $14 = ((($13)) + 100|0); //@line 34 "../units/pitchknob.c"
 $15 = HEAP32[$14>>2]|0; //@line 34 "../units/pitchknob.c"
 $16 = ($15|0)!=(0|0); //@line 34 "../units/pitchknob.c"
 if ($16) {
  $17 = $pitch_knob; //@line 35 "../units/pitchknob.c"
  $18 = $pitch_knob; //@line 35 "../units/pitchknob.c"
  $19 = ((($18)) + 100|0); //@line 35 "../units/pitchknob.c"
  $20 = HEAP32[$19>>2]|0; //@line 35 "../units/pitchknob.c"
  _Window_insert_child($17,$20); //@line 35 "../units/pitchknob.c"
 }
 $21 = $pitch_knob; //@line 37 "../units/pitchknob.c"
 $22 = (_Unit_create_output($21,45,75)|0); //@line 37 "../units/pitchknob.c"
 $23 = $pitch_knob; //@line 37 "../units/pitchknob.c"
 $24 = ((($23)) + 96|0); //@line 37 "../units/pitchknob.c"
 HEAP32[$24>>2] = $22; //@line 37 "../units/pitchknob.c"
 $25 = $pitch_knob; //@line 39 "../units/pitchknob.c"
 $26 = ((($25)) + 100|0); //@line 39 "../units/pitchknob.c"
 $27 = HEAP32[$26>>2]|0; //@line 39 "../units/pitchknob.c"
 $28 = ($27|0)!=(0|0); //@line 39 "../units/pitchknob.c"
 if ($28) {
  $29 = $pitch_knob; //@line 39 "../units/pitchknob.c"
  $30 = ((($29)) + 96|0); //@line 39 "../units/pitchknob.c"
  $31 = HEAP32[$30>>2]|0; //@line 39 "../units/pitchknob.c"
  $32 = ($31|0)!=(0|0); //@line 39 "../units/pitchknob.c"
  if ($32) {
   $34 = $pitch_knob; //@line 45 "../units/pitchknob.c"
   _Window_resize($34,50,150); //@line 45 "../units/pitchknob.c"
   $35 = $pitch_knob; //@line 46 "../units/pitchknob.c"
   $36 = ((($35)) + 96|0); //@line 46 "../units/pitchknob.c"
   $37 = HEAP32[$36>>2]|0; //@line 46 "../units/pitchknob.c"
   $38 = ((($37)) + 104|0); //@line 46 "../units/pitchknob.c"
   HEAP32[$38>>2] = 36; //@line 46 "../units/pitchknob.c"
   $39 = $pitch_knob; //@line 48 "../units/pitchknob.c"
   $0 = $39; //@line 48 "../units/pitchknob.c"
   $40 = $0; //@line 49 "../units/pitchknob.c"
   STACKTOP = sp;return ($40|0); //@line 49 "../units/pitchknob.c"
  }
 }
 $33 = $pitch_knob; //@line 41 "../units/pitchknob.c"
 _Object_delete($33); //@line 41 "../units/pitchknob.c"
 $0 = 0; //@line 42 "../units/pitchknob.c"
 $40 = $0; //@line 49 "../units/pitchknob.c"
 STACKTOP = sp;return ($40|0); //@line 49 "../units/pitchknob.c"
}
function _PitchKnob_pull_sample_handler($io,$sample_l,$sample_r) {
 $io = $io|0;
 $sample_l = $sample_l|0;
 $sample_r = $sample_r|0;
 var $0 = 0, $1 = 0, $10 = 0.0, $11 = 0.0, $12 = 0.0, $13 = 0.0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0.0, $pitch_knob = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $io;
 $1 = $sample_l;
 $2 = $sample_r;
 $3 = $0; //@line 11 "../units/pitchknob.c"
 $4 = ((($3)) + 96|0); //@line 11 "../units/pitchknob.c"
 $5 = HEAP32[$4>>2]|0; //@line 11 "../units/pitchknob.c"
 $pitch_knob = $5; //@line 11 "../units/pitchknob.c"
 $6 = $pitch_knob; //@line 14 "../units/pitchknob.c"
 $7 = ((($6)) + 100|0); //@line 14 "../units/pitchknob.c"
 $8 = HEAP32[$7>>2]|0; //@line 14 "../units/pitchknob.c"
 $9 = (+_Slider_get_value($8)); //@line 14 "../units/pitchknob.c"
 $10 = 1.0 - $9; //@line 14 "../units/pitchknob.c"
 $11 = $10 * 6.0; //@line 14 "../units/pitchknob.c"
 $12 = (+Math_pow(2.0,(+$11))); //@line 14 "../units/pitchknob.c"
 $13 = 2.0 * $12; //@line 14 "../units/pitchknob.c"
 $14 = $2; //@line 13 "../units/pitchknob.c"
 HEAPF64[$14>>3] = $13; //@line 13 "../units/pitchknob.c"
 $15 = $1; //@line 13 "../units/pitchknob.c"
 HEAPF64[$15>>3] = $13; //@line 13 "../units/pitchknob.c"
 STACKTOP = sp;return 1; //@line 16 "../units/pitchknob.c"
}
function _Sequence_new() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_Module_new(37,5252)|0); //@line 5 "../units/sequence.c"
 return ($0|0); //@line 5 "../units/sequence.c"
}
function _Sequence_constructor($patch_core) {
 $patch_core = $patch_core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $i = 0, $sequence = 0, $temp_input = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = (_malloc(128)|0); //@line 69 "../units/sequence.c"
 $sequence = $2; //@line 69 "../units/sequence.c"
 $3 = $sequence; //@line 71 "../units/sequence.c"
 $4 = ($3|0)!=(0|0); //@line 71 "../units/sequence.c"
 $5 = $sequence; //@line 74 "../units/sequence.c"
 if (!($4)) {
  $0 = $5; //@line 72 "../units/sequence.c"
  $61 = $0; //@line 120 "../units/sequence.c"
  STACKTOP = sp;return ($61|0); //@line 120 "../units/sequence.c"
 }
 $6 = $1; //@line 74 "../units/sequence.c"
 $7 = (_Unit_init($5,$6)|0); //@line 74 "../units/sequence.c"
 $8 = ($7|0)!=(0); //@line 74 "../units/sequence.c"
 $9 = $sequence; //@line 80 "../units/sequence.c"
 if (!($8)) {
  _Object_delete($9); //@line 76 "../units/sequence.c"
  $0 = 0; //@line 77 "../units/sequence.c"
  $61 = $0; //@line 120 "../units/sequence.c"
  STACKTOP = sp;return ($61|0); //@line 120 "../units/sequence.c"
 }
 _Object_init($9,38); //@line 80 "../units/sequence.c"
 $10 = (_List_new()|0); //@line 82 "../units/sequence.c"
 $11 = $sequence; //@line 82 "../units/sequence.c"
 $12 = ((($11)) + 104|0); //@line 82 "../units/sequence.c"
 HEAP32[$12>>2] = $10; //@line 82 "../units/sequence.c"
 $13 = $sequence; //@line 84 "../units/sequence.c"
 $14 = ((($13)) + 104|0); //@line 84 "../units/sequence.c"
 $15 = HEAP32[$14>>2]|0; //@line 84 "../units/sequence.c"
 $16 = ($15|0)!=(0|0); //@line 84 "../units/sequence.c"
 if (!($16)) {
  $17 = $sequence; //@line 86 "../units/sequence.c"
  _Object_delete($17); //@line 86 "../units/sequence.c"
  $0 = 0; //@line 87 "../units/sequence.c"
  $61 = $0; //@line 120 "../units/sequence.c"
  STACKTOP = sp;return ($61|0); //@line 120 "../units/sequence.c"
 }
 $i = 0; //@line 91 "../units/sequence.c"
 while(1) {
  $18 = $i; //@line 91 "../units/sequence.c"
  $19 = ($18|0)<(8); //@line 91 "../units/sequence.c"
  $20 = $sequence; //@line 93 "../units/sequence.c"
  if (!($19)) {
   break;
  }
  $21 = $i; //@line 93 "../units/sequence.c"
  $22 = (($21) + 1)|0; //@line 93 "../units/sequence.c"
  $23 = ($22*20)|0; //@line 93 "../units/sequence.c"
  $24 = (_Unit_create_input($20,$23,5)|0); //@line 93 "../units/sequence.c"
  $temp_input = $24; //@line 93 "../units/sequence.c"
  $25 = $temp_input; //@line 95 "../units/sequence.c"
  $26 = ($25|0)!=(0|0); //@line 95 "../units/sequence.c"
  $27 = $sequence; //@line 101 "../units/sequence.c"
  if (!($26)) {
   label = 10;
   break;
  }
  $28 = ((($27)) + 104|0); //@line 101 "../units/sequence.c"
  $29 = HEAP32[$28>>2]|0; //@line 101 "../units/sequence.c"
  $30 = $temp_input; //@line 101 "../units/sequence.c"
  (_List_add($29,$30)|0); //@line 101 "../units/sequence.c"
  $31 = $i; //@line 91 "../units/sequence.c"
  $32 = (($31) + 1)|0; //@line 91 "../units/sequence.c"
  $i = $32; //@line 91 "../units/sequence.c"
 }
 if ((label|0) == 10) {
  _Object_delete($27); //@line 97 "../units/sequence.c"
  $0 = 0; //@line 98 "../units/sequence.c"
  $61 = $0; //@line 120 "../units/sequence.c"
  STACKTOP = sp;return ($61|0); //@line 120 "../units/sequence.c"
 }
 $33 = (_Unit_create_output($20,195,75)|0); //@line 104 "../units/sequence.c"
 $34 = $sequence; //@line 104 "../units/sequence.c"
 $35 = ((($34)) + 96|0); //@line 104 "../units/sequence.c"
 HEAP32[$35>>2] = $33; //@line 104 "../units/sequence.c"
 $36 = $sequence; //@line 105 "../units/sequence.c"
 $37 = (_Unit_create_input($36,5,75)|0); //@line 105 "../units/sequence.c"
 $38 = $sequence; //@line 105 "../units/sequence.c"
 $39 = ((($38)) + 100|0); //@line 105 "../units/sequence.c"
 HEAP32[$39>>2] = $37; //@line 105 "../units/sequence.c"
 $40 = $sequence; //@line 107 "../units/sequence.c"
 $41 = ((($40)) + 100|0); //@line 107 "../units/sequence.c"
 $42 = HEAP32[$41>>2]|0; //@line 107 "../units/sequence.c"
 $43 = ($42|0)!=(0|0); //@line 107 "../units/sequence.c"
 if ($43) {
  $44 = $sequence; //@line 107 "../units/sequence.c"
  $45 = ((($44)) + 96|0); //@line 107 "../units/sequence.c"
  $46 = HEAP32[$45>>2]|0; //@line 107 "../units/sequence.c"
  $47 = ($46|0)!=(0|0); //@line 107 "../units/sequence.c"
  if ($47) {
   $49 = $sequence; //@line 113 "../units/sequence.c"
   _Window_resize($49,200,150); //@line 113 "../units/sequence.c"
   $50 = $sequence; //@line 114 "../units/sequence.c"
   $51 = ((($50)) + 96|0); //@line 114 "../units/sequence.c"
   $52 = HEAP32[$51>>2]|0; //@line 114 "../units/sequence.c"
   $53 = ((($52)) + 104|0); //@line 114 "../units/sequence.c"
   HEAP32[$53>>2] = 39; //@line 114 "../units/sequence.c"
   $54 = $sequence; //@line 115 "../units/sequence.c"
   $55 = ((($54)) + 120|0); //@line 115 "../units/sequence.c"
   HEAP32[$55>>2] = 0; //@line 115 "../units/sequence.c"
   $56 = $sequence; //@line 116 "../units/sequence.c"
   $57 = ((($56)) + 112|0); //@line 116 "../units/sequence.c"
   HEAPF64[$57>>3] = 0.0; //@line 116 "../units/sequence.c"
   $58 = $sequence; //@line 117 "../units/sequence.c"
   $59 = ((($58)) + 52|0); //@line 117 "../units/sequence.c"
   HEAP32[$59>>2] = 40; //@line 117 "../units/sequence.c"
   $60 = $sequence; //@line 119 "../units/sequence.c"
   $0 = $60; //@line 119 "../units/sequence.c"
   $61 = $0; //@line 120 "../units/sequence.c"
   STACKTOP = sp;return ($61|0); //@line 120 "../units/sequence.c"
  }
 }
 $48 = $sequence; //@line 109 "../units/sequence.c"
 _Object_delete($48); //@line 109 "../units/sequence.c"
 $0 = 0; //@line 110 "../units/sequence.c"
 $61 = $0; //@line 120 "../units/sequence.c"
 STACKTOP = sp;return ($61|0); //@line 120 "../units/sequence.c"
}
function _Sequence_pull_sample_handler($io,$sample_l,$sample_r) {
 $io = $io|0;
 $sample_l = $sample_l|0;
 $sample_r = $sample_r|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0, $16 = 0.0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0.0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0.0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0.0, $56 = 0, $57 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $current_clock_sample_l = 0, $current_clock_sample_r = 0;
 var $i = 0, $sequence = 0, $step_sample_l = 0, $step_sample_r = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 176|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $current_clock_sample_l = sp + 136|0;
 $current_clock_sample_r = sp + 128|0;
 $step_sample_l = sp + 64|0;
 $step_sample_r = sp;
 $1 = $io;
 $2 = $sample_l;
 $3 = $sample_r;
 $4 = $1; //@line 10 "../units/sequence.c"
 $5 = ((($4)) + 96|0); //@line 10 "../units/sequence.c"
 $6 = HEAP32[$5>>2]|0; //@line 10 "../units/sequence.c"
 $sequence = $6; //@line 10 "../units/sequence.c"
 $7 = $sequence; //@line 18 "../units/sequence.c"
 $8 = ((($7)) + 100|0); //@line 18 "../units/sequence.c"
 $9 = HEAP32[$8>>2]|0; //@line 18 "../units/sequence.c"
 $10 = (_IO_pull_sample($9,$current_clock_sample_l,$current_clock_sample_r)|0); //@line 18 "../units/sequence.c"
 $11 = ($10|0)!=(0); //@line 18 "../units/sequence.c"
 if (!($11)) {
  $0 = 0; //@line 19 "../units/sequence.c"
  $57 = $0; //@line 40 "../units/sequence.c"
  STACKTOP = sp;return ($57|0); //@line 40 "../units/sequence.c"
 }
 $12 = +HEAPF64[$current_clock_sample_l>>3]; //@line 21 "../units/sequence.c"
 $13 = $12 > 0.0; //@line 21 "../units/sequence.c"
 if ($13) {
  $14 = $sequence; //@line 21 "../units/sequence.c"
  $15 = ((($14)) + 112|0); //@line 21 "../units/sequence.c"
  $16 = +HEAPF64[$15>>3]; //@line 21 "../units/sequence.c"
  $17 = $16 <= 0.0; //@line 21 "../units/sequence.c"
  if ($17) {
   $18 = $sequence; //@line 22 "../units/sequence.c"
   $19 = ((($18)) + 120|0); //@line 22 "../units/sequence.c"
   $20 = HEAP32[$19>>2]|0; //@line 22 "../units/sequence.c"
   $21 = (($20) + 1)|0; //@line 22 "../units/sequence.c"
   HEAP32[$19>>2] = $21; //@line 22 "../units/sequence.c"
  }
 }
 $22 = +HEAPF64[$current_clock_sample_l>>3]; //@line 24 "../units/sequence.c"
 $23 = $sequence; //@line 24 "../units/sequence.c"
 $24 = ((($23)) + 112|0); //@line 24 "../units/sequence.c"
 HEAPF64[$24>>3] = $22; //@line 24 "../units/sequence.c"
 $25 = $sequence; //@line 26 "../units/sequence.c"
 $26 = ((($25)) + 120|0); //@line 26 "../units/sequence.c"
 $27 = HEAP32[$26>>2]|0; //@line 26 "../units/sequence.c"
 $28 = ($27|0)==(8); //@line 26 "../units/sequence.c"
 if ($28) {
  $29 = $sequence; //@line 27 "../units/sequence.c"
  $30 = ((($29)) + 120|0); //@line 27 "../units/sequence.c"
  HEAP32[$30>>2] = 0; //@line 27 "../units/sequence.c"
 }
 $i = 0; //@line 29 "../units/sequence.c"
 while(1) {
  $31 = $i; //@line 29 "../units/sequence.c"
  $32 = ($31|0)<(8); //@line 29 "../units/sequence.c"
  $33 = $sequence; //@line 31 "../units/sequence.c"
  if (!($32)) {
   label = 13;
   break;
  }
  $34 = ((($33)) + 104|0); //@line 31 "../units/sequence.c"
  $35 = HEAP32[$34>>2]|0; //@line 31 "../units/sequence.c"
  $36 = $i; //@line 31 "../units/sequence.c"
  $37 = (_List_get_at($35,$36)|0); //@line 31 "../units/sequence.c"
  $38 = $i; //@line 32 "../units/sequence.c"
  $39 = (($step_sample_l) + ($38<<3)|0); //@line 32 "../units/sequence.c"
  $40 = $i; //@line 32 "../units/sequence.c"
  $41 = (($step_sample_r) + ($40<<3)|0); //@line 32 "../units/sequence.c"
  $42 = (_IO_pull_sample($37,$39,$41)|0); //@line 31 "../units/sequence.c"
  $43 = ($42|0)!=(0); //@line 31 "../units/sequence.c"
  if (!($43)) {
   label = 11;
   break;
  }
  $44 = $i; //@line 29 "../units/sequence.c"
  $45 = (($44) + 1)|0; //@line 29 "../units/sequence.c"
  $i = $45; //@line 29 "../units/sequence.c"
 }
 if ((label|0) == 11) {
  $0 = 0; //@line 33 "../units/sequence.c"
  $57 = $0; //@line 40 "../units/sequence.c"
  STACKTOP = sp;return ($57|0); //@line 40 "../units/sequence.c"
 }
 else if ((label|0) == 13) {
  $46 = ((($33)) + 120|0); //@line 36 "../units/sequence.c"
  $47 = HEAP32[$46>>2]|0; //@line 36 "../units/sequence.c"
  $48 = (($step_sample_l) + ($47<<3)|0); //@line 36 "../units/sequence.c"
  $49 = +HEAPF64[$48>>3]; //@line 36 "../units/sequence.c"
  $50 = $2; //@line 36 "../units/sequence.c"
  HEAPF64[$50>>3] = $49; //@line 36 "../units/sequence.c"
  $51 = $sequence; //@line 37 "../units/sequence.c"
  $52 = ((($51)) + 120|0); //@line 37 "../units/sequence.c"
  $53 = HEAP32[$52>>2]|0; //@line 37 "../units/sequence.c"
  $54 = (($step_sample_r) + ($53<<3)|0); //@line 37 "../units/sequence.c"
  $55 = +HEAPF64[$54>>3]; //@line 37 "../units/sequence.c"
  $56 = $3; //@line 37 "../units/sequence.c"
  HEAPF64[$56>>3] = $55; //@line 37 "../units/sequence.c"
  $0 = 1; //@line 39 "../units/sequence.c"
  $57 = $0; //@line 40 "../units/sequence.c"
  STACKTOP = sp;return ($57|0); //@line 40 "../units/sequence.c"
 }
 return (0)|0;
}
function _Sequence_delete_function($sequence_object) {
 $sequence_object = $sequence_object|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $sequence = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $sequence_object;
 $1 = $0; //@line 44 "../units/sequence.c"
 $sequence = $1; //@line 44 "../units/sequence.c"
 while(1) {
  $2 = $sequence; //@line 48 "../units/sequence.c"
  $3 = ((($2)) + 104|0); //@line 48 "../units/sequence.c"
  $4 = HEAP32[$3>>2]|0; //@line 48 "../units/sequence.c"
  $5 = ($4|0)!=(0|0); //@line 48 "../units/sequence.c"
  if ($5) {
   $6 = $sequence; //@line 48 "../units/sequence.c"
   $7 = ((($6)) + 104|0); //@line 48 "../units/sequence.c"
   $8 = HEAP32[$7>>2]|0; //@line 48 "../units/sequence.c"
   $9 = ((($8)) + 4|0); //@line 48 "../units/sequence.c"
   $10 = HEAP32[$9>>2]|0; //@line 48 "../units/sequence.c"
   $11 = ($10|0)!=(0); //@line 48 "../units/sequence.c"
   $16 = $11;
  } else {
   $16 = 0;
  }
  $12 = $sequence; //@line 49 "../units/sequence.c"
  $13 = ((($12)) + 104|0); //@line 49 "../units/sequence.c"
  $14 = HEAP32[$13>>2]|0; //@line 49 "../units/sequence.c"
  if (!($16)) {
   break;
  }
  (_List_remove_at($14,0)|0); //@line 49 "../units/sequence.c"
 }
 _Object_delete($14); //@line 52 "../units/sequence.c"
 $15 = $0; //@line 53 "../units/sequence.c"
 _Unit_delete($15); //@line 53 "../units/sequence.c"
 STACKTOP = sp;return; //@line 54 "../units/sequence.c"
}
function _Sequence_paint_handler($sequence_window) {
 $sequence_window = $sequence_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $sequence_window;
 $1 = $0; //@line 58 "../units/sequence.c"
 _Frame_paint_handler($1); //@line 58 "../units/sequence.c"
 $2 = $0; //@line 59 "../units/sequence.c"
 $3 = ((($2)) + 24|0); //@line 59 "../units/sequence.c"
 $4 = HEAP32[$3>>2]|0; //@line 59 "../units/sequence.c"
 $5 = $0; //@line 60 "../units/sequence.c"
 $6 = ((($5)) + 16|0); //@line 60 "../units/sequence.c"
 $7 = HEAP16[$6>>1]|0; //@line 60 "../units/sequence.c"
 $8 = $7&65535; //@line 60 "../units/sequence.c"
 $9 = (($8|0) / 2)&-1; //@line 60 "../units/sequence.c"
 $10 = (($9) - 32)|0; //@line 60 "../units/sequence.c"
 $11 = $0; //@line 61 "../units/sequence.c"
 $12 = ((($11)) + 18|0); //@line 61 "../units/sequence.c"
 $13 = HEAP16[$12>>1]|0; //@line 61 "../units/sequence.c"
 $14 = $13&65535; //@line 61 "../units/sequence.c"
 $15 = (($14|0) / 2)&-1; //@line 61 "../units/sequence.c"
 $16 = (($15) - 6)|0; //@line 61 "../units/sequence.c"
 _Context_draw_text($4,5252,$10,$16,-16777216); //@line 59 "../units/sequence.c"
 STACKTOP = sp;return; //@line 63 "../units/sequence.c"
}
function _Sine_new() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_Module_new(41,5261)|0); //@line 7 "../units/sine.c"
 return ($0|0); //@line 7 "../units/sine.c"
}
function _Sine_constructor($patch_core) {
 $patch_core = $patch_core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $sine = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = (_malloc(112)|0); //@line 39 "../units/sine.c"
 $sine = $2; //@line 39 "../units/sine.c"
 $3 = $sine; //@line 41 "../units/sine.c"
 $4 = ($3|0)!=(0|0); //@line 41 "../units/sine.c"
 $5 = $sine; //@line 44 "../units/sine.c"
 if (!($4)) {
  $0 = $5; //@line 42 "../units/sine.c"
  $36 = $0; //@line 65 "../units/sine.c"
  STACKTOP = sp;return ($36|0); //@line 65 "../units/sine.c"
 }
 $6 = $1; //@line 44 "../units/sine.c"
 $7 = (_Unit_init($5,$6)|0); //@line 44 "../units/sine.c"
 $8 = ($7|0)!=(0); //@line 44 "../units/sine.c"
 $9 = $sine; //@line 50 "../units/sine.c"
 if (!($8)) {
  _Object_delete($9); //@line 46 "../units/sine.c"
  $0 = 0; //@line 47 "../units/sine.c"
  $36 = $0; //@line 65 "../units/sine.c"
  STACKTOP = sp;return ($36|0); //@line 65 "../units/sine.c"
 }
 $10 = (_Unit_create_output($9,195,75)|0); //@line 50 "../units/sine.c"
 $11 = $sine; //@line 50 "../units/sine.c"
 $12 = ((($11)) + 96|0); //@line 50 "../units/sine.c"
 HEAP32[$12>>2] = $10; //@line 50 "../units/sine.c"
 $13 = $sine; //@line 51 "../units/sine.c"
 $14 = (_Unit_create_input($13,5,75)|0); //@line 51 "../units/sine.c"
 $15 = $sine; //@line 51 "../units/sine.c"
 $16 = ((($15)) + 100|0); //@line 51 "../units/sine.c"
 HEAP32[$16>>2] = $14; //@line 51 "../units/sine.c"
 $17 = $sine; //@line 52 "../units/sine.c"
 _Window_resize($17,200,150); //@line 52 "../units/sine.c"
 $18 = $sine; //@line 54 "../units/sine.c"
 $19 = ((($18)) + 96|0); //@line 54 "../units/sine.c"
 $20 = HEAP32[$19>>2]|0; //@line 54 "../units/sine.c"
 $21 = ($20|0)!=(0|0); //@line 54 "../units/sine.c"
 if ($21) {
  $22 = $sine; //@line 54 "../units/sine.c"
  $23 = ((($22)) + 100|0); //@line 54 "../units/sine.c"
  $24 = HEAP32[$23>>2]|0; //@line 54 "../units/sine.c"
  $25 = ($24|0)!=(0|0); //@line 54 "../units/sine.c"
  if ($25) {
   $27 = $sine; //@line 60 "../units/sine.c"
   $28 = ((($27)) + 104|0); //@line 60 "../units/sine.c"
   HEAPF64[$28>>3] = 0.0; //@line 60 "../units/sine.c"
   $29 = $sine; //@line 61 "../units/sine.c"
   $30 = ((($29)) + 96|0); //@line 61 "../units/sine.c"
   $31 = HEAP32[$30>>2]|0; //@line 61 "../units/sine.c"
   $32 = ((($31)) + 104|0); //@line 61 "../units/sine.c"
   HEAP32[$32>>2] = 42; //@line 61 "../units/sine.c"
   $33 = $sine; //@line 62 "../units/sine.c"
   $34 = ((($33)) + 52|0); //@line 62 "../units/sine.c"
   HEAP32[$34>>2] = 43; //@line 62 "../units/sine.c"
   $35 = $sine; //@line 64 "../units/sine.c"
   $0 = $35; //@line 64 "../units/sine.c"
   $36 = $0; //@line 65 "../units/sine.c"
   STACKTOP = sp;return ($36|0); //@line 65 "../units/sine.c"
  }
 }
 $26 = $sine; //@line 56 "../units/sine.c"
 _Object_delete($26); //@line 56 "../units/sine.c"
 $0 = 0; //@line 57 "../units/sine.c"
 $36 = $0; //@line 65 "../units/sine.c"
 STACKTOP = sp;return ($36|0); //@line 65 "../units/sine.c"
}
function _Sine_pull_sample_handler($io,$sample_l,$sample_r) {
 $io = $io|0;
 $sample_l = $sample_l|0;
 $sample_r = $sample_r|0;
 var $0 = 0, $1 = 0, $10 = 0.0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0.0, $21 = 0.0, $22 = 0.0, $23 = 0.0, $24 = 0.0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0.0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0.0, $34 = 0.0, $35 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0.0, $in_sample_l = 0, $in_sample_r = 0, $sine = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $in_sample_l = sp + 8|0;
 $in_sample_r = sp;
 $1 = $io;
 $2 = $sample_l;
 $3 = $sample_r;
 $4 = $1; //@line 13 "../units/sine.c"
 $5 = ((($4)) + 96|0); //@line 13 "../units/sine.c"
 $6 = HEAP32[$5>>2]|0; //@line 13 "../units/sine.c"
 $sine = $6; //@line 13 "../units/sine.c"
 $7 = $sine; //@line 15 "../units/sine.c"
 $8 = ((($7)) + 104|0); //@line 15 "../units/sine.c"
 $9 = +HEAPF64[$8>>3]; //@line 15 "../units/sine.c"
 $10 = (+Math_sin((+$9))); //@line 15 "../units/sine.c"
 $11 = $3; //@line 15 "../units/sine.c"
 HEAPF64[$11>>3] = $10; //@line 15 "../units/sine.c"
 $12 = $2; //@line 15 "../units/sine.c"
 HEAPF64[$12>>3] = $10; //@line 15 "../units/sine.c"
 $13 = $sine; //@line 17 "../units/sine.c"
 $14 = ((($13)) + 100|0); //@line 17 "../units/sine.c"
 $15 = HEAP32[$14>>2]|0; //@line 17 "../units/sine.c"
 $16 = (_IO_pull_sample($15,$in_sample_l,$in_sample_r)|0); //@line 17 "../units/sine.c"
 $17 = ($16|0)!=(0); //@line 17 "../units/sine.c"
 if (!($17)) {
  $0 = 0; //@line 18 "../units/sine.c"
  $35 = $0; //@line 26 "../units/sine.c"
  STACKTOP = sp;return ($35|0); //@line 26 "../units/sine.c"
 }
 $18 = $sine; //@line 20 "../units/sine.c"
 $19 = ((($18)) + 104|0); //@line 20 "../units/sine.c"
 $20 = +HEAPF64[$19>>3]; //@line 20 "../units/sine.c"
 $21 = +HEAPF64[$in_sample_l>>3]; //@line 20 "../units/sine.c"
 $22 = 6.2831853071795862 * $21; //@line 20 "../units/sine.c"
 $23 = $22 / 44100.0; //@line 20 "../units/sine.c"
 $24 = $20 + $23; //@line 20 "../units/sine.c"
 $25 = $sine; //@line 20 "../units/sine.c"
 $26 = ((($25)) + 104|0); //@line 20 "../units/sine.c"
 HEAPF64[$26>>3] = $24; //@line 20 "../units/sine.c"
 $27 = $sine; //@line 22 "../units/sine.c"
 $28 = ((($27)) + 104|0); //@line 22 "../units/sine.c"
 $29 = +HEAPF64[$28>>3]; //@line 22 "../units/sine.c"
 $30 = $29 > 6.2831853071795862; //@line 22 "../units/sine.c"
 if ($30) {
  $31 = $sine; //@line 23 "../units/sine.c"
  $32 = ((($31)) + 104|0); //@line 23 "../units/sine.c"
  $33 = +HEAPF64[$32>>3]; //@line 23 "../units/sine.c"
  $34 = $33 - 6.2831853071795862; //@line 23 "../units/sine.c"
  HEAPF64[$32>>3] = $34; //@line 23 "../units/sine.c"
 }
 $0 = 1; //@line 25 "../units/sine.c"
 $35 = $0; //@line 26 "../units/sine.c"
 STACKTOP = sp;return ($35|0); //@line 26 "../units/sine.c"
}
function _Sine_paint_handler($sine_window) {
 $sine_window = $sine_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $sine_window;
 $1 = $0; //@line 30 "../units/sine.c"
 _Frame_paint_handler($1); //@line 30 "../units/sine.c"
 $2 = $0; //@line 31 "../units/sine.c"
 $3 = ((($2)) + 24|0); //@line 31 "../units/sine.c"
 $4 = HEAP32[$3>>2]|0; //@line 31 "../units/sine.c"
 $5 = $0; //@line 32 "../units/sine.c"
 $6 = ((($5)) + 16|0); //@line 32 "../units/sine.c"
 $7 = HEAP16[$6>>1]|0; //@line 32 "../units/sine.c"
 $8 = $7&65535; //@line 32 "../units/sine.c"
 $9 = (($8|0) / 2)&-1; //@line 32 "../units/sine.c"
 $10 = (($9) - 16)|0; //@line 32 "../units/sine.c"
 $11 = $0; //@line 33 "../units/sine.c"
 $12 = ((($11)) + 18|0); //@line 33 "../units/sine.c"
 $13 = HEAP16[$12>>1]|0; //@line 33 "../units/sine.c"
 $14 = $13&65535; //@line 33 "../units/sine.c"
 $15 = (($14|0) / 2)&-1; //@line 33 "../units/sine.c"
 $16 = (($15) - 6)|0; //@line 33 "../units/sine.c"
 _Context_draw_text($4,5261,$10,$16,-16777216); //@line 31 "../units/sine.c"
 STACKTOP = sp;return; //@line 35 "../units/sine.c"
}
function _Square_new() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_Module_new(44,5266)|0); //@line 7 "../units/square.c"
 return ($0|0); //@line 7 "../units/square.c"
}
function _Square_constructor($patch_core) {
 $patch_core = $patch_core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $square = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = (_malloc(112)|0); //@line 39 "../units/square.c"
 $square = $2; //@line 39 "../units/square.c"
 $3 = $square; //@line 41 "../units/square.c"
 $4 = ($3|0)!=(0|0); //@line 41 "../units/square.c"
 $5 = $square; //@line 44 "../units/square.c"
 if (!($4)) {
  $0 = $5; //@line 42 "../units/square.c"
  $36 = $0; //@line 65 "../units/square.c"
  STACKTOP = sp;return ($36|0); //@line 65 "../units/square.c"
 }
 $6 = $1; //@line 44 "../units/square.c"
 $7 = (_Unit_init($5,$6)|0); //@line 44 "../units/square.c"
 $8 = ($7|0)!=(0); //@line 44 "../units/square.c"
 $9 = $square; //@line 50 "../units/square.c"
 if (!($8)) {
  _Object_delete($9); //@line 46 "../units/square.c"
  $0 = 0; //@line 47 "../units/square.c"
  $36 = $0; //@line 65 "../units/square.c"
  STACKTOP = sp;return ($36|0); //@line 65 "../units/square.c"
 }
 $10 = (_Unit_create_output($9,195,75)|0); //@line 50 "../units/square.c"
 $11 = $square; //@line 50 "../units/square.c"
 $12 = ((($11)) + 96|0); //@line 50 "../units/square.c"
 HEAP32[$12>>2] = $10; //@line 50 "../units/square.c"
 $13 = $square; //@line 51 "../units/square.c"
 $14 = (_Unit_create_input($13,5,75)|0); //@line 51 "../units/square.c"
 $15 = $square; //@line 51 "../units/square.c"
 $16 = ((($15)) + 100|0); //@line 51 "../units/square.c"
 HEAP32[$16>>2] = $14; //@line 51 "../units/square.c"
 $17 = $square; //@line 52 "../units/square.c"
 _Window_resize($17,200,150); //@line 52 "../units/square.c"
 $18 = $square; //@line 54 "../units/square.c"
 $19 = ((($18)) + 96|0); //@line 54 "../units/square.c"
 $20 = HEAP32[$19>>2]|0; //@line 54 "../units/square.c"
 $21 = ($20|0)!=(0|0); //@line 54 "../units/square.c"
 if ($21) {
  $22 = $square; //@line 54 "../units/square.c"
  $23 = ((($22)) + 100|0); //@line 54 "../units/square.c"
  $24 = HEAP32[$23>>2]|0; //@line 54 "../units/square.c"
  $25 = ($24|0)!=(0|0); //@line 54 "../units/square.c"
  if ($25) {
   $27 = $square; //@line 60 "../units/square.c"
   $28 = ((($27)) + 104|0); //@line 60 "../units/square.c"
   HEAPF64[$28>>3] = 0.0; //@line 60 "../units/square.c"
   $29 = $square; //@line 61 "../units/square.c"
   $30 = ((($29)) + 96|0); //@line 61 "../units/square.c"
   $31 = HEAP32[$30>>2]|0; //@line 61 "../units/square.c"
   $32 = ((($31)) + 104|0); //@line 61 "../units/square.c"
   HEAP32[$32>>2] = 45; //@line 61 "../units/square.c"
   $33 = $square; //@line 62 "../units/square.c"
   $34 = ((($33)) + 52|0); //@line 62 "../units/square.c"
   HEAP32[$34>>2] = 46; //@line 62 "../units/square.c"
   $35 = $square; //@line 64 "../units/square.c"
   $0 = $35; //@line 64 "../units/square.c"
   $36 = $0; //@line 65 "../units/square.c"
   STACKTOP = sp;return ($36|0); //@line 65 "../units/square.c"
  }
 }
 $26 = $square; //@line 56 "../units/square.c"
 _Object_delete($26); //@line 56 "../units/square.c"
 $0 = 0; //@line 57 "../units/square.c"
 $36 = $0; //@line 65 "../units/square.c"
 STACKTOP = sp;return ($36|0); //@line 65 "../units/square.c"
}
function _Square_pull_sample_handler($io,$sample_l,$sample_r) {
 $io = $io|0;
 $sample_l = $sample_l|0;
 $sample_r = $sample_r|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0.0, $22 = 0.0, $23 = 0.0, $24 = 0.0, $25 = 0.0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0.0, $31 = 0, $32 = 0, $33 = 0, $34 = 0.0, $35 = 0.0, $36 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0.0, $in_sample_l = 0, $in_sample_r = 0, $square = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $in_sample_l = sp + 8|0;
 $in_sample_r = sp;
 $1 = $io;
 $2 = $sample_l;
 $3 = $sample_r;
 $4 = $1; //@line 13 "../units/square.c"
 $5 = ((($4)) + 96|0); //@line 13 "../units/square.c"
 $6 = HEAP32[$5>>2]|0; //@line 13 "../units/square.c"
 $square = $6; //@line 13 "../units/square.c"
 $7 = $square; //@line 15 "../units/square.c"
 $8 = ((($7)) + 104|0); //@line 15 "../units/square.c"
 $9 = +HEAPF64[$8>>3]; //@line 15 "../units/square.c"
 $10 = $9 > 3.1415926535897931; //@line 15 "../units/square.c"
 $11 = $10 ? 1.0 : -1.0; //@line 15 "../units/square.c"
 $12 = $3; //@line 15 "../units/square.c"
 HEAPF64[$12>>3] = $11; //@line 15 "../units/square.c"
 $13 = $2; //@line 15 "../units/square.c"
 HEAPF64[$13>>3] = $11; //@line 15 "../units/square.c"
 $14 = $square; //@line 17 "../units/square.c"
 $15 = ((($14)) + 100|0); //@line 17 "../units/square.c"
 $16 = HEAP32[$15>>2]|0; //@line 17 "../units/square.c"
 $17 = (_IO_pull_sample($16,$in_sample_l,$in_sample_r)|0); //@line 17 "../units/square.c"
 $18 = ($17|0)!=(0); //@line 17 "../units/square.c"
 if (!($18)) {
  $0 = 0; //@line 18 "../units/square.c"
  $36 = $0; //@line 26 "../units/square.c"
  STACKTOP = sp;return ($36|0); //@line 26 "../units/square.c"
 }
 $19 = $square; //@line 20 "../units/square.c"
 $20 = ((($19)) + 104|0); //@line 20 "../units/square.c"
 $21 = +HEAPF64[$20>>3]; //@line 20 "../units/square.c"
 $22 = +HEAPF64[$in_sample_l>>3]; //@line 20 "../units/square.c"
 $23 = 6.2831853071795862 * $22; //@line 20 "../units/square.c"
 $24 = $23 / 44100.0; //@line 20 "../units/square.c"
 $25 = $21 + $24; //@line 20 "../units/square.c"
 $26 = $square; //@line 20 "../units/square.c"
 $27 = ((($26)) + 104|0); //@line 20 "../units/square.c"
 HEAPF64[$27>>3] = $25; //@line 20 "../units/square.c"
 $28 = $square; //@line 22 "../units/square.c"
 $29 = ((($28)) + 104|0); //@line 22 "../units/square.c"
 $30 = +HEAPF64[$29>>3]; //@line 22 "../units/square.c"
 $31 = $30 > 6.2831853071795862; //@line 22 "../units/square.c"
 if ($31) {
  $32 = $square; //@line 23 "../units/square.c"
  $33 = ((($32)) + 104|0); //@line 23 "../units/square.c"
  $34 = +HEAPF64[$33>>3]; //@line 23 "../units/square.c"
  $35 = $34 - 6.2831853071795862; //@line 23 "../units/square.c"
  HEAPF64[$33>>3] = $35; //@line 23 "../units/square.c"
 }
 $0 = 1; //@line 25 "../units/square.c"
 $36 = $0; //@line 26 "../units/square.c"
 STACKTOP = sp;return ($36|0); //@line 26 "../units/square.c"
}
function _Square_paint_handler($square_window) {
 $square_window = $square_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $square_window;
 $1 = $0; //@line 30 "../units/square.c"
 _Frame_paint_handler($1); //@line 30 "../units/square.c"
 $2 = $0; //@line 31 "../units/square.c"
 $3 = ((($2)) + 24|0); //@line 31 "../units/square.c"
 $4 = HEAP32[$3>>2]|0; //@line 31 "../units/square.c"
 $5 = $0; //@line 32 "../units/square.c"
 $6 = ((($5)) + 16|0); //@line 32 "../units/square.c"
 $7 = HEAP16[$6>>1]|0; //@line 32 "../units/square.c"
 $8 = $7&65535; //@line 32 "../units/square.c"
 $9 = (($8|0) / 2)&-1; //@line 32 "../units/square.c"
 $10 = (($9) - 24)|0; //@line 32 "../units/square.c"
 $11 = $0; //@line 33 "../units/square.c"
 $12 = ((($11)) + 18|0); //@line 33 "../units/square.c"
 $13 = HEAP16[$12>>1]|0; //@line 33 "../units/square.c"
 $14 = $13&65535; //@line 33 "../units/square.c"
 $15 = (($14|0) / 2)&-1; //@line 33 "../units/square.c"
 $16 = (($15) - 6)|0; //@line 33 "../units/square.c"
 _Context_draw_text($4,5266,$10,$16,-16777216); //@line 31 "../units/square.c"
 STACKTOP = sp;return; //@line 35 "../units/square.c"
}
function _PatchDesktop_new($patch_core) {
 $patch_core = $patch_core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $patch_desktop = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $patch_core;
 $2 = (_malloc(120)|0); //@line 5 "../widgets/patchdesktop.c"
 $patch_desktop = $2; //@line 5 "../widgets/patchdesktop.c"
 $3 = $patch_desktop; //@line 7 "../widgets/patchdesktop.c"
 $4 = ($3|0)!=(0|0); //@line 7 "../widgets/patchdesktop.c"
 if (!($4)) {
  $5 = $patch_desktop; //@line 8 "../widgets/patchdesktop.c"
  $0 = $5; //@line 8 "../widgets/patchdesktop.c"
  $38 = $0; //@line 34 "../widgets/patchdesktop.c"
  STACKTOP = sp;return ($38|0); //@line 34 "../widgets/patchdesktop.c"
 }
 $6 = (_PlatformWrapper_get_context()|0); //@line 10 "../widgets/patchdesktop.c"
 $7 = $patch_desktop; //@line 10 "../widgets/patchdesktop.c"
 $8 = ((($7)) + 100|0); //@line 10 "../widgets/patchdesktop.c"
 HEAP32[$8>>2] = $6; //@line 10 "../widgets/patchdesktop.c"
 $9 = ($6|0)!=(0|0); //@line 10 "../widgets/patchdesktop.c"
 $10 = $patch_desktop; //@line 16 "../widgets/patchdesktop.c"
 if (!($9)) {
  _Object_delete($10); //@line 12 "../widgets/patchdesktop.c"
  $0 = 0; //@line 13 "../widgets/patchdesktop.c"
  $38 = $0; //@line 34 "../widgets/patchdesktop.c"
  STACKTOP = sp;return ($38|0); //@line 34 "../widgets/patchdesktop.c"
 }
 $11 = $patch_desktop; //@line 16 "../widgets/patchdesktop.c"
 $12 = ((($11)) + 100|0); //@line 16 "../widgets/patchdesktop.c"
 $13 = HEAP32[$12>>2]|0; //@line 16 "../widgets/patchdesktop.c"
 $14 = (_Desktop_init($10,$13)|0); //@line 16 "../widgets/patchdesktop.c"
 $15 = ($14|0)!=(0); //@line 16 "../widgets/patchdesktop.c"
 $16 = $patch_desktop; //@line 23 "../widgets/patchdesktop.c"
 if ($15) {
  _Object_init($16,47); //@line 23 "../widgets/patchdesktop.c"
  $20 = $1; //@line 25 "../widgets/patchdesktop.c"
  $21 = $patch_desktop; //@line 25 "../widgets/patchdesktop.c"
  $22 = ((($21)) + 96|0); //@line 25 "../widgets/patchdesktop.c"
  HEAP32[$22>>2] = $20; //@line 25 "../widgets/patchdesktop.c"
  $23 = $patch_desktop; //@line 26 "../widgets/patchdesktop.c"
  $24 = ((($23)) + 76|0); //@line 26 "../widgets/patchdesktop.c"
  HEAP32[$24>>2] = 48; //@line 26 "../widgets/patchdesktop.c"
  $25 = $patch_desktop; //@line 27 "../widgets/patchdesktop.c"
  $26 = ((($25)) + 72|0); //@line 27 "../widgets/patchdesktop.c"
  HEAP32[$26>>2] = 49; //@line 27 "../widgets/patchdesktop.c"
  $27 = $patch_desktop; //@line 28 "../widgets/patchdesktop.c"
  $28 = ((($27)) + 52|0); //@line 28 "../widgets/patchdesktop.c"
  HEAP32[$28>>2] = 50; //@line 28 "../widgets/patchdesktop.c"
  $29 = (_PlatformWrapper_is_mouse_shown()|0); //@line 29 "../widgets/patchdesktop.c"
  $30 = $29&255; //@line 29 "../widgets/patchdesktop.c"
  $31 = $patch_desktop; //@line 29 "../widgets/patchdesktop.c"
  $32 = ((($31)) + 92|0); //@line 29 "../widgets/patchdesktop.c"
  HEAP8[$32>>0] = $30; //@line 29 "../widgets/patchdesktop.c"
  $33 = $patch_desktop; //@line 30 "../widgets/patchdesktop.c"
  $34 = ((($33)) + 104|0); //@line 30 "../widgets/patchdesktop.c"
  HEAP32[$34>>2] = 0; //@line 30 "../widgets/patchdesktop.c"
  $35 = $patch_desktop; //@line 31 "../widgets/patchdesktop.c"
  $36 = ((($35)) + 116|0); //@line 31 "../widgets/patchdesktop.c"
  HEAP32[$36>>2] = 0; //@line 31 "../widgets/patchdesktop.c"
  $37 = $patch_desktop; //@line 33 "../widgets/patchdesktop.c"
  $0 = $37; //@line 33 "../widgets/patchdesktop.c"
  $38 = $0; //@line 34 "../widgets/patchdesktop.c"
  STACKTOP = sp;return ($38|0); //@line 34 "../widgets/patchdesktop.c"
 } else {
  $17 = ((($16)) + 100|0); //@line 18 "../widgets/patchdesktop.c"
  $18 = HEAP32[$17>>2]|0; //@line 18 "../widgets/patchdesktop.c"
  _Object_delete($18); //@line 18 "../widgets/patchdesktop.c"
  $19 = $patch_desktop; //@line 19 "../widgets/patchdesktop.c"
  _Object_delete($19); //@line 19 "../widgets/patchdesktop.c"
  $0 = 0; //@line 20 "../widgets/patchdesktop.c"
  $38 = $0; //@line 34 "../widgets/patchdesktop.c"
  STACKTOP = sp;return ($38|0); //@line 34 "../widgets/patchdesktop.c"
 }
 return (0)|0;
}
function _PatchDesktop_delete_function($patch_desktop_object) {
 $patch_desktop_object = $patch_desktop_object|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $patch_desktop = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_desktop_object;
 $1 = $0; //@line 175 "../widgets/patchdesktop.c"
 $patch_desktop = $1; //@line 175 "../widgets/patchdesktop.c"
 $2 = $0; //@line 177 "../widgets/patchdesktop.c"
 $3 = ($2|0)!=(0|0); //@line 177 "../widgets/patchdesktop.c"
 if (!($3)) {
  STACKTOP = sp;return; //@line 182 "../widgets/patchdesktop.c"
 }
 $4 = $patch_desktop; //@line 180 "../widgets/patchdesktop.c"
 $5 = ((($4)) + 116|0); //@line 180 "../widgets/patchdesktop.c"
 $6 = HEAP32[$5>>2]|0; //@line 180 "../widgets/patchdesktop.c"
 _Object_delete($6); //@line 180 "../widgets/patchdesktop.c"
 $7 = $0; //@line 181 "../widgets/patchdesktop.c"
 _Window_delete_function($7); //@line 181 "../widgets/patchdesktop.c"
 STACKTOP = sp;return; //@line 182 "../widgets/patchdesktop.c"
}
function _PatchDesktop_mouseclick_handler($patch_desktop_window,$x,$y) {
 $patch_desktop_window = $patch_desktop_window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $patch_desktop = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_desktop_window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 38 "../widgets/patchdesktop.c"
 $patch_desktop = $3; //@line 38 "../widgets/patchdesktop.c"
 $4 = $patch_desktop; //@line 40 "../widgets/patchdesktop.c"
 $5 = ((($4)) + 104|0); //@line 40 "../widgets/patchdesktop.c"
 $6 = HEAP32[$5>>2]|0; //@line 40 "../widgets/patchdesktop.c"
 $7 = ($6|0)!=(0|0); //@line 40 "../widgets/patchdesktop.c"
 if ($7) {
  $8 = $patch_desktop; //@line 41 "../widgets/patchdesktop.c"
  _PatchDesktop_end_connection($8); //@line 41 "../widgets/patchdesktop.c"
 }
 $9 = $patch_desktop; //@line 43 "../widgets/patchdesktop.c"
 $10 = ((($9)) + 116|0); //@line 43 "../widgets/patchdesktop.c"
 $11 = HEAP32[$10>>2]|0; //@line 43 "../widgets/patchdesktop.c"
 $12 = ($11|0)!=(0|0); //@line 43 "../widgets/patchdesktop.c"
 $13 = $patch_desktop; //@line 45 "../widgets/patchdesktop.c"
 if ($12) {
  $14 = ((($13)) + 116|0); //@line 45 "../widgets/patchdesktop.c"
  $15 = HEAP32[$14>>2]|0; //@line 45 "../widgets/patchdesktop.c"
  _Object_delete($15); //@line 45 "../widgets/patchdesktop.c"
  $16 = $patch_desktop; //@line 46 "../widgets/patchdesktop.c"
  $17 = ((($16)) + 116|0); //@line 46 "../widgets/patchdesktop.c"
  HEAP32[$17>>2] = 0; //@line 46 "../widgets/patchdesktop.c"
  STACKTOP = sp;return; //@line 52 "../widgets/patchdesktop.c"
 } else {
  $18 = ((($13)) + 96|0); //@line 49 "../widgets/patchdesktop.c"
  $19 = HEAP32[$18>>2]|0; //@line 49 "../widgets/patchdesktop.c"
  $20 = $1; //@line 49 "../widgets/patchdesktop.c"
  $21 = $2; //@line 49 "../widgets/patchdesktop.c"
  $22 = (_SessionMenu_new($19,$20,$21)|0); //@line 49 "../widgets/patchdesktop.c"
  $23 = $patch_desktop; //@line 49 "../widgets/patchdesktop.c"
  $24 = ((($23)) + 116|0); //@line 49 "../widgets/patchdesktop.c"
  HEAP32[$24>>2] = $22; //@line 49 "../widgets/patchdesktop.c"
  $25 = $patch_desktop; //@line 50 "../widgets/patchdesktop.c"
  $26 = $patch_desktop; //@line 50 "../widgets/patchdesktop.c"
  $27 = ((($26)) + 116|0); //@line 50 "../widgets/patchdesktop.c"
  $28 = HEAP32[$27>>2]|0; //@line 50 "../widgets/patchdesktop.c"
  _Window_insert_child($25,$28); //@line 50 "../widgets/patchdesktop.c"
  STACKTOP = sp;return; //@line 52 "../widgets/patchdesktop.c"
 }
}
function _PatchDesktop_mousemove_handler($patch_desktop_window,$x,$y) {
 $patch_desktop_window = $patch_desktop_window|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $patch_desktop = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_desktop_window;
 $1 = $x;
 $2 = $y;
 $3 = $0; //@line 162 "../widgets/patchdesktop.c"
 $patch_desktop = $3; //@line 162 "../widgets/patchdesktop.c"
 $4 = $patch_desktop; //@line 164 "../widgets/patchdesktop.c"
 $5 = ((($4)) + 104|0); //@line 164 "../widgets/patchdesktop.c"
 $6 = HEAP32[$5>>2]|0; //@line 164 "../widgets/patchdesktop.c"
 $7 = ($6|0)!=(0|0); //@line 164 "../widgets/patchdesktop.c"
 if (!($7)) {
  STACKTOP = sp;return; //@line 171 "../widgets/patchdesktop.c"
 }
 $8 = $1; //@line 167 "../widgets/patchdesktop.c"
 $9 = $patch_desktop; //@line 167 "../widgets/patchdesktop.c"
 $10 = ((($9)) + 108|0); //@line 167 "../widgets/patchdesktop.c"
 HEAP32[$10>>2] = $8; //@line 167 "../widgets/patchdesktop.c"
 $11 = $2; //@line 168 "../widgets/patchdesktop.c"
 $12 = $patch_desktop; //@line 168 "../widgets/patchdesktop.c"
 $13 = ((($12)) + 112|0); //@line 168 "../widgets/patchdesktop.c"
 HEAP32[$13>>2] = $11; //@line 168 "../widgets/patchdesktop.c"
 $14 = $patch_desktop; //@line 169 "../widgets/patchdesktop.c"
 $15 = $patch_desktop; //@line 169 "../widgets/patchdesktop.c"
 $16 = ((($15)) + 16|0); //@line 169 "../widgets/patchdesktop.c"
 $17 = HEAP16[$16>>1]|0; //@line 169 "../widgets/patchdesktop.c"
 $18 = $17&65535; //@line 169 "../widgets/patchdesktop.c"
 $19 = (($18) - 1)|0; //@line 169 "../widgets/patchdesktop.c"
 $20 = $patch_desktop; //@line 170 "../widgets/patchdesktop.c"
 $21 = ((($20)) + 18|0); //@line 170 "../widgets/patchdesktop.c"
 $22 = HEAP16[$21>>1]|0; //@line 170 "../widgets/patchdesktop.c"
 $23 = $22&65535; //@line 170 "../widgets/patchdesktop.c"
 $24 = (($23) - 1)|0; //@line 170 "../widgets/patchdesktop.c"
 _Window_invalidate($14,0,0,$19,$24); //@line 169 "../widgets/patchdesktop.c"
 STACKTOP = sp;return; //@line 171 "../widgets/patchdesktop.c"
}
function _PatchDesktop_paint_handler($patch_desktop_window) {
 $patch_desktop_window = $patch_desktop_window|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $9 = 0, $i = 0, $input = 0, $patch_desktop = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_desktop_window;
 $1 = $0; //@line 88 "../widgets/patchdesktop.c"
 $patch_desktop = $1; //@line 88 "../widgets/patchdesktop.c"
 $2 = $0; //@line 90 "../widgets/patchdesktop.c"
 $3 = ((($2)) + 24|0); //@line 90 "../widgets/patchdesktop.c"
 $4 = HEAP32[$3>>2]|0; //@line 90 "../widgets/patchdesktop.c"
 $5 = $0; //@line 90 "../widgets/patchdesktop.c"
 $6 = ((($5)) + 16|0); //@line 90 "../widgets/patchdesktop.c"
 $7 = HEAP16[$6>>1]|0; //@line 90 "../widgets/patchdesktop.c"
 $8 = $7&65535; //@line 90 "../widgets/patchdesktop.c"
 $9 = $0; //@line 91 "../widgets/patchdesktop.c"
 $10 = ((($9)) + 18|0); //@line 91 "../widgets/patchdesktop.c"
 $11 = HEAP16[$10>>1]|0; //@line 91 "../widgets/patchdesktop.c"
 $12 = $11&65535; //@line 91 "../widgets/patchdesktop.c"
 _Context_fill_rect($4,0,0,$8,$12,-2990246); //@line 90 "../widgets/patchdesktop.c"
 $13 = $0; //@line 94 "../widgets/patchdesktop.c"
 $14 = ((($13)) + 24|0); //@line 94 "../widgets/patchdesktop.c"
 $15 = HEAP32[$14>>2]|0; //@line 94 "../widgets/patchdesktop.c"
 $16 = $0; //@line 95 "../widgets/patchdesktop.c"
 $17 = ((($16)) + 18|0); //@line 95 "../widgets/patchdesktop.c"
 $18 = HEAP16[$17>>1]|0; //@line 95 "../widgets/patchdesktop.c"
 $19 = $18&65535; //@line 95 "../widgets/patchdesktop.c"
 $20 = (($19) - 18)|0; //@line 95 "../widgets/patchdesktop.c"
 _Context_draw_text($15,5273,5,$20,-1); //@line 94 "../widgets/patchdesktop.c"
 $21 = $patch_desktop; //@line 97 "../widgets/patchdesktop.c"
 $22 = ((($21)) + 104|0); //@line 97 "../widgets/patchdesktop.c"
 $23 = HEAP32[$22>>2]|0; //@line 97 "../widgets/patchdesktop.c"
 $24 = ($23|0)!=(0|0); //@line 97 "../widgets/patchdesktop.c"
 if ($24) {
  $25 = $0; //@line 100 "../widgets/patchdesktop.c"
  $26 = ((($25)) + 24|0); //@line 100 "../widgets/patchdesktop.c"
  $27 = HEAP32[$26>>2]|0; //@line 100 "../widgets/patchdesktop.c"
  $28 = $patch_desktop; //@line 100 "../widgets/patchdesktop.c"
  $29 = ((($28)) + 104|0); //@line 100 "../widgets/patchdesktop.c"
  $30 = HEAP32[$29>>2]|0; //@line 100 "../widgets/patchdesktop.c"
  $31 = (_Window_screen_x($30)|0); //@line 100 "../widgets/patchdesktop.c"
  $32 = (($31) + 3)|0; //@line 100 "../widgets/patchdesktop.c"
  $33 = $patch_desktop; //@line 101 "../widgets/patchdesktop.c"
  $34 = ((($33)) + 104|0); //@line 101 "../widgets/patchdesktop.c"
  $35 = HEAP32[$34>>2]|0; //@line 101 "../widgets/patchdesktop.c"
  $36 = (_Window_screen_y($35)|0); //@line 101 "../widgets/patchdesktop.c"
  $37 = (($36) + 3)|0; //@line 101 "../widgets/patchdesktop.c"
  $38 = $patch_desktop; //@line 101 "../widgets/patchdesktop.c"
  $39 = ((($38)) + 108|0); //@line 101 "../widgets/patchdesktop.c"
  $40 = HEAP32[$39>>2]|0; //@line 101 "../widgets/patchdesktop.c"
  $41 = $patch_desktop; //@line 102 "../widgets/patchdesktop.c"
  $42 = ((($41)) + 112|0); //@line 102 "../widgets/patchdesktop.c"
  $43 = HEAP32[$42>>2]|0; //@line 102 "../widgets/patchdesktop.c"
  _draw_elbow($27,$32,$37,$40,$43,-16777016); //@line 100 "../widgets/patchdesktop.c"
 }
 $i = 0; //@line 105 "../widgets/patchdesktop.c"
 while(1) {
  $44 = $i; //@line 105 "../widgets/patchdesktop.c"
  $45 = $patch_desktop; //@line 105 "../widgets/patchdesktop.c"
  $46 = ((($45)) + 96|0); //@line 105 "../widgets/patchdesktop.c"
  $47 = HEAP32[$46>>2]|0; //@line 105 "../widgets/patchdesktop.c"
  $48 = ((($47)) + 16|0); //@line 105 "../widgets/patchdesktop.c"
  $49 = HEAP32[$48>>2]|0; //@line 105 "../widgets/patchdesktop.c"
  $50 = ((($49)) + 4|0); //@line 105 "../widgets/patchdesktop.c"
  $51 = HEAP32[$50>>2]|0; //@line 105 "../widgets/patchdesktop.c"
  $52 = ($44>>>0)<($51>>>0); //@line 105 "../widgets/patchdesktop.c"
  if (!($52)) {
   break;
  }
  $53 = $patch_desktop; //@line 107 "../widgets/patchdesktop.c"
  $54 = ((($53)) + 96|0); //@line 107 "../widgets/patchdesktop.c"
  $55 = HEAP32[$54>>2]|0; //@line 107 "../widgets/patchdesktop.c"
  $56 = ((($55)) + 16|0); //@line 107 "../widgets/patchdesktop.c"
  $57 = HEAP32[$56>>2]|0; //@line 107 "../widgets/patchdesktop.c"
  $58 = $i; //@line 107 "../widgets/patchdesktop.c"
  $59 = (_List_get_at($57,$58)|0); //@line 107 "../widgets/patchdesktop.c"
  $input = $59; //@line 107 "../widgets/patchdesktop.c"
  $60 = $input; //@line 109 "../widgets/patchdesktop.c"
  $61 = ((($60)) + 92|0); //@line 109 "../widgets/patchdesktop.c"
  $62 = HEAP32[$61>>2]|0; //@line 109 "../widgets/patchdesktop.c"
  $63 = ($62|0)!=(0|0); //@line 109 "../widgets/patchdesktop.c"
  if ($63) {
   $64 = $0; //@line 111 "../widgets/patchdesktop.c"
   $65 = ((($64)) + 24|0); //@line 111 "../widgets/patchdesktop.c"
   $66 = HEAP32[$65>>2]|0; //@line 111 "../widgets/patchdesktop.c"
   $67 = $input; //@line 111 "../widgets/patchdesktop.c"
   $68 = (_Window_screen_x($67)|0); //@line 111 "../widgets/patchdesktop.c"
   $69 = (($68) + 2)|0; //@line 111 "../widgets/patchdesktop.c"
   $70 = $input; //@line 112 "../widgets/patchdesktop.c"
   $71 = (_Window_screen_y($70)|0); //@line 112 "../widgets/patchdesktop.c"
   $72 = (($71) + 2)|0; //@line 112 "../widgets/patchdesktop.c"
   $73 = $input; //@line 112 "../widgets/patchdesktop.c"
   $74 = ((($73)) + 92|0); //@line 112 "../widgets/patchdesktop.c"
   $75 = HEAP32[$74>>2]|0; //@line 112 "../widgets/patchdesktop.c"
   $76 = (_Window_screen_x($75)|0); //@line 112 "../widgets/patchdesktop.c"
   $77 = (($76) + 2)|0; //@line 112 "../widgets/patchdesktop.c"
   $78 = $input; //@line 113 "../widgets/patchdesktop.c"
   $79 = ((($78)) + 92|0); //@line 113 "../widgets/patchdesktop.c"
   $80 = HEAP32[$79>>2]|0; //@line 113 "../widgets/patchdesktop.c"
   $81 = (_Window_screen_y($80)|0); //@line 113 "../widgets/patchdesktop.c"
   $82 = (($81) + 2)|0; //@line 113 "../widgets/patchdesktop.c"
   _draw_elbow($66,$69,$72,$77,$82,-16726016); //@line 111 "../widgets/patchdesktop.c"
  }
  $83 = $i; //@line 105 "../widgets/patchdesktop.c"
  $84 = (($83) + 1)|0; //@line 105 "../widgets/patchdesktop.c"
  $i = $84; //@line 105 "../widgets/patchdesktop.c"
 }
 STACKTOP = sp;return; //@line 116 "../widgets/patchdesktop.c"
}
function _PatchDesktop_end_connection($patch_desktop) {
 $patch_desktop = $patch_desktop|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_desktop;
 $1 = $0; //@line 155 "../widgets/patchdesktop.c"
 $2 = ((($1)) + 104|0); //@line 155 "../widgets/patchdesktop.c"
 HEAP32[$2>>2] = 0; //@line 155 "../widgets/patchdesktop.c"
 $3 = $0; //@line 156 "../widgets/patchdesktop.c"
 $4 = $0; //@line 156 "../widgets/patchdesktop.c"
 $5 = ((($4)) + 16|0); //@line 156 "../widgets/patchdesktop.c"
 $6 = HEAP16[$5>>1]|0; //@line 156 "../widgets/patchdesktop.c"
 $7 = $6&65535; //@line 156 "../widgets/patchdesktop.c"
 $8 = (($7) - 1)|0; //@line 156 "../widgets/patchdesktop.c"
 $9 = $0; //@line 157 "../widgets/patchdesktop.c"
 $10 = ((($9)) + 18|0); //@line 157 "../widgets/patchdesktop.c"
 $11 = HEAP16[$10>>1]|0; //@line 157 "../widgets/patchdesktop.c"
 $12 = $11&65535; //@line 157 "../widgets/patchdesktop.c"
 $13 = (($12) - 1)|0; //@line 157 "../widgets/patchdesktop.c"
 _Window_invalidate($3,0,0,$8,$13); //@line 156 "../widgets/patchdesktop.c"
 STACKTOP = sp;return; //@line 158 "../widgets/patchdesktop.c"
}
function _draw_elbow($context,$x1,$y1,$x2,$y2,$color) {
 $context = $context|0;
 $x1 = $x1|0;
 $y1 = $y1|0;
 $x2 = $x2|0;
 $y2 = $y2|0;
 $color = $color|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $hlen = 0, $temp = 0, $vlen = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $context;
 $1 = $x1;
 $2 = $y1;
 $3 = $x2;
 $4 = $y2;
 $5 = $color;
 $6 = $3; //@line 56 "../widgets/patchdesktop.c"
 $7 = $1; //@line 56 "../widgets/patchdesktop.c"
 $8 = (($6) - ($7))|0; //@line 56 "../widgets/patchdesktop.c"
 $hlen = $8; //@line 56 "../widgets/patchdesktop.c"
 $9 = $hlen; //@line 59 "../widgets/patchdesktop.c"
 $10 = ($9|0)<(0); //@line 59 "../widgets/patchdesktop.c"
 if ($10) {
  $11 = $1; //@line 61 "../widgets/patchdesktop.c"
  $temp = $11; //@line 61 "../widgets/patchdesktop.c"
  $12 = $3; //@line 62 "../widgets/patchdesktop.c"
  $1 = $12; //@line 62 "../widgets/patchdesktop.c"
  $13 = $temp; //@line 63 "../widgets/patchdesktop.c"
  $3 = $13; //@line 63 "../widgets/patchdesktop.c"
  $14 = $2; //@line 64 "../widgets/patchdesktop.c"
  $temp = $14; //@line 64 "../widgets/patchdesktop.c"
  $15 = $4; //@line 65 "../widgets/patchdesktop.c"
  $2 = $15; //@line 65 "../widgets/patchdesktop.c"
  $16 = $temp; //@line 66 "../widgets/patchdesktop.c"
  $4 = $16; //@line 66 "../widgets/patchdesktop.c"
  $17 = $hlen; //@line 67 "../widgets/patchdesktop.c"
  $18 = (0 - ($17))|0; //@line 67 "../widgets/patchdesktop.c"
  $hlen = $18; //@line 67 "../widgets/patchdesktop.c"
 }
 $19 = $0; //@line 70 "../widgets/patchdesktop.c"
 $20 = $1; //@line 70 "../widgets/patchdesktop.c"
 $21 = $2; //@line 70 "../widgets/patchdesktop.c"
 $22 = $hlen; //@line 70 "../widgets/patchdesktop.c"
 $23 = (($22|0) / 2)&-1; //@line 70 "../widgets/patchdesktop.c"
 $24 = $5; //@line 70 "../widgets/patchdesktop.c"
 _Context_horizontal_line($19,$20,$21,$23,$24); //@line 70 "../widgets/patchdesktop.c"
 $25 = $0; //@line 71 "../widgets/patchdesktop.c"
 $26 = $1; //@line 71 "../widgets/patchdesktop.c"
 $27 = $hlen; //@line 71 "../widgets/patchdesktop.c"
 $28 = (($27|0) / 2)&-1; //@line 71 "../widgets/patchdesktop.c"
 $29 = (($26) + ($28))|0; //@line 71 "../widgets/patchdesktop.c"
 $30 = $4; //@line 71 "../widgets/patchdesktop.c"
 $31 = $hlen; //@line 71 "../widgets/patchdesktop.c"
 $32 = (($31|0) / 2)&-1; //@line 71 "../widgets/patchdesktop.c"
 $33 = $5; //@line 71 "../widgets/patchdesktop.c"
 _Context_horizontal_line($25,$29,$30,$32,$33); //@line 71 "../widgets/patchdesktop.c"
 $34 = $4; //@line 73 "../widgets/patchdesktop.c"
 $35 = $2; //@line 73 "../widgets/patchdesktop.c"
 $36 = (($34) - ($35))|0; //@line 73 "../widgets/patchdesktop.c"
 $vlen = $36; //@line 73 "../widgets/patchdesktop.c"
 $37 = $vlen; //@line 75 "../widgets/patchdesktop.c"
 $38 = ($37|0)<(0); //@line 75 "../widgets/patchdesktop.c"
 if (!($38)) {
  $42 = $0; //@line 81 "../widgets/patchdesktop.c"
  $43 = $1; //@line 81 "../widgets/patchdesktop.c"
  $44 = $hlen; //@line 81 "../widgets/patchdesktop.c"
  $45 = (($44|0) / 2)&-1; //@line 81 "../widgets/patchdesktop.c"
  $46 = (($43) + ($45))|0; //@line 81 "../widgets/patchdesktop.c"
  $47 = $2; //@line 81 "../widgets/patchdesktop.c"
  $48 = $vlen; //@line 81 "../widgets/patchdesktop.c"
  $49 = $5; //@line 81 "../widgets/patchdesktop.c"
  _Context_vertical_line($42,$46,$47,$48,$49); //@line 81 "../widgets/patchdesktop.c"
  STACKTOP = sp;return; //@line 82 "../widgets/patchdesktop.c"
 }
 $39 = $4; //@line 77 "../widgets/patchdesktop.c"
 $2 = $39; //@line 77 "../widgets/patchdesktop.c"
 $40 = $vlen; //@line 78 "../widgets/patchdesktop.c"
 $41 = (0 - ($40))|0; //@line 78 "../widgets/patchdesktop.c"
 $vlen = $41; //@line 78 "../widgets/patchdesktop.c"
 $42 = $0; //@line 81 "../widgets/patchdesktop.c"
 $43 = $1; //@line 81 "../widgets/patchdesktop.c"
 $44 = $hlen; //@line 81 "../widgets/patchdesktop.c"
 $45 = (($44|0) / 2)&-1; //@line 81 "../widgets/patchdesktop.c"
 $46 = (($43) + ($45))|0; //@line 81 "../widgets/patchdesktop.c"
 $47 = $2; //@line 81 "../widgets/patchdesktop.c"
 $48 = $vlen; //@line 81 "../widgets/patchdesktop.c"
 $49 = $5; //@line 81 "../widgets/patchdesktop.c"
 _Context_vertical_line($42,$46,$47,$48,$49); //@line 81 "../widgets/patchdesktop.c"
 STACKTOP = sp;return; //@line 82 "../widgets/patchdesktop.c"
}
function _PatchDesktop_connect_action($patch_desktop,$io) {
 $patch_desktop = $patch_desktop|0;
 $io = $io|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_desktop;
 $1 = $io;
 $2 = $0; //@line 120 "../widgets/patchdesktop.c"
 $3 = ((($2)) + 104|0); //@line 120 "../widgets/patchdesktop.c"
 $4 = HEAP32[$3>>2]|0; //@line 120 "../widgets/patchdesktop.c"
 $5 = ($4|0)!=(0|0); //@line 120 "../widgets/patchdesktop.c"
 $6 = $0; //@line 121 "../widgets/patchdesktop.c"
 $7 = $1; //@line 121 "../widgets/patchdesktop.c"
 if ($5) {
  _PatchDesktop_finish_connection($6,$7); //@line 121 "../widgets/patchdesktop.c"
  STACKTOP = sp;return; //@line 124 "../widgets/patchdesktop.c"
 } else {
  _PatchDesktop_begin_connection($6,$7); //@line 123 "../widgets/patchdesktop.c"
  STACKTOP = sp;return; //@line 124 "../widgets/patchdesktop.c"
 }
}
function _PatchDesktop_finish_connection($patch_desktop,$io) {
 $patch_desktop = $patch_desktop|0;
 $io = $io|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_desktop;
 $1 = $io;
 $2 = $0; //@line 135 "../widgets/patchdesktop.c"
 $3 = ((($2)) + 104|0); //@line 135 "../widgets/patchdesktop.c"
 $4 = HEAP32[$3>>2]|0; //@line 135 "../widgets/patchdesktop.c"
 $5 = ($4|0)!=(0|0); //@line 135 "../widgets/patchdesktop.c"
 if (!($5)) {
  STACKTOP = sp;return; //@line 151 "../widgets/patchdesktop.c"
 }
 $6 = $0; //@line 138 "../widgets/patchdesktop.c"
 $7 = ((($6)) + 104|0); //@line 138 "../widgets/patchdesktop.c"
 $8 = HEAP32[$7>>2]|0; //@line 138 "../widgets/patchdesktop.c"
 $9 = ((($8)) + 100|0); //@line 138 "../widgets/patchdesktop.c"
 $10 = HEAP32[$9>>2]|0; //@line 138 "../widgets/patchdesktop.c"
 $11 = ($10|0)!=(0); //@line 138 "../widgets/patchdesktop.c"
 $12 = $11 ^ 1; //@line 138 "../widgets/patchdesktop.c"
 $13 = $12 ^ 1; //@line 138 "../widgets/patchdesktop.c"
 $14 = $13&1; //@line 138 "../widgets/patchdesktop.c"
 $15 = $1; //@line 138 "../widgets/patchdesktop.c"
 $16 = ((($15)) + 100|0); //@line 138 "../widgets/patchdesktop.c"
 $17 = HEAP32[$16>>2]|0; //@line 138 "../widgets/patchdesktop.c"
 $18 = ($17|0)!=(0); //@line 138 "../widgets/patchdesktop.c"
 $19 = $18 ^ 1; //@line 138 "../widgets/patchdesktop.c"
 $20 = $19 ^ 1; //@line 138 "../widgets/patchdesktop.c"
 $21 = $20&1; //@line 138 "../widgets/patchdesktop.c"
 $22 = ($14|0)==($21|0); //@line 138 "../widgets/patchdesktop.c"
 if ($22) {
  STACKTOP = sp;return; //@line 151 "../widgets/patchdesktop.c"
 }
 $23 = $0; //@line 141 "../widgets/patchdesktop.c"
 $24 = ((($23)) + 104|0); //@line 141 "../widgets/patchdesktop.c"
 $25 = HEAP32[$24>>2]|0; //@line 141 "../widgets/patchdesktop.c"
 $26 = $1; //@line 141 "../widgets/patchdesktop.c"
 _IO_connect($25,$26); //@line 141 "../widgets/patchdesktop.c"
 $27 = $1; //@line 142 "../widgets/patchdesktop.c"
 $28 = $0; //@line 142 "../widgets/patchdesktop.c"
 $29 = ((($28)) + 104|0); //@line 142 "../widgets/patchdesktop.c"
 $30 = HEAP32[$29>>2]|0; //@line 142 "../widgets/patchdesktop.c"
 _IO_connect($27,$30); //@line 142 "../widgets/patchdesktop.c"
 $31 = $0; //@line 143 "../widgets/patchdesktop.c"
 $32 = ((($31)) + 104|0); //@line 143 "../widgets/patchdesktop.c"
 $33 = HEAP32[$32>>2]|0; //@line 143 "../widgets/patchdesktop.c"
 $34 = $0; //@line 144 "../widgets/patchdesktop.c"
 $35 = ((($34)) + 104|0); //@line 144 "../widgets/patchdesktop.c"
 $36 = HEAP32[$35>>2]|0; //@line 144 "../widgets/patchdesktop.c"
 $37 = ((($36)) + 18|0); //@line 144 "../widgets/patchdesktop.c"
 $38 = HEAP16[$37>>1]|0; //@line 144 "../widgets/patchdesktop.c"
 $39 = $38&65535; //@line 144 "../widgets/patchdesktop.c"
 $40 = (($39) - 1)|0; //@line 144 "../widgets/patchdesktop.c"
 $41 = $0; //@line 145 "../widgets/patchdesktop.c"
 $42 = ((($41)) + 104|0); //@line 145 "../widgets/patchdesktop.c"
 $43 = HEAP32[$42>>2]|0; //@line 145 "../widgets/patchdesktop.c"
 $44 = ((($43)) + 16|0); //@line 145 "../widgets/patchdesktop.c"
 $45 = HEAP16[$44>>1]|0; //@line 145 "../widgets/patchdesktop.c"
 $46 = $45&65535; //@line 145 "../widgets/patchdesktop.c"
 $47 = (($46) - 1)|0; //@line 145 "../widgets/patchdesktop.c"
 _Window_invalidate($33,0,0,$40,$47); //@line 143 "../widgets/patchdesktop.c"
 $48 = $1; //@line 146 "../widgets/patchdesktop.c"
 $49 = $1; //@line 146 "../widgets/patchdesktop.c"
 $50 = ((($49)) + 18|0); //@line 146 "../widgets/patchdesktop.c"
 $51 = HEAP16[$50>>1]|0; //@line 146 "../widgets/patchdesktop.c"
 $52 = $51&65535; //@line 146 "../widgets/patchdesktop.c"
 $53 = (($52) - 1)|0; //@line 146 "../widgets/patchdesktop.c"
 $54 = $1; //@line 146 "../widgets/patchdesktop.c"
 $55 = ((($54)) + 16|0); //@line 146 "../widgets/patchdesktop.c"
 $56 = HEAP16[$55>>1]|0; //@line 146 "../widgets/patchdesktop.c"
 $57 = $56&65535; //@line 146 "../widgets/patchdesktop.c"
 $58 = (($57) - 1)|0; //@line 146 "../widgets/patchdesktop.c"
 _Window_invalidate($48,0,0,$53,$58); //@line 146 "../widgets/patchdesktop.c"
 $59 = $0; //@line 147 "../widgets/patchdesktop.c"
 $60 = ((($59)) + 104|0); //@line 147 "../widgets/patchdesktop.c"
 HEAP32[$60>>2] = 0; //@line 147 "../widgets/patchdesktop.c"
 $61 = $0; //@line 148 "../widgets/patchdesktop.c"
 $62 = $0; //@line 148 "../widgets/patchdesktop.c"
 $63 = ((($62)) + 16|0); //@line 148 "../widgets/patchdesktop.c"
 $64 = HEAP16[$63>>1]|0; //@line 148 "../widgets/patchdesktop.c"
 $65 = $64&65535; //@line 148 "../widgets/patchdesktop.c"
 $66 = (($65) - 1)|0; //@line 148 "../widgets/patchdesktop.c"
 $67 = $0; //@line 149 "../widgets/patchdesktop.c"
 $68 = ((($67)) + 18|0); //@line 149 "../widgets/patchdesktop.c"
 $69 = HEAP16[$68>>1]|0; //@line 149 "../widgets/patchdesktop.c"
 $70 = $69&65535; //@line 149 "../widgets/patchdesktop.c"
 $71 = (($70) - 1)|0; //@line 149 "../widgets/patchdesktop.c"
 _Window_invalidate($61,0,0,$66,$71); //@line 148 "../widgets/patchdesktop.c"
 STACKTOP = sp;return; //@line 151 "../widgets/patchdesktop.c"
}
function _PatchDesktop_begin_connection($patch_desktop,$io) {
 $patch_desktop = $patch_desktop|0;
 $io = $io|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $patch_desktop;
 $1 = $io;
 $2 = $1; //@line 128 "../widgets/patchdesktop.c"
 $3 = $0; //@line 128 "../widgets/patchdesktop.c"
 $4 = ((($3)) + 104|0); //@line 128 "../widgets/patchdesktop.c"
 HEAP32[$4>>2] = $2; //@line 128 "../widgets/patchdesktop.c"
 $5 = $1; //@line 130 "../widgets/patchdesktop.c"
 $6 = $1; //@line 130 "../widgets/patchdesktop.c"
 $7 = ((($6)) + 18|0); //@line 130 "../widgets/patchdesktop.c"
 $8 = HEAP16[$7>>1]|0; //@line 130 "../widgets/patchdesktop.c"
 $9 = $8&65535; //@line 130 "../widgets/patchdesktop.c"
 $10 = (($9) - 1)|0; //@line 130 "../widgets/patchdesktop.c"
 $11 = $1; //@line 130 "../widgets/patchdesktop.c"
 $12 = ((($11)) + 16|0); //@line 130 "../widgets/patchdesktop.c"
 $13 = HEAP16[$12>>1]|0; //@line 130 "../widgets/patchdesktop.c"
 $14 = $13&65535; //@line 130 "../widgets/patchdesktop.c"
 $15 = (($14) - 1)|0; //@line 130 "../widgets/patchdesktop.c"
 _Window_invalidate($5,0,0,$10,$15); //@line 130 "../widgets/patchdesktop.c"
 STACKTOP = sp;return; //@line 131 "../widgets/patchdesktop.c"
}
function _Menu_init($menu,$x,$y,$width) {
 $menu = $menu|0;
 $x = $x|0;
 $y = $y|0;
 $width = $width|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $menu;
 $1 = $x;
 $2 = $y;
 $3 = $width;
 $4 = $0; //@line 20 "../uilib/menu.c"
 $5 = $1; //@line 20 "../uilib/menu.c"
 $6 = $2; //@line 20 "../uilib/menu.c"
 $7 = $3; //@line 20 "../uilib/menu.c"
 $8 = (_Frame_init($4,$5,$6,$7,4)|0); //@line 20 "../uilib/menu.c"
 STACKTOP = sp;return ($8|0); //@line 20 "../uilib/menu.c"
}
function _Menu_add_entry($menu,$menu_entry) {
 $menu = $menu|0;
 $menu_entry = $menu_entry|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $menu;
 $1 = $menu_entry;
 $2 = $0; //@line 25 "../uilib/menu.c"
 $3 = $1; //@line 25 "../uilib/menu.c"
 _Window_insert_child($2,$3); //@line 25 "../uilib/menu.c"
 $4 = $0; //@line 26 "../uilib/menu.c"
 $5 = ((($4)) + 16|0); //@line 26 "../uilib/menu.c"
 $6 = HEAP16[$5>>1]|0; //@line 26 "../uilib/menu.c"
 $7 = $6&65535; //@line 26 "../uilib/menu.c"
 $8 = (($7) - 4)|0; //@line 26 "../uilib/menu.c"
 $9 = $8&65535; //@line 26 "../uilib/menu.c"
 $10 = $1; //@line 26 "../uilib/menu.c"
 $11 = ((($10)) + 16|0); //@line 26 "../uilib/menu.c"
 HEAP16[$11>>1] = $9; //@line 26 "../uilib/menu.c"
 $12 = $1; //@line 27 "../uilib/menu.c"
 $13 = ((($12)) + 12|0); //@line 27 "../uilib/menu.c"
 HEAP16[$13>>1] = 2; //@line 27 "../uilib/menu.c"
 $14 = $0; //@line 28 "../uilib/menu.c"
 $15 = ((($14)) + 40|0); //@line 28 "../uilib/menu.c"
 $16 = HEAP32[$15>>2]|0; //@line 28 "../uilib/menu.c"
 $17 = ((($16)) + 4|0); //@line 28 "../uilib/menu.c"
 $18 = HEAP32[$17>>2]|0; //@line 28 "../uilib/menu.c"
 $19 = (($18) - 1)|0; //@line 28 "../uilib/menu.c"
 $20 = ($19*14)|0; //@line 28 "../uilib/menu.c"
 $21 = (($20) + 2)|0; //@line 28 "../uilib/menu.c"
 $22 = $21&65535; //@line 28 "../uilib/menu.c"
 $23 = $1; //@line 28 "../uilib/menu.c"
 $24 = ((($23)) + 14|0); //@line 28 "../uilib/menu.c"
 HEAP16[$24>>1] = $22; //@line 28 "../uilib/menu.c"
 $25 = $0; //@line 29 "../uilib/menu.c"
 $26 = ((($25)) + 18|0); //@line 29 "../uilib/menu.c"
 $27 = HEAP16[$26>>1]|0; //@line 29 "../uilib/menu.c"
 $28 = $27&65535; //@line 29 "../uilib/menu.c"
 $29 = (($28) + 14)|0; //@line 29 "../uilib/menu.c"
 $30 = $29&65535; //@line 29 "../uilib/menu.c"
 HEAP16[$26>>1] = $30; //@line 29 "../uilib/menu.c"
 STACKTOP = sp;return; //@line 30 "../uilib/menu.c"
}
function _main($argc,$argv) {
 $argc = $argc|0;
 $argv = $argv|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = 0;
 $1 = $argc;
 $2 = $argv;
 _PlatformWrapper_init(); //@line 6 "../main.c"
 $3 = (_PatchCore_new()|0); //@line 7 "../main.c"
 _PatchCore_start($3); //@line 7 "../main.c"
 _PlatformWrapper_hold_for_exit(); //@line 9 "../main.c"
 STACKTOP = sp;return 0; //@line 11 "../main.c"
}
function ___errno_location() {
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (0|0)==(0|0);
 if ($0) {
  $$0 = 840;
 } else {
  $1 = (_pthread_self()|0);
  $2 = ((($1)) + 60|0);
  $3 = HEAP32[$2>>2]|0;
  $$0 = $3;
 }
 return ($$0|0);
}
function _srand($s) {
 $s = $s|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($s) + -1)|0;
 $1 = 8;
 $2 = $1;
 HEAP32[$2>>2] = $0;
 $3 = (($1) + 4)|0;
 $4 = $3;
 HEAP32[$4>>2] = 0;
 return;
}
function _rand() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = 8;
 $1 = $0;
 $2 = HEAP32[$1>>2]|0;
 $3 = (($0) + 4)|0;
 $4 = $3;
 $5 = HEAP32[$4>>2]|0;
 $6 = (___muldi3(($2|0),($5|0),1284865837,1481765933)|0);
 $7 = tempRet0;
 $8 = (_i64Add(($6|0),($7|0),1,0)|0);
 $9 = tempRet0;
 $10 = 8;
 $11 = $10;
 HEAP32[$11>>2] = $8;
 $12 = (($10) + 4)|0;
 $13 = $12;
 HEAP32[$13>>2] = $9;
 $14 = (_bitshift64Lshr(($8|0),($9|0),33)|0);
 $15 = tempRet0;
 return ($14|0);
}
function _strcmp($l,$r) {
 $l = $l|0;
 $r = $r|0;
 var $$014 = 0, $$05 = 0, $$lcssa = 0, $$lcssa2 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond3 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 $0 = HEAP8[$l>>0]|0;
 $1 = HEAP8[$r>>0]|0;
 $2 = ($0<<24>>24)!=($1<<24>>24);
 $3 = ($0<<24>>24)==(0);
 $or$cond3 = $3 | $2;
 if ($or$cond3) {
  $$lcssa = $0;$$lcssa2 = $1;
 } else {
  $$014 = $l;$$05 = $r;
  while(1) {
   $4 = ((($$014)) + 1|0);
   $5 = ((($$05)) + 1|0);
   $6 = HEAP8[$4>>0]|0;
   $7 = HEAP8[$5>>0]|0;
   $8 = ($6<<24>>24)!=($7<<24>>24);
   $9 = ($6<<24>>24)==(0);
   $or$cond = $9 | $8;
   if ($or$cond) {
    $$lcssa = $6;$$lcssa2 = $7;
    break;
   } else {
    $$014 = $4;$$05 = $5;
   }
  }
 }
 $10 = $$lcssa&255;
 $11 = $$lcssa2&255;
 $12 = (($10) - ($11))|0;
 return ($12|0);
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$3$i = 0, $$lcssa = 0, $$lcssa211 = 0, $$lcssa215 = 0, $$lcssa216 = 0, $$lcssa217 = 0, $$lcssa219 = 0, $$lcssa222 = 0, $$lcssa224 = 0, $$lcssa226 = 0, $$lcssa228 = 0, $$lcssa230 = 0, $$lcssa232 = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i22$i = 0, $$pre$i25 = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i23$iZ2D = 0;
 var $$pre$phi$i26Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi58$i$iZ2D = 0, $$pre$phiZ2D = 0, $$pre105 = 0, $$pre106 = 0, $$pre14$i$i = 0, $$pre43$i = 0, $$pre56$i$i = 0, $$pre57$i$i = 0, $$pre8$i = 0, $$rsize$0$i = 0, $$rsize$3$i = 0, $$sum = 0, $$sum$i$i = 0, $$sum$i$i$i = 0, $$sum$i13$i = 0, $$sum$i14$i = 0, $$sum$i17$i = 0, $$sum$i19$i = 0;
 var $$sum$i2334 = 0, $$sum$i32 = 0, $$sum$i35 = 0, $$sum1 = 0, $$sum1$i = 0, $$sum1$i$i = 0, $$sum1$i15$i = 0, $$sum1$i20$i = 0, $$sum1$i24 = 0, $$sum10 = 0, $$sum10$i = 0, $$sum10$i$i = 0, $$sum11$i = 0, $$sum11$i$i = 0, $$sum1112 = 0, $$sum112$i = 0, $$sum113$i = 0, $$sum114$i = 0, $$sum115$i = 0, $$sum116$i = 0;
 var $$sum117$i = 0, $$sum118$i = 0, $$sum119$i = 0, $$sum12$i = 0, $$sum12$i$i = 0, $$sum120$i = 0, $$sum121$i = 0, $$sum122$i = 0, $$sum123$i = 0, $$sum124$i = 0, $$sum125$i = 0, $$sum13$i = 0, $$sum13$i$i = 0, $$sum14$i$i = 0, $$sum15$i = 0, $$sum15$i$i = 0, $$sum16$i = 0, $$sum16$i$i = 0, $$sum17$i = 0, $$sum17$i$i = 0;
 var $$sum18$i = 0, $$sum1819$i$i = 0, $$sum2 = 0, $$sum2$i = 0, $$sum2$i$i = 0, $$sum2$i$i$i = 0, $$sum2$i16$i = 0, $$sum2$i18$i = 0, $$sum2$i21$i = 0, $$sum20$i$i = 0, $$sum21$i$i = 0, $$sum22$i$i = 0, $$sum23$i$i = 0, $$sum24$i$i = 0, $$sum25$i$i = 0, $$sum27$i$i = 0, $$sum28$i$i = 0, $$sum29$i$i = 0, $$sum3$i = 0, $$sum3$i27 = 0;
 var $$sum30$i$i = 0, $$sum3132$i$i = 0, $$sum34$i$i = 0, $$sum3536$i$i = 0, $$sum3738$i$i = 0, $$sum39$i$i = 0, $$sum4 = 0, $$sum4$i = 0, $$sum4$i$i = 0, $$sum4$i28 = 0, $$sum40$i$i = 0, $$sum41$i$i = 0, $$sum42$i$i = 0, $$sum5$i = 0, $$sum5$i$i = 0, $$sum56 = 0, $$sum6$i = 0, $$sum67$i$i = 0, $$sum7$i = 0, $$sum8$i = 0;
 var $$sum9 = 0, $$sum9$i = 0, $$sum9$i$i = 0, $$tsize$1$i = 0, $$v$0$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $1000 = 0, $1001 = 0, $1002 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $1006 = 0, $1007 = 0, $1008 = 0, $1009 = 0, $101 = 0;
 var $1010 = 0, $1011 = 0, $1012 = 0, $1013 = 0, $1014 = 0, $1015 = 0, $1016 = 0, $1017 = 0, $1018 = 0, $1019 = 0, $102 = 0, $1020 = 0, $1021 = 0, $1022 = 0, $1023 = 0, $1024 = 0, $1025 = 0, $1026 = 0, $1027 = 0, $1028 = 0;
 var $1029 = 0, $103 = 0, $1030 = 0, $1031 = 0, $1032 = 0, $1033 = 0, $1034 = 0, $1035 = 0, $1036 = 0, $1037 = 0, $1038 = 0, $1039 = 0, $104 = 0, $1040 = 0, $1041 = 0, $1042 = 0, $1043 = 0, $1044 = 0, $1045 = 0, $1046 = 0;
 var $1047 = 0, $1048 = 0, $1049 = 0, $105 = 0, $1050 = 0, $1051 = 0, $1052 = 0, $1053 = 0, $1054 = 0, $1055 = 0, $1056 = 0, $1057 = 0, $1058 = 0, $1059 = 0, $106 = 0, $1060 = 0, $1061 = 0, $1062 = 0, $1063 = 0, $1064 = 0;
 var $1065 = 0, $1066 = 0, $1067 = 0, $1068 = 0, $1069 = 0, $107 = 0, $1070 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0;
 var $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0;
 var $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0;
 var $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0;
 var $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0;
 var $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0;
 var $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0;
 var $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0;
 var $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0;
 var $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0;
 var $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0;
 var $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0;
 var $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0;
 var $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0;
 var $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0;
 var $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0;
 var $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0;
 var $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0;
 var $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0;
 var $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0;
 var $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0;
 var $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0;
 var $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0;
 var $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0;
 var $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0;
 var $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0;
 var $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0;
 var $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0;
 var $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0;
 var $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0;
 var $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0;
 var $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0;
 var $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0;
 var $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0;
 var $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0;
 var $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0;
 var $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0;
 var $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0;
 var $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0, $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0;
 var $804 = 0, $805 = 0, $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0, $810 = 0, $811 = 0, $812 = 0, $813 = 0, $814 = 0, $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0;
 var $822 = 0, $823 = 0, $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0, $829 = 0, $83 = 0, $830 = 0, $831 = 0, $832 = 0, $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0;
 var $840 = 0, $841 = 0, $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0, $847 = 0, $848 = 0, $849 = 0, $85 = 0, $850 = 0, $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0;
 var $859 = 0, $86 = 0, $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0, $865 = 0, $866 = 0, $867 = 0, $868 = 0, $869 = 0, $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0;
 var $877 = 0, $878 = 0, $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0, $883 = 0, $884 = 0, $885 = 0, $886 = 0, $887 = 0, $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0;
 var $895 = 0, $896 = 0, $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0, $900 = 0, $901 = 0, $902 = 0, $903 = 0, $904 = 0, $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0;
 var $912 = 0, $913 = 0, $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0, $919 = 0, $92 = 0, $920 = 0, $921 = 0, $922 = 0, $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0;
 var $930 = 0, $931 = 0, $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0, $937 = 0, $938 = 0, $939 = 0, $94 = 0, $940 = 0, $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0;
 var $949 = 0, $95 = 0, $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0, $955 = 0, $956 = 0, $957 = 0, $958 = 0, $959 = 0, $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0;
 var $967 = 0, $968 = 0, $969 = 0, $97 = 0, $970 = 0, $971 = 0, $972 = 0, $973 = 0, $974 = 0, $975 = 0, $976 = 0, $977 = 0, $978 = 0, $979 = 0, $98 = 0, $980 = 0, $981 = 0, $982 = 0, $983 = 0, $984 = 0;
 var $985 = 0, $986 = 0, $987 = 0, $988 = 0, $989 = 0, $99 = 0, $990 = 0, $991 = 0, $992 = 0, $993 = 0, $994 = 0, $995 = 0, $996 = 0, $997 = 0, $998 = 0, $999 = 0, $F$0$i$i = 0, $F1$0$i = 0, $F4$0 = 0, $F4$0$i$i = 0;
 var $F5$0$i = 0, $I1$0$i$i = 0, $I7$0$i = 0, $I7$0$i$i = 0, $K12$029$i = 0, $K2$07$i$i = 0, $K8$051$i$i = 0, $R$0$i = 0, $R$0$i$i = 0, $R$0$i$i$lcssa = 0, $R$0$i$lcssa = 0, $R$0$i18 = 0, $R$0$i18$lcssa = 0, $R$1$i = 0, $R$1$i$i = 0, $R$1$i20 = 0, $RP$0$i = 0, $RP$0$i$i = 0, $RP$0$i$i$lcssa = 0, $RP$0$i$lcssa = 0;
 var $RP$0$i17 = 0, $RP$0$i17$lcssa = 0, $T$0$lcssa$i = 0, $T$0$lcssa$i$i = 0, $T$0$lcssa$i25$i = 0, $T$028$i = 0, $T$028$i$lcssa = 0, $T$050$i$i = 0, $T$050$i$i$lcssa = 0, $T$06$i$i = 0, $T$06$i$i$lcssa = 0, $br$0$ph$i = 0, $cond$i = 0, $cond$i$i = 0, $cond$i21 = 0, $exitcond$i$i = 0, $i$02$i$i = 0, $idx$0$i = 0, $mem$0 = 0, $nb$0 = 0;
 var $not$$i = 0, $not$$i$i = 0, $not$$i26$i = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i30 = 0, $or$cond1$i = 0, $or$cond19$i = 0, $or$cond2$i = 0, $or$cond3$i = 0, $or$cond5$i = 0, $or$cond57$i = 0, $or$cond6$i = 0, $or$cond8$i = 0, $or$cond9$i = 0, $qsize$0$i$i = 0, $rsize$0$i = 0, $rsize$0$i$lcssa = 0, $rsize$0$i15 = 0, $rsize$1$i = 0;
 var $rsize$2$i = 0, $rsize$3$lcssa$i = 0, $rsize$331$i = 0, $rst$0$i = 0, $rst$1$i = 0, $sizebits$0$i = 0, $sp$0$i$i = 0, $sp$0$i$i$i = 0, $sp$084$i = 0, $sp$084$i$lcssa = 0, $sp$183$i = 0, $sp$183$i$lcssa = 0, $ssize$0$$i = 0, $ssize$0$i = 0, $ssize$1$ph$i = 0, $ssize$2$i = 0, $t$0$i = 0, $t$0$i14 = 0, $t$1$i = 0, $t$2$ph$i = 0;
 var $t$2$v$3$i = 0, $t$230$i = 0, $tbase$255$i = 0, $tsize$0$ph$i = 0, $tsize$0323944$i = 0, $tsize$1$i = 0, $tsize$254$i = 0, $v$0$i = 0, $v$0$i$lcssa = 0, $v$0$i16 = 0, $v$1$i = 0, $v$2$i = 0, $v$3$lcssa$i = 0, $v$3$ph$i = 0, $v$332$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($bytes>>>0)<(245);
 do {
  if ($0) {
   $1 = ($bytes>>>0)<(11);
   $2 = (($bytes) + 11)|0;
   $3 = $2 & -8;
   $4 = $1 ? 16 : $3;
   $5 = $4 >>> 3;
   $6 = HEAP32[844>>2]|0;
   $7 = $6 >>> $5;
   $8 = $7 & 3;
   $9 = ($8|0)==(0);
   if (!($9)) {
    $10 = $7 & 1;
    $11 = $10 ^ 1;
    $12 = (($11) + ($5))|0;
    $13 = $12 << 1;
    $14 = (884 + ($13<<2)|0);
    $$sum10 = (($13) + 2)|0;
    $15 = (884 + ($$sum10<<2)|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = ((($16)) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ($14|0)==($18|0);
    do {
     if ($19) {
      $20 = 1 << $12;
      $21 = $20 ^ -1;
      $22 = $6 & $21;
      HEAP32[844>>2] = $22;
     } else {
      $23 = HEAP32[(860)>>2]|0;
      $24 = ($18>>>0)<($23>>>0);
      if ($24) {
       _abort();
       // unreachable;
      }
      $25 = ((($18)) + 12|0);
      $26 = HEAP32[$25>>2]|0;
      $27 = ($26|0)==($16|0);
      if ($27) {
       HEAP32[$25>>2] = $14;
       HEAP32[$15>>2] = $18;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $28 = $12 << 3;
    $29 = $28 | 3;
    $30 = ((($16)) + 4|0);
    HEAP32[$30>>2] = $29;
    $$sum1112 = $28 | 4;
    $31 = (($16) + ($$sum1112)|0);
    $32 = HEAP32[$31>>2]|0;
    $33 = $32 | 1;
    HEAP32[$31>>2] = $33;
    $mem$0 = $17;
    return ($mem$0|0);
   }
   $34 = HEAP32[(852)>>2]|0;
   $35 = ($4>>>0)>($34>>>0);
   if ($35) {
    $36 = ($7|0)==(0);
    if (!($36)) {
     $37 = $7 << $5;
     $38 = 2 << $5;
     $39 = (0 - ($38))|0;
     $40 = $38 | $39;
     $41 = $37 & $40;
     $42 = (0 - ($41))|0;
     $43 = $41 & $42;
     $44 = (($43) + -1)|0;
     $45 = $44 >>> 12;
     $46 = $45 & 16;
     $47 = $44 >>> $46;
     $48 = $47 >>> 5;
     $49 = $48 & 8;
     $50 = $49 | $46;
     $51 = $47 >>> $49;
     $52 = $51 >>> 2;
     $53 = $52 & 4;
     $54 = $50 | $53;
     $55 = $51 >>> $53;
     $56 = $55 >>> 1;
     $57 = $56 & 2;
     $58 = $54 | $57;
     $59 = $55 >>> $57;
     $60 = $59 >>> 1;
     $61 = $60 & 1;
     $62 = $58 | $61;
     $63 = $59 >>> $61;
     $64 = (($62) + ($63))|0;
     $65 = $64 << 1;
     $66 = (884 + ($65<<2)|0);
     $$sum4 = (($65) + 2)|0;
     $67 = (884 + ($$sum4<<2)|0);
     $68 = HEAP32[$67>>2]|0;
     $69 = ((($68)) + 8|0);
     $70 = HEAP32[$69>>2]|0;
     $71 = ($66|0)==($70|0);
     do {
      if ($71) {
       $72 = 1 << $64;
       $73 = $72 ^ -1;
       $74 = $6 & $73;
       HEAP32[844>>2] = $74;
       $88 = $34;
      } else {
       $75 = HEAP32[(860)>>2]|0;
       $76 = ($70>>>0)<($75>>>0);
       if ($76) {
        _abort();
        // unreachable;
       }
       $77 = ((($70)) + 12|0);
       $78 = HEAP32[$77>>2]|0;
       $79 = ($78|0)==($68|0);
       if ($79) {
        HEAP32[$77>>2] = $66;
        HEAP32[$67>>2] = $70;
        $$pre = HEAP32[(852)>>2]|0;
        $88 = $$pre;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $80 = $64 << 3;
     $81 = (($80) - ($4))|0;
     $82 = $4 | 3;
     $83 = ((($68)) + 4|0);
     HEAP32[$83>>2] = $82;
     $84 = (($68) + ($4)|0);
     $85 = $81 | 1;
     $$sum56 = $4 | 4;
     $86 = (($68) + ($$sum56)|0);
     HEAP32[$86>>2] = $85;
     $87 = (($68) + ($80)|0);
     HEAP32[$87>>2] = $81;
     $89 = ($88|0)==(0);
     if (!($89)) {
      $90 = HEAP32[(864)>>2]|0;
      $91 = $88 >>> 3;
      $92 = $91 << 1;
      $93 = (884 + ($92<<2)|0);
      $94 = HEAP32[844>>2]|0;
      $95 = 1 << $91;
      $96 = $94 & $95;
      $97 = ($96|0)==(0);
      if ($97) {
       $98 = $94 | $95;
       HEAP32[844>>2] = $98;
       $$pre105 = (($92) + 2)|0;
       $$pre106 = (884 + ($$pre105<<2)|0);
       $$pre$phiZ2D = $$pre106;$F4$0 = $93;
      } else {
       $$sum9 = (($92) + 2)|0;
       $99 = (884 + ($$sum9<<2)|0);
       $100 = HEAP32[$99>>2]|0;
       $101 = HEAP32[(860)>>2]|0;
       $102 = ($100>>>0)<($101>>>0);
       if ($102) {
        _abort();
        // unreachable;
       } else {
        $$pre$phiZ2D = $99;$F4$0 = $100;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $90;
      $103 = ((($F4$0)) + 12|0);
      HEAP32[$103>>2] = $90;
      $104 = ((($90)) + 8|0);
      HEAP32[$104>>2] = $F4$0;
      $105 = ((($90)) + 12|0);
      HEAP32[$105>>2] = $93;
     }
     HEAP32[(852)>>2] = $81;
     HEAP32[(864)>>2] = $84;
     $mem$0 = $69;
     return ($mem$0|0);
    }
    $106 = HEAP32[(848)>>2]|0;
    $107 = ($106|0)==(0);
    if ($107) {
     $nb$0 = $4;
    } else {
     $108 = (0 - ($106))|0;
     $109 = $106 & $108;
     $110 = (($109) + -1)|0;
     $111 = $110 >>> 12;
     $112 = $111 & 16;
     $113 = $110 >>> $112;
     $114 = $113 >>> 5;
     $115 = $114 & 8;
     $116 = $115 | $112;
     $117 = $113 >>> $115;
     $118 = $117 >>> 2;
     $119 = $118 & 4;
     $120 = $116 | $119;
     $121 = $117 >>> $119;
     $122 = $121 >>> 1;
     $123 = $122 & 2;
     $124 = $120 | $123;
     $125 = $121 >>> $123;
     $126 = $125 >>> 1;
     $127 = $126 & 1;
     $128 = $124 | $127;
     $129 = $125 >>> $127;
     $130 = (($128) + ($129))|0;
     $131 = (1148 + ($130<<2)|0);
     $132 = HEAP32[$131>>2]|0;
     $133 = ((($132)) + 4|0);
     $134 = HEAP32[$133>>2]|0;
     $135 = $134 & -8;
     $136 = (($135) - ($4))|0;
     $rsize$0$i = $136;$t$0$i = $132;$v$0$i = $132;
     while(1) {
      $137 = ((($t$0$i)) + 16|0);
      $138 = HEAP32[$137>>2]|0;
      $139 = ($138|0)==(0|0);
      if ($139) {
       $140 = ((($t$0$i)) + 20|0);
       $141 = HEAP32[$140>>2]|0;
       $142 = ($141|0)==(0|0);
       if ($142) {
        $rsize$0$i$lcssa = $rsize$0$i;$v$0$i$lcssa = $v$0$i;
        break;
       } else {
        $144 = $141;
       }
      } else {
       $144 = $138;
      }
      $143 = ((($144)) + 4|0);
      $145 = HEAP32[$143>>2]|0;
      $146 = $145 & -8;
      $147 = (($146) - ($4))|0;
      $148 = ($147>>>0)<($rsize$0$i>>>0);
      $$rsize$0$i = $148 ? $147 : $rsize$0$i;
      $$v$0$i = $148 ? $144 : $v$0$i;
      $rsize$0$i = $$rsize$0$i;$t$0$i = $144;$v$0$i = $$v$0$i;
     }
     $149 = HEAP32[(860)>>2]|0;
     $150 = ($v$0$i$lcssa>>>0)<($149>>>0);
     if ($150) {
      _abort();
      // unreachable;
     }
     $151 = (($v$0$i$lcssa) + ($4)|0);
     $152 = ($v$0$i$lcssa>>>0)<($151>>>0);
     if (!($152)) {
      _abort();
      // unreachable;
     }
     $153 = ((($v$0$i$lcssa)) + 24|0);
     $154 = HEAP32[$153>>2]|0;
     $155 = ((($v$0$i$lcssa)) + 12|0);
     $156 = HEAP32[$155>>2]|0;
     $157 = ($156|0)==($v$0$i$lcssa|0);
     do {
      if ($157) {
       $167 = ((($v$0$i$lcssa)) + 20|0);
       $168 = HEAP32[$167>>2]|0;
       $169 = ($168|0)==(0|0);
       if ($169) {
        $170 = ((($v$0$i$lcssa)) + 16|0);
        $171 = HEAP32[$170>>2]|0;
        $172 = ($171|0)==(0|0);
        if ($172) {
         $R$1$i = 0;
         break;
        } else {
         $R$0$i = $171;$RP$0$i = $170;
        }
       } else {
        $R$0$i = $168;$RP$0$i = $167;
       }
       while(1) {
        $173 = ((($R$0$i)) + 20|0);
        $174 = HEAP32[$173>>2]|0;
        $175 = ($174|0)==(0|0);
        if (!($175)) {
         $R$0$i = $174;$RP$0$i = $173;
         continue;
        }
        $176 = ((($R$0$i)) + 16|0);
        $177 = HEAP32[$176>>2]|0;
        $178 = ($177|0)==(0|0);
        if ($178) {
         $R$0$i$lcssa = $R$0$i;$RP$0$i$lcssa = $RP$0$i;
         break;
        } else {
         $R$0$i = $177;$RP$0$i = $176;
        }
       }
       $179 = ($RP$0$i$lcssa>>>0)<($149>>>0);
       if ($179) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$RP$0$i$lcssa>>2] = 0;
        $R$1$i = $R$0$i$lcssa;
        break;
       }
      } else {
       $158 = ((($v$0$i$lcssa)) + 8|0);
       $159 = HEAP32[$158>>2]|0;
       $160 = ($159>>>0)<($149>>>0);
       if ($160) {
        _abort();
        // unreachable;
       }
       $161 = ((($159)) + 12|0);
       $162 = HEAP32[$161>>2]|0;
       $163 = ($162|0)==($v$0$i$lcssa|0);
       if (!($163)) {
        _abort();
        // unreachable;
       }
       $164 = ((($156)) + 8|0);
       $165 = HEAP32[$164>>2]|0;
       $166 = ($165|0)==($v$0$i$lcssa|0);
       if ($166) {
        HEAP32[$161>>2] = $156;
        HEAP32[$164>>2] = $159;
        $R$1$i = $156;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $180 = ($154|0)==(0|0);
     do {
      if (!($180)) {
       $181 = ((($v$0$i$lcssa)) + 28|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = (1148 + ($182<<2)|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = ($v$0$i$lcssa|0)==($184|0);
       if ($185) {
        HEAP32[$183>>2] = $R$1$i;
        $cond$i = ($R$1$i|0)==(0|0);
        if ($cond$i) {
         $186 = 1 << $182;
         $187 = $186 ^ -1;
         $188 = HEAP32[(848)>>2]|0;
         $189 = $188 & $187;
         HEAP32[(848)>>2] = $189;
         break;
        }
       } else {
        $190 = HEAP32[(860)>>2]|0;
        $191 = ($154>>>0)<($190>>>0);
        if ($191) {
         _abort();
         // unreachable;
        }
        $192 = ((($154)) + 16|0);
        $193 = HEAP32[$192>>2]|0;
        $194 = ($193|0)==($v$0$i$lcssa|0);
        if ($194) {
         HEAP32[$192>>2] = $R$1$i;
        } else {
         $195 = ((($154)) + 20|0);
         HEAP32[$195>>2] = $R$1$i;
        }
        $196 = ($R$1$i|0)==(0|0);
        if ($196) {
         break;
        }
       }
       $197 = HEAP32[(860)>>2]|0;
       $198 = ($R$1$i>>>0)<($197>>>0);
       if ($198) {
        _abort();
        // unreachable;
       }
       $199 = ((($R$1$i)) + 24|0);
       HEAP32[$199>>2] = $154;
       $200 = ((($v$0$i$lcssa)) + 16|0);
       $201 = HEAP32[$200>>2]|0;
       $202 = ($201|0)==(0|0);
       do {
        if (!($202)) {
         $203 = ($201>>>0)<($197>>>0);
         if ($203) {
          _abort();
          // unreachable;
         } else {
          $204 = ((($R$1$i)) + 16|0);
          HEAP32[$204>>2] = $201;
          $205 = ((($201)) + 24|0);
          HEAP32[$205>>2] = $R$1$i;
          break;
         }
        }
       } while(0);
       $206 = ((($v$0$i$lcssa)) + 20|0);
       $207 = HEAP32[$206>>2]|0;
       $208 = ($207|0)==(0|0);
       if (!($208)) {
        $209 = HEAP32[(860)>>2]|0;
        $210 = ($207>>>0)<($209>>>0);
        if ($210) {
         _abort();
         // unreachable;
        } else {
         $211 = ((($R$1$i)) + 20|0);
         HEAP32[$211>>2] = $207;
         $212 = ((($207)) + 24|0);
         HEAP32[$212>>2] = $R$1$i;
         break;
        }
       }
      }
     } while(0);
     $213 = ($rsize$0$i$lcssa>>>0)<(16);
     if ($213) {
      $214 = (($rsize$0$i$lcssa) + ($4))|0;
      $215 = $214 | 3;
      $216 = ((($v$0$i$lcssa)) + 4|0);
      HEAP32[$216>>2] = $215;
      $$sum4$i = (($214) + 4)|0;
      $217 = (($v$0$i$lcssa) + ($$sum4$i)|0);
      $218 = HEAP32[$217>>2]|0;
      $219 = $218 | 1;
      HEAP32[$217>>2] = $219;
     } else {
      $220 = $4 | 3;
      $221 = ((($v$0$i$lcssa)) + 4|0);
      HEAP32[$221>>2] = $220;
      $222 = $rsize$0$i$lcssa | 1;
      $$sum$i35 = $4 | 4;
      $223 = (($v$0$i$lcssa) + ($$sum$i35)|0);
      HEAP32[$223>>2] = $222;
      $$sum1$i = (($rsize$0$i$lcssa) + ($4))|0;
      $224 = (($v$0$i$lcssa) + ($$sum1$i)|0);
      HEAP32[$224>>2] = $rsize$0$i$lcssa;
      $225 = HEAP32[(852)>>2]|0;
      $226 = ($225|0)==(0);
      if (!($226)) {
       $227 = HEAP32[(864)>>2]|0;
       $228 = $225 >>> 3;
       $229 = $228 << 1;
       $230 = (884 + ($229<<2)|0);
       $231 = HEAP32[844>>2]|0;
       $232 = 1 << $228;
       $233 = $231 & $232;
       $234 = ($233|0)==(0);
       if ($234) {
        $235 = $231 | $232;
        HEAP32[844>>2] = $235;
        $$pre$i = (($229) + 2)|0;
        $$pre8$i = (884 + ($$pre$i<<2)|0);
        $$pre$phi$iZ2D = $$pre8$i;$F1$0$i = $230;
       } else {
        $$sum3$i = (($229) + 2)|0;
        $236 = (884 + ($$sum3$i<<2)|0);
        $237 = HEAP32[$236>>2]|0;
        $238 = HEAP32[(860)>>2]|0;
        $239 = ($237>>>0)<($238>>>0);
        if ($239) {
         _abort();
         // unreachable;
        } else {
         $$pre$phi$iZ2D = $236;$F1$0$i = $237;
        }
       }
       HEAP32[$$pre$phi$iZ2D>>2] = $227;
       $240 = ((($F1$0$i)) + 12|0);
       HEAP32[$240>>2] = $227;
       $241 = ((($227)) + 8|0);
       HEAP32[$241>>2] = $F1$0$i;
       $242 = ((($227)) + 12|0);
       HEAP32[$242>>2] = $230;
      }
      HEAP32[(852)>>2] = $rsize$0$i$lcssa;
      HEAP32[(864)>>2] = $151;
     }
     $243 = ((($v$0$i$lcssa)) + 8|0);
     $mem$0 = $243;
     return ($mem$0|0);
    }
   } else {
    $nb$0 = $4;
   }
  } else {
   $244 = ($bytes>>>0)>(4294967231);
   if ($244) {
    $nb$0 = -1;
   } else {
    $245 = (($bytes) + 11)|0;
    $246 = $245 & -8;
    $247 = HEAP32[(848)>>2]|0;
    $248 = ($247|0)==(0);
    if ($248) {
     $nb$0 = $246;
    } else {
     $249 = (0 - ($246))|0;
     $250 = $245 >>> 8;
     $251 = ($250|0)==(0);
     if ($251) {
      $idx$0$i = 0;
     } else {
      $252 = ($246>>>0)>(16777215);
      if ($252) {
       $idx$0$i = 31;
      } else {
       $253 = (($250) + 1048320)|0;
       $254 = $253 >>> 16;
       $255 = $254 & 8;
       $256 = $250 << $255;
       $257 = (($256) + 520192)|0;
       $258 = $257 >>> 16;
       $259 = $258 & 4;
       $260 = $259 | $255;
       $261 = $256 << $259;
       $262 = (($261) + 245760)|0;
       $263 = $262 >>> 16;
       $264 = $263 & 2;
       $265 = $260 | $264;
       $266 = (14 - ($265))|0;
       $267 = $261 << $264;
       $268 = $267 >>> 15;
       $269 = (($266) + ($268))|0;
       $270 = $269 << 1;
       $271 = (($269) + 7)|0;
       $272 = $246 >>> $271;
       $273 = $272 & 1;
       $274 = $273 | $270;
       $idx$0$i = $274;
      }
     }
     $275 = (1148 + ($idx$0$i<<2)|0);
     $276 = HEAP32[$275>>2]|0;
     $277 = ($276|0)==(0|0);
     L123: do {
      if ($277) {
       $rsize$2$i = $249;$t$1$i = 0;$v$2$i = 0;
       label = 86;
      } else {
       $278 = ($idx$0$i|0)==(31);
       $279 = $idx$0$i >>> 1;
       $280 = (25 - ($279))|0;
       $281 = $278 ? 0 : $280;
       $282 = $246 << $281;
       $rsize$0$i15 = $249;$rst$0$i = 0;$sizebits$0$i = $282;$t$0$i14 = $276;$v$0$i16 = 0;
       while(1) {
        $283 = ((($t$0$i14)) + 4|0);
        $284 = HEAP32[$283>>2]|0;
        $285 = $284 & -8;
        $286 = (($285) - ($246))|0;
        $287 = ($286>>>0)<($rsize$0$i15>>>0);
        if ($287) {
         $288 = ($285|0)==($246|0);
         if ($288) {
          $rsize$331$i = $286;$t$230$i = $t$0$i14;$v$332$i = $t$0$i14;
          label = 90;
          break L123;
         } else {
          $rsize$1$i = $286;$v$1$i = $t$0$i14;
         }
        } else {
         $rsize$1$i = $rsize$0$i15;$v$1$i = $v$0$i16;
        }
        $289 = ((($t$0$i14)) + 20|0);
        $290 = HEAP32[$289>>2]|0;
        $291 = $sizebits$0$i >>> 31;
        $292 = (((($t$0$i14)) + 16|0) + ($291<<2)|0);
        $293 = HEAP32[$292>>2]|0;
        $294 = ($290|0)==(0|0);
        $295 = ($290|0)==($293|0);
        $or$cond19$i = $294 | $295;
        $rst$1$i = $or$cond19$i ? $rst$0$i : $290;
        $296 = ($293|0)==(0|0);
        $297 = $sizebits$0$i << 1;
        if ($296) {
         $rsize$2$i = $rsize$1$i;$t$1$i = $rst$1$i;$v$2$i = $v$1$i;
         label = 86;
         break;
        } else {
         $rsize$0$i15 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $297;$t$0$i14 = $293;$v$0$i16 = $v$1$i;
        }
       }
      }
     } while(0);
     if ((label|0) == 86) {
      $298 = ($t$1$i|0)==(0|0);
      $299 = ($v$2$i|0)==(0|0);
      $or$cond$i = $298 & $299;
      if ($or$cond$i) {
       $300 = 2 << $idx$0$i;
       $301 = (0 - ($300))|0;
       $302 = $300 | $301;
       $303 = $247 & $302;
       $304 = ($303|0)==(0);
       if ($304) {
        $nb$0 = $246;
        break;
       }
       $305 = (0 - ($303))|0;
       $306 = $303 & $305;
       $307 = (($306) + -1)|0;
       $308 = $307 >>> 12;
       $309 = $308 & 16;
       $310 = $307 >>> $309;
       $311 = $310 >>> 5;
       $312 = $311 & 8;
       $313 = $312 | $309;
       $314 = $310 >>> $312;
       $315 = $314 >>> 2;
       $316 = $315 & 4;
       $317 = $313 | $316;
       $318 = $314 >>> $316;
       $319 = $318 >>> 1;
       $320 = $319 & 2;
       $321 = $317 | $320;
       $322 = $318 >>> $320;
       $323 = $322 >>> 1;
       $324 = $323 & 1;
       $325 = $321 | $324;
       $326 = $322 >>> $324;
       $327 = (($325) + ($326))|0;
       $328 = (1148 + ($327<<2)|0);
       $329 = HEAP32[$328>>2]|0;
       $t$2$ph$i = $329;$v$3$ph$i = 0;
      } else {
       $t$2$ph$i = $t$1$i;$v$3$ph$i = $v$2$i;
      }
      $330 = ($t$2$ph$i|0)==(0|0);
      if ($330) {
       $rsize$3$lcssa$i = $rsize$2$i;$v$3$lcssa$i = $v$3$ph$i;
      } else {
       $rsize$331$i = $rsize$2$i;$t$230$i = $t$2$ph$i;$v$332$i = $v$3$ph$i;
       label = 90;
      }
     }
     if ((label|0) == 90) {
      while(1) {
       label = 0;
       $331 = ((($t$230$i)) + 4|0);
       $332 = HEAP32[$331>>2]|0;
       $333 = $332 & -8;
       $334 = (($333) - ($246))|0;
       $335 = ($334>>>0)<($rsize$331$i>>>0);
       $$rsize$3$i = $335 ? $334 : $rsize$331$i;
       $t$2$v$3$i = $335 ? $t$230$i : $v$332$i;
       $336 = ((($t$230$i)) + 16|0);
       $337 = HEAP32[$336>>2]|0;
       $338 = ($337|0)==(0|0);
       if (!($338)) {
        $rsize$331$i = $$rsize$3$i;$t$230$i = $337;$v$332$i = $t$2$v$3$i;
        label = 90;
        continue;
       }
       $339 = ((($t$230$i)) + 20|0);
       $340 = HEAP32[$339>>2]|0;
       $341 = ($340|0)==(0|0);
       if ($341) {
        $rsize$3$lcssa$i = $$rsize$3$i;$v$3$lcssa$i = $t$2$v$3$i;
        break;
       } else {
        $rsize$331$i = $$rsize$3$i;$t$230$i = $340;$v$332$i = $t$2$v$3$i;
        label = 90;
       }
      }
     }
     $342 = ($v$3$lcssa$i|0)==(0|0);
     if ($342) {
      $nb$0 = $246;
     } else {
      $343 = HEAP32[(852)>>2]|0;
      $344 = (($343) - ($246))|0;
      $345 = ($rsize$3$lcssa$i>>>0)<($344>>>0);
      if ($345) {
       $346 = HEAP32[(860)>>2]|0;
       $347 = ($v$3$lcssa$i>>>0)<($346>>>0);
       if ($347) {
        _abort();
        // unreachable;
       }
       $348 = (($v$3$lcssa$i) + ($246)|0);
       $349 = ($v$3$lcssa$i>>>0)<($348>>>0);
       if (!($349)) {
        _abort();
        // unreachable;
       }
       $350 = ((($v$3$lcssa$i)) + 24|0);
       $351 = HEAP32[$350>>2]|0;
       $352 = ((($v$3$lcssa$i)) + 12|0);
       $353 = HEAP32[$352>>2]|0;
       $354 = ($353|0)==($v$3$lcssa$i|0);
       do {
        if ($354) {
         $364 = ((($v$3$lcssa$i)) + 20|0);
         $365 = HEAP32[$364>>2]|0;
         $366 = ($365|0)==(0|0);
         if ($366) {
          $367 = ((($v$3$lcssa$i)) + 16|0);
          $368 = HEAP32[$367>>2]|0;
          $369 = ($368|0)==(0|0);
          if ($369) {
           $R$1$i20 = 0;
           break;
          } else {
           $R$0$i18 = $368;$RP$0$i17 = $367;
          }
         } else {
          $R$0$i18 = $365;$RP$0$i17 = $364;
         }
         while(1) {
          $370 = ((($R$0$i18)) + 20|0);
          $371 = HEAP32[$370>>2]|0;
          $372 = ($371|0)==(0|0);
          if (!($372)) {
           $R$0$i18 = $371;$RP$0$i17 = $370;
           continue;
          }
          $373 = ((($R$0$i18)) + 16|0);
          $374 = HEAP32[$373>>2]|0;
          $375 = ($374|0)==(0|0);
          if ($375) {
           $R$0$i18$lcssa = $R$0$i18;$RP$0$i17$lcssa = $RP$0$i17;
           break;
          } else {
           $R$0$i18 = $374;$RP$0$i17 = $373;
          }
         }
         $376 = ($RP$0$i17$lcssa>>>0)<($346>>>0);
         if ($376) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$RP$0$i17$lcssa>>2] = 0;
          $R$1$i20 = $R$0$i18$lcssa;
          break;
         }
        } else {
         $355 = ((($v$3$lcssa$i)) + 8|0);
         $356 = HEAP32[$355>>2]|0;
         $357 = ($356>>>0)<($346>>>0);
         if ($357) {
          _abort();
          // unreachable;
         }
         $358 = ((($356)) + 12|0);
         $359 = HEAP32[$358>>2]|0;
         $360 = ($359|0)==($v$3$lcssa$i|0);
         if (!($360)) {
          _abort();
          // unreachable;
         }
         $361 = ((($353)) + 8|0);
         $362 = HEAP32[$361>>2]|0;
         $363 = ($362|0)==($v$3$lcssa$i|0);
         if ($363) {
          HEAP32[$358>>2] = $353;
          HEAP32[$361>>2] = $356;
          $R$1$i20 = $353;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $377 = ($351|0)==(0|0);
       do {
        if (!($377)) {
         $378 = ((($v$3$lcssa$i)) + 28|0);
         $379 = HEAP32[$378>>2]|0;
         $380 = (1148 + ($379<<2)|0);
         $381 = HEAP32[$380>>2]|0;
         $382 = ($v$3$lcssa$i|0)==($381|0);
         if ($382) {
          HEAP32[$380>>2] = $R$1$i20;
          $cond$i21 = ($R$1$i20|0)==(0|0);
          if ($cond$i21) {
           $383 = 1 << $379;
           $384 = $383 ^ -1;
           $385 = HEAP32[(848)>>2]|0;
           $386 = $385 & $384;
           HEAP32[(848)>>2] = $386;
           break;
          }
         } else {
          $387 = HEAP32[(860)>>2]|0;
          $388 = ($351>>>0)<($387>>>0);
          if ($388) {
           _abort();
           // unreachable;
          }
          $389 = ((($351)) + 16|0);
          $390 = HEAP32[$389>>2]|0;
          $391 = ($390|0)==($v$3$lcssa$i|0);
          if ($391) {
           HEAP32[$389>>2] = $R$1$i20;
          } else {
           $392 = ((($351)) + 20|0);
           HEAP32[$392>>2] = $R$1$i20;
          }
          $393 = ($R$1$i20|0)==(0|0);
          if ($393) {
           break;
          }
         }
         $394 = HEAP32[(860)>>2]|0;
         $395 = ($R$1$i20>>>0)<($394>>>0);
         if ($395) {
          _abort();
          // unreachable;
         }
         $396 = ((($R$1$i20)) + 24|0);
         HEAP32[$396>>2] = $351;
         $397 = ((($v$3$lcssa$i)) + 16|0);
         $398 = HEAP32[$397>>2]|0;
         $399 = ($398|0)==(0|0);
         do {
          if (!($399)) {
           $400 = ($398>>>0)<($394>>>0);
           if ($400) {
            _abort();
            // unreachable;
           } else {
            $401 = ((($R$1$i20)) + 16|0);
            HEAP32[$401>>2] = $398;
            $402 = ((($398)) + 24|0);
            HEAP32[$402>>2] = $R$1$i20;
            break;
           }
          }
         } while(0);
         $403 = ((($v$3$lcssa$i)) + 20|0);
         $404 = HEAP32[$403>>2]|0;
         $405 = ($404|0)==(0|0);
         if (!($405)) {
          $406 = HEAP32[(860)>>2]|0;
          $407 = ($404>>>0)<($406>>>0);
          if ($407) {
           _abort();
           // unreachable;
          } else {
           $408 = ((($R$1$i20)) + 20|0);
           HEAP32[$408>>2] = $404;
           $409 = ((($404)) + 24|0);
           HEAP32[$409>>2] = $R$1$i20;
           break;
          }
         }
        }
       } while(0);
       $410 = ($rsize$3$lcssa$i>>>0)<(16);
       L199: do {
        if ($410) {
         $411 = (($rsize$3$lcssa$i) + ($246))|0;
         $412 = $411 | 3;
         $413 = ((($v$3$lcssa$i)) + 4|0);
         HEAP32[$413>>2] = $412;
         $$sum18$i = (($411) + 4)|0;
         $414 = (($v$3$lcssa$i) + ($$sum18$i)|0);
         $415 = HEAP32[$414>>2]|0;
         $416 = $415 | 1;
         HEAP32[$414>>2] = $416;
        } else {
         $417 = $246 | 3;
         $418 = ((($v$3$lcssa$i)) + 4|0);
         HEAP32[$418>>2] = $417;
         $419 = $rsize$3$lcssa$i | 1;
         $$sum$i2334 = $246 | 4;
         $420 = (($v$3$lcssa$i) + ($$sum$i2334)|0);
         HEAP32[$420>>2] = $419;
         $$sum1$i24 = (($rsize$3$lcssa$i) + ($246))|0;
         $421 = (($v$3$lcssa$i) + ($$sum1$i24)|0);
         HEAP32[$421>>2] = $rsize$3$lcssa$i;
         $422 = $rsize$3$lcssa$i >>> 3;
         $423 = ($rsize$3$lcssa$i>>>0)<(256);
         if ($423) {
          $424 = $422 << 1;
          $425 = (884 + ($424<<2)|0);
          $426 = HEAP32[844>>2]|0;
          $427 = 1 << $422;
          $428 = $426 & $427;
          $429 = ($428|0)==(0);
          if ($429) {
           $430 = $426 | $427;
           HEAP32[844>>2] = $430;
           $$pre$i25 = (($424) + 2)|0;
           $$pre43$i = (884 + ($$pre$i25<<2)|0);
           $$pre$phi$i26Z2D = $$pre43$i;$F5$0$i = $425;
          } else {
           $$sum17$i = (($424) + 2)|0;
           $431 = (884 + ($$sum17$i<<2)|0);
           $432 = HEAP32[$431>>2]|0;
           $433 = HEAP32[(860)>>2]|0;
           $434 = ($432>>>0)<($433>>>0);
           if ($434) {
            _abort();
            // unreachable;
           } else {
            $$pre$phi$i26Z2D = $431;$F5$0$i = $432;
           }
          }
          HEAP32[$$pre$phi$i26Z2D>>2] = $348;
          $435 = ((($F5$0$i)) + 12|0);
          HEAP32[$435>>2] = $348;
          $$sum15$i = (($246) + 8)|0;
          $436 = (($v$3$lcssa$i) + ($$sum15$i)|0);
          HEAP32[$436>>2] = $F5$0$i;
          $$sum16$i = (($246) + 12)|0;
          $437 = (($v$3$lcssa$i) + ($$sum16$i)|0);
          HEAP32[$437>>2] = $425;
          break;
         }
         $438 = $rsize$3$lcssa$i >>> 8;
         $439 = ($438|0)==(0);
         if ($439) {
          $I7$0$i = 0;
         } else {
          $440 = ($rsize$3$lcssa$i>>>0)>(16777215);
          if ($440) {
           $I7$0$i = 31;
          } else {
           $441 = (($438) + 1048320)|0;
           $442 = $441 >>> 16;
           $443 = $442 & 8;
           $444 = $438 << $443;
           $445 = (($444) + 520192)|0;
           $446 = $445 >>> 16;
           $447 = $446 & 4;
           $448 = $447 | $443;
           $449 = $444 << $447;
           $450 = (($449) + 245760)|0;
           $451 = $450 >>> 16;
           $452 = $451 & 2;
           $453 = $448 | $452;
           $454 = (14 - ($453))|0;
           $455 = $449 << $452;
           $456 = $455 >>> 15;
           $457 = (($454) + ($456))|0;
           $458 = $457 << 1;
           $459 = (($457) + 7)|0;
           $460 = $rsize$3$lcssa$i >>> $459;
           $461 = $460 & 1;
           $462 = $461 | $458;
           $I7$0$i = $462;
          }
         }
         $463 = (1148 + ($I7$0$i<<2)|0);
         $$sum2$i = (($246) + 28)|0;
         $464 = (($v$3$lcssa$i) + ($$sum2$i)|0);
         HEAP32[$464>>2] = $I7$0$i;
         $$sum3$i27 = (($246) + 16)|0;
         $465 = (($v$3$lcssa$i) + ($$sum3$i27)|0);
         $$sum4$i28 = (($246) + 20)|0;
         $466 = (($v$3$lcssa$i) + ($$sum4$i28)|0);
         HEAP32[$466>>2] = 0;
         HEAP32[$465>>2] = 0;
         $467 = HEAP32[(848)>>2]|0;
         $468 = 1 << $I7$0$i;
         $469 = $467 & $468;
         $470 = ($469|0)==(0);
         if ($470) {
          $471 = $467 | $468;
          HEAP32[(848)>>2] = $471;
          HEAP32[$463>>2] = $348;
          $$sum5$i = (($246) + 24)|0;
          $472 = (($v$3$lcssa$i) + ($$sum5$i)|0);
          HEAP32[$472>>2] = $463;
          $$sum6$i = (($246) + 12)|0;
          $473 = (($v$3$lcssa$i) + ($$sum6$i)|0);
          HEAP32[$473>>2] = $348;
          $$sum7$i = (($246) + 8)|0;
          $474 = (($v$3$lcssa$i) + ($$sum7$i)|0);
          HEAP32[$474>>2] = $348;
          break;
         }
         $475 = HEAP32[$463>>2]|0;
         $476 = ((($475)) + 4|0);
         $477 = HEAP32[$476>>2]|0;
         $478 = $477 & -8;
         $479 = ($478|0)==($rsize$3$lcssa$i|0);
         L217: do {
          if ($479) {
           $T$0$lcssa$i = $475;
          } else {
           $480 = ($I7$0$i|0)==(31);
           $481 = $I7$0$i >>> 1;
           $482 = (25 - ($481))|0;
           $483 = $480 ? 0 : $482;
           $484 = $rsize$3$lcssa$i << $483;
           $K12$029$i = $484;$T$028$i = $475;
           while(1) {
            $491 = $K12$029$i >>> 31;
            $492 = (((($T$028$i)) + 16|0) + ($491<<2)|0);
            $487 = HEAP32[$492>>2]|0;
            $493 = ($487|0)==(0|0);
            if ($493) {
             $$lcssa232 = $492;$T$028$i$lcssa = $T$028$i;
             break;
            }
            $485 = $K12$029$i << 1;
            $486 = ((($487)) + 4|0);
            $488 = HEAP32[$486>>2]|0;
            $489 = $488 & -8;
            $490 = ($489|0)==($rsize$3$lcssa$i|0);
            if ($490) {
             $T$0$lcssa$i = $487;
             break L217;
            } else {
             $K12$029$i = $485;$T$028$i = $487;
            }
           }
           $494 = HEAP32[(860)>>2]|0;
           $495 = ($$lcssa232>>>0)<($494>>>0);
           if ($495) {
            _abort();
            // unreachable;
           } else {
            HEAP32[$$lcssa232>>2] = $348;
            $$sum11$i = (($246) + 24)|0;
            $496 = (($v$3$lcssa$i) + ($$sum11$i)|0);
            HEAP32[$496>>2] = $T$028$i$lcssa;
            $$sum12$i = (($246) + 12)|0;
            $497 = (($v$3$lcssa$i) + ($$sum12$i)|0);
            HEAP32[$497>>2] = $348;
            $$sum13$i = (($246) + 8)|0;
            $498 = (($v$3$lcssa$i) + ($$sum13$i)|0);
            HEAP32[$498>>2] = $348;
            break L199;
           }
          }
         } while(0);
         $499 = ((($T$0$lcssa$i)) + 8|0);
         $500 = HEAP32[$499>>2]|0;
         $501 = HEAP32[(860)>>2]|0;
         $502 = ($500>>>0)>=($501>>>0);
         $not$$i = ($T$0$lcssa$i>>>0)>=($501>>>0);
         $503 = $502 & $not$$i;
         if ($503) {
          $504 = ((($500)) + 12|0);
          HEAP32[$504>>2] = $348;
          HEAP32[$499>>2] = $348;
          $$sum8$i = (($246) + 8)|0;
          $505 = (($v$3$lcssa$i) + ($$sum8$i)|0);
          HEAP32[$505>>2] = $500;
          $$sum9$i = (($246) + 12)|0;
          $506 = (($v$3$lcssa$i) + ($$sum9$i)|0);
          HEAP32[$506>>2] = $T$0$lcssa$i;
          $$sum10$i = (($246) + 24)|0;
          $507 = (($v$3$lcssa$i) + ($$sum10$i)|0);
          HEAP32[$507>>2] = 0;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $508 = ((($v$3$lcssa$i)) + 8|0);
       $mem$0 = $508;
       return ($mem$0|0);
      } else {
       $nb$0 = $246;
      }
     }
    }
   }
  }
 } while(0);
 $509 = HEAP32[(852)>>2]|0;
 $510 = ($509>>>0)<($nb$0>>>0);
 if (!($510)) {
  $511 = (($509) - ($nb$0))|0;
  $512 = HEAP32[(864)>>2]|0;
  $513 = ($511>>>0)>(15);
  if ($513) {
   $514 = (($512) + ($nb$0)|0);
   HEAP32[(864)>>2] = $514;
   HEAP32[(852)>>2] = $511;
   $515 = $511 | 1;
   $$sum2 = (($nb$0) + 4)|0;
   $516 = (($512) + ($$sum2)|0);
   HEAP32[$516>>2] = $515;
   $517 = (($512) + ($509)|0);
   HEAP32[$517>>2] = $511;
   $518 = $nb$0 | 3;
   $519 = ((($512)) + 4|0);
   HEAP32[$519>>2] = $518;
  } else {
   HEAP32[(852)>>2] = 0;
   HEAP32[(864)>>2] = 0;
   $520 = $509 | 3;
   $521 = ((($512)) + 4|0);
   HEAP32[$521>>2] = $520;
   $$sum1 = (($509) + 4)|0;
   $522 = (($512) + ($$sum1)|0);
   $523 = HEAP32[$522>>2]|0;
   $524 = $523 | 1;
   HEAP32[$522>>2] = $524;
  }
  $525 = ((($512)) + 8|0);
  $mem$0 = $525;
  return ($mem$0|0);
 }
 $526 = HEAP32[(856)>>2]|0;
 $527 = ($526>>>0)>($nb$0>>>0);
 if ($527) {
  $528 = (($526) - ($nb$0))|0;
  HEAP32[(856)>>2] = $528;
  $529 = HEAP32[(868)>>2]|0;
  $530 = (($529) + ($nb$0)|0);
  HEAP32[(868)>>2] = $530;
  $531 = $528 | 1;
  $$sum = (($nb$0) + 4)|0;
  $532 = (($529) + ($$sum)|0);
  HEAP32[$532>>2] = $531;
  $533 = $nb$0 | 3;
  $534 = ((($529)) + 4|0);
  HEAP32[$534>>2] = $533;
  $535 = ((($529)) + 8|0);
  $mem$0 = $535;
  return ($mem$0|0);
 }
 $536 = HEAP32[1316>>2]|0;
 $537 = ($536|0)==(0);
 do {
  if ($537) {
   $538 = (_sysconf(30)|0);
   $539 = (($538) + -1)|0;
   $540 = $539 & $538;
   $541 = ($540|0)==(0);
   if ($541) {
    HEAP32[(1324)>>2] = $538;
    HEAP32[(1320)>>2] = $538;
    HEAP32[(1328)>>2] = -1;
    HEAP32[(1332)>>2] = -1;
    HEAP32[(1336)>>2] = 0;
    HEAP32[(1288)>>2] = 0;
    $542 = (_time((0|0))|0);
    $543 = $542 & -16;
    $544 = $543 ^ 1431655768;
    HEAP32[1316>>2] = $544;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $545 = (($nb$0) + 48)|0;
 $546 = HEAP32[(1324)>>2]|0;
 $547 = (($nb$0) + 47)|0;
 $548 = (($546) + ($547))|0;
 $549 = (0 - ($546))|0;
 $550 = $548 & $549;
 $551 = ($550>>>0)>($nb$0>>>0);
 if (!($551)) {
  $mem$0 = 0;
  return ($mem$0|0);
 }
 $552 = HEAP32[(1284)>>2]|0;
 $553 = ($552|0)==(0);
 if (!($553)) {
  $554 = HEAP32[(1276)>>2]|0;
  $555 = (($554) + ($550))|0;
  $556 = ($555>>>0)<=($554>>>0);
  $557 = ($555>>>0)>($552>>>0);
  $or$cond1$i = $556 | $557;
  if ($or$cond1$i) {
   $mem$0 = 0;
   return ($mem$0|0);
  }
 }
 $558 = HEAP32[(1288)>>2]|0;
 $559 = $558 & 4;
 $560 = ($559|0)==(0);
 L258: do {
  if ($560) {
   $561 = HEAP32[(868)>>2]|0;
   $562 = ($561|0)==(0|0);
   L260: do {
    if ($562) {
     label = 174;
    } else {
     $sp$0$i$i = (1292);
     while(1) {
      $563 = HEAP32[$sp$0$i$i>>2]|0;
      $564 = ($563>>>0)>($561>>>0);
      if (!($564)) {
       $565 = ((($sp$0$i$i)) + 4|0);
       $566 = HEAP32[$565>>2]|0;
       $567 = (($563) + ($566)|0);
       $568 = ($567>>>0)>($561>>>0);
       if ($568) {
        $$lcssa228 = $sp$0$i$i;$$lcssa230 = $565;
        break;
       }
      }
      $569 = ((($sp$0$i$i)) + 8|0);
      $570 = HEAP32[$569>>2]|0;
      $571 = ($570|0)==(0|0);
      if ($571) {
       label = 174;
       break L260;
      } else {
       $sp$0$i$i = $570;
      }
     }
     $594 = HEAP32[(856)>>2]|0;
     $595 = (($548) - ($594))|0;
     $596 = $595 & $549;
     $597 = ($596>>>0)<(2147483647);
     if ($597) {
      $598 = (_sbrk(($596|0))|0);
      $599 = HEAP32[$$lcssa228>>2]|0;
      $600 = HEAP32[$$lcssa230>>2]|0;
      $601 = (($599) + ($600)|0);
      $602 = ($598|0)==($601|0);
      $$3$i = $602 ? $596 : 0;
      if ($602) {
       $603 = ($598|0)==((-1)|0);
       if ($603) {
        $tsize$0323944$i = $$3$i;
       } else {
        $tbase$255$i = $598;$tsize$254$i = $$3$i;
        label = 194;
        break L258;
       }
      } else {
       $br$0$ph$i = $598;$ssize$1$ph$i = $596;$tsize$0$ph$i = $$3$i;
       label = 184;
      }
     } else {
      $tsize$0323944$i = 0;
     }
    }
   } while(0);
   do {
    if ((label|0) == 174) {
     $572 = (_sbrk(0)|0);
     $573 = ($572|0)==((-1)|0);
     if ($573) {
      $tsize$0323944$i = 0;
     } else {
      $574 = $572;
      $575 = HEAP32[(1320)>>2]|0;
      $576 = (($575) + -1)|0;
      $577 = $576 & $574;
      $578 = ($577|0)==(0);
      if ($578) {
       $ssize$0$i = $550;
      } else {
       $579 = (($576) + ($574))|0;
       $580 = (0 - ($575))|0;
       $581 = $579 & $580;
       $582 = (($550) - ($574))|0;
       $583 = (($582) + ($581))|0;
       $ssize$0$i = $583;
      }
      $584 = HEAP32[(1276)>>2]|0;
      $585 = (($584) + ($ssize$0$i))|0;
      $586 = ($ssize$0$i>>>0)>($nb$0>>>0);
      $587 = ($ssize$0$i>>>0)<(2147483647);
      $or$cond$i30 = $586 & $587;
      if ($or$cond$i30) {
       $588 = HEAP32[(1284)>>2]|0;
       $589 = ($588|0)==(0);
       if (!($589)) {
        $590 = ($585>>>0)<=($584>>>0);
        $591 = ($585>>>0)>($588>>>0);
        $or$cond2$i = $590 | $591;
        if ($or$cond2$i) {
         $tsize$0323944$i = 0;
         break;
        }
       }
       $592 = (_sbrk(($ssize$0$i|0))|0);
       $593 = ($592|0)==($572|0);
       $ssize$0$$i = $593 ? $ssize$0$i : 0;
       if ($593) {
        $tbase$255$i = $572;$tsize$254$i = $ssize$0$$i;
        label = 194;
        break L258;
       } else {
        $br$0$ph$i = $592;$ssize$1$ph$i = $ssize$0$i;$tsize$0$ph$i = $ssize$0$$i;
        label = 184;
       }
      } else {
       $tsize$0323944$i = 0;
      }
     }
    }
   } while(0);
   L280: do {
    if ((label|0) == 184) {
     $604 = (0 - ($ssize$1$ph$i))|0;
     $605 = ($br$0$ph$i|0)!=((-1)|0);
     $606 = ($ssize$1$ph$i>>>0)<(2147483647);
     $or$cond5$i = $606 & $605;
     $607 = ($545>>>0)>($ssize$1$ph$i>>>0);
     $or$cond6$i = $607 & $or$cond5$i;
     do {
      if ($or$cond6$i) {
       $608 = HEAP32[(1324)>>2]|0;
       $609 = (($547) - ($ssize$1$ph$i))|0;
       $610 = (($609) + ($608))|0;
       $611 = (0 - ($608))|0;
       $612 = $610 & $611;
       $613 = ($612>>>0)<(2147483647);
       if ($613) {
        $614 = (_sbrk(($612|0))|0);
        $615 = ($614|0)==((-1)|0);
        if ($615) {
         (_sbrk(($604|0))|0);
         $tsize$0323944$i = $tsize$0$ph$i;
         break L280;
        } else {
         $616 = (($612) + ($ssize$1$ph$i))|0;
         $ssize$2$i = $616;
         break;
        }
       } else {
        $ssize$2$i = $ssize$1$ph$i;
       }
      } else {
       $ssize$2$i = $ssize$1$ph$i;
      }
     } while(0);
     $617 = ($br$0$ph$i|0)==((-1)|0);
     if ($617) {
      $tsize$0323944$i = $tsize$0$ph$i;
     } else {
      $tbase$255$i = $br$0$ph$i;$tsize$254$i = $ssize$2$i;
      label = 194;
      break L258;
     }
    }
   } while(0);
   $618 = HEAP32[(1288)>>2]|0;
   $619 = $618 | 4;
   HEAP32[(1288)>>2] = $619;
   $tsize$1$i = $tsize$0323944$i;
   label = 191;
  } else {
   $tsize$1$i = 0;
   label = 191;
  }
 } while(0);
 if ((label|0) == 191) {
  $620 = ($550>>>0)<(2147483647);
  if ($620) {
   $621 = (_sbrk(($550|0))|0);
   $622 = (_sbrk(0)|0);
   $623 = ($621|0)!=((-1)|0);
   $624 = ($622|0)!=((-1)|0);
   $or$cond3$i = $623 & $624;
   $625 = ($621>>>0)<($622>>>0);
   $or$cond8$i = $625 & $or$cond3$i;
   if ($or$cond8$i) {
    $626 = $622;
    $627 = $621;
    $628 = (($626) - ($627))|0;
    $629 = (($nb$0) + 40)|0;
    $630 = ($628>>>0)>($629>>>0);
    $$tsize$1$i = $630 ? $628 : $tsize$1$i;
    if ($630) {
     $tbase$255$i = $621;$tsize$254$i = $$tsize$1$i;
     label = 194;
    }
   }
  }
 }
 if ((label|0) == 194) {
  $631 = HEAP32[(1276)>>2]|0;
  $632 = (($631) + ($tsize$254$i))|0;
  HEAP32[(1276)>>2] = $632;
  $633 = HEAP32[(1280)>>2]|0;
  $634 = ($632>>>0)>($633>>>0);
  if ($634) {
   HEAP32[(1280)>>2] = $632;
  }
  $635 = HEAP32[(868)>>2]|0;
  $636 = ($635|0)==(0|0);
  L299: do {
   if ($636) {
    $637 = HEAP32[(860)>>2]|0;
    $638 = ($637|0)==(0|0);
    $639 = ($tbase$255$i>>>0)<($637>>>0);
    $or$cond9$i = $638 | $639;
    if ($or$cond9$i) {
     HEAP32[(860)>>2] = $tbase$255$i;
    }
    HEAP32[(1292)>>2] = $tbase$255$i;
    HEAP32[(1296)>>2] = $tsize$254$i;
    HEAP32[(1304)>>2] = 0;
    $640 = HEAP32[1316>>2]|0;
    HEAP32[(880)>>2] = $640;
    HEAP32[(876)>>2] = -1;
    $i$02$i$i = 0;
    while(1) {
     $641 = $i$02$i$i << 1;
     $642 = (884 + ($641<<2)|0);
     $$sum$i$i = (($641) + 3)|0;
     $643 = (884 + ($$sum$i$i<<2)|0);
     HEAP32[$643>>2] = $642;
     $$sum1$i$i = (($641) + 2)|0;
     $644 = (884 + ($$sum1$i$i<<2)|0);
     HEAP32[$644>>2] = $642;
     $645 = (($i$02$i$i) + 1)|0;
     $exitcond$i$i = ($645|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $i$02$i$i = $645;
     }
    }
    $646 = (($tsize$254$i) + -40)|0;
    $647 = ((($tbase$255$i)) + 8|0);
    $648 = $647;
    $649 = $648 & 7;
    $650 = ($649|0)==(0);
    $651 = (0 - ($648))|0;
    $652 = $651 & 7;
    $653 = $650 ? 0 : $652;
    $654 = (($tbase$255$i) + ($653)|0);
    $655 = (($646) - ($653))|0;
    HEAP32[(868)>>2] = $654;
    HEAP32[(856)>>2] = $655;
    $656 = $655 | 1;
    $$sum$i13$i = (($653) + 4)|0;
    $657 = (($tbase$255$i) + ($$sum$i13$i)|0);
    HEAP32[$657>>2] = $656;
    $$sum2$i$i = (($tsize$254$i) + -36)|0;
    $658 = (($tbase$255$i) + ($$sum2$i$i)|0);
    HEAP32[$658>>2] = 40;
    $659 = HEAP32[(1332)>>2]|0;
    HEAP32[(872)>>2] = $659;
   } else {
    $sp$084$i = (1292);
    while(1) {
     $660 = HEAP32[$sp$084$i>>2]|0;
     $661 = ((($sp$084$i)) + 4|0);
     $662 = HEAP32[$661>>2]|0;
     $663 = (($660) + ($662)|0);
     $664 = ($tbase$255$i|0)==($663|0);
     if ($664) {
      $$lcssa222 = $660;$$lcssa224 = $661;$$lcssa226 = $662;$sp$084$i$lcssa = $sp$084$i;
      label = 204;
      break;
     }
     $665 = ((($sp$084$i)) + 8|0);
     $666 = HEAP32[$665>>2]|0;
     $667 = ($666|0)==(0|0);
     if ($667) {
      break;
     } else {
      $sp$084$i = $666;
     }
    }
    if ((label|0) == 204) {
     $668 = ((($sp$084$i$lcssa)) + 12|0);
     $669 = HEAP32[$668>>2]|0;
     $670 = $669 & 8;
     $671 = ($670|0)==(0);
     if ($671) {
      $672 = ($635>>>0)>=($$lcssa222>>>0);
      $673 = ($635>>>0)<($tbase$255$i>>>0);
      $or$cond57$i = $673 & $672;
      if ($or$cond57$i) {
       $674 = (($$lcssa226) + ($tsize$254$i))|0;
       HEAP32[$$lcssa224>>2] = $674;
       $675 = HEAP32[(856)>>2]|0;
       $676 = (($675) + ($tsize$254$i))|0;
       $677 = ((($635)) + 8|0);
       $678 = $677;
       $679 = $678 & 7;
       $680 = ($679|0)==(0);
       $681 = (0 - ($678))|0;
       $682 = $681 & 7;
       $683 = $680 ? 0 : $682;
       $684 = (($635) + ($683)|0);
       $685 = (($676) - ($683))|0;
       HEAP32[(868)>>2] = $684;
       HEAP32[(856)>>2] = $685;
       $686 = $685 | 1;
       $$sum$i17$i = (($683) + 4)|0;
       $687 = (($635) + ($$sum$i17$i)|0);
       HEAP32[$687>>2] = $686;
       $$sum2$i18$i = (($676) + 4)|0;
       $688 = (($635) + ($$sum2$i18$i)|0);
       HEAP32[$688>>2] = 40;
       $689 = HEAP32[(1332)>>2]|0;
       HEAP32[(872)>>2] = $689;
       break;
      }
     }
    }
    $690 = HEAP32[(860)>>2]|0;
    $691 = ($tbase$255$i>>>0)<($690>>>0);
    if ($691) {
     HEAP32[(860)>>2] = $tbase$255$i;
     $755 = $tbase$255$i;
    } else {
     $755 = $690;
    }
    $692 = (($tbase$255$i) + ($tsize$254$i)|0);
    $sp$183$i = (1292);
    while(1) {
     $693 = HEAP32[$sp$183$i>>2]|0;
     $694 = ($693|0)==($692|0);
     if ($694) {
      $$lcssa219 = $sp$183$i;$sp$183$i$lcssa = $sp$183$i;
      label = 212;
      break;
     }
     $695 = ((($sp$183$i)) + 8|0);
     $696 = HEAP32[$695>>2]|0;
     $697 = ($696|0)==(0|0);
     if ($697) {
      $sp$0$i$i$i = (1292);
      break;
     } else {
      $sp$183$i = $696;
     }
    }
    if ((label|0) == 212) {
     $698 = ((($sp$183$i$lcssa)) + 12|0);
     $699 = HEAP32[$698>>2]|0;
     $700 = $699 & 8;
     $701 = ($700|0)==(0);
     if ($701) {
      HEAP32[$$lcssa219>>2] = $tbase$255$i;
      $702 = ((($sp$183$i$lcssa)) + 4|0);
      $703 = HEAP32[$702>>2]|0;
      $704 = (($703) + ($tsize$254$i))|0;
      HEAP32[$702>>2] = $704;
      $705 = ((($tbase$255$i)) + 8|0);
      $706 = $705;
      $707 = $706 & 7;
      $708 = ($707|0)==(0);
      $709 = (0 - ($706))|0;
      $710 = $709 & 7;
      $711 = $708 ? 0 : $710;
      $712 = (($tbase$255$i) + ($711)|0);
      $$sum112$i = (($tsize$254$i) + 8)|0;
      $713 = (($tbase$255$i) + ($$sum112$i)|0);
      $714 = $713;
      $715 = $714 & 7;
      $716 = ($715|0)==(0);
      $717 = (0 - ($714))|0;
      $718 = $717 & 7;
      $719 = $716 ? 0 : $718;
      $$sum113$i = (($719) + ($tsize$254$i))|0;
      $720 = (($tbase$255$i) + ($$sum113$i)|0);
      $721 = $720;
      $722 = $712;
      $723 = (($721) - ($722))|0;
      $$sum$i19$i = (($711) + ($nb$0))|0;
      $724 = (($tbase$255$i) + ($$sum$i19$i)|0);
      $725 = (($723) - ($nb$0))|0;
      $726 = $nb$0 | 3;
      $$sum1$i20$i = (($711) + 4)|0;
      $727 = (($tbase$255$i) + ($$sum1$i20$i)|0);
      HEAP32[$727>>2] = $726;
      $728 = ($720|0)==($635|0);
      L324: do {
       if ($728) {
        $729 = HEAP32[(856)>>2]|0;
        $730 = (($729) + ($725))|0;
        HEAP32[(856)>>2] = $730;
        HEAP32[(868)>>2] = $724;
        $731 = $730 | 1;
        $$sum42$i$i = (($$sum$i19$i) + 4)|0;
        $732 = (($tbase$255$i) + ($$sum42$i$i)|0);
        HEAP32[$732>>2] = $731;
       } else {
        $733 = HEAP32[(864)>>2]|0;
        $734 = ($720|0)==($733|0);
        if ($734) {
         $735 = HEAP32[(852)>>2]|0;
         $736 = (($735) + ($725))|0;
         HEAP32[(852)>>2] = $736;
         HEAP32[(864)>>2] = $724;
         $737 = $736 | 1;
         $$sum40$i$i = (($$sum$i19$i) + 4)|0;
         $738 = (($tbase$255$i) + ($$sum40$i$i)|0);
         HEAP32[$738>>2] = $737;
         $$sum41$i$i = (($736) + ($$sum$i19$i))|0;
         $739 = (($tbase$255$i) + ($$sum41$i$i)|0);
         HEAP32[$739>>2] = $736;
         break;
        }
        $$sum2$i21$i = (($tsize$254$i) + 4)|0;
        $$sum114$i = (($$sum2$i21$i) + ($719))|0;
        $740 = (($tbase$255$i) + ($$sum114$i)|0);
        $741 = HEAP32[$740>>2]|0;
        $742 = $741 & 3;
        $743 = ($742|0)==(1);
        if ($743) {
         $744 = $741 & -8;
         $745 = $741 >>> 3;
         $746 = ($741>>>0)<(256);
         L332: do {
          if ($746) {
           $$sum3738$i$i = $719 | 8;
           $$sum124$i = (($$sum3738$i$i) + ($tsize$254$i))|0;
           $747 = (($tbase$255$i) + ($$sum124$i)|0);
           $748 = HEAP32[$747>>2]|0;
           $$sum39$i$i = (($tsize$254$i) + 12)|0;
           $$sum125$i = (($$sum39$i$i) + ($719))|0;
           $749 = (($tbase$255$i) + ($$sum125$i)|0);
           $750 = HEAP32[$749>>2]|0;
           $751 = $745 << 1;
           $752 = (884 + ($751<<2)|0);
           $753 = ($748|0)==($752|0);
           do {
            if (!($753)) {
             $754 = ($748>>>0)<($755>>>0);
             if ($754) {
              _abort();
              // unreachable;
             }
             $756 = ((($748)) + 12|0);
             $757 = HEAP32[$756>>2]|0;
             $758 = ($757|0)==($720|0);
             if ($758) {
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $759 = ($750|0)==($748|0);
           if ($759) {
            $760 = 1 << $745;
            $761 = $760 ^ -1;
            $762 = HEAP32[844>>2]|0;
            $763 = $762 & $761;
            HEAP32[844>>2] = $763;
            break;
           }
           $764 = ($750|0)==($752|0);
           do {
            if ($764) {
             $$pre57$i$i = ((($750)) + 8|0);
             $$pre$phi58$i$iZ2D = $$pre57$i$i;
            } else {
             $765 = ($750>>>0)<($755>>>0);
             if ($765) {
              _abort();
              // unreachable;
             }
             $766 = ((($750)) + 8|0);
             $767 = HEAP32[$766>>2]|0;
             $768 = ($767|0)==($720|0);
             if ($768) {
              $$pre$phi58$i$iZ2D = $766;
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $769 = ((($748)) + 12|0);
           HEAP32[$769>>2] = $750;
           HEAP32[$$pre$phi58$i$iZ2D>>2] = $748;
          } else {
           $$sum34$i$i = $719 | 24;
           $$sum115$i = (($$sum34$i$i) + ($tsize$254$i))|0;
           $770 = (($tbase$255$i) + ($$sum115$i)|0);
           $771 = HEAP32[$770>>2]|0;
           $$sum5$i$i = (($tsize$254$i) + 12)|0;
           $$sum116$i = (($$sum5$i$i) + ($719))|0;
           $772 = (($tbase$255$i) + ($$sum116$i)|0);
           $773 = HEAP32[$772>>2]|0;
           $774 = ($773|0)==($720|0);
           do {
            if ($774) {
             $$sum67$i$i = $719 | 16;
             $$sum122$i = (($$sum2$i21$i) + ($$sum67$i$i))|0;
             $784 = (($tbase$255$i) + ($$sum122$i)|0);
             $785 = HEAP32[$784>>2]|0;
             $786 = ($785|0)==(0|0);
             if ($786) {
              $$sum123$i = (($$sum67$i$i) + ($tsize$254$i))|0;
              $787 = (($tbase$255$i) + ($$sum123$i)|0);
              $788 = HEAP32[$787>>2]|0;
              $789 = ($788|0)==(0|0);
              if ($789) {
               $R$1$i$i = 0;
               break;
              } else {
               $R$0$i$i = $788;$RP$0$i$i = $787;
              }
             } else {
              $R$0$i$i = $785;$RP$0$i$i = $784;
             }
             while(1) {
              $790 = ((($R$0$i$i)) + 20|0);
              $791 = HEAP32[$790>>2]|0;
              $792 = ($791|0)==(0|0);
              if (!($792)) {
               $R$0$i$i = $791;$RP$0$i$i = $790;
               continue;
              }
              $793 = ((($R$0$i$i)) + 16|0);
              $794 = HEAP32[$793>>2]|0;
              $795 = ($794|0)==(0|0);
              if ($795) {
               $R$0$i$i$lcssa = $R$0$i$i;$RP$0$i$i$lcssa = $RP$0$i$i;
               break;
              } else {
               $R$0$i$i = $794;$RP$0$i$i = $793;
              }
             }
             $796 = ($RP$0$i$i$lcssa>>>0)<($755>>>0);
             if ($796) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$RP$0$i$i$lcssa>>2] = 0;
              $R$1$i$i = $R$0$i$i$lcssa;
              break;
             }
            } else {
             $$sum3536$i$i = $719 | 8;
             $$sum117$i = (($$sum3536$i$i) + ($tsize$254$i))|0;
             $775 = (($tbase$255$i) + ($$sum117$i)|0);
             $776 = HEAP32[$775>>2]|0;
             $777 = ($776>>>0)<($755>>>0);
             if ($777) {
              _abort();
              // unreachable;
             }
             $778 = ((($776)) + 12|0);
             $779 = HEAP32[$778>>2]|0;
             $780 = ($779|0)==($720|0);
             if (!($780)) {
              _abort();
              // unreachable;
             }
             $781 = ((($773)) + 8|0);
             $782 = HEAP32[$781>>2]|0;
             $783 = ($782|0)==($720|0);
             if ($783) {
              HEAP32[$778>>2] = $773;
              HEAP32[$781>>2] = $776;
              $R$1$i$i = $773;
              break;
             } else {
              _abort();
              // unreachable;
             }
            }
           } while(0);
           $797 = ($771|0)==(0|0);
           if ($797) {
            break;
           }
           $$sum30$i$i = (($tsize$254$i) + 28)|0;
           $$sum118$i = (($$sum30$i$i) + ($719))|0;
           $798 = (($tbase$255$i) + ($$sum118$i)|0);
           $799 = HEAP32[$798>>2]|0;
           $800 = (1148 + ($799<<2)|0);
           $801 = HEAP32[$800>>2]|0;
           $802 = ($720|0)==($801|0);
           do {
            if ($802) {
             HEAP32[$800>>2] = $R$1$i$i;
             $cond$i$i = ($R$1$i$i|0)==(0|0);
             if (!($cond$i$i)) {
              break;
             }
             $803 = 1 << $799;
             $804 = $803 ^ -1;
             $805 = HEAP32[(848)>>2]|0;
             $806 = $805 & $804;
             HEAP32[(848)>>2] = $806;
             break L332;
            } else {
             $807 = HEAP32[(860)>>2]|0;
             $808 = ($771>>>0)<($807>>>0);
             if ($808) {
              _abort();
              // unreachable;
             }
             $809 = ((($771)) + 16|0);
             $810 = HEAP32[$809>>2]|0;
             $811 = ($810|0)==($720|0);
             if ($811) {
              HEAP32[$809>>2] = $R$1$i$i;
             } else {
              $812 = ((($771)) + 20|0);
              HEAP32[$812>>2] = $R$1$i$i;
             }
             $813 = ($R$1$i$i|0)==(0|0);
             if ($813) {
              break L332;
             }
            }
           } while(0);
           $814 = HEAP32[(860)>>2]|0;
           $815 = ($R$1$i$i>>>0)<($814>>>0);
           if ($815) {
            _abort();
            // unreachable;
           }
           $816 = ((($R$1$i$i)) + 24|0);
           HEAP32[$816>>2] = $771;
           $$sum3132$i$i = $719 | 16;
           $$sum119$i = (($$sum3132$i$i) + ($tsize$254$i))|0;
           $817 = (($tbase$255$i) + ($$sum119$i)|0);
           $818 = HEAP32[$817>>2]|0;
           $819 = ($818|0)==(0|0);
           do {
            if (!($819)) {
             $820 = ($818>>>0)<($814>>>0);
             if ($820) {
              _abort();
              // unreachable;
             } else {
              $821 = ((($R$1$i$i)) + 16|0);
              HEAP32[$821>>2] = $818;
              $822 = ((($818)) + 24|0);
              HEAP32[$822>>2] = $R$1$i$i;
              break;
             }
            }
           } while(0);
           $$sum120$i = (($$sum2$i21$i) + ($$sum3132$i$i))|0;
           $823 = (($tbase$255$i) + ($$sum120$i)|0);
           $824 = HEAP32[$823>>2]|0;
           $825 = ($824|0)==(0|0);
           if ($825) {
            break;
           }
           $826 = HEAP32[(860)>>2]|0;
           $827 = ($824>>>0)<($826>>>0);
           if ($827) {
            _abort();
            // unreachable;
           } else {
            $828 = ((($R$1$i$i)) + 20|0);
            HEAP32[$828>>2] = $824;
            $829 = ((($824)) + 24|0);
            HEAP32[$829>>2] = $R$1$i$i;
            break;
           }
          }
         } while(0);
         $$sum9$i$i = $744 | $719;
         $$sum121$i = (($$sum9$i$i) + ($tsize$254$i))|0;
         $830 = (($tbase$255$i) + ($$sum121$i)|0);
         $831 = (($744) + ($725))|0;
         $oldfirst$0$i$i = $830;$qsize$0$i$i = $831;
        } else {
         $oldfirst$0$i$i = $720;$qsize$0$i$i = $725;
        }
        $832 = ((($oldfirst$0$i$i)) + 4|0);
        $833 = HEAP32[$832>>2]|0;
        $834 = $833 & -2;
        HEAP32[$832>>2] = $834;
        $835 = $qsize$0$i$i | 1;
        $$sum10$i$i = (($$sum$i19$i) + 4)|0;
        $836 = (($tbase$255$i) + ($$sum10$i$i)|0);
        HEAP32[$836>>2] = $835;
        $$sum11$i$i = (($qsize$0$i$i) + ($$sum$i19$i))|0;
        $837 = (($tbase$255$i) + ($$sum11$i$i)|0);
        HEAP32[$837>>2] = $qsize$0$i$i;
        $838 = $qsize$0$i$i >>> 3;
        $839 = ($qsize$0$i$i>>>0)<(256);
        if ($839) {
         $840 = $838 << 1;
         $841 = (884 + ($840<<2)|0);
         $842 = HEAP32[844>>2]|0;
         $843 = 1 << $838;
         $844 = $842 & $843;
         $845 = ($844|0)==(0);
         do {
          if ($845) {
           $846 = $842 | $843;
           HEAP32[844>>2] = $846;
           $$pre$i22$i = (($840) + 2)|0;
           $$pre56$i$i = (884 + ($$pre$i22$i<<2)|0);
           $$pre$phi$i23$iZ2D = $$pre56$i$i;$F4$0$i$i = $841;
          } else {
           $$sum29$i$i = (($840) + 2)|0;
           $847 = (884 + ($$sum29$i$i<<2)|0);
           $848 = HEAP32[$847>>2]|0;
           $849 = HEAP32[(860)>>2]|0;
           $850 = ($848>>>0)<($849>>>0);
           if (!($850)) {
            $$pre$phi$i23$iZ2D = $847;$F4$0$i$i = $848;
            break;
           }
           _abort();
           // unreachable;
          }
         } while(0);
         HEAP32[$$pre$phi$i23$iZ2D>>2] = $724;
         $851 = ((($F4$0$i$i)) + 12|0);
         HEAP32[$851>>2] = $724;
         $$sum27$i$i = (($$sum$i19$i) + 8)|0;
         $852 = (($tbase$255$i) + ($$sum27$i$i)|0);
         HEAP32[$852>>2] = $F4$0$i$i;
         $$sum28$i$i = (($$sum$i19$i) + 12)|0;
         $853 = (($tbase$255$i) + ($$sum28$i$i)|0);
         HEAP32[$853>>2] = $841;
         break;
        }
        $854 = $qsize$0$i$i >>> 8;
        $855 = ($854|0)==(0);
        do {
         if ($855) {
          $I7$0$i$i = 0;
         } else {
          $856 = ($qsize$0$i$i>>>0)>(16777215);
          if ($856) {
           $I7$0$i$i = 31;
           break;
          }
          $857 = (($854) + 1048320)|0;
          $858 = $857 >>> 16;
          $859 = $858 & 8;
          $860 = $854 << $859;
          $861 = (($860) + 520192)|0;
          $862 = $861 >>> 16;
          $863 = $862 & 4;
          $864 = $863 | $859;
          $865 = $860 << $863;
          $866 = (($865) + 245760)|0;
          $867 = $866 >>> 16;
          $868 = $867 & 2;
          $869 = $864 | $868;
          $870 = (14 - ($869))|0;
          $871 = $865 << $868;
          $872 = $871 >>> 15;
          $873 = (($870) + ($872))|0;
          $874 = $873 << 1;
          $875 = (($873) + 7)|0;
          $876 = $qsize$0$i$i >>> $875;
          $877 = $876 & 1;
          $878 = $877 | $874;
          $I7$0$i$i = $878;
         }
        } while(0);
        $879 = (1148 + ($I7$0$i$i<<2)|0);
        $$sum12$i$i = (($$sum$i19$i) + 28)|0;
        $880 = (($tbase$255$i) + ($$sum12$i$i)|0);
        HEAP32[$880>>2] = $I7$0$i$i;
        $$sum13$i$i = (($$sum$i19$i) + 16)|0;
        $881 = (($tbase$255$i) + ($$sum13$i$i)|0);
        $$sum14$i$i = (($$sum$i19$i) + 20)|0;
        $882 = (($tbase$255$i) + ($$sum14$i$i)|0);
        HEAP32[$882>>2] = 0;
        HEAP32[$881>>2] = 0;
        $883 = HEAP32[(848)>>2]|0;
        $884 = 1 << $I7$0$i$i;
        $885 = $883 & $884;
        $886 = ($885|0)==(0);
        if ($886) {
         $887 = $883 | $884;
         HEAP32[(848)>>2] = $887;
         HEAP32[$879>>2] = $724;
         $$sum15$i$i = (($$sum$i19$i) + 24)|0;
         $888 = (($tbase$255$i) + ($$sum15$i$i)|0);
         HEAP32[$888>>2] = $879;
         $$sum16$i$i = (($$sum$i19$i) + 12)|0;
         $889 = (($tbase$255$i) + ($$sum16$i$i)|0);
         HEAP32[$889>>2] = $724;
         $$sum17$i$i = (($$sum$i19$i) + 8)|0;
         $890 = (($tbase$255$i) + ($$sum17$i$i)|0);
         HEAP32[$890>>2] = $724;
         break;
        }
        $891 = HEAP32[$879>>2]|0;
        $892 = ((($891)) + 4|0);
        $893 = HEAP32[$892>>2]|0;
        $894 = $893 & -8;
        $895 = ($894|0)==($qsize$0$i$i|0);
        L418: do {
         if ($895) {
          $T$0$lcssa$i25$i = $891;
         } else {
          $896 = ($I7$0$i$i|0)==(31);
          $897 = $I7$0$i$i >>> 1;
          $898 = (25 - ($897))|0;
          $899 = $896 ? 0 : $898;
          $900 = $qsize$0$i$i << $899;
          $K8$051$i$i = $900;$T$050$i$i = $891;
          while(1) {
           $907 = $K8$051$i$i >>> 31;
           $908 = (((($T$050$i$i)) + 16|0) + ($907<<2)|0);
           $903 = HEAP32[$908>>2]|0;
           $909 = ($903|0)==(0|0);
           if ($909) {
            $$lcssa = $908;$T$050$i$i$lcssa = $T$050$i$i;
            break;
           }
           $901 = $K8$051$i$i << 1;
           $902 = ((($903)) + 4|0);
           $904 = HEAP32[$902>>2]|0;
           $905 = $904 & -8;
           $906 = ($905|0)==($qsize$0$i$i|0);
           if ($906) {
            $T$0$lcssa$i25$i = $903;
            break L418;
           } else {
            $K8$051$i$i = $901;$T$050$i$i = $903;
           }
          }
          $910 = HEAP32[(860)>>2]|0;
          $911 = ($$lcssa>>>0)<($910>>>0);
          if ($911) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$$lcssa>>2] = $724;
           $$sum23$i$i = (($$sum$i19$i) + 24)|0;
           $912 = (($tbase$255$i) + ($$sum23$i$i)|0);
           HEAP32[$912>>2] = $T$050$i$i$lcssa;
           $$sum24$i$i = (($$sum$i19$i) + 12)|0;
           $913 = (($tbase$255$i) + ($$sum24$i$i)|0);
           HEAP32[$913>>2] = $724;
           $$sum25$i$i = (($$sum$i19$i) + 8)|0;
           $914 = (($tbase$255$i) + ($$sum25$i$i)|0);
           HEAP32[$914>>2] = $724;
           break L324;
          }
         }
        } while(0);
        $915 = ((($T$0$lcssa$i25$i)) + 8|0);
        $916 = HEAP32[$915>>2]|0;
        $917 = HEAP32[(860)>>2]|0;
        $918 = ($916>>>0)>=($917>>>0);
        $not$$i26$i = ($T$0$lcssa$i25$i>>>0)>=($917>>>0);
        $919 = $918 & $not$$i26$i;
        if ($919) {
         $920 = ((($916)) + 12|0);
         HEAP32[$920>>2] = $724;
         HEAP32[$915>>2] = $724;
         $$sum20$i$i = (($$sum$i19$i) + 8)|0;
         $921 = (($tbase$255$i) + ($$sum20$i$i)|0);
         HEAP32[$921>>2] = $916;
         $$sum21$i$i = (($$sum$i19$i) + 12)|0;
         $922 = (($tbase$255$i) + ($$sum21$i$i)|0);
         HEAP32[$922>>2] = $T$0$lcssa$i25$i;
         $$sum22$i$i = (($$sum$i19$i) + 24)|0;
         $923 = (($tbase$255$i) + ($$sum22$i$i)|0);
         HEAP32[$923>>2] = 0;
         break;
        } else {
         _abort();
         // unreachable;
        }
       }
      } while(0);
      $$sum1819$i$i = $711 | 8;
      $924 = (($tbase$255$i) + ($$sum1819$i$i)|0);
      $mem$0 = $924;
      return ($mem$0|0);
     } else {
      $sp$0$i$i$i = (1292);
     }
    }
    while(1) {
     $925 = HEAP32[$sp$0$i$i$i>>2]|0;
     $926 = ($925>>>0)>($635>>>0);
     if (!($926)) {
      $927 = ((($sp$0$i$i$i)) + 4|0);
      $928 = HEAP32[$927>>2]|0;
      $929 = (($925) + ($928)|0);
      $930 = ($929>>>0)>($635>>>0);
      if ($930) {
       $$lcssa215 = $925;$$lcssa216 = $928;$$lcssa217 = $929;
       break;
      }
     }
     $931 = ((($sp$0$i$i$i)) + 8|0);
     $932 = HEAP32[$931>>2]|0;
     $sp$0$i$i$i = $932;
    }
    $$sum$i14$i = (($$lcssa216) + -47)|0;
    $$sum1$i15$i = (($$lcssa216) + -39)|0;
    $933 = (($$lcssa215) + ($$sum1$i15$i)|0);
    $934 = $933;
    $935 = $934 & 7;
    $936 = ($935|0)==(0);
    $937 = (0 - ($934))|0;
    $938 = $937 & 7;
    $939 = $936 ? 0 : $938;
    $$sum2$i16$i = (($$sum$i14$i) + ($939))|0;
    $940 = (($$lcssa215) + ($$sum2$i16$i)|0);
    $941 = ((($635)) + 16|0);
    $942 = ($940>>>0)<($941>>>0);
    $943 = $942 ? $635 : $940;
    $944 = ((($943)) + 8|0);
    $945 = (($tsize$254$i) + -40)|0;
    $946 = ((($tbase$255$i)) + 8|0);
    $947 = $946;
    $948 = $947 & 7;
    $949 = ($948|0)==(0);
    $950 = (0 - ($947))|0;
    $951 = $950 & 7;
    $952 = $949 ? 0 : $951;
    $953 = (($tbase$255$i) + ($952)|0);
    $954 = (($945) - ($952))|0;
    HEAP32[(868)>>2] = $953;
    HEAP32[(856)>>2] = $954;
    $955 = $954 | 1;
    $$sum$i$i$i = (($952) + 4)|0;
    $956 = (($tbase$255$i) + ($$sum$i$i$i)|0);
    HEAP32[$956>>2] = $955;
    $$sum2$i$i$i = (($tsize$254$i) + -36)|0;
    $957 = (($tbase$255$i) + ($$sum2$i$i$i)|0);
    HEAP32[$957>>2] = 40;
    $958 = HEAP32[(1332)>>2]|0;
    HEAP32[(872)>>2] = $958;
    $959 = ((($943)) + 4|0);
    HEAP32[$959>>2] = 27;
    ;HEAP32[$944>>2]=HEAP32[(1292)>>2]|0;HEAP32[$944+4>>2]=HEAP32[(1292)+4>>2]|0;HEAP32[$944+8>>2]=HEAP32[(1292)+8>>2]|0;HEAP32[$944+12>>2]=HEAP32[(1292)+12>>2]|0;
    HEAP32[(1292)>>2] = $tbase$255$i;
    HEAP32[(1296)>>2] = $tsize$254$i;
    HEAP32[(1304)>>2] = 0;
    HEAP32[(1300)>>2] = $944;
    $960 = ((($943)) + 28|0);
    HEAP32[$960>>2] = 7;
    $961 = ((($943)) + 32|0);
    $962 = ($961>>>0)<($$lcssa217>>>0);
    if ($962) {
     $964 = $960;
     while(1) {
      $963 = ((($964)) + 4|0);
      HEAP32[$963>>2] = 7;
      $965 = ((($964)) + 8|0);
      $966 = ($965>>>0)<($$lcssa217>>>0);
      if ($966) {
       $964 = $963;
      } else {
       break;
      }
     }
    }
    $967 = ($943|0)==($635|0);
    if (!($967)) {
     $968 = $943;
     $969 = $635;
     $970 = (($968) - ($969))|0;
     $971 = HEAP32[$959>>2]|0;
     $972 = $971 & -2;
     HEAP32[$959>>2] = $972;
     $973 = $970 | 1;
     $974 = ((($635)) + 4|0);
     HEAP32[$974>>2] = $973;
     HEAP32[$943>>2] = $970;
     $975 = $970 >>> 3;
     $976 = ($970>>>0)<(256);
     if ($976) {
      $977 = $975 << 1;
      $978 = (884 + ($977<<2)|0);
      $979 = HEAP32[844>>2]|0;
      $980 = 1 << $975;
      $981 = $979 & $980;
      $982 = ($981|0)==(0);
      if ($982) {
       $983 = $979 | $980;
       HEAP32[844>>2] = $983;
       $$pre$i$i = (($977) + 2)|0;
       $$pre14$i$i = (884 + ($$pre$i$i<<2)|0);
       $$pre$phi$i$iZ2D = $$pre14$i$i;$F$0$i$i = $978;
      } else {
       $$sum4$i$i = (($977) + 2)|0;
       $984 = (884 + ($$sum4$i$i<<2)|0);
       $985 = HEAP32[$984>>2]|0;
       $986 = HEAP32[(860)>>2]|0;
       $987 = ($985>>>0)<($986>>>0);
       if ($987) {
        _abort();
        // unreachable;
       } else {
        $$pre$phi$i$iZ2D = $984;$F$0$i$i = $985;
       }
      }
      HEAP32[$$pre$phi$i$iZ2D>>2] = $635;
      $988 = ((($F$0$i$i)) + 12|0);
      HEAP32[$988>>2] = $635;
      $989 = ((($635)) + 8|0);
      HEAP32[$989>>2] = $F$0$i$i;
      $990 = ((($635)) + 12|0);
      HEAP32[$990>>2] = $978;
      break;
     }
     $991 = $970 >>> 8;
     $992 = ($991|0)==(0);
     if ($992) {
      $I1$0$i$i = 0;
     } else {
      $993 = ($970>>>0)>(16777215);
      if ($993) {
       $I1$0$i$i = 31;
      } else {
       $994 = (($991) + 1048320)|0;
       $995 = $994 >>> 16;
       $996 = $995 & 8;
       $997 = $991 << $996;
       $998 = (($997) + 520192)|0;
       $999 = $998 >>> 16;
       $1000 = $999 & 4;
       $1001 = $1000 | $996;
       $1002 = $997 << $1000;
       $1003 = (($1002) + 245760)|0;
       $1004 = $1003 >>> 16;
       $1005 = $1004 & 2;
       $1006 = $1001 | $1005;
       $1007 = (14 - ($1006))|0;
       $1008 = $1002 << $1005;
       $1009 = $1008 >>> 15;
       $1010 = (($1007) + ($1009))|0;
       $1011 = $1010 << 1;
       $1012 = (($1010) + 7)|0;
       $1013 = $970 >>> $1012;
       $1014 = $1013 & 1;
       $1015 = $1014 | $1011;
       $I1$0$i$i = $1015;
      }
     }
     $1016 = (1148 + ($I1$0$i$i<<2)|0);
     $1017 = ((($635)) + 28|0);
     HEAP32[$1017>>2] = $I1$0$i$i;
     $1018 = ((($635)) + 20|0);
     HEAP32[$1018>>2] = 0;
     HEAP32[$941>>2] = 0;
     $1019 = HEAP32[(848)>>2]|0;
     $1020 = 1 << $I1$0$i$i;
     $1021 = $1019 & $1020;
     $1022 = ($1021|0)==(0);
     if ($1022) {
      $1023 = $1019 | $1020;
      HEAP32[(848)>>2] = $1023;
      HEAP32[$1016>>2] = $635;
      $1024 = ((($635)) + 24|0);
      HEAP32[$1024>>2] = $1016;
      $1025 = ((($635)) + 12|0);
      HEAP32[$1025>>2] = $635;
      $1026 = ((($635)) + 8|0);
      HEAP32[$1026>>2] = $635;
      break;
     }
     $1027 = HEAP32[$1016>>2]|0;
     $1028 = ((($1027)) + 4|0);
     $1029 = HEAP32[$1028>>2]|0;
     $1030 = $1029 & -8;
     $1031 = ($1030|0)==($970|0);
     L459: do {
      if ($1031) {
       $T$0$lcssa$i$i = $1027;
      } else {
       $1032 = ($I1$0$i$i|0)==(31);
       $1033 = $I1$0$i$i >>> 1;
       $1034 = (25 - ($1033))|0;
       $1035 = $1032 ? 0 : $1034;
       $1036 = $970 << $1035;
       $K2$07$i$i = $1036;$T$06$i$i = $1027;
       while(1) {
        $1043 = $K2$07$i$i >>> 31;
        $1044 = (((($T$06$i$i)) + 16|0) + ($1043<<2)|0);
        $1039 = HEAP32[$1044>>2]|0;
        $1045 = ($1039|0)==(0|0);
        if ($1045) {
         $$lcssa211 = $1044;$T$06$i$i$lcssa = $T$06$i$i;
         break;
        }
        $1037 = $K2$07$i$i << 1;
        $1038 = ((($1039)) + 4|0);
        $1040 = HEAP32[$1038>>2]|0;
        $1041 = $1040 & -8;
        $1042 = ($1041|0)==($970|0);
        if ($1042) {
         $T$0$lcssa$i$i = $1039;
         break L459;
        } else {
         $K2$07$i$i = $1037;$T$06$i$i = $1039;
        }
       }
       $1046 = HEAP32[(860)>>2]|0;
       $1047 = ($$lcssa211>>>0)<($1046>>>0);
       if ($1047) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$$lcssa211>>2] = $635;
        $1048 = ((($635)) + 24|0);
        HEAP32[$1048>>2] = $T$06$i$i$lcssa;
        $1049 = ((($635)) + 12|0);
        HEAP32[$1049>>2] = $635;
        $1050 = ((($635)) + 8|0);
        HEAP32[$1050>>2] = $635;
        break L299;
       }
      }
     } while(0);
     $1051 = ((($T$0$lcssa$i$i)) + 8|0);
     $1052 = HEAP32[$1051>>2]|0;
     $1053 = HEAP32[(860)>>2]|0;
     $1054 = ($1052>>>0)>=($1053>>>0);
     $not$$i$i = ($T$0$lcssa$i$i>>>0)>=($1053>>>0);
     $1055 = $1054 & $not$$i$i;
     if ($1055) {
      $1056 = ((($1052)) + 12|0);
      HEAP32[$1056>>2] = $635;
      HEAP32[$1051>>2] = $635;
      $1057 = ((($635)) + 8|0);
      HEAP32[$1057>>2] = $1052;
      $1058 = ((($635)) + 12|0);
      HEAP32[$1058>>2] = $T$0$lcssa$i$i;
      $1059 = ((($635)) + 24|0);
      HEAP32[$1059>>2] = 0;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   }
  } while(0);
  $1060 = HEAP32[(856)>>2]|0;
  $1061 = ($1060>>>0)>($nb$0>>>0);
  if ($1061) {
   $1062 = (($1060) - ($nb$0))|0;
   HEAP32[(856)>>2] = $1062;
   $1063 = HEAP32[(868)>>2]|0;
   $1064 = (($1063) + ($nb$0)|0);
   HEAP32[(868)>>2] = $1064;
   $1065 = $1062 | 1;
   $$sum$i32 = (($nb$0) + 4)|0;
   $1066 = (($1063) + ($$sum$i32)|0);
   HEAP32[$1066>>2] = $1065;
   $1067 = $nb$0 | 3;
   $1068 = ((($1063)) + 4|0);
   HEAP32[$1068>>2] = $1067;
   $1069 = ((($1063)) + 8|0);
   $mem$0 = $1069;
   return ($mem$0|0);
  }
 }
 $1070 = (___errno_location()|0);
 HEAP32[$1070>>2] = 12;
 $mem$0 = 0;
 return ($mem$0|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$lcssa = 0, $$pre = 0, $$pre$phi59Z2D = 0, $$pre$phi61Z2D = 0, $$pre$phiZ2D = 0, $$pre57 = 0, $$pre58 = 0, $$pre60 = 0, $$sum = 0, $$sum11 = 0, $$sum12 = 0, $$sum13 = 0, $$sum14 = 0, $$sum1718 = 0, $$sum19 = 0, $$sum2 = 0, $$sum20 = 0, $$sum22 = 0, $$sum23 = 0, $$sum24 = 0;
 var $$sum25 = 0, $$sum26 = 0, $$sum27 = 0, $$sum28 = 0, $$sum29 = 0, $$sum3 = 0, $$sum30 = 0, $$sum31 = 0, $$sum5 = 0, $$sum67 = 0, $$sum8 = 0, $$sum9 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0;
 var $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0;
 var $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0;
 var $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0;
 var $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0;
 var $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0;
 var $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0;
 var $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0;
 var $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0;
 var $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0;
 var $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0;
 var $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0;
 var $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0;
 var $321 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0;
 var $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0;
 var $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0;
 var $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F16$0 = 0, $I18$0 = 0, $K19$052 = 0, $R$0 = 0, $R$0$lcssa = 0, $R$1 = 0;
 var $R7$0 = 0, $R7$0$lcssa = 0, $R7$1 = 0, $RP$0 = 0, $RP$0$lcssa = 0, $RP9$0 = 0, $RP9$0$lcssa = 0, $T$0$lcssa = 0, $T$051 = 0, $T$051$lcssa = 0, $cond = 0, $cond47 = 0, $not$ = 0, $p$0 = 0, $psize$0 = 0, $psize$1 = 0, $sp$0$i = 0, $sp$0$in$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($mem|0)==(0|0);
 if ($0) {
  return;
 }
 $1 = ((($mem)) + -8|0);
 $2 = HEAP32[(860)>>2]|0;
 $3 = ($1>>>0)<($2>>>0);
 if ($3) {
  _abort();
  // unreachable;
 }
 $4 = ((($mem)) + -4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 & 3;
 $7 = ($6|0)==(1);
 if ($7) {
  _abort();
  // unreachable;
 }
 $8 = $5 & -8;
 $$sum = (($8) + -8)|0;
 $9 = (($mem) + ($$sum)|0);
 $10 = $5 & 1;
 $11 = ($10|0)==(0);
 do {
  if ($11) {
   $12 = HEAP32[$1>>2]|0;
   $13 = ($6|0)==(0);
   if ($13) {
    return;
   }
   $$sum2 = (-8 - ($12))|0;
   $14 = (($mem) + ($$sum2)|0);
   $15 = (($12) + ($8))|0;
   $16 = ($14>>>0)<($2>>>0);
   if ($16) {
    _abort();
    // unreachable;
   }
   $17 = HEAP32[(864)>>2]|0;
   $18 = ($14|0)==($17|0);
   if ($18) {
    $$sum3 = (($8) + -4)|0;
    $103 = (($mem) + ($$sum3)|0);
    $104 = HEAP32[$103>>2]|0;
    $105 = $104 & 3;
    $106 = ($105|0)==(3);
    if (!($106)) {
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    HEAP32[(852)>>2] = $15;
    $107 = $104 & -2;
    HEAP32[$103>>2] = $107;
    $108 = $15 | 1;
    $$sum20 = (($$sum2) + 4)|0;
    $109 = (($mem) + ($$sum20)|0);
    HEAP32[$109>>2] = $108;
    HEAP32[$9>>2] = $15;
    return;
   }
   $19 = $12 >>> 3;
   $20 = ($12>>>0)<(256);
   if ($20) {
    $$sum30 = (($$sum2) + 8)|0;
    $21 = (($mem) + ($$sum30)|0);
    $22 = HEAP32[$21>>2]|0;
    $$sum31 = (($$sum2) + 12)|0;
    $23 = (($mem) + ($$sum31)|0);
    $24 = HEAP32[$23>>2]|0;
    $25 = $19 << 1;
    $26 = (884 + ($25<<2)|0);
    $27 = ($22|0)==($26|0);
    if (!($27)) {
     $28 = ($22>>>0)<($2>>>0);
     if ($28) {
      _abort();
      // unreachable;
     }
     $29 = ((($22)) + 12|0);
     $30 = HEAP32[$29>>2]|0;
     $31 = ($30|0)==($14|0);
     if (!($31)) {
      _abort();
      // unreachable;
     }
    }
    $32 = ($24|0)==($22|0);
    if ($32) {
     $33 = 1 << $19;
     $34 = $33 ^ -1;
     $35 = HEAP32[844>>2]|0;
     $36 = $35 & $34;
     HEAP32[844>>2] = $36;
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    $37 = ($24|0)==($26|0);
    if ($37) {
     $$pre60 = ((($24)) + 8|0);
     $$pre$phi61Z2D = $$pre60;
    } else {
     $38 = ($24>>>0)<($2>>>0);
     if ($38) {
      _abort();
      // unreachable;
     }
     $39 = ((($24)) + 8|0);
     $40 = HEAP32[$39>>2]|0;
     $41 = ($40|0)==($14|0);
     if ($41) {
      $$pre$phi61Z2D = $39;
     } else {
      _abort();
      // unreachable;
     }
    }
    $42 = ((($22)) + 12|0);
    HEAP32[$42>>2] = $24;
    HEAP32[$$pre$phi61Z2D>>2] = $22;
    $p$0 = $14;$psize$0 = $15;
    break;
   }
   $$sum22 = (($$sum2) + 24)|0;
   $43 = (($mem) + ($$sum22)|0);
   $44 = HEAP32[$43>>2]|0;
   $$sum23 = (($$sum2) + 12)|0;
   $45 = (($mem) + ($$sum23)|0);
   $46 = HEAP32[$45>>2]|0;
   $47 = ($46|0)==($14|0);
   do {
    if ($47) {
     $$sum25 = (($$sum2) + 20)|0;
     $57 = (($mem) + ($$sum25)|0);
     $58 = HEAP32[$57>>2]|0;
     $59 = ($58|0)==(0|0);
     if ($59) {
      $$sum24 = (($$sum2) + 16)|0;
      $60 = (($mem) + ($$sum24)|0);
      $61 = HEAP32[$60>>2]|0;
      $62 = ($61|0)==(0|0);
      if ($62) {
       $R$1 = 0;
       break;
      } else {
       $R$0 = $61;$RP$0 = $60;
      }
     } else {
      $R$0 = $58;$RP$0 = $57;
     }
     while(1) {
      $63 = ((($R$0)) + 20|0);
      $64 = HEAP32[$63>>2]|0;
      $65 = ($64|0)==(0|0);
      if (!($65)) {
       $R$0 = $64;$RP$0 = $63;
       continue;
      }
      $66 = ((($R$0)) + 16|0);
      $67 = HEAP32[$66>>2]|0;
      $68 = ($67|0)==(0|0);
      if ($68) {
       $R$0$lcssa = $R$0;$RP$0$lcssa = $RP$0;
       break;
      } else {
       $R$0 = $67;$RP$0 = $66;
      }
     }
     $69 = ($RP$0$lcssa>>>0)<($2>>>0);
     if ($69) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$RP$0$lcssa>>2] = 0;
      $R$1 = $R$0$lcssa;
      break;
     }
    } else {
     $$sum29 = (($$sum2) + 8)|0;
     $48 = (($mem) + ($$sum29)|0);
     $49 = HEAP32[$48>>2]|0;
     $50 = ($49>>>0)<($2>>>0);
     if ($50) {
      _abort();
      // unreachable;
     }
     $51 = ((($49)) + 12|0);
     $52 = HEAP32[$51>>2]|0;
     $53 = ($52|0)==($14|0);
     if (!($53)) {
      _abort();
      // unreachable;
     }
     $54 = ((($46)) + 8|0);
     $55 = HEAP32[$54>>2]|0;
     $56 = ($55|0)==($14|0);
     if ($56) {
      HEAP32[$51>>2] = $46;
      HEAP32[$54>>2] = $49;
      $R$1 = $46;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   } while(0);
   $70 = ($44|0)==(0|0);
   if ($70) {
    $p$0 = $14;$psize$0 = $15;
   } else {
    $$sum26 = (($$sum2) + 28)|0;
    $71 = (($mem) + ($$sum26)|0);
    $72 = HEAP32[$71>>2]|0;
    $73 = (1148 + ($72<<2)|0);
    $74 = HEAP32[$73>>2]|0;
    $75 = ($14|0)==($74|0);
    if ($75) {
     HEAP32[$73>>2] = $R$1;
     $cond = ($R$1|0)==(0|0);
     if ($cond) {
      $76 = 1 << $72;
      $77 = $76 ^ -1;
      $78 = HEAP32[(848)>>2]|0;
      $79 = $78 & $77;
      HEAP32[(848)>>2] = $79;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    } else {
     $80 = HEAP32[(860)>>2]|0;
     $81 = ($44>>>0)<($80>>>0);
     if ($81) {
      _abort();
      // unreachable;
     }
     $82 = ((($44)) + 16|0);
     $83 = HEAP32[$82>>2]|0;
     $84 = ($83|0)==($14|0);
     if ($84) {
      HEAP32[$82>>2] = $R$1;
     } else {
      $85 = ((($44)) + 20|0);
      HEAP32[$85>>2] = $R$1;
     }
     $86 = ($R$1|0)==(0|0);
     if ($86) {
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
    $87 = HEAP32[(860)>>2]|0;
    $88 = ($R$1>>>0)<($87>>>0);
    if ($88) {
     _abort();
     // unreachable;
    }
    $89 = ((($R$1)) + 24|0);
    HEAP32[$89>>2] = $44;
    $$sum27 = (($$sum2) + 16)|0;
    $90 = (($mem) + ($$sum27)|0);
    $91 = HEAP32[$90>>2]|0;
    $92 = ($91|0)==(0|0);
    do {
     if (!($92)) {
      $93 = ($91>>>0)<($87>>>0);
      if ($93) {
       _abort();
       // unreachable;
      } else {
       $94 = ((($R$1)) + 16|0);
       HEAP32[$94>>2] = $91;
       $95 = ((($91)) + 24|0);
       HEAP32[$95>>2] = $R$1;
       break;
      }
     }
    } while(0);
    $$sum28 = (($$sum2) + 20)|0;
    $96 = (($mem) + ($$sum28)|0);
    $97 = HEAP32[$96>>2]|0;
    $98 = ($97|0)==(0|0);
    if ($98) {
     $p$0 = $14;$psize$0 = $15;
    } else {
     $99 = HEAP32[(860)>>2]|0;
     $100 = ($97>>>0)<($99>>>0);
     if ($100) {
      _abort();
      // unreachable;
     } else {
      $101 = ((($R$1)) + 20|0);
      HEAP32[$101>>2] = $97;
      $102 = ((($97)) + 24|0);
      HEAP32[$102>>2] = $R$1;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
   }
  } else {
   $p$0 = $1;$psize$0 = $8;
  }
 } while(0);
 $110 = ($p$0>>>0)<($9>>>0);
 if (!($110)) {
  _abort();
  // unreachable;
 }
 $$sum19 = (($8) + -4)|0;
 $111 = (($mem) + ($$sum19)|0);
 $112 = HEAP32[$111>>2]|0;
 $113 = $112 & 1;
 $114 = ($113|0)==(0);
 if ($114) {
  _abort();
  // unreachable;
 }
 $115 = $112 & 2;
 $116 = ($115|0)==(0);
 if ($116) {
  $117 = HEAP32[(868)>>2]|0;
  $118 = ($9|0)==($117|0);
  if ($118) {
   $119 = HEAP32[(856)>>2]|0;
   $120 = (($119) + ($psize$0))|0;
   HEAP32[(856)>>2] = $120;
   HEAP32[(868)>>2] = $p$0;
   $121 = $120 | 1;
   $122 = ((($p$0)) + 4|0);
   HEAP32[$122>>2] = $121;
   $123 = HEAP32[(864)>>2]|0;
   $124 = ($p$0|0)==($123|0);
   if (!($124)) {
    return;
   }
   HEAP32[(864)>>2] = 0;
   HEAP32[(852)>>2] = 0;
   return;
  }
  $125 = HEAP32[(864)>>2]|0;
  $126 = ($9|0)==($125|0);
  if ($126) {
   $127 = HEAP32[(852)>>2]|0;
   $128 = (($127) + ($psize$0))|0;
   HEAP32[(852)>>2] = $128;
   HEAP32[(864)>>2] = $p$0;
   $129 = $128 | 1;
   $130 = ((($p$0)) + 4|0);
   HEAP32[$130>>2] = $129;
   $131 = (($p$0) + ($128)|0);
   HEAP32[$131>>2] = $128;
   return;
  }
  $132 = $112 & -8;
  $133 = (($132) + ($psize$0))|0;
  $134 = $112 >>> 3;
  $135 = ($112>>>0)<(256);
  do {
   if ($135) {
    $136 = (($mem) + ($8)|0);
    $137 = HEAP32[$136>>2]|0;
    $$sum1718 = $8 | 4;
    $138 = (($mem) + ($$sum1718)|0);
    $139 = HEAP32[$138>>2]|0;
    $140 = $134 << 1;
    $141 = (884 + ($140<<2)|0);
    $142 = ($137|0)==($141|0);
    if (!($142)) {
     $143 = HEAP32[(860)>>2]|0;
     $144 = ($137>>>0)<($143>>>0);
     if ($144) {
      _abort();
      // unreachable;
     }
     $145 = ((($137)) + 12|0);
     $146 = HEAP32[$145>>2]|0;
     $147 = ($146|0)==($9|0);
     if (!($147)) {
      _abort();
      // unreachable;
     }
    }
    $148 = ($139|0)==($137|0);
    if ($148) {
     $149 = 1 << $134;
     $150 = $149 ^ -1;
     $151 = HEAP32[844>>2]|0;
     $152 = $151 & $150;
     HEAP32[844>>2] = $152;
     break;
    }
    $153 = ($139|0)==($141|0);
    if ($153) {
     $$pre58 = ((($139)) + 8|0);
     $$pre$phi59Z2D = $$pre58;
    } else {
     $154 = HEAP32[(860)>>2]|0;
     $155 = ($139>>>0)<($154>>>0);
     if ($155) {
      _abort();
      // unreachable;
     }
     $156 = ((($139)) + 8|0);
     $157 = HEAP32[$156>>2]|0;
     $158 = ($157|0)==($9|0);
     if ($158) {
      $$pre$phi59Z2D = $156;
     } else {
      _abort();
      // unreachable;
     }
    }
    $159 = ((($137)) + 12|0);
    HEAP32[$159>>2] = $139;
    HEAP32[$$pre$phi59Z2D>>2] = $137;
   } else {
    $$sum5 = (($8) + 16)|0;
    $160 = (($mem) + ($$sum5)|0);
    $161 = HEAP32[$160>>2]|0;
    $$sum67 = $8 | 4;
    $162 = (($mem) + ($$sum67)|0);
    $163 = HEAP32[$162>>2]|0;
    $164 = ($163|0)==($9|0);
    do {
     if ($164) {
      $$sum9 = (($8) + 12)|0;
      $175 = (($mem) + ($$sum9)|0);
      $176 = HEAP32[$175>>2]|0;
      $177 = ($176|0)==(0|0);
      if ($177) {
       $$sum8 = (($8) + 8)|0;
       $178 = (($mem) + ($$sum8)|0);
       $179 = HEAP32[$178>>2]|0;
       $180 = ($179|0)==(0|0);
       if ($180) {
        $R7$1 = 0;
        break;
       } else {
        $R7$0 = $179;$RP9$0 = $178;
       }
      } else {
       $R7$0 = $176;$RP9$0 = $175;
      }
      while(1) {
       $181 = ((($R7$0)) + 20|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = ($182|0)==(0|0);
       if (!($183)) {
        $R7$0 = $182;$RP9$0 = $181;
        continue;
       }
       $184 = ((($R7$0)) + 16|0);
       $185 = HEAP32[$184>>2]|0;
       $186 = ($185|0)==(0|0);
       if ($186) {
        $R7$0$lcssa = $R7$0;$RP9$0$lcssa = $RP9$0;
        break;
       } else {
        $R7$0 = $185;$RP9$0 = $184;
       }
      }
      $187 = HEAP32[(860)>>2]|0;
      $188 = ($RP9$0$lcssa>>>0)<($187>>>0);
      if ($188) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$RP9$0$lcssa>>2] = 0;
       $R7$1 = $R7$0$lcssa;
       break;
      }
     } else {
      $165 = (($mem) + ($8)|0);
      $166 = HEAP32[$165>>2]|0;
      $167 = HEAP32[(860)>>2]|0;
      $168 = ($166>>>0)<($167>>>0);
      if ($168) {
       _abort();
       // unreachable;
      }
      $169 = ((($166)) + 12|0);
      $170 = HEAP32[$169>>2]|0;
      $171 = ($170|0)==($9|0);
      if (!($171)) {
       _abort();
       // unreachable;
      }
      $172 = ((($163)) + 8|0);
      $173 = HEAP32[$172>>2]|0;
      $174 = ($173|0)==($9|0);
      if ($174) {
       HEAP32[$169>>2] = $163;
       HEAP32[$172>>2] = $166;
       $R7$1 = $163;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $189 = ($161|0)==(0|0);
    if (!($189)) {
     $$sum12 = (($8) + 20)|0;
     $190 = (($mem) + ($$sum12)|0);
     $191 = HEAP32[$190>>2]|0;
     $192 = (1148 + ($191<<2)|0);
     $193 = HEAP32[$192>>2]|0;
     $194 = ($9|0)==($193|0);
     if ($194) {
      HEAP32[$192>>2] = $R7$1;
      $cond47 = ($R7$1|0)==(0|0);
      if ($cond47) {
       $195 = 1 << $191;
       $196 = $195 ^ -1;
       $197 = HEAP32[(848)>>2]|0;
       $198 = $197 & $196;
       HEAP32[(848)>>2] = $198;
       break;
      }
     } else {
      $199 = HEAP32[(860)>>2]|0;
      $200 = ($161>>>0)<($199>>>0);
      if ($200) {
       _abort();
       // unreachable;
      }
      $201 = ((($161)) + 16|0);
      $202 = HEAP32[$201>>2]|0;
      $203 = ($202|0)==($9|0);
      if ($203) {
       HEAP32[$201>>2] = $R7$1;
      } else {
       $204 = ((($161)) + 20|0);
       HEAP32[$204>>2] = $R7$1;
      }
      $205 = ($R7$1|0)==(0|0);
      if ($205) {
       break;
      }
     }
     $206 = HEAP32[(860)>>2]|0;
     $207 = ($R7$1>>>0)<($206>>>0);
     if ($207) {
      _abort();
      // unreachable;
     }
     $208 = ((($R7$1)) + 24|0);
     HEAP32[$208>>2] = $161;
     $$sum13 = (($8) + 8)|0;
     $209 = (($mem) + ($$sum13)|0);
     $210 = HEAP32[$209>>2]|0;
     $211 = ($210|0)==(0|0);
     do {
      if (!($211)) {
       $212 = ($210>>>0)<($206>>>0);
       if ($212) {
        _abort();
        // unreachable;
       } else {
        $213 = ((($R7$1)) + 16|0);
        HEAP32[$213>>2] = $210;
        $214 = ((($210)) + 24|0);
        HEAP32[$214>>2] = $R7$1;
        break;
       }
      }
     } while(0);
     $$sum14 = (($8) + 12)|0;
     $215 = (($mem) + ($$sum14)|0);
     $216 = HEAP32[$215>>2]|0;
     $217 = ($216|0)==(0|0);
     if (!($217)) {
      $218 = HEAP32[(860)>>2]|0;
      $219 = ($216>>>0)<($218>>>0);
      if ($219) {
       _abort();
       // unreachable;
      } else {
       $220 = ((($R7$1)) + 20|0);
       HEAP32[$220>>2] = $216;
       $221 = ((($216)) + 24|0);
       HEAP32[$221>>2] = $R7$1;
       break;
      }
     }
    }
   }
  } while(0);
  $222 = $133 | 1;
  $223 = ((($p$0)) + 4|0);
  HEAP32[$223>>2] = $222;
  $224 = (($p$0) + ($133)|0);
  HEAP32[$224>>2] = $133;
  $225 = HEAP32[(864)>>2]|0;
  $226 = ($p$0|0)==($225|0);
  if ($226) {
   HEAP32[(852)>>2] = $133;
   return;
  } else {
   $psize$1 = $133;
  }
 } else {
  $227 = $112 & -2;
  HEAP32[$111>>2] = $227;
  $228 = $psize$0 | 1;
  $229 = ((($p$0)) + 4|0);
  HEAP32[$229>>2] = $228;
  $230 = (($p$0) + ($psize$0)|0);
  HEAP32[$230>>2] = $psize$0;
  $psize$1 = $psize$0;
 }
 $231 = $psize$1 >>> 3;
 $232 = ($psize$1>>>0)<(256);
 if ($232) {
  $233 = $231 << 1;
  $234 = (884 + ($233<<2)|0);
  $235 = HEAP32[844>>2]|0;
  $236 = 1 << $231;
  $237 = $235 & $236;
  $238 = ($237|0)==(0);
  if ($238) {
   $239 = $235 | $236;
   HEAP32[844>>2] = $239;
   $$pre = (($233) + 2)|0;
   $$pre57 = (884 + ($$pre<<2)|0);
   $$pre$phiZ2D = $$pre57;$F16$0 = $234;
  } else {
   $$sum11 = (($233) + 2)|0;
   $240 = (884 + ($$sum11<<2)|0);
   $241 = HEAP32[$240>>2]|0;
   $242 = HEAP32[(860)>>2]|0;
   $243 = ($241>>>0)<($242>>>0);
   if ($243) {
    _abort();
    // unreachable;
   } else {
    $$pre$phiZ2D = $240;$F16$0 = $241;
   }
  }
  HEAP32[$$pre$phiZ2D>>2] = $p$0;
  $244 = ((($F16$0)) + 12|0);
  HEAP32[$244>>2] = $p$0;
  $245 = ((($p$0)) + 8|0);
  HEAP32[$245>>2] = $F16$0;
  $246 = ((($p$0)) + 12|0);
  HEAP32[$246>>2] = $234;
  return;
 }
 $247 = $psize$1 >>> 8;
 $248 = ($247|0)==(0);
 if ($248) {
  $I18$0 = 0;
 } else {
  $249 = ($psize$1>>>0)>(16777215);
  if ($249) {
   $I18$0 = 31;
  } else {
   $250 = (($247) + 1048320)|0;
   $251 = $250 >>> 16;
   $252 = $251 & 8;
   $253 = $247 << $252;
   $254 = (($253) + 520192)|0;
   $255 = $254 >>> 16;
   $256 = $255 & 4;
   $257 = $256 | $252;
   $258 = $253 << $256;
   $259 = (($258) + 245760)|0;
   $260 = $259 >>> 16;
   $261 = $260 & 2;
   $262 = $257 | $261;
   $263 = (14 - ($262))|0;
   $264 = $258 << $261;
   $265 = $264 >>> 15;
   $266 = (($263) + ($265))|0;
   $267 = $266 << 1;
   $268 = (($266) + 7)|0;
   $269 = $psize$1 >>> $268;
   $270 = $269 & 1;
   $271 = $270 | $267;
   $I18$0 = $271;
  }
 }
 $272 = (1148 + ($I18$0<<2)|0);
 $273 = ((($p$0)) + 28|0);
 HEAP32[$273>>2] = $I18$0;
 $274 = ((($p$0)) + 16|0);
 $275 = ((($p$0)) + 20|0);
 HEAP32[$275>>2] = 0;
 HEAP32[$274>>2] = 0;
 $276 = HEAP32[(848)>>2]|0;
 $277 = 1 << $I18$0;
 $278 = $276 & $277;
 $279 = ($278|0)==(0);
 L199: do {
  if ($279) {
   $280 = $276 | $277;
   HEAP32[(848)>>2] = $280;
   HEAP32[$272>>2] = $p$0;
   $281 = ((($p$0)) + 24|0);
   HEAP32[$281>>2] = $272;
   $282 = ((($p$0)) + 12|0);
   HEAP32[$282>>2] = $p$0;
   $283 = ((($p$0)) + 8|0);
   HEAP32[$283>>2] = $p$0;
  } else {
   $284 = HEAP32[$272>>2]|0;
   $285 = ((($284)) + 4|0);
   $286 = HEAP32[$285>>2]|0;
   $287 = $286 & -8;
   $288 = ($287|0)==($psize$1|0);
   L202: do {
    if ($288) {
     $T$0$lcssa = $284;
    } else {
     $289 = ($I18$0|0)==(31);
     $290 = $I18$0 >>> 1;
     $291 = (25 - ($290))|0;
     $292 = $289 ? 0 : $291;
     $293 = $psize$1 << $292;
     $K19$052 = $293;$T$051 = $284;
     while(1) {
      $300 = $K19$052 >>> 31;
      $301 = (((($T$051)) + 16|0) + ($300<<2)|0);
      $296 = HEAP32[$301>>2]|0;
      $302 = ($296|0)==(0|0);
      if ($302) {
       $$lcssa = $301;$T$051$lcssa = $T$051;
       break;
      }
      $294 = $K19$052 << 1;
      $295 = ((($296)) + 4|0);
      $297 = HEAP32[$295>>2]|0;
      $298 = $297 & -8;
      $299 = ($298|0)==($psize$1|0);
      if ($299) {
       $T$0$lcssa = $296;
       break L202;
      } else {
       $K19$052 = $294;$T$051 = $296;
      }
     }
     $303 = HEAP32[(860)>>2]|0;
     $304 = ($$lcssa>>>0)<($303>>>0);
     if ($304) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$$lcssa>>2] = $p$0;
      $305 = ((($p$0)) + 24|0);
      HEAP32[$305>>2] = $T$051$lcssa;
      $306 = ((($p$0)) + 12|0);
      HEAP32[$306>>2] = $p$0;
      $307 = ((($p$0)) + 8|0);
      HEAP32[$307>>2] = $p$0;
      break L199;
     }
    }
   } while(0);
   $308 = ((($T$0$lcssa)) + 8|0);
   $309 = HEAP32[$308>>2]|0;
   $310 = HEAP32[(860)>>2]|0;
   $311 = ($309>>>0)>=($310>>>0);
   $not$ = ($T$0$lcssa>>>0)>=($310>>>0);
   $312 = $311 & $not$;
   if ($312) {
    $313 = ((($309)) + 12|0);
    HEAP32[$313>>2] = $p$0;
    HEAP32[$308>>2] = $p$0;
    $314 = ((($p$0)) + 8|0);
    HEAP32[$314>>2] = $309;
    $315 = ((($p$0)) + 12|0);
    HEAP32[$315>>2] = $T$0$lcssa;
    $316 = ((($p$0)) + 24|0);
    HEAP32[$316>>2] = 0;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $317 = HEAP32[(876)>>2]|0;
 $318 = (($317) + -1)|0;
 HEAP32[(876)>>2] = $318;
 $319 = ($318|0)==(0);
 if ($319) {
  $sp$0$in$i = (1300);
 } else {
  return;
 }
 while(1) {
  $sp$0$i = HEAP32[$sp$0$in$i>>2]|0;
  $320 = ($sp$0$i|0)==(0|0);
  $321 = ((($sp$0$i)) + 8|0);
  if ($320) {
   break;
  } else {
   $sp$0$in$i = $321;
  }
 }
 HEAP32[(876)>>2] = -1;
 return;
}
function runPostSets() {
}
function _i64Add(a, b, c, d) {
    /*
      x = a + b*2^32
      y = c + d*2^32
      result = l + h*2^32
    */
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a + c)>>>0;
    h = (b + d + (((l>>>0) < (a>>>0))|0))>>>0; // Add carry from low word to high word on overflow.
    return ((tempRet0 = h,l|0)|0);
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _bitshift64Lshr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >>> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = 0;
    return (high >>> (bits - 32))|0;
}
function _memcpy(dest, src, num) {
    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}
function _i64Subtract(a, b, c, d) {
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a - c)>>>0;
    h = (b - d)>>>0;
    h = (b - d - (((c>>>0) > (a>>>0))|0))>>>0; // Borrow one from high word to low word on underflow.
    return ((tempRet0 = h,l|0)|0);
  }
function _bitshift64Shl(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits));
      return low << bits;
    }
    tempRet0 = low << (bits - 32);
    return 0;
  }
function _bitshift64Ashr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = (high|0) < 0 ? -1 : 0;
    return (high >> (bits - 32))|0;
  }
function _llvm_cttz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((cttz_i8)+(x & 0xff))>>0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 8)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 16)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((cttz_i8)+(x >>> 24))>>0)])|0) + 24)|0;
  }

// ======== compiled code from system/lib/compiler-rt , see readme therein
function ___muldsi3($a, $b) {
  $a = $a | 0;
  $b = $b | 0;
  var $1 = 0, $2 = 0, $3 = 0, $6 = 0, $8 = 0, $11 = 0, $12 = 0;
  $1 = $a & 65535;
  $2 = $b & 65535;
  $3 = Math_imul($2, $1) | 0;
  $6 = $a >>> 16;
  $8 = ($3 >>> 16) + (Math_imul($2, $6) | 0) | 0;
  $11 = $b >>> 16;
  $12 = Math_imul($11, $1) | 0;
  return (tempRet0 = (($8 >>> 16) + (Math_imul($11, $6) | 0) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, 0 | ($8 + $12 << 16 | $3 & 65535)) | 0;
}
function ___divdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $7$0 = 0, $7$1 = 0, $8$0 = 0, $10$0 = 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  $7$0 = $2$0 ^ $1$0;
  $7$1 = $2$1 ^ $1$1;
  $8$0 = ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, 0) | 0;
  $10$0 = _i64Subtract($8$0 ^ $7$0, tempRet0 ^ $7$1, $7$0, $7$1) | 0;
  return $10$0 | 0;
}
function ___remdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $10$0 = 0, $10$1 = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  $rem = __stackBase__ | 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, $rem) | 0;
  $10$0 = _i64Subtract(HEAP32[$rem >> 2] ^ $1$0, HEAP32[$rem + 4 >> 2] ^ $1$1, $1$0, $1$1) | 0;
  $10$1 = tempRet0;
  STACKTOP = __stackBase__;
  return (tempRet0 = $10$1, $10$0) | 0;
}
function ___muldi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0, $2 = 0;
  $x_sroa_0_0_extract_trunc = $a$0;
  $y_sroa_0_0_extract_trunc = $b$0;
  $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
  $1$1 = tempRet0;
  $2 = Math_imul($a$1, $y_sroa_0_0_extract_trunc) | 0;
  return (tempRet0 = ((Math_imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $2 | 0) + $1$1 | $1$1 & 0, 0 | $1$0 & -1) | 0;
}
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0;
  $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
  return $1$0 | 0;
}
function ___uremdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  $rem = __stackBase__ | 0;
  ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) | 0;
  STACKTOP = __stackBase__;
  return (tempRet0 = HEAP32[$rem + 4 >> 2] | 0, HEAP32[$rem >> 2] | 0) | 0;
}
function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  $rem = $rem | 0;
  var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $49 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $86 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $117 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $154$0 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $q_sroa_0_0_insert_insert77$1 = 0, $_0$0 = 0, $_0$1 = 0;
  $n_sroa_0_0_extract_trunc = $a$0;
  $n_sroa_1_4_extract_shift$0 = $a$1;
  $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
  $d_sroa_0_0_extract_trunc = $b$0;
  $d_sroa_1_4_extract_shift$0 = $b$1;
  $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
  if (($n_sroa_1_4_extract_trunc | 0) == 0) {
    $4 = ($rem | 0) != 0;
    if (($d_sroa_1_4_extract_trunc | 0) == 0) {
      if ($4) {
        HEAP32[$rem >> 2] = ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
        HEAP32[$rem + 4 >> 2] = 0;
      }
      $_0$1 = 0;
      $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$4) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    }
  }
  $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
  do {
    if (($d_sroa_0_0_extract_trunc | 0) == 0) {
      if ($17) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
          HEAP32[$rem + 4 >> 2] = 0;
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      if (($n_sroa_0_0_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0;
          HEAP32[$rem + 4 >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0);
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
      if (($37 & $d_sroa_1_4_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0 | $a$0 & -1;
          HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
        }
        $_0$1 = 0;
        $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $49 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
      $51 = $49 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
      if ($51 >>> 0 <= 30) {
        $57 = $51 + 1 | 0;
        $58 = 31 - $51 | 0;
        $sr_1_ph = $57;
        $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
        $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
        $q_sroa_0_1_ph = 0;
        $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
        break;
      }
      if (($rem | 0) == 0) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = 0 | $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$17) {
        $117 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
        $119 = $117 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        if ($119 >>> 0 <= 31) {
          $125 = $119 + 1 | 0;
          $126 = 31 - $119 | 0;
          $130 = $119 - 31 >> 31;
          $sr_1_ph = $125;
          $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
          $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
          $q_sroa_0_1_ph = 0;
          $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
          break;
        }
        if (($rem | 0) == 0) {
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        HEAP32[$rem >> 2] = 0 | $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
      if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
        $86 = (Math_clz32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 | 0;
        $88 = $86 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        $89 = 64 - $88 | 0;
        $91 = 32 - $88 | 0;
        $92 = $91 >> 31;
        $95 = $88 - 32 | 0;
        $105 = $95 >> 31;
        $sr_1_ph = $88;
        $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
        $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
        $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
        $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
        break;
      }
      if (($rem | 0) != 0) {
        HEAP32[$rem >> 2] = $66 & $n_sroa_0_0_extract_trunc;
        HEAP32[$rem + 4 >> 2] = 0;
      }
      if (($d_sroa_0_0_extract_trunc | 0) == 1) {
        $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$0 = 0 | $a$0 & -1;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
        $_0$1 = 0 | $n_sroa_1_4_extract_trunc >>> ($78 >>> 0);
        $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
    }
  } while (0);
  if (($sr_1_ph | 0) == 0) {
    $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
    $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
    $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
    $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = 0;
  } else {
    $d_sroa_0_0_insert_insert99$0 = 0 | $b$0 & -1;
    $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
    $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0 | 0, $d_sroa_0_0_insert_insert99$1 | 0, -1, -1) | 0;
    $137$1 = tempRet0;
    $q_sroa_1_1198 = $q_sroa_1_1_ph;
    $q_sroa_0_1199 = $q_sroa_0_1_ph;
    $r_sroa_1_1200 = $r_sroa_1_1_ph;
    $r_sroa_0_1201 = $r_sroa_0_1_ph;
    $sr_1202 = $sr_1_ph;
    $carry_0203 = 0;
    while (1) {
      $147 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
      $149 = $carry_0203 | $q_sroa_0_1199 << 1;
      $r_sroa_0_0_insert_insert42$0 = 0 | ($r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31);
      $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
      _i64Subtract($137$0, $137$1, $r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1) | 0;
      $150$1 = tempRet0;
      $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
      $152 = $151$0 & 1;
      $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1, $151$0 & $d_sroa_0_0_insert_insert99$0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1) | 0;
      $r_sroa_0_0_extract_trunc = $154$0;
      $r_sroa_1_4_extract_trunc = tempRet0;
      $155 = $sr_1202 - 1 | 0;
      if (($155 | 0) == 0) {
        break;
      } else {
        $q_sroa_1_1198 = $147;
        $q_sroa_0_1199 = $149;
        $r_sroa_1_1200 = $r_sroa_1_4_extract_trunc;
        $r_sroa_0_1201 = $r_sroa_0_0_extract_trunc;
        $sr_1202 = $155;
        $carry_0203 = $152;
      }
    }
    $q_sroa_1_1_lcssa = $147;
    $q_sroa_0_1_lcssa = $149;
    $r_sroa_1_1_lcssa = $r_sroa_1_4_extract_trunc;
    $r_sroa_0_1_lcssa = $r_sroa_0_0_extract_trunc;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = $152;
  }
  $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
  $q_sroa_0_0_insert_ext75$1 = 0;
  $q_sroa_0_0_insert_insert77$1 = $q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1;
  if (($rem | 0) != 0) {
    HEAP32[$rem >> 2] = 0 | $r_sroa_0_1_lcssa;
    HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa | 0;
  }
  $_0$1 = (0 | $q_sroa_0_0_insert_ext75$0) >>> 31 | $q_sroa_0_0_insert_insert77$1 << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
  $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
  return (tempRet0 = $_0$1, $_0$0) | 0;
}
// =======================================================================



  
function dynCall_ii(index,a1) {
  index = index|0;
  a1=a1|0;
  return FUNCTION_TABLE_ii[index&63](a1|0)|0;
}


function dynCall_iiii(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0;
  return FUNCTION_TABLE_iiii[index&63](a1|0,a2|0,a3|0)|0;
}


function dynCall_viiii(index,a1,a2,a3,a4) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0;
  FUNCTION_TABLE_viiii[index&15](a1|0,a2|0,a3|0,a4|0);
}


function dynCall_viii(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0;
  FUNCTION_TABLE_viii[index&63](a1|0,a2|0,a3|0);
}


function dynCall_vi(index,a1) {
  index = index|0;
  a1=a1|0;
  FUNCTION_TABLE_vi[index&63](a1|0);
}

function b0(p0) {
 p0 = p0|0; nullFunc_ii(0);return 0;
}
function b1(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(1);return 0;
}
function b2(p0,p1,p2,p3) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0; nullFunc_viiii(2);
}
function b3(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_viii(3);
}
function b4(p0) {
 p0 = p0|0; nullFunc_vi(4);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_ii = [b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,_MasterOut_constructor
,b0,b0,b0,_Noise_constructor,b0,b0,_PitchKnob_constructor,b0,_Sequence_constructor,b0,b0,b0,_Sine_constructor,b0,b0,_Square_constructor,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0
,b0,b0,b0,b0,b0];
var FUNCTION_TABLE_iiii = [b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,_Output_initial_sample_pull_handler,_Input_sample_pull_handler,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,_MasterOut_pull_sample_handler,b1,b1,_Noise_pull_sample_handler,b1,b1,_PitchKnob_pull_sample_handler,b1,b1,_Sequence_pull_sample_handler,b1,b1,_Sine_pull_sample_handler,b1,b1,_Square_pull_sample_handler,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1,b1,b1];
var FUNCTION_TABLE_viiii = [b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,_Patch_mouse_callback,b2,b2];
var FUNCTION_TABLE_viii = [b3,b3,b3,b3,b3,b3,b3,b3,b3,_Window_move_function,b3,b3,_Patch_resize_callback,b3,_PatchCore_pull_sample,b3,_IO_mouseclick_handler,b3,b3,_Unit_move_function,b3,b3,b3,b3,b3,_SessionMenu_mouseclick_function,_Slider_knob_move,b3,b3
,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,_PatchDesktop_mouseclick_handler,_PatchDesktop_mousemove_handler,b3,b3,b3,b3,b3,b3,b3,b3,b3
,b3,b3,b3,b3,b3];
var FUNCTION_TABLE_vi = [b4,_String_delete_function,_Object_default_delete_function,_List_delete,_AssociativeArray_delete_function,_Context_delete_function,_Desktop_paint_handler,_Window_delete_function,_Window_paint_handler,b4,_Module_delete_function,_PatchCore_delete_function,b4,b4,b4,_IO_paint_handler,b4,b4,b4,b4,_Frame_paint_handler,_MenuEntry_delete_function,_MenuEntry_paint_handler,_MenuEntry_mouseover_handler,_MenuEntry_mouseout_handler,b4,b4,_Slider_delete_function,b4
,_MasterOut_delete_function,b4,_MasterOut_paint_handler,b4,b4,_Noise_paint_handler,b4,b4,b4,_Sequence_delete_function,b4,_Sequence_paint_handler,b4,b4,_Sine_paint_handler,b4,b4,_Square_paint_handler,_PatchDesktop_delete_function,b4,b4,_PatchDesktop_paint_handler,b4,b4,b4,b4,b4,b4,b4,b4
,b4,b4,b4,b4,b4];

  return { _free: _free, _main: _main, _doMouseCallback: _doMouseCallback, _memset: _memset, _malloc: _malloc, _i64Add: _i64Add, _memcpy: _memcpy, _doResizeCallback: _doResizeCallback, _doPullSample: _doPullSample, _bitshift64Lshr: _bitshift64Lshr, ___errno_location: ___errno_location, runPostSets: runPostSets, _emscripten_replace_memory: _emscripten_replace_memory, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_ii: dynCall_ii, dynCall_iiii: dynCall_iiii, dynCall_viiii: dynCall_viiii, dynCall_viii: dynCall_viii, dynCall_vi: dynCall_vi };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var real__free = asm["_free"]; asm["_free"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__free.apply(null, arguments);
};

var real__main = asm["_main"]; asm["_main"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__main.apply(null, arguments);
};

var real__doMouseCallback = asm["_doMouseCallback"]; asm["_doMouseCallback"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__doMouseCallback.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__malloc.apply(null, arguments);
};

var real__i64Add = asm["_i64Add"]; asm["_i64Add"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Add.apply(null, arguments);
};

var real__doResizeCallback = asm["_doResizeCallback"]; asm["_doResizeCallback"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__doResizeCallback.apply(null, arguments);
};

var real____errno_location = asm["___errno_location"]; asm["___errno_location"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real____errno_location.apply(null, arguments);
};

var real__bitshift64Lshr = asm["_bitshift64Lshr"]; asm["_bitshift64Lshr"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Lshr.apply(null, arguments);
};

var real__doPullSample = asm["_doPullSample"]; asm["_doPullSample"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__doPullSample.apply(null, arguments);
};
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _doMouseCallback = Module["_doMouseCallback"] = asm["_doMouseCallback"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _doResizeCallback = Module["_doResizeCallback"] = asm["_doResizeCallback"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = asm["_emscripten_replace_memory"];
var _doPullSample = Module["_doPullSample"] = asm["_doPullSample"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
;

Runtime.stackAlloc = asm['stackAlloc'];
Runtime.stackSave = asm['stackSave'];
Runtime.stackRestore = asm['stackRestore'];
Runtime.establishStackSpace = asm['establishStackSpace'];

Runtime.setTempRet0 = asm['setTempRet0'];
Runtime.getTempRet0 = asm['getTempRet0'];



// === Auto-generated postamble setup entry stuff ===


function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return; 

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status, implicit) {
  if (implicit && Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') implicitly called by end of main(), but noExitRuntime, so not exiting the runtime (you can use emscripten_force_exit, if you want to force a true shutdown)');
    return;
  }

  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)');
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  if (ENVIRONMENT_IS_NODE) {
    // Work around a node.js bug where stdout buffer is not flushed at process exit:
    // Instead of process.exit() directly, wait for stdout flush event.
    // See https://github.com/joyent/node/issues/1669 and https://github.com/kripken/emscripten/issues/2582
    // Workaround is based on https://github.com/RReverser/acorn/commit/50ab143cecc9ed71a2d66f78b4aec3bb2e9844f6
    process['stdout']['once']('drain', function () {
      process['exit'](status);
    });
    console.log(' '); // Make sure to print something to force the drain event to occur, in case the stdout buffer was empty.
    // Work around another node bug where sometimes 'drain' is never fired - make another effort
    // to emit the exit status, after a significant delay (if node hasn't fired drain by then, give up)
    setTimeout(function() {
      process['exit'](status);
    }, 500);
  } else
  if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
    quit(status);
  }
  // if we reach here, we must throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

var abortDecorators = [];

function abort(what) {
  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

Module["noExitRuntime"] = true;

run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



//# sourceMappingURL=current_build.js.map