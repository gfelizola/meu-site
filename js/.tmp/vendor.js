/*
 * Foundation Responsive Library
 * http://foundation.zurb.com
 * Copyright 2013, ZURB
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
*/

/*jslint unparam: true, browser: true, indent: 2 */

// Accommodate running jQuery or Zepto in noConflict() mode by
// using an anonymous function to redefine the $ shorthand name.
// See http://docs.jquery.com/Using_jQuery_with_Other_Libraries
// and http://zeptojs.com/
var libFuncName = null;

if (typeof jQuery === "undefined" &&
    typeof Zepto === "undefined" &&
    typeof $ === "function") {
  libFuncName = $;
} else if (typeof jQuery === "function") {
  libFuncName = jQuery;
} else if (typeof Zepto === "function") {
  libFuncName = Zepto;
} else {
  throw new TypeError();
}

(function ($, window, document, undefined) {
  'use strict';

  /*
    matchMedia() polyfill - Test a CSS media 
    type/query in JS. Authors & copyright (c) 2012: 
    Scott Jehl, Paul Irish, Nicholas Zakas. 
    Dual MIT/BSD license

    https://github.com/paulirish/matchMedia.js
  */

  window.matchMedia = window.matchMedia || (function( doc, undefined ) {

    "use strict";

    var bool,
        docElem = doc.documentElement,
        refNode = docElem.firstElementChild || docElem.firstChild,
        // fakeBody required for <FF4 when executed in <head>
        fakeBody = doc.createElement( "body" ),
        div = doc.createElement( "div" );

    div.id = "mq-test-1";
    div.style.cssText = "position:absolute;top:-100em";
    fakeBody.style.background = "none";
    fakeBody.appendChild(div);

    return function(q){

      div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

      docElem.insertBefore( fakeBody, refNode );
      bool = div.offsetWidth === 42;
      docElem.removeChild( fakeBody );

      return {
        matches: bool,
        media: q
      };

    };

  }( document ));

  // add dusty browser stuff
  if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp */) {
      "use strict";
   
      if (this == null) {
        throw new TypeError();
      }

      var t = Object(this),
          len = t.length >>> 0;
      if (typeof fun !== "function") {
          return;
      }

      var res = [],
          thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          var val = t[i]; // in case fun mutates this
          if (fun && fun.call(thisp, val, i, t)) {
            res.push(val);
          }
        }
      }

      return res;
    }
  }

  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== "function") {
        // closest thing possible to the ECMAScript 5 internal IsCallable function
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }
   
      var aArgs = Array.prototype.slice.call(arguments, 1), 
          fToBind = this, 
          fNOP = function () {},
          fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis
               ? this
               : oThis,
             aArgs.concat(Array.prototype.slice.call(arguments)));
          };
   
      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();
   
      return fBound;
    };
  }

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
      "use strict";
      if (this == null) {
        throw new TypeError();
      }
      var t = Object(this);
      var len = t.length >>> 0;
      if (len === 0) {
        return -1;
      }
      var n = 0;
      if (arguments.length > 1) {
        n = Number(arguments[1]);
        if (n != n) { // shortcut for verifying if it's NaN
          n = 0;
        } else if (n != 0 && n != Infinity && n != -Infinity) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
      if (n >= len) {
          return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    }
  }

  // fake stop() for zepto.
  $.fn.stop = $.fn.stop || function() {
    return this;
  };

  window.Foundation = {
    name : 'Foundation',

    version : '4.3.1',

    cache : {},

    init : function (scope, libraries, method, options, response, /* internal */ nc) {
      var library_arr,
          args = [scope, method, options, response],
          responses = [],
          nc = nc || false;

      // disable library error catching,
      // used for development only
      if (nc) this.nc = nc;

      // check RTL
      this.rtl = /rtl/i.test($('html').attr('dir'));

      // set foundation global scope
      this.scope = scope || this.scope;

      if (libraries && typeof libraries === 'string' && !/reflow/i.test(libraries)) {
        if (/off/i.test(libraries)) return this.off();

        library_arr = libraries.split(' ');

        if (library_arr.length > 0) {
          for (var i = library_arr.length - 1; i >= 0; i--) {
            responses.push(this.init_lib(library_arr[i], args));
          }
        }
      } else {
        if (/reflow/i.test(libraries)) args[1] = 'reflow';

        for (var lib in this.libs) {
          responses.push(this.init_lib(lib, args));
        }
      }

      // if first argument is callback, add to args
      if (typeof libraries === 'function') {
        args.unshift(libraries);
      }

      return this.response_obj(responses, args);
    },

    response_obj : function (response_arr, args) {
      for (var i = 0, len = args.length; i < len; i++) {
        if (typeof args[i] === 'function') {
          return args[i]({
            errors: response_arr.filter(function (s) {
              if (typeof s === 'string') return s;
            })
          });
        }
      }

      return response_arr;
    },

    init_lib : function (lib, args) {
      return this.trap(function () {
        if (this.libs.hasOwnProperty(lib)) {
          this.patch(this.libs[lib]);
          return this.libs[lib].init.apply(this.libs[lib], args);
        } else {
          return function () {};
        }
      }.bind(this), lib);
    },

    trap : function (fun, lib) {
      if (!this.nc) {
        try {
          return fun();
        } catch (e) {
          return this.error({name: lib, message: 'could not be initialized', more: e.name + ' ' + e.message});
        }
      }

      return fun();
    },

    patch : function (lib) {
      this.fix_outer(lib);
      lib.scope = this.scope;
      lib.rtl = this.rtl;
    },

    inherit : function (scope, methods) {
      var methods_arr = methods.split(' ');

      for (var i = methods_arr.length - 1; i >= 0; i--) {
        if (this.lib_methods.hasOwnProperty(methods_arr[i])) {
          this.libs[scope.name][methods_arr[i]] = this.lib_methods[methods_arr[i]];
        }
      }
    },

    random_str : function (length) {
      var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

      if (!length) {
        length = Math.floor(Math.random() * chars.length);
      }

      var str = '';
      for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
      }
      return str;
    },

    libs : {},

    // methods that can be inherited in libraries
    lib_methods : {
      set_data : function (node, data) {
        // this.name references the name of the library calling this method
        var id = [this.name,+new Date(),Foundation.random_str(5)].join('-');

        Foundation.cache[id] = data;
        node.attr('data-' + this.name + '-id', id);
        return data;
      },

      get_data : function (node) {
        return Foundation.cache[node.attr('data-' + this.name + '-id')];
      },

      remove_data : function (node) {
        if (node) {
          delete Foundation.cache[node.attr('data-' + this.name + '-id')];
          node.attr('data-' + this.name + '-id', '');
        } else {
          $('[data-' + this.name + '-id]').each(function () {
            delete Foundation.cache[$(this).attr('data-' + this.name + '-id')];
            $(this).attr('data-' + this.name + '-id', '');
          });
        }
      },

      throttle : function(fun, delay) {
        var timer = null;
        return function () {
          var context = this, args = arguments;
          clearTimeout(timer);
          timer = setTimeout(function () {
            fun.apply(context, args);
          }, delay);
        };
      },

      // parses data-options attribute on nodes and turns
      // them into an object
      data_options : function (el) {
        var opts = {}, ii, p,
            opts_arr = (el.attr('data-options') || ':').split(';'),
            opts_len = opts_arr.length;

        function isNumber (o) {
          return ! isNaN (o-0) && o !== null && o !== "" && o !== false && o !== true;
        }

        function trim(str) {
          if (typeof str === 'string') return $.trim(str);
          return str;
        }

        // parse options
        for (ii = opts_len - 1; ii >= 0; ii--) {
          p = opts_arr[ii].split(':');

          if (/true/i.test(p[1])) p[1] = true;
          if (/false/i.test(p[1])) p[1] = false;
          if (isNumber(p[1])) p[1] = parseInt(p[1], 10);

          if (p.length === 2 && p[0].length > 0) {
            opts[trim(p[0])] = trim(p[1]);
          }
        }

        return opts;
      },

      delay : function (fun, delay) {
        return setTimeout(fun, delay);
      },

      // animated scrolling
      scrollTo : function (el, to, duration) {
        if (duration < 0) return;
        var difference = to - $(window).scrollTop();
        var perTick = difference / duration * 10;

        this.scrollToTimerCache = setTimeout(function() {
          if (!isNaN(parseInt(perTick, 10))) {
            window.scrollTo(0, $(window).scrollTop() + perTick);
            this.scrollTo(el, to, duration - 10);
          }
        }.bind(this), 10);
      },

      // not supported in core Zepto
      scrollLeft : function (el) {
        if (!el.length) return;
        return ('scrollLeft' in el[0]) ? el[0].scrollLeft : el[0].pageXOffset;
      },

      // test for empty object or array
      empty : function (obj) {
        if (obj.length && obj.length > 0)    return false;
        if (obj.length && obj.length === 0)  return true;

        for (var key in obj) {
          if (hasOwnProperty.call(obj, key))    return false;
        }

        return true;
      }
    },

    fix_outer : function (lib) {
      lib.outerHeight = function (el, bool) {
        if (typeof Zepto === 'function') {
          return el.height();
        }

        if (typeof bool !== 'undefined') {
          return el.outerHeight(bool);
        }

        return el.outerHeight();
      };

      lib.outerWidth = function (el, bool) {
        if (typeof Zepto === 'function') {
          return el.width();
        }

        if (typeof bool !== 'undefined') {
          return el.outerWidth(bool);
        }

        return el.outerWidth();
      };
    },

    error : function (error) {
      return error.name + ' ' + error.message + '; ' + error.more;
    },

    // remove all foundation events.
    off: function () {
      $(this.scope).off('.fndtn');
      $(window).off('.fndtn');
      return true;
    },

    zj : $
  };

  $.fn.foundation = function () {
    var args = Array.prototype.slice.call(arguments, 0);

    return this.each(function () {
      Foundation.init.apply(Foundation, [this].concat(args));
      return this;
    });
  };

}(libFuncName, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.abide = {
    name : 'abide',

    version : '4.3.0',

    settings : {
      live_validate : true,
      focus_on_invalid : true,
      timeout : 1000,
      patterns : {
        alpha: /[a-zA-Z]+/,
        alpha_numeric : /[a-zA-Z0-9]+/,
        integer: /-?\d+/,
        number: /-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?/,

        // generic password: upper-case, lower-case, number/special character, and min 8 characters
        password : /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,

        // amex, visa, diners
        card : /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
        cvv : /^([0-9]){3,4}$/,

        // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
        email : /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

        url: /(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/,
        // abc.de
        domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/,

        datetime: /([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))/,
        // YYYY-MM-DD
        date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))/,
        // HH:MM:SS
        time : /(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}/,
        dateISO: /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/,
        // MM/DD/YYYY
        month_day_year : /(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d/,

        // #FFF or #FFFFFF
        color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
      }
    },

    timer : null,

    init : function (scope, method, options) {
      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method !== 'string') {
        if (!this.settings.init) { this.events(); }

      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this,
          forms = $('form[data-abide]', this.scope).attr('novalidate', 'novalidate');

      forms
        .on('submit validate', function (e) {
          return self.validate($(this).find('input, textarea, select').get(), e);
        });

      this.settings.init = true;

      if (!this.settings.live_validate) return;

      forms
        .find('input, textarea, select')
        .on('blur change', function (e) {
          self.validate([this], e);
        })
        .on('keydown', function (e) {
          clearTimeout(self.timer);
          self.timer = setTimeout(function () {
            self.validate([this], e);
          }.bind(this), self.settings.timeout);
        });
    },

    validate : function (els, e) {
      var validations = this.parse_patterns(els),
          validation_count = validations.length,
          form = $(els[0]).closest('form');

      while (validation_count--) {
        if (!validations[validation_count] && /submit/.test(e.type)) {
          if (this.settings.focus_on_invalid) els[validation_count].focus();
          form.trigger('invalid');
          $(els[validation_count]).closest('form').attr('data-invalid', '');
          return false;
        }
      }

      if (/submit/.test(e.type)) {
        form.trigger('valid');
      }

      form.removeAttr('data-invalid');

      return true;
    },

    parse_patterns : function (els) {
      var count = els.length,
          el_patterns = [];

      for (var i = count - 1; i >= 0; i--) {
        el_patterns.push(this.pattern(els[i]));
      }

      return this.check_validation_and_apply_styles(el_patterns);
    },

    pattern : function (el) {
      var type = el.getAttribute('type'),
          required = typeof el.getAttribute('required') === 'string';

      if (this.settings.patterns.hasOwnProperty(type)) {
        return [el, this.settings.patterns[type], required];
      }

      var pattern = el.getAttribute('pattern') || '';

      if (this.settings.patterns.hasOwnProperty(pattern) && pattern.length > 0) {
        return [el, this.settings.patterns[pattern], required];
      } else if (pattern.length > 0) {
        return [el, new RegExp(pattern), required];
      }

      pattern = /.*/;

      return [el, pattern, required];
    },

    check_validation_and_apply_styles : function (el_patterns) {
      var count = el_patterns.length,
          validations = [];

      for (var i = count - 1; i >= 0; i--) {
        var el = el_patterns[i][0],
            required = el_patterns[i][2],
            value = el.value,
            is_radio = el.type === "radio",
            valid_length = (required) ? (el.value.length > 0) : true;

        if (is_radio && required) {
          validations.push(this.valid_radio(el, required));
        } else {
          if (el_patterns[i][1].test(value) && valid_length ||
            !required && el.value.length < 1) {
            $(el).removeAttr('data-invalid').parent().removeClass('error');
            validations.push(true);
          } else {
            $(el).attr('data-invalid', '').parent().addClass('error');
            validations.push(false);
          }
        }
      }

      return validations;
    },

    valid_radio : function (el, required) {
      var name = el.getAttribute('name'),
          group = document.getElementsByName(name),
          count = group.length,
          valid = false;

      for (var i=0; i < count; i++) {
        if (group[i].checked) valid = true;
      }

      for (var i=0; i < count; i++) {
        if (valid) {
          $(group[i]).removeAttr('data-invalid').parent().removeClass('error');
        } else {
          $(group[i]).attr('data-invalid', '').parent().addClass('error');
        }
      }

      return valid;
    }
  };
}(Foundation.zj, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.alerts = {
    name : 'alerts',

    version : '4.2.2',

    settings : {
      speed: 300, // fade out speed
      callback: function (){}
    },

    init : function (scope, method, options) {
      this.scope = scope || this.scope;

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method !== 'string') {
        if (!this.settings.init) { this.events(); }

        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(this.scope).on('click.fndtn.alerts', '[data-alert] a.close', function (e) {
        e.preventDefault();
        $(this).closest("[data-alert]").fadeOut(self.speed, function () {
          $(this).remove();
          self.settings.callback();
        });
      });

      this.settings.init = true;
    },

    off : function () {
      $(this.scope).off('.fndtn.alerts');
    },

    reflow : function () {}
  };
}(Foundation.zj, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.clearing = {
    name : 'clearing',

    version: '4.3.1',

    settings : {
      templates : {
        viewing : '<a href="#" class="clearing-close">&times;</a>' +
          '<div class="visible-img" style="display: none"><img src="//:0">' +
          '<p class="clearing-caption"></p><a href="#" class="clearing-main-prev"><span></span></a>' +
          '<a href="#" class="clearing-main-next"><span></span></a></div>'
      },

      // comma delimited list of selectors that, on click, will close clearing,
      // add 'div.clearing-blackout, div.visible-img' to close on background click
      close_selectors : '.clearing-close',

      // event initializers and locks
      init : false,
      locked : false
    },

    init : function (scope, method, options) {
      var self = this;
      Foundation.inherit(this, 'set_data get_data remove_data throttle data_options');

      if (typeof method === 'object') {
        options = $.extend(true, this.settings, method);
      }

      if (typeof method !== 'string') {
        $(this.scope).find('ul[data-clearing]').each(function () {
          var $el = $(this),
              options = options || {},
              lis = $el.find('li'),
              settings = self.get_data($el);

          if (!settings && lis.length > 0) {
            options.$parent = $el.parent();

            self.set_data($el, $.extend({}, self.settings, options, self.data_options($el)));

            self.assemble($el.find('li'));

            if (!self.settings.init) {
              self.events().swipe_events();
            }
          }
        });

        return this.settings.init;
      } else {
        // fire method
        return this[method].call(this, options);
      }
    },

    // event binding and initial setup

    events : function () {
      var self = this;

      $(this.scope)
        .on('click.fndtn.clearing', 'ul[data-clearing] li',
          function (e, current, target) {
            var current = current || $(this),
                target = target || current,
                next = current.next('li'),
                settings = self.get_data(current.parent()),
                image = $(e.target);

            e.preventDefault();
            if (!settings) self.init();

            // if clearing is open and the current image is
            // clicked, go to the next image in sequence
            if (target.hasClass('visible') && 
              current[0] === target[0] && 
              next.length > 0 && self.is_open(current)) {
              target = next;
              image = target.find('img');
            }

            // set current and target to the clicked li if not otherwise defined.
            self.open(image, current, target);
            self.update_paddles(target);
          })

        .on('click.fndtn.clearing', '.clearing-main-next',
          function (e) { this.nav(e, 'next') }.bind(this))
        .on('click.fndtn.clearing', '.clearing-main-prev',
          function (e) { this.nav(e, 'prev') }.bind(this))
        .on('click.fndtn.clearing', this.settings.close_selectors,
          function (e) { Foundation.libs.clearing.close(e, this) })
        .on('keydown.fndtn.clearing',
          function (e) { this.keydown(e) }.bind(this));

      $(window).on('resize.fndtn.clearing',
        function () { this.resize() }.bind(this));

      this.settings.init = true;
      return this;
    },

    swipe_events : function () {
      var self = this;

      $(this.scope)
        .on('touchstart.fndtn.clearing', '.visible-img', function(e) {
          if (!e.touches) { e = e.originalEvent; }
          var data = {
                start_page_x: e.touches[0].pageX,
                start_page_y: e.touches[0].pageY,
                start_time: (new Date()).getTime(),
                delta_x: 0,
                is_scrolling: undefined
              };

          $(this).data('swipe-transition', data);
          e.stopPropagation();
        })
        .on('touchmove.fndtn.clearing', '.visible-img', function(e) {
          if (!e.touches) { e = e.originalEvent; }
          // Ignore pinch/zoom events
          if(e.touches.length > 1 || e.scale && e.scale !== 1) return;

          var data = $(this).data('swipe-transition');

          if (typeof data === 'undefined') {
            data = {};
          }

          data.delta_x = e.touches[0].pageX - data.start_page_x;

          if ( typeof data.is_scrolling === 'undefined') {
            data.is_scrolling = !!( data.is_scrolling || Math.abs(data.delta_x) < Math.abs(e.touches[0].pageY - data.start_page_y) );
          }

          if (!data.is_scrolling && !data.active) {
            e.preventDefault();
            var direction = (data.delta_x < 0) ? 'next' : 'prev';
            data.active = true;
            self.nav(e, direction);
          }
        })
        .on('touchend.fndtn.clearing', '.visible-img', function(e) {
          $(this).data('swipe-transition', {});
          e.stopPropagation();
        });
    },

    assemble : function ($li) {
      var $el = $li.parent();
      $el.after('<div id="foundationClearingHolder"></div>');

      var holder = $('#foundationClearingHolder'),
          settings = this.get_data($el),
          grid = $el.detach(),
          data = {
            grid: '<div class="carousel">' + this.outerHTML(grid[0]) + '</div>',
            viewing: settings.templates.viewing
          },
          wrapper = '<div class="clearing-assembled"><div>' + data.viewing +
            data.grid + '</div></div>';

      return holder.after(wrapper).remove();
    },

    // event callbacks

    open : function ($image, current, target) {
      var root = target.closest('.clearing-assembled'),
          container = root.find('div').first(),
          visible_image = container.find('.visible-img'),
          image = visible_image.find('img').not($image);

      if (!this.locked()) {
        // set the image to the selected thumbnail
        image
          .attr('src', this.load($image))
          .css('visibility', 'hidden');

        this.loaded(image, function () {
          image.css('visibility', 'visible');
          // toggle the gallery
          root.addClass('clearing-blackout');
          container.addClass('clearing-container');
          visible_image.show();
          this.fix_height(target)
            .caption(visible_image.find('.clearing-caption'), $image)
            .center(image)
            .shift(current, target, function () {
              target.siblings().removeClass('visible');
              target.addClass('visible');
            });
        }.bind(this));
      }
    },

    close : function (e, el) {
      e.preventDefault();

      var root = (function (target) {
            if (/blackout/.test(target.selector)) {
              return target;
            } else {
              return target.closest('.clearing-blackout');
            }
          }($(el))), container, visible_image;

      if (el === e.target && root) {
        container = root.find('div').first();
        visible_image = container.find('.visible-img');
        this.settings.prev_index = 0;
        root.find('ul[data-clearing]')
          .attr('style', '').closest('.clearing-blackout')
          .removeClass('clearing-blackout');
        container.removeClass('clearing-container');
        visible_image.hide();
      }

      return false;
    },

    is_open : function (current) {
      return current.parent().attr('style').length > 0;
    },

    keydown : function (e) {
      var clearing = $('.clearing-blackout').find('ul[data-clearing]');

      if (e.which === 39) this.go(clearing, 'next');
      if (e.which === 37) this.go(clearing, 'prev');
      if (e.which === 27) $('a.clearing-close').trigger('click');
    },

    nav : function (e, direction) {
      var clearing = $('.clearing-blackout').find('ul[data-clearing]');

      e.preventDefault();
      this.go(clearing, direction);
    },

    resize : function () {
      var image = $('.clearing-blackout .visible-img').find('img');

      if (image.length) {
        this.center(image);
      }
    },

    // visual adjustments
    fix_height : function (target) {
      var lis = target.parent().children(),
          self = this;

      lis.each(function () {
          var li = $(this),
              image = li.find('img');

          if (li.height() > self.outerHeight(image)) {
            li.addClass('fix-height');
          }
        })
        .closest('ul')
        .width(lis.length * 100 + '%');

      return this;
    },

    update_paddles : function (target) {
      var visible_image = target
        .closest('.carousel')
        .siblings('.visible-img');

      if (target.next().length > 0) {
        visible_image
          .find('.clearing-main-next')
          .removeClass('disabled');
      } else {
        visible_image
          .find('.clearing-main-next')
          .addClass('disabled');
      }

      if (target.prev().length > 0) {
        visible_image
          .find('.clearing-main-prev')
          .removeClass('disabled');
      } else {
        visible_image
          .find('.clearing-main-prev')
          .addClass('disabled');
      }
    },

    center : function (target) {
      if (!this.rtl) {
        target.css({
          marginLeft : -(this.outerWidth(target) / 2),
          marginTop : -(this.outerHeight(target) / 2)
        });
      } else {
        target.css({
          marginRight : -(this.outerWidth(target) / 2),
          marginTop : -(this.outerHeight(target) / 2)
        });
      }
      return this;
    },

    // image loading and preloading

    load : function ($image) {
      if ($image[0].nodeName === "A") {
        var href = $image.attr('href');
      } else {
        var href = $image.parent().attr('href');
      }

      this.preload($image);

      if (href) return href;
      return $image.attr('src');
    },

    preload : function ($image) {
      this
        .img($image.closest('li').next())
        .img($image.closest('li').prev());
    },

    loaded : function (image, callback) {
      // based on jquery.imageready.js
      // @weblinc, @jsantell, (c) 2012

      function loaded () {
        callback();
      }

      function bindLoad () {
        this.one('load', loaded);

        if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
          var src = this.attr( 'src' ),
              param = src.match( /\?/ ) ? '&' : '?';

          param += 'random=' + (new Date()).getTime();
          this.attr('src', src + param);
        }
      }

      if (!image.attr('src')) {
        loaded();
        return;
      }

      if (image[0].complete || image[0].readyState === 4) {
        loaded();
      } else {
        bindLoad.call(image);
      }
    },

    img : function (img) {
      if (img.length) {
        var new_img = new Image(),
            new_a = img.find('a');

        if (new_a.length) {
          new_img.src = new_a.attr('href');
        } else {
          new_img.src = img.find('img').attr('src');
        }
      }
      return this;
    },

    // image caption

    caption : function (container, $image) {
      var caption = $image.data('caption');

      if (caption) {
        container
          .html(caption)
          .show();
      } else {
        container
          .text('')
          .hide();
      }
      return this;
    },

    // directional methods

    go : function ($ul, direction) {
      var current = $ul.find('.visible'),
          target = current[direction]();

      if (target.length) {
        target
          .find('img')
          .trigger('click', [current, target]);
      }
    },

    shift : function (current, target, callback) {
      var clearing = target.parent(),
          old_index = this.settings.prev_index || target.index(),
          direction = this.direction(clearing, current, target),
          left = parseInt(clearing.css('left'), 10),
          width = this.outerWidth(target),
          skip_shift;

      // we use jQuery animate instead of CSS transitions because we
      // need a callback to unlock the next animation
      if (target.index() !== old_index && !/skip/.test(direction)){
        if (/left/.test(direction)) {
          this.lock();
          clearing.animate({left : left + width}, 300, this.unlock());
        } else if (/right/.test(direction)) {
          this.lock();
          clearing.animate({left : left - width}, 300, this.unlock());
        }
      } else if (/skip/.test(direction)) {
        // the target image is not adjacent to the current image, so
        // do we scroll right or not
        skip_shift = target.index() - this.settings.up_count;
        this.lock();

        if (skip_shift > 0) {
          clearing.animate({left : -(skip_shift * width)}, 300, this.unlock());
        } else {
          clearing.animate({left : 0}, 300, this.unlock());
        }
      }

      callback();
    },

    direction : function ($el, current, target) {
      var lis = $el.find('li'),
          li_width = this.outerWidth(lis) + (this.outerWidth(lis) / 4),
          up_count = Math.floor(this.outerWidth($('.clearing-container')) / li_width) - 1,
          target_index = lis.index(target),
          response;

      this.settings.up_count = up_count;

      if (this.adjacent(this.settings.prev_index, target_index)) {
        if ((target_index > up_count)
          && target_index > this.settings.prev_index) {
          response = 'right';
        } else if ((target_index > up_count - 1)
          && target_index <= this.settings.prev_index) {
          response = 'left';
        } else {
          response = false;
        }
      } else {
        response = 'skip';
      }

      this.settings.prev_index = target_index;

      return response;
    },

    adjacent : function (current_index, target_index) {
      for (var i = target_index + 1; i >= target_index - 1; i--) {
        if (i === current_index) return true;
      }
      return false;
    },

    // lock management

    lock : function () {
      this.settings.locked = true;
    },

    unlock : function () {
      this.settings.locked = false;
    },

    locked : function () {
      return this.settings.locked;
    },

    // plugin management/browser quirks

    outerHTML : function (el) {
      // support FireFox < 11
      return el.outerHTML || new XMLSerializer().serializeToString(el);
    },

    off : function () {
      $(this.scope).off('.fndtn.clearing');
      $(window).off('.fndtn.clearing');
      this.remove_data(); // empty settings cache
      this.settings.init = false;
    },

    reflow : function () {
      this.init();
    }
  };

}(Foundation.zj, this, this.document));
;/*!
 * jQuery Cookie Plugin v1.3
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 *
 * Modified to work with Zepto.js by ZURB
 */
(function ($, document, undefined) {

  var pluses = /\+/g;

  function raw(s) {
    return s;
  }

  function decoded(s) {
    return decodeURIComponent(s.replace(pluses, ' '));
  }

  var config = $.cookie = function (key, value, options) {

    // write
    if (value !== undefined) {
      options = $.extend({}, config.defaults, options);

      if (value === null) {
        options.expires = -1;
      }

      if (typeof options.expires === 'number') {
        var days = options.expires, t = options.expires = new Date();
        t.setDate(t.getDate() + days);
      }

      value = config.json ? JSON.stringify(value) : String(value);

      return (document.cookie = [
        encodeURIComponent(key), '=', config.raw ? value : encodeURIComponent(value),
        options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
        options.path    ? '; path=' + options.path : '',
        options.domain  ? '; domain=' + options.domain : '',
        options.secure  ? '; secure' : ''
      ].join(''));
    }

    // read
    var decode = config.raw ? raw : decoded;
    var cookies = document.cookie.split('; ');
    for (var i = 0, l = cookies.length; i < l; i++) {
      var parts = cookies[i].split('=');
      if (decode(parts.shift()) === key) {
        var cookie = decode(parts.join('='));
        return config.json ? JSON.parse(cookie) : cookie;
      }
    }

    return null;
  };

  config.defaults = {};

  $.removeCookie = function (key, options) {
    if ($.cookie(key) !== null) {
      $.cookie(key, null, options);
      return true;
    }
    return false;
  };

})(Foundation.zj, document);
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.dropdown = {
    name : 'dropdown',

    version : '4.3.0',

    settings : {
      activeClass: 'open',
      is_hover: false,
      opened: function(){},
      closed: function(){}
    },

    init : function (scope, method, options) {
      this.scope = scope || this.scope;
      Foundation.inherit(this, 'throttle scrollLeft data_options');

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method !== 'string') {

        if (!this.settings.init) {
          this.events();
        }

        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(this.scope)
        .on('click.fndtn.dropdown', '[data-dropdown]', function (e) {
          var settings = $.extend({}, self.settings, self.data_options($(this)));
          e.preventDefault();

          if (!settings.is_hover) self.toggle($(this));
        })
        .on('mouseenter', '[data-dropdown]', function (e) {
          var settings = $.extend({}, self.settings, self.data_options($(this)));
          if (settings.is_hover) self.toggle($(this));
        })
        .on('mouseleave', '[data-dropdown-content]', function (e) {
          var target = $('[data-dropdown="' + $(this).attr('id') + '"]'),
              settings = $.extend({}, self.settings, self.data_options(target));
          if (settings.is_hover) self.close.call(self, $(this));
        })
        .on('opened.fndtn.dropdown', '[data-dropdown-content]', this.settings.opened)
        .on('closed.fndtn.dropdown', '[data-dropdown-content]', this.settings.closed);

      $(document).on('click.fndtn.dropdown', function (e) {
        var parent = $(e.target).closest('[data-dropdown-content]');

        if ($(e.target).data('dropdown')) {
          return;
        }
        if (parent.length > 0 && ($(e.target).is('[data-dropdown-content]') || $.contains(parent.first()[0], e.target))) {
          e.stopPropagation();
          return;
        }

        self.close.call(self, $('[data-dropdown-content]'));
      });

      $(window).on('resize.fndtn.dropdown', self.throttle(function () {
        self.resize.call(self);
      }, 50)).trigger('resize');

      this.settings.init = true;
    },

    close: function (dropdown) {
      var self = this;
      dropdown.each(function () {
        if ($(this).hasClass(self.settings.activeClass)) {
          $(this)
            .css(Foundation.rtl ? 'right':'left', '-99999px')
            .removeClass(self.settings.activeClass);
          $(this).trigger('closed');
        }
      });
    },

    open: function (dropdown, target) {
        this
          .css(dropdown
            .addClass(this.settings.activeClass), target);
        dropdown.trigger('opened');
    },

    toggle : function (target) {
      var dropdown = $('#' + target.data('dropdown'));

      this.close.call(this, $('[data-dropdown-content]').not(dropdown));

      if (dropdown.hasClass(this.settings.activeClass)) {
        this.close.call(this, dropdown);
      } else {
        this.close.call(this, $('[data-dropdown-content]'))
        this.open.call(this, dropdown, target);
      }
    },

    resize : function () {
      var dropdown = $('[data-dropdown-content].open'),
          target = $("[data-dropdown='" + dropdown.attr('id') + "']");

      if (dropdown.length && target.length) {
        this.css(dropdown, target);
      }
    },

    css : function (dropdown, target) {
      var offset_parent = dropdown.offsetParent();
      // if (offset_parent.length > 0 && /body/i.test(dropdown.offsetParent()[0].nodeName)) {
        var position = target.offset();
        position.top -= offset_parent.offset().top;
        position.left -= offset_parent.offset().left;
      // } else {
      //   var position = target.position();
      // }

      if (this.small()) {
        dropdown.css({
          position : 'absolute',
          width: '95%',
          left: '2.5%',
          'max-width': 'none',
          top: position.top + this.outerHeight(target)
        });
      } else {
        if (!Foundation.rtl && $(window).width() > this.outerWidth(dropdown) + target.offset().left) {
          var left = position.left;
          if (dropdown.hasClass('right')) {
            dropdown.removeClass('right');
          }
        } else {
          if (!dropdown.hasClass('right')) {
            dropdown.addClass('right');
          }
          var left = position.left - (this.outerWidth(dropdown) - this.outerWidth(target));
        }

        dropdown.attr('style', '').css({
          position : 'absolute',
          top: position.top + this.outerHeight(target),
          left: left
        });
      }

      return dropdown;
    },

    small : function () {
      return $(window).width() < 768 || $('html').hasClass('lt-ie9');
    },

    off: function () {
      $(this.scope).off('.fndtn.dropdown');
      $('html, body').off('.fndtn.dropdown');
      $(window).off('.fndtn.dropdown');
      $('[data-dropdown-content]').off('.fndtn.dropdown');
      this.settings.init = false;
    },

    reflow : function () {}
  };
}(Foundation.zj, this, this.document));
;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.forms = {
    name : 'forms',

    version: '4.3.1',

    cache: {},

    settings: {
      disable_class: 'no-custom',
      last_combo : null
    },

    init: function (scope, method, options) {

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method !== 'string') {
        if (!this.settings.init) {
          this.events();
        }

        this.assemble();

        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    assemble: function () {
      $('form.custom input[type="radio"]', $(this.scope))
        .not('[data-customforms="disabled"]')
        .not('.' + this.settings.disable_class)
        .each(this.append_custom_markup);
      $('form.custom input[type="checkbox"]', $(this.scope))
        .not('[data-customforms="disabled"]')
        .not('.' + this.settings.disable_class)
        .each(this.append_custom_markup);
      $('form.custom select', $(this.scope))
        .not('[data-customforms="disabled"]')
        .not('.' + this.settings.disable_class)
        .not('[multiple=multiple]')
        .each(this.append_custom_select);
    },

    events: function () {
      var self = this;

      $(this.scope)
        .on('click.fndtn.forms', 'form.custom span.custom.checkbox', function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.toggle_checkbox($(this));
        })
        .on('click.fndtn.forms', 'form.custom span.custom.radio', function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.toggle_radio($(this));
        })
        .on('change.fndtn.forms', 'form.custom select', function (e, force_refresh) {
          if ($(this).is('[data-customforms="disabled"]')) return;
          self.refresh_custom_select($(this), force_refresh);
        })
        .on('click.fndtn.forms', 'form.custom label', function (e) {
          if ($(e.target).is('label')) {
            var $associatedElement = $('#' + self.escape($(this).attr('for'))).not('[data-customforms="disabled"]'),
              $customCheckbox,
              $customRadio;

            if ($associatedElement.length !== 0) {
              if ($associatedElement.attr('type') === 'checkbox') {
                e.preventDefault();
                $customCheckbox = $(this).find('span.custom.checkbox');
                //the checkbox might be outside after the label or inside of another element
                if ($customCheckbox.length === 0) {
                  $customCheckbox = $associatedElement.add(this).siblings('span.custom.checkbox').first();
                }
                self.toggle_checkbox($customCheckbox);
              } else if ($associatedElement.attr('type') === 'radio') {
                e.preventDefault();
                $customRadio = $(this).find('span.custom.radio');
                //the radio might be outside after the label or inside of another element
                if ($customRadio.length === 0) {
                  $customRadio = $associatedElement.add(this).siblings('span.custom.radio').first();
                }
                self.toggle_radio($customRadio);
              }
            }
          }
        })
        .on('mousedown.fndtn.forms', 'form.custom div.custom.dropdown', function () {
          return false;
        })
        .on('click.fndtn.forms', 'form.custom div.custom.dropdown a.current, form.custom div.custom.dropdown a.selector', function (e) {
          var $this = $(this),
              $dropdown = $this.closest('div.custom.dropdown'),
              $select = getFirstPrevSibling($dropdown, 'select');

          // make sure other dropdowns close
          if (!$dropdown.hasClass('open')) $(self.scope).trigger('click');

          e.preventDefault();
          if (false === $select.is(':disabled')) {
            $dropdown.toggleClass('open');

            if ($dropdown.hasClass('open')) {
              $(self.scope).on('click.fndtn.forms.customdropdown', function () {
                $dropdown.removeClass('open');
                $(self.scope).off('.fndtn.forms.customdropdown');
              });
            } else {
              $(self.scope).on('.fndtn.forms.customdropdown');
            }
            return false;
          }
        })
        .on('click.fndtn.forms touchend.fndtn.forms', 'form.custom div.custom.dropdown li', function (e) {
          var $this = $(this),
              $customDropdown = $this.closest('div.custom.dropdown'),
              $select = getFirstPrevSibling($customDropdown, 'select'),
              selectedIndex = 0;

          e.preventDefault();
          e.stopPropagation();

          if (!$(this).hasClass('disabled')) {
            $('div.dropdown').not($customDropdown).removeClass('open');

            var $oldThis = $this.closest('ul')
              .find('li.selected');
            $oldThis.removeClass('selected');

            $this.addClass('selected');

            $customDropdown.removeClass('open')
              .find('a.current')
              .text($this.text());

            $this.closest('ul').find('li').each(function (index) {
              if ($this[0] === this) {
                selectedIndex = index;
              }
            });
            $select[0].selectedIndex = selectedIndex;

            //store the old value in data
            $select.data('prevalue', $oldThis.html());
            
            // Kick off full DOM change event
            if (typeof (document.createEvent) != 'undefined') {
              var event = document.createEvent('HTMLEvents');
              event.initEvent('change', true, true);
              $select[0].dispatchEvent(event);
            } else {
              $select[0].fireEvent('onchange'); // for IE
            }
          }
      });

      $(window).on('keydown', function (e) {
        var focus = document.activeElement,
            self = Foundation.libs.forms,
            dropdown = $('.custom.dropdown.open');

        if (dropdown.length > 0) {
          e.preventDefault();

          if (e.which === 13) {
            dropdown.find('li.selected').trigger('click');
          }

          if (e.which === 27) {
            dropdown.removeClass('open');
          }

          if (e.which >= 65 && e.which <= 90) {
            var next = self.go_to(dropdown, e.which),
                current = dropdown.find('li.selected');

            if (next) {
              current.removeClass('selected');
              self.scrollTo(next.addClass('selected'), 300);
            }
          }

          if (e.which === 38) {
            var current = dropdown.find('li.selected'),
                prev = current.prev(':not(.disabled)');

            if (prev.length > 0) {
              prev.parent()[0].scrollTop = prev.parent().scrollTop() - self.outerHeight(prev);
              current.removeClass('selected');
              prev.addClass('selected');
            }
          } else if (e.which === 40) {
            var current = dropdown.find('li.selected'),
                next = current.next(':not(.disabled)');

            if (next.length > 0) {
              next.parent()[0].scrollTop = next.parent().scrollTop() + self.outerHeight(next);
              current.removeClass('selected');
              next.addClass('selected');
            }
          }
        }
      });

      this.settings.init = true;
    },

    go_to: function (dropdown, character) {
      var lis = dropdown.find('li'),
          count = lis.length;

      if (count > 0) {
        for (var i = 0; i < count; i++) {
          var first_letter = lis.eq(i).text().charAt(0).toLowerCase();
          if (first_letter === String.fromCharCode(character).toLowerCase()) return lis.eq(i);
        }
      }
    },

    scrollTo: function (el, duration) {
      if (duration < 0) return;
      var parent = el.parent();
      var li_height = this.outerHeight(el);
      var difference = (li_height * (el.index())) - parent.scrollTop();
      var perTick = difference / duration * 10;

      this.scrollToTimerCache = setTimeout(function () {
        if (!isNaN(parseInt(perTick, 10))) {
          parent[0].scrollTop = parent.scrollTop() + perTick;
          this.scrollTo(el, duration - 10);
        }
      }.bind(this), 10);
    },

    append_custom_markup: function (idx, sel) {
      var $this = $(sel),
          type = $this.attr('type'),
          $span = $this.next('span.custom.' + type);
          
      if (!$this.parent().hasClass('switch')) {
        $this.addClass('hidden-field');
      }

      if ($span.length === 0) {
        $span = $('<span class="custom ' + type + '"></span>').insertAfter($this);
      }

      $span.toggleClass('checked', $this.is(':checked'));
      $span.toggleClass('disabled', $this.is(':disabled'));
    },

    append_custom_select: function (idx, sel) {
        var self = Foundation.libs.forms,
            $this = $(sel),
            $customSelect = $this.next('div.custom.dropdown'),
            $customList = $customSelect.find('ul'),
            $selectCurrent = $customSelect.find(".current"),
            $selector = $customSelect.find(".selector"),
            $options = $this.find('option'),
            $selectedOption = $options.filter(':selected'),
            copyClasses = $this.attr('class') ? $this.attr('class').split(' ') : [],
            maxWidth = 0,
            liHtml = '',
            $listItems,
            $currentSelect = false;

        if ($customSelect.length === 0) {
          var customSelectSize = $this.hasClass('small') ? 'small' : $this.hasClass('medium') ? 'medium' : $this.hasClass('large') ? 'large' : $this.hasClass('expand') ? 'expand' : '';

          $customSelect = $('<div class="' + ['custom', 'dropdown', customSelectSize].concat(copyClasses).filter(function (item, idx, arr) {
            if (item === '') return false;
            return arr.indexOf(item) === idx;
          }).join(' ') + '"><a href="#" class="selector"></a><ul /></div>');

          $selector = $customSelect.find(".selector");
          $customList = $customSelect.find("ul");

          liHtml = $options.map(function () {
            var copyClasses = $(this).attr('class') ? $(this).attr('class') : '';
            return "<li class='" + copyClasses + "'>" + $(this).html() + "</li>";
          }).get().join('');

          $customList.append(liHtml);

          $currentSelect = $customSelect
            .prepend('<a href="#" class="current">' + $selectedOption.html() + '</a>')
            .find(".current");

          $this.after($customSelect)
            .addClass('hidden-field');
        } else {
          liHtml = $options.map(function () {
              return "<li>" + $(this).html() + "</li>";
            })
            .get().join('');

          $customList.html('')
            .append(liHtml);

        } // endif $customSelect.length === 0

        self.assign_id($this, $customSelect);
        $customSelect.toggleClass('disabled', $this.is(':disabled'));
        $listItems = $customList.find('li');

        // cache list length
        self.cache[$customSelect.data('id')] = $listItems.length;

        $options.each(function (index) {
          if (this.selected) {
            $listItems.eq(index).addClass('selected');

            if ($currentSelect) {
              $currentSelect.html($(this).html());
            }
          }
          if ($(this).is(':disabled')) {
            $listItems.eq(index).addClass('disabled');
          }
        });

        //
        // If we're not specifying a predetermined form size.
        //
        if (!$customSelect.is('.small, .medium, .large, .expand')) {

          // ------------------------------------------------------------------------------------
          // This is a work-around for when elements are contained within hidden parents.
          // For example, when custom-form elements are inside of a hidden reveal modal.
          //
          // We need to display the current custom list element as well as hidden parent elements
          // in order to properly calculate the list item element's width property.
          // -------------------------------------------------------------------------------------

          $customSelect.addClass('open');
          //
          // Quickly, display all parent elements.
          // This should help us calcualate the width of the list item's within the drop down.
          //
          var self = Foundation.libs.forms;
          self.hidden_fix.adjust($customList);

          maxWidth = (self.outerWidth($listItems) > maxWidth) ? self.outerWidth($listItems) : maxWidth;

          Foundation.libs.forms.hidden_fix.reset();

          $customSelect.removeClass('open');

        } // endif

    },

    assign_id: function ($select, $customSelect) {
      var id = [+new Date(), Foundation.random_str(5)].join('-');
      $select.attr('data-id', id);
      $customSelect.attr('data-id', id);
    },

    refresh_custom_select: function ($select, force_refresh) {
      var self = this;
      var maxWidth = 0,
          $customSelect = $select.next(),
          $options = $select.find('option'),
          $listItems = $customSelect.find('li');

      if ($listItems.length !== this.cache[$customSelect.data('id')] || force_refresh) {
        $customSelect.find('ul').html('');

        $options.each(function () {
          var $li = $('<li>' + $(this).html() + '</li>');
          $customSelect.find('ul').append($li);
        });

        // re-populate
        $options.each(function (index) {
          if (this.selected) {
            $customSelect.find('li').eq(index).addClass('selected');
            $customSelect.find('.current').html($(this).html());
          }
          if ($(this).is(':disabled')) {
            $customSelect.find('li').eq(index).addClass('disabled');
          }
        });

        // fix width
        $customSelect.removeAttr('style')
          .find('ul').removeAttr('style');
        $customSelect.find('li').each(function () {
          $customSelect.addClass('open');
          if (self.outerWidth($(this)) > maxWidth) {
            maxWidth = self.outerWidth($(this));
          }
          $customSelect.removeClass('open');
        });

        $listItems = $customSelect.find('li');
        // cache list length
        this.cache[$customSelect.data('id')] = $listItems.length;
      }
    },

    toggle_checkbox: function ($element) {
      var $input = $element.prev(),
          input = $input[0];

      if (false === $input.is(':disabled')) {
        input.checked = ((input.checked) ? false : true);
        $element.toggleClass('checked');

        $input.trigger('change');
      }
    },

    toggle_radio: function ($element) {
        var $input = $element.prev(),
            $form = $input.closest('form.custom'),
            input = $input[0];

        if (false === $input.is(':disabled')) {
          $form.find('input[type="radio"][name="' + this.escape($input.attr('name')) + '"]')
            .next().not($element).removeClass('checked');

          if (!$element.hasClass('checked')) {
            $element.toggleClass('checked');
          }

          input.checked = $element.hasClass('checked');

          $input.trigger('change');
        }
    },

    escape: function (text) {
      if (!text) return '';
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    },

    hidden_fix: {
        /**
         * Sets all hidden parent elements and self to visibile.
         *
         * @method adjust
         * @param {jQuery Object} $child
         */

        // We'll use this to temporarily store style properties.
        tmp: [],

        // We'll use this to set hidden parent elements.
        hidden: null,

        adjust: function ($child) {
          // Internal reference.
          var _self = this;

          // Set all hidden parent elements, including this element.
          _self.hidden = $child.parents();
          _self.hidden = _self.hidden.add($child).filter(":hidden");

          // Loop through all hidden elements.
          _self.hidden.each(function () {

            // Cache the element.
            var $elem = $(this);

            // Store the style attribute.
            // Undefined if element doesn't have a style attribute.
            _self.tmp.push($elem.attr('style'));

            // Set the element's display property to block,
            // but ensure it's visibility is hidden.
            $elem.css({
                'visibility': 'hidden',
                'display': 'block'
            });
          });

        }, // end adjust

        /**
         * Resets the elements previous state.
         *
         * @method reset
         */
        reset: function () {
          // Internal reference.
          var _self = this;
          // Loop through our hidden element collection.
          _self.hidden.each(function (i) {
            // Cache this element.
            var $elem = $(this),
                _tmp = _self.tmp[i]; // Get the stored 'style' value for this element.

            // If the stored value is undefined.
            if (_tmp === undefined)
            // Remove the style attribute.
            $elem.removeAttr('style');
            else
            // Otherwise, reset the element style attribute.
            $elem.attr('style', _tmp);
          });
          // Reset the tmp array.
          _self.tmp = [];
          // Reset the hidden elements variable.
          _self.hidden = null;

        } // end reset
    },

    off: function () {
      $(this.scope).off('.fndtn.forms');
    },

    reflow : function () {}
  };

  var getFirstPrevSibling = function($el, selector) {
    var $el = $el.prev();
    while ($el.length) {
      if ($el.is(selector)) return $el;
      $el = $el.prev();
    }
    return $();
  };
}(Foundation.zj, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.interchange = {
    name : 'interchange',

    version : '4.2.4',

    cache : {},

    images_loaded : false,

    settings : {
      load_attr : 'interchange',

      named_queries : {
        'default' : 'only screen and (min-width: 1px)',
        small : 'only screen and (min-width: 768px)',
        medium : 'only screen and (min-width: 1280px)',
        large : 'only screen and (min-width: 1440px)',
        landscape : 'only screen and (orientation: landscape)',
        portrait : 'only screen and (orientation: portrait)',
        retina : 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 
          'only screen and (min--moz-device-pixel-ratio: 2),' + 
          'only screen and (-o-min-device-pixel-ratio: 2/1),' + 
          'only screen and (min-device-pixel-ratio: 2),' + 
          'only screen and (min-resolution: 192dpi),' + 
          'only screen and (min-resolution: 2dppx)'
      },

      directives : {
        replace: function (el, path) {
          if (/IMG/.test(el[0].nodeName)) {
            var orig_path = el[0].src;

            if (new RegExp(path, 'i').test(orig_path)) return;

            el[0].src = path;

            return el.trigger('replace', [el[0].src, orig_path]);
          }
        }
      }
    },

    init : function (scope, method, options) {
      Foundation.inherit(this, 'throttle');

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      this.events();
      this.images();

      if (typeof method !== 'string') {
        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(window).on('resize.fndtn.interchange', self.throttle(function () {
        self.resize.call(self);
      }, 50));
    },

    resize : function () {
      var cache = this.cache;

      if(!this.images_loaded) {
        setTimeout($.proxy(this.resize, this), 50);
        return;
      }

      for (var uuid in cache) {
        if (cache.hasOwnProperty(uuid)) {
          var passed = this.results(uuid, cache[uuid]);

          if (passed) {
            this.settings.directives[passed
              .scenario[1]](passed.el, passed.scenario[0]);
          }
        }
      }

    },

    results : function (uuid, scenarios) {
      var count = scenarios.length;

      if (count > 0) {
        var el = $('[data-uuid="' + uuid + '"]');

        for (var i = count - 1; i >= 0; i--) {
          var mq, rule = scenarios[i][2];
          if (this.settings.named_queries.hasOwnProperty(rule)) {
            mq = matchMedia(this.settings.named_queries[rule]);
          } else {
            mq = matchMedia(rule);
          }
          if (mq.matches) {
            return {el: el, scenario: scenarios[i]};
          }
        }
      }

      return false;
    },

    images : function (force_update) {
      if (typeof this.cached_images === 'undefined' || force_update) {
        return this.update_images();
      }

      return this.cached_images;
    },

    update_images : function () {
      var images = document.getElementsByTagName('img'),
          count = images.length,
          loaded_count = 0,
          data_attr = 'data-' + this.settings.load_attr;

      this.cached_images = [];
      this.images_loaded = false;

      for (var i = count - 1; i >= 0; i--) {
        this.loaded($(images[i]), function (image) {
          loaded_count++;
          if (image) {
            var str = image.getAttribute(data_attr) || '';

            if (str.length > 0) {
              this.cached_images.push(image);
            }
          }

          if(loaded_count === count) {
            this.images_loaded = true;
            this.enhance();
          }
        }.bind(this));
      }

      return 'deferred';
    },

    // based on jquery.imageready.js
    // @weblinc, @jsantell, (c) 2012

    loaded : function (image, callback) {
      function loaded () {
        callback(image[0]);
      }

      function bindLoad () {
        this.one('load', loaded);

        if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
          var src = this.attr( 'src' ),
              param = src.match( /\?/ ) ? '&' : '?';

          param += 'random=' + (new Date()).getTime();
          this.attr('src', src + param);
        }
      }

      if (!image.attr('src')) {
        loaded();
        return;
      }

      if (image[0].complete || image[0].readyState === 4) {
        loaded();
      } else {
        bindLoad.call(image);
      }
    },

    enhance : function () {
      var count = this.images().length;

      for (var i = count - 1; i >= 0; i--) {
        this._object($(this.images()[i]));
      }

      return $(window).trigger('resize');
    },

    parse_params : function (path, directive, mq) {
      return [this.trim(path), this.convert_directive(directive), this.trim(mq)];
    },

    convert_directive : function (directive) {
      var trimmed = this.trim(directive);

      if (trimmed.length > 0) {
        return trimmed;
      }

      return 'replace';
    },

    _object : function(el) {
      var raw_arr = this.parse_data_attr(el),
          scenarios = [], count = raw_arr.length;

      if (count > 0) {
        for (var i = count - 1; i >= 0; i--) {
          var split = raw_arr[i].split(/\((.*?)(\))$/);

          if (split.length > 1) {
            var cached_split = split[0].split(','),
                params = this.parse_params(cached_split[0],
                  cached_split[1], split[1]);

            scenarios.push(params);
          }
        }
      }

      return this.store(el, scenarios);
    },

    uuid : function (separator) {
      var delim = separator || "-";

      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }

      return (S4() + S4() + delim + S4() + delim + S4()
        + delim + S4() + delim + S4() + S4() + S4());
    },

    store : function (el, scenarios) {
      var uuid = this.uuid(),
          current_uuid = el.data('uuid');

      if (current_uuid) return this.cache[current_uuid];

      el.attr('data-uuid', uuid);

      return this.cache[uuid] = scenarios;
    },

    trim : function(str) {
      if (typeof str === 'string') {
        return $.trim(str);
      }

      return str;
    },

    parse_data_attr : function (el) {
      var raw = el.data(this.settings.load_attr).split(/\[(.*?)\]/),
          count = raw.length, output = [];

      for (var i = count - 1; i >= 0; i--) {
        if (raw[i].replace(/[\W\d]+/, '').length > 4) {
          output.push(raw[i]);
        }
      }

      return output;
    },

    reflow : function () {
      this.images(true);
    }

  };

}(Foundation.zj, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.joyride = {
    name : 'joyride',

    version : '4.2.2',

    defaults : {
      expose               : false,      // turn on or off the expose feature
      modal                : false,      // Whether to cover page with modal during the tour
      tipLocation          : 'bottom',  // 'top' or 'bottom' in relation to parent
      nubPosition          : 'auto',    // override on a per tooltip bases
      scrollSpeed          : 300,       // Page scrolling speed in milliseconds, 0 = no scroll animation
      timer                : 0,         // 0 = no timer , all other numbers = timer in milliseconds
      startTimerOnClick    : true,      // true or false - true requires clicking the first button start the timer
      startOffset          : 0,         // the index of the tooltip you want to start on (index of the li)
      nextButton           : true,      // true or false to control whether a next button is used
      tipAnimation         : 'fade',    // 'pop' or 'fade' in each tip
      pauseAfter           : [],        // array of indexes where to pause the tour after
      exposed              : [],        // array of expose elements
      tipAnimationFadeSpeed: 300,       // when tipAnimation = 'fade' this is speed in milliseconds for the transition
      cookieMonster        : false,     // true or false to control whether cookies are used
      cookieName           : 'joyride', // Name the cookie you'll use
      cookieDomain         : false,     // Will this cookie be attached to a domain, ie. '.notableapp.com'
      cookieExpires        : 365,       // set when you would like the cookie to expire.
      tipContainer         : 'body',    // Where will the tip be attached
      postRideCallback     : function (){},    // A method to call once the tour closes (canceled or complete)
      postStepCallback     : function (){},    // A method to call after each step
      preStepCallback      : function (){},    // A method to call before each step
      preRideCallback      : function (){},    // A method to call before the tour starts (passed index, tip, and cloned exposed element)
      postExposeCallback   : function (){},    // A method to call after an element has been exposed
      template : { // HTML segments for tip layout
        link    : '<a href="#close" class="joyride-close-tip">&times;</a>',
        timer   : '<div class="joyride-timer-indicator-wrap"><span class="joyride-timer-indicator"></span></div>',
        tip     : '<div class="joyride-tip-guide"><span class="joyride-nub"></span></div>',
        wrapper : '<div class="joyride-content-wrapper"></div>',
        button  : '<a href="#" class="small button joyride-next-tip"></a>',
        modal   : '<div class="joyride-modal-bg"></div>',
        expose  : '<div class="joyride-expose-wrapper"></div>',
        exposeCover: '<div class="joyride-expose-cover"></div>'
      },
      exposeAddClass : '' // One or more space-separated class names to be added to exposed element
    },

    settings : {},

    init : function (scope, method, options) {
      this.scope = scope || this.scope;
      Foundation.inherit(this, 'throttle data_options scrollTo scrollLeft delay');

      if (typeof method === 'object') {
        $.extend(true, this.settings, this.defaults, method);
      } else {
        $.extend(true, this.settings, this.defaults, options);
      }

      if (typeof method !== 'string') {
        if (!this.settings.init) this.events();

        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(this.scope)
        .on('click.joyride', '.joyride-next-tip, .joyride-modal-bg', function (e) {
          e.preventDefault();

          if (this.settings.$li.next().length < 1) {
            this.end();
          } else if (this.settings.timer > 0) {
            clearTimeout(this.settings.automate);
            this.hide();
            this.show();
            this.startTimer();
          } else {
            this.hide();
            this.show();
          }

        }.bind(this))

        .on('click.joyride', '.joyride-close-tip', function (e) {
          e.preventDefault();
          this.end();
        }.bind(this));

      $(window).on('resize.fndtn.joyride', self.throttle(function () {
        if ($('[data-joyride]').length > 0 && self.settings.$next_tip) {
          if (self.settings.exposed.length > 0) {
            var $els = $(self.settings.exposed);

            $els.each(function () {
              var $this = $(this);
              self.un_expose($this);
              self.expose($this);
            });
          }

          if (self.is_phone()) {
            self.pos_phone();
          } else {
            self.pos_default(false, true);
          }
        }
      }, 100));

      this.settings.init = true;
    },

    start : function () {
      var self = this,
          $this = $(this.scope).find('[data-joyride]'),
          integer_settings = ['timer', 'scrollSpeed', 'startOffset', 'tipAnimationFadeSpeed', 'cookieExpires'],
          int_settings_count = integer_settings.length;

      if (!this.settings.init) this.init();

      // non configureable settings
      this.settings.$content_el = $this;
      this.settings.$body = $(this.settings.tipContainer);
      this.settings.body_offset = $(this.settings.tipContainer).position();
      this.settings.$tip_content = this.settings.$content_el.find('> li');
      this.settings.paused = false;
      this.settings.attempts = 0;

      this.settings.tipLocationPatterns = {
        top: ['bottom'],
        bottom: [], // bottom should not need to be repositioned
        left: ['right', 'top', 'bottom'],
        right: ['left', 'top', 'bottom']
      };

      // can we create cookies?
      if (typeof $.cookie !== 'function') {
        this.settings.cookieMonster = false;
      }

      // generate the tips and insert into dom.
      if (!this.settings.cookieMonster || this.settings.cookieMonster && $.cookie(this.settings.cookieName) === null) {
        this.settings.$tip_content.each(function (index) {
          var $this = $(this);
          $.extend(true, self.settings, self.data_options($this));
          // Make sure that settings parsed from data_options are integers where necessary
          for (var i = int_settings_count - 1; i >= 0; i--) {
            self.settings[integer_settings[i]] = parseInt(self.settings[integer_settings[i]], 10);
          }
          self.create({$li : $this, index : index});
        });

        // show first tip
        if (!this.settings.startTimerOnClick && this.settings.timer > 0) {
          this.show('init');
          this.startTimer();
        } else {
          this.show('init');
        }

      }
    },

    resume : function () {
      this.set_li();
      this.show();
    },

    tip_template : function (opts) {
      var $blank, content;

      opts.tip_class = opts.tip_class || '';

      $blank = $(this.settings.template.tip).addClass(opts.tip_class);
      content = $.trim($(opts.li).html()) +
        this.button_text(opts.button_text) +
        this.settings.template.link +
        this.timer_instance(opts.index);

      $blank.append($(this.settings.template.wrapper));
      $blank.first().attr('data-index', opts.index);
      $('.joyride-content-wrapper', $blank).append(content);

      return $blank[0];
    },

    timer_instance : function (index) {
      var txt;

      if ((index === 0 && this.settings.startTimerOnClick && this.settings.timer > 0) || this.settings.timer === 0) {
        txt = '';
      } else {
        txt = this.outerHTML($(this.settings.template.timer)[0]);
      }
      return txt;
    },

    button_text : function (txt) {
      if (this.settings.nextButton) {
        txt = $.trim(txt) || 'Next';
        txt = this.outerHTML($(this.settings.template.button).append(txt)[0]);
      } else {
        txt = '';
      }
      return txt;
    },

    create : function (opts) {
      var buttonText = opts.$li.attr('data-button') || opts.$li.attr('data-text'),
        tipClass = opts.$li.attr('class'),
        $tip_content = $(this.tip_template({
          tip_class : tipClass,
          index : opts.index,
          button_text : buttonText,
          li : opts.$li
        }));

      $(this.settings.tipContainer).append($tip_content);
    },

    show : function (init) {
      var $timer = null;

      // are we paused?
      if (this.settings.$li === undefined
        || ($.inArray(this.settings.$li.index(), this.settings.pauseAfter) === -1)) {

        // don't go to the next li if the tour was paused
        if (this.settings.paused) {
          this.settings.paused = false;
        } else {
          this.set_li(init);
        }

        this.settings.attempts = 0;

        if (this.settings.$li.length && this.settings.$target.length > 0) {
          if (init) { //run when we first start
            this.settings.preRideCallback(this.settings.$li.index(), this.settings.$next_tip);
            if (this.settings.modal) {
              this.show_modal();
            }
          }

          this.settings.preStepCallback(this.settings.$li.index(), this.settings.$next_tip);

          if (this.settings.modal && this.settings.expose) {
            this.expose();
          }

          this.settings.tipSettings = $.extend(this.settings, this.data_options(this.settings.$li));

          this.settings.timer = parseInt(this.settings.timer, 10);

          this.settings.tipSettings.tipLocationPattern = this.settings.tipLocationPatterns[this.settings.tipSettings.tipLocation];

          // scroll if not modal
          if (!/body/i.test(this.settings.$target.selector)) {
            this.scroll_to();
          }

          if (this.is_phone()) {
            this.pos_phone(true);
          } else {
            this.pos_default(true);
          }

          $timer = this.settings.$next_tip.find('.joyride-timer-indicator');

          if (/pop/i.test(this.settings.tipAnimation)) {

            $timer.width(0);

            if (this.settings.timer > 0) {

              this.settings.$next_tip.show();

              this.delay(function () {
                $timer.animate({
                  width: $timer.parent().width()
                }, this.settings.timer, 'linear');
              }.bind(this), this.settings.tipAnimationFadeSpeed);

            } else {
              this.settings.$next_tip.show();

            }


          } else if (/fade/i.test(this.settings.tipAnimation)) {

            $timer.width(0);

            if (this.settings.timer > 0) {

              this.settings.$next_tip
                .fadeIn(this.settings.tipAnimationFadeSpeed)
                .show();

              this.delay(function () {
                $timer.animate({
                  width: $timer.parent().width()
                }, this.settings.timer, 'linear');
              }.bind(this), this.settings.tipAnimationFadeSpeed);

            } else {
              this.settings.$next_tip.fadeIn(this.settings.tipAnimationFadeSpeed);

            }
          }

          this.settings.$current_tip = this.settings.$next_tip;

        // skip non-existant targets
        } else if (this.settings.$li && this.settings.$target.length < 1) {

          this.show();

        } else {

          this.end();

        }
      } else {

        this.settings.paused = true;

      }

    },

    is_phone : function () {
      if (Modernizr) {
        return Modernizr.mq('only screen and (max-width: 767px)') || $('.lt-ie9').length > 0;
      }

      return (this.settings.$window.width() < 767);
    },

    hide : function () {
      if (this.settings.modal && this.settings.expose) {
        this.un_expose();
      }

      if (!this.settings.modal) {
        $('.joyride-modal-bg').hide();
      }

      // Prevent scroll bouncing...wait to remove from layout
      this.settings.$current_tip.css('visibility', 'hidden');
      setTimeout($.proxy(function() {
        this.hide();
        this.css('visibility', 'visible');
      }, this.settings.$current_tip), 0);
      this.settings.postStepCallback(this.settings.$li.index(),
        this.settings.$current_tip);
    },

    set_li : function (init) {
      if (init) {
        this.settings.$li = this.settings.$tip_content.eq(this.settings.startOffset);
        this.set_next_tip();
        this.settings.$current_tip = this.settings.$next_tip;
      } else {
        this.settings.$li = this.settings.$li.next();
        this.set_next_tip();
      }

      this.set_target();
    },

    set_next_tip : function () {
      this.settings.$next_tip = $(".joyride-tip-guide[data-index='" + this.settings.$li.index() + "']");
      this.settings.$next_tip.data('closed', '');
    },

    set_target : function () {
      var cl = this.settings.$li.attr('data-class'),
          id = this.settings.$li.attr('data-id'),
          $sel = function () {
            if (id) {
              return $(document.getElementById(id));
            } else if (cl) {
              return $('.' + cl).first();
            } else {
              return $('body');
            }
          };

      this.settings.$target = $sel();
    },

    scroll_to : function () {
      var window_half, tipOffset;

      window_half = $(window).height() / 2;
      tipOffset = Math.ceil(this.settings.$target.offset().top - window_half + this.outerHeight(this.settings.$next_tip));
      if (tipOffset > 0) {
        this.scrollTo($('html, body'), tipOffset, this.settings.scrollSpeed);
      }
    },

    paused : function () {
      return ($.inArray((this.settings.$li.index() + 1), this.settings.pauseAfter) === -1);
    },

    restart : function () {
      this.hide();
      this.settings.$li = undefined;
      this.show('init');
    },

    pos_default : function (init, resizing) {
      var half_fold = Math.ceil($(window).height() / 2),
          tip_position = this.settings.$next_tip.offset(),
          $nub = this.settings.$next_tip.find('.joyride-nub'),
          nub_width = Math.ceil(this.outerWidth($nub) / 2),
          nub_height = Math.ceil(this.outerHeight($nub) / 2),
          toggle = init || false;

      // tip must not be "display: none" to calculate position
      if (toggle) {
        this.settings.$next_tip.css('visibility', 'hidden');
        this.settings.$next_tip.show();
      }

      if (typeof resizing === 'undefined') {
        resizing = false;
      }

      if (!/body/i.test(this.settings.$target.selector)) {

          if (this.bottom()) {
            var leftOffset = this.settings.$target.offset().left;
            if (Foundation.rtl) {
              leftOffset = this.settings.$target.offset().width - this.settings.$next_tip.width() + leftOffset;
            }
            this.settings.$next_tip.css({
              top: (this.settings.$target.offset().top + nub_height + this.outerHeight(this.settings.$target)),
              left: leftOffset});

            this.nub_position($nub, this.settings.tipSettings.nubPosition, 'top');

          } else if (this.top()) {
            var leftOffset = this.settings.$target.offset().left;
            if (Foundation.rtl) {
              leftOffset = this.settings.$target.offset().width - this.settings.$next_tip.width() + leftOffset;
            }
            this.settings.$next_tip.css({
              top: (this.settings.$target.offset().top - this.outerHeight(this.settings.$next_tip) - nub_height),
              left: leftOffset});

            this.nub_position($nub, this.settings.tipSettings.nubPosition, 'bottom');

          } else if (this.right()) {

            this.settings.$next_tip.css({
              top: this.settings.$target.offset().top,
              left: (this.outerWidth(this.settings.$target) + this.settings.$target.offset().left + nub_width)});

            this.nub_position($nub, this.settings.tipSettings.nubPosition, 'left');

          } else if (this.left()) {

            this.settings.$next_tip.css({
              top: this.settings.$target.offset().top,
              left: (this.settings.$target.offset().left - this.outerWidth(this.settings.$next_tip) - nub_width)});

            this.nub_position($nub, this.settings.tipSettings.nubPosition, 'right');

          }

          if (!this.visible(this.corners(this.settings.$next_tip)) && this.settings.attempts < this.settings.tipSettings.tipLocationPattern.length) {

            $nub.removeClass('bottom')
              .removeClass('top')
              .removeClass('right')
              .removeClass('left');

            this.settings.tipSettings.tipLocation = this.settings.tipSettings.tipLocationPattern[this.settings.attempts];

            this.settings.attempts++;

            this.pos_default();

          }

      } else if (this.settings.$li.length) {

        this.pos_modal($nub);

      }

      if (toggle) {
        this.settings.$next_tip.hide();
        this.settings.$next_tip.css('visibility', 'visible');
      }

    },

    pos_phone : function (init) {
      var tip_height = this.outerHeight(this.settings.$next_tip),
          tip_offset = this.settings.$next_tip.offset(),
          target_height = this.outerHeight(this.settings.$target),
          $nub = $('.joyride-nub', this.settings.$next_tip),
          nub_height = Math.ceil(this.outerHeight($nub) / 2),
          toggle = init || false;

      $nub.removeClass('bottom')
        .removeClass('top')
        .removeClass('right')
        .removeClass('left');

      if (toggle) {
        this.settings.$next_tip.css('visibility', 'hidden');
        this.settings.$next_tip.show();
      }

      if (!/body/i.test(this.settings.$target.selector)) {

        if (this.top()) {

            this.settings.$next_tip.offset({top: this.settings.$target.offset().top - tip_height - nub_height});
            $nub.addClass('bottom');

        } else {

          this.settings.$next_tip.offset({top: this.settings.$target.offset().top + target_height + nub_height});
          $nub.addClass('top');

        }

      } else if (this.settings.$li.length) {
        this.pos_modal($nub);
      }

      if (toggle) {
        this.settings.$next_tip.hide();
        this.settings.$next_tip.css('visibility', 'visible');
      }
    },

    pos_modal : function ($nub) {
      this.center();
      $nub.hide();

      this.show_modal();
    },

    show_modal : function () {
      if (!this.settings.$next_tip.data('closed')) {
        var joyridemodalbg =  $('.joyride-modal-bg');
        if (joyridemodalbg.length < 1) {
          $('body').append(this.settings.template.modal).show();
        }

        if (/pop/i.test(this.settings.tipAnimation)) {
            joyridemodalbg.show();
        } else {
            joyridemodalbg.fadeIn(this.settings.tipAnimationFadeSpeed);
        }
      }
    },

    expose : function () {
      var expose,
          exposeCover,
          el,
          origCSS,
          origClasses,
          randId = 'expose-'+Math.floor(Math.random()*10000);

      if (arguments.length > 0 && arguments[0] instanceof $) {
        el = arguments[0];
      } else if(this.settings.$target && !/body/i.test(this.settings.$target.selector)){
        el = this.settings.$target;
      }  else {
        return false;
      }

      if(el.length < 1){
        if(window.console){
          console.error('element not valid', el);
        }
        return false;
      }

      expose = $(this.settings.template.expose);
      this.settings.$body.append(expose);
      expose.css({
        top: el.offset().top,
        left: el.offset().left,
        width: this.outerWidth(el, true),
        height: this.outerHeight(el, true)
      });

      exposeCover = $(this.settings.template.exposeCover);

      origCSS = {
        zIndex: el.css('z-index'),
        position: el.css('position')
      };
      
      origClasses = el.attr('class') == null ? '' : el.attr('class');

      el.css('z-index',parseInt(expose.css('z-index'))+1);

      if (origCSS.position == 'static') {
        el.css('position','relative');
      }

      el.data('expose-css',origCSS);
      el.data('orig-class', origClasses);
      el.attr('class', origClasses + ' ' + this.settings.exposeAddClass);

      exposeCover.css({
        top: el.offset().top,
        left: el.offset().left,
        width: this.outerWidth(el, true),
        height: this.outerHeight(el, true)
      });

      this.settings.$body.append(exposeCover);
      expose.addClass(randId);
      exposeCover.addClass(randId);
      el.data('expose', randId);
      this.settings.postExposeCallback(this.settings.$li.index(), this.settings.$next_tip, el);
      this.add_exposed(el);
    },

    un_expose : function () {
      var exposeId,
          el,
          expose ,
          origCSS,
          origClasses,
          clearAll = false;

      if (arguments.length > 0 && arguments[0] instanceof $) {
        el = arguments[0];
      } else if(this.settings.$target && !/body/i.test(this.settings.$target.selector)){
        el = this.settings.$target;
      }  else {
        return false;
      }

      if(el.length < 1){
        if (window.console) {
          console.error('element not valid', el);
        }
        return false;
      }

      exposeId = el.data('expose');
      expose = $('.' + exposeId);

      if (arguments.length > 1) {
        clearAll = arguments[1];
      }

      if (clearAll === true) {
        $('.joyride-expose-wrapper,.joyride-expose-cover').remove();
      } else {
        expose.remove();
      }

      origCSS = el.data('expose-css');

      if (origCSS.zIndex == 'auto') {
        el.css('z-index', '');
      } else {
        el.css('z-index', origCSS.zIndex);
      }

      if (origCSS.position != el.css('position')) {
        if(origCSS.position == 'static') {// this is default, no need to set it.
          el.css('position', '');
        } else {
          el.css('position', origCSS.position);
        }
      }
      
      origClasses = el.data('orig-class');
      el.attr('class', origClasses);
      el.removeData('orig-classes');

      el.removeData('expose');
      el.removeData('expose-z-index');
      this.remove_exposed(el);
    },

    add_exposed: function(el){
      this.settings.exposed = this.settings.exposed || [];
      if (el instanceof $ || typeof el === 'object') {
        this.settings.exposed.push(el[0]);
      } else if (typeof el == 'string') {
        this.settings.exposed.push(el);
      }
    },

    remove_exposed: function(el){
      var search, count;
      if (el instanceof $) {
        search = el[0]
      } else if (typeof el == 'string'){
        search = el;
      }

      this.settings.exposed = this.settings.exposed || [];
      count = this.settings.exposed.length;

      for (var i=0; i < count; i++) {
        if (this.settings.exposed[i] == search) {
          this.settings.exposed.splice(i, 1);
          return;
        }
      }
    },

    center : function () {
      var $w = $(window);

      this.settings.$next_tip.css({
        top : ((($w.height() - this.outerHeight(this.settings.$next_tip)) / 2) + $w.scrollTop()),
        left : ((($w.width() - this.outerWidth(this.settings.$next_tip)) / 2) + this.scrollLeft($w))
      });

      return true;
    },

    bottom : function () {
      return /bottom/i.test(this.settings.tipSettings.tipLocation);
    },

    top : function () {
      return /top/i.test(this.settings.tipSettings.tipLocation);
    },

    right : function () {
      return /right/i.test(this.settings.tipSettings.tipLocation);
    },

    left : function () {
      return /left/i.test(this.settings.tipSettings.tipLocation);
    },

    corners : function (el) {
      var w = $(window),
          window_half = w.height() / 2,
          //using this to calculate since scroll may not have finished yet.
          tipOffset = Math.ceil(this.settings.$target.offset().top - window_half + this.settings.$next_tip.outerHeight()),
          right = w.width() + this.scrollLeft(w),
          offsetBottom =  w.height() + tipOffset,
          bottom = w.height() + w.scrollTop(),
          top = w.scrollTop();

      if (tipOffset < top) {
        if (tipOffset < 0) {
          top = 0;
        } else {
          top = tipOffset;
        }
      }

      if (offsetBottom > bottom) {
        bottom = offsetBottom;
      }

      return [
        el.offset().top < top,
        right < el.offset().left + el.outerWidth(),
        bottom < el.offset().top + el.outerHeight(),
        this.scrollLeft(w) > el.offset().left
      ];
    },

    visible : function (hidden_corners) {
      var i = hidden_corners.length;

      while (i--) {
        if (hidden_corners[i]) return false;
      }

      return true;
    },

    nub_position : function (nub, pos, def) {
      if (pos === 'auto') {
        nub.addClass(def);
      } else {
        nub.addClass(pos);
      }
    },

    startTimer : function () {
      if (this.settings.$li.length) {
        this.settings.automate = setTimeout(function () {
          this.hide();
          this.show();
          this.startTimer();
        }.bind(this), this.settings.timer);
      } else {
        clearTimeout(this.settings.automate);
      }
    },

    end : function () {
      if (this.settings.cookieMonster) {
        $.cookie(this.settings.cookieName, 'ridden', { expires: this.settings.cookieExpires, domain: this.settings.cookieDomain });
      }

      if (this.settings.timer > 0) {
        clearTimeout(this.settings.automate);
      }

      if (this.settings.modal && this.settings.expose) {
        this.un_expose();
      }

      this.settings.$next_tip.data('closed', true);

      $('.joyride-modal-bg').hide();
      this.settings.$current_tip.hide();
      this.settings.postStepCallback(this.settings.$li.index(), this.settings.$current_tip);
      this.settings.postRideCallback(this.settings.$li.index(), this.settings.$current_tip);
      $('.joyride-tip-guide').remove();
    },

    outerHTML : function (el) {
      // support FireFox < 11
      return el.outerHTML || new XMLSerializer().serializeToString(el);
    },

    off : function () {
      $(this.scope).off('.joyride');
      $(window).off('.joyride');
      $('.joyride-close-tip, .joyride-next-tip, .joyride-modal-bg').off('.joyride');
      $('.joyride-tip-guide, .joyride-modal-bg').remove();
      clearTimeout(this.settings.automate);
      this.settings = {};
    },

    reflow : function () {}
  };
}(Foundation.zj, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.magellan = {
    name : 'magellan',

    version : '4.2.2',

    settings : {
      activeClass: 'active',
      threshold: 0
    },

    init : function (scope, method, options) {
      this.scope = scope || this.scope;
      Foundation.inherit(this, 'data_options');

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method !== 'string') {
        if (!this.settings.init) {
          this.fixed_magellan = $("[data-magellan-expedition]");
          this.set_threshold();
          this.last_destination = $('[data-magellan-destination]').last();
          this.events();
        }

        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;
      $(this.scope).on('arrival.fndtn.magellan', '[data-magellan-arrival]', function (e) {
        var $destination = $(this),
            $expedition = $destination.closest('[data-magellan-expedition]'),
            activeClass = $expedition.attr('data-magellan-active-class') 
              || self.settings.activeClass;

          $destination
            .closest('[data-magellan-expedition]')
            .find('[data-magellan-arrival]')
            .not($destination)
            .removeClass(activeClass);
          $destination.addClass(activeClass);
      });

      this.fixed_magellan
        .on('update-position.fndtn.magellan', function(){
          var $el = $(this);
          // $el.data("magellan-fixed-position","");
          // $el.data("magellan-top-offset", "");
        })
        .trigger('update-position');

      $(window)
        .on('resize.fndtn.magellan', function() {
          this.fixed_magellan.trigger('update-position');
        }.bind(this))

        .on('scroll.fndtn.magellan', function() {
          var windowScrollTop = $(window).scrollTop();
          self.fixed_magellan.each(function() {
            var $expedition = $(this);
            if (typeof $expedition.data('magellan-top-offset') === 'undefined') {
              $expedition.data('magellan-top-offset', $expedition.offset().top);
            }
            if (typeof $expedition.data('magellan-fixed-position') === 'undefined') {
              $expedition.data('magellan-fixed-position', false)
            }
            var fixed_position = (windowScrollTop + self.settings.threshold) > $expedition.data("magellan-top-offset");
            var attr = $expedition.attr('data-magellan-top-offset');

            if ($expedition.data("magellan-fixed-position") != fixed_position) {
              $expedition.data("magellan-fixed-position", fixed_position);
              if (fixed_position) {
                $expedition.addClass('fixed');
                $expedition.css({position:"fixed", top:0});
              } else {
                $expedition.removeClass('fixed');
                $expedition.css({position:"", top:""});
              }
              if (fixed_position && typeof attr != 'undefined' && attr != false) {
                $expedition.css({position:"fixed", top:attr + "px"});
              }
            }
          });
        });


      if (this.last_destination.length > 0) {
        $(window).on('scroll.fndtn.magellan', function (e) {
          var windowScrollTop = $(window).scrollTop(),
              scrolltopPlusHeight = windowScrollTop + $(window).height(),
              lastDestinationTop = Math.ceil(self.last_destination.offset().top);

          $('[data-magellan-destination]').each(function () {
            var $destination = $(this),
                destination_name = $destination.attr('data-magellan-destination'),
                topOffset = $destination.offset().top - windowScrollTop;

            if (topOffset <= self.settings.threshold) {
              $("[data-magellan-arrival='" + destination_name + "']").trigger('arrival');
            }
            // In large screens we may hit the bottom of the page and dont reach the top of the last magellan-destination, so lets force it
            if (scrolltopPlusHeight >= $(self.scope).height() && lastDestinationTop > windowScrollTop && lastDestinationTop < scrolltopPlusHeight) {
              $('[data-magellan-arrival]').last().trigger('arrival');
            }
          });
        });
      }

      this.settings.init = true;
    },

    set_threshold : function () {
      if (!this.settings.threshold) {
        this.settings.threshold = (this.fixed_magellan.length > 0) ? 
          this.outerHeight(this.fixed_magellan, true) : 0;
      }
    },

    off : function () {
      $(this.scope).off('.fndtn.magellan');
    },

    reflow : function () {}
  };
}(Foundation.zj, this, this.document));
;;(function ($, window, document, undefined) {
  'use strict';

  var noop = function() {};

  var Orbit = function(el, settings) {
    // Don't reinitialize plugin
    if (el.hasClass(settings.slides_container_class)) {
      return this;
    }

    var self = this,
        container,
        slides_container = el,
        number_container,
        bullets_container,
        timer_container,
        idx = 0,
        animate,
        timer,
        locked = false,
        adjust_height_after = false;

    slides_container.children().first().addClass(settings.active_slide_class);

    self.update_slide_number = function(index) {
      if (settings.slide_number) {
        number_container.find('span:first').text(parseInt(index)+1);
        number_container.find('span:last').text(slides_container.children().length);
      }
      if (settings.bullets) {
        bullets_container.children().removeClass(settings.bullets_active_class);
        $(bullets_container.children().get(index)).addClass(settings.bullets_active_class);
      }
    };

    self.build_markup = function() {
      slides_container.wrap('<div class="'+settings.container_class+'"></div>');
      container = slides_container.parent();
      slides_container.addClass(settings.slides_container_class);
      
      if (settings.navigation_arrows) {
        container.append($('<a>').addClass(settings.prev_class).append('<span>'));
        container.append($('<a>').addClass(settings.next_class).append('<span>'));
      }

      if (settings.timer) {
        timer_container = $('<div>').addClass(settings.timer_container_class);
        timer_container.append('<span>');
        timer_container.append($('<div>').addClass(settings.timer_progress_class));
        timer_container.addClass(settings.timer_paused_class);
        container.append(timer_container);
      }

      if (settings.slide_number) {
        number_container = $('<div>').addClass(settings.slide_number_class);
        number_container.append('<span></span> of <span></span>');
        container.append(number_container);
      }

      if (settings.bullets) {
        bullets_container = $('<ol>').addClass(settings.bullets_container_class);
        container.append(bullets_container);
        slides_container.children().each(function(idx, el) {
          var bullet = $('<li>').attr('data-orbit-slide', idx);
          bullets_container.append(bullet);
        });
      }

      if (settings.stack_on_small) {
        container.addClass(settings.stack_on_small_class);
      }

      self.update_slide_number(0);
    };

    self._goto = function(next_idx, start_timer) {
      // if (locked) {return false;}
      if (next_idx === idx) {return false;}
      if (typeof timer === 'object') {timer.restart();}
      var slides = slides_container.children();

      var dir = 'next';
      locked = true;
      if (next_idx < idx) {dir = 'prev';}
      if (next_idx >= slides.length) {next_idx = 0;}
      else if (next_idx < 0) {next_idx = slides.length - 1;}
      
      var current = $(slides.get(idx));
      var next = $(slides.get(next_idx));

      current.css('zIndex', 2);
      next.css('zIndex', 4).addClass('active');

      slides_container.trigger('orbit:before-slide-change');
      settings.before_slide_change();
      
      var callback = function() {
        var unlock = function() {
          idx = next_idx;
          locked = false;
          if (start_timer === true) {timer = self.create_timer(); timer.start();}
          self.update_slide_number(idx);
          slides_container.trigger('orbit:after-slide-change',[{slide_number: idx, total_slides: slides.length}]);
          settings.after_slide_change(idx, slides.length);
        };
        if (slides_container.height() != next.height()) {
          slides_container.animate({'height': next.height()}, 250, 'linear', unlock);
        } else {
          unlock();
        }
      };

      if (slides.length === 1) {callback(); return false;}

      var start_animation = function() {
        if (dir === 'next') {animate.next(current, next, callback);}
        if (dir === 'prev') {animate.prev(current, next, callback);}        
      };

      if (next.height() > slides_container.height()) {
        slides_container.animate({'height': next.height()}, 250, 'linear', start_animation);
      } else {
        start_animation();
      }
    };
    
    self.next = function(e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      self._goto(idx + 1);
    };
    
    self.prev = function(e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      self._goto(idx - 1);
    };

    self.link_custom = function(e) {
      e.preventDefault();
      var link = $(this).attr('data-orbit-link');
      if ((typeof link === 'string') && (link = $.trim(link)) != "") {
        var slide = container.find('[data-orbit-slide='+link+']');
        if (slide.index() != -1) {self._goto(slide.index());}
      }
    };

    self.link_bullet = function(e) {
      var index = $(this).attr('data-orbit-slide');
      if ((typeof index === 'string') && (index = $.trim(index)) != "") {
        self._goto(index);
      }
    }

    self.timer_callback = function() {
      self._goto(idx + 1, true);
    }
    
    self.compute_dimensions = function() {
      var current = $(slides_container.children().get(idx));
      var h = current.height();
      if (!settings.variable_height) {
        slides_container.children().each(function(){
          if ($(this).height() > h) { h = $(this).height(); }
        });
      }
      slides_container.height(h);
    };

    self.create_timer = function() {
      var t = new Timer(
        container.find('.'+settings.timer_container_class), 
        settings, 
        self.timer_callback
      );
      return t;
    };

    self.stop_timer = function() {
      if (typeof timer === 'object') timer.stop();
    };

    self.toggle_timer = function() {
      var t = container.find('.'+settings.timer_container_class);
      if (t.hasClass(settings.timer_paused_class)) {
        if (typeof timer === 'undefined') {timer = self.create_timer();}
        timer.start();     
      }
      else {
        if (typeof timer === 'object') {timer.stop();}
      }
    };

    self.init = function() {
      self.build_markup();
      if (settings.timer) {timer = self.create_timer(); timer.start();}
      animate = new FadeAnimation(slides_container);
      if (settings.animation === 'slide') 
        animate = new SlideAnimation(slides_container);        
      container.on('click', '.'+settings.next_class, self.next);
      container.on('click', '.'+settings.prev_class, self.prev);
      container.on('click', '[data-orbit-slide]', self.link_bullet);
      container.on('click', self.toggle_timer);
      container.on('touchstart.fndtn.orbit', function(e) {
        if (!e.touches) {e = e.originalEvent;}
        var data = {
          start_page_x: e.touches[0].pageX,
          start_page_y: e.touches[0].pageY,
          start_time: (new Date()).getTime(),
          delta_x: 0,
          is_scrolling: undefined
        };
        container.data('swipe-transition', data);
        e.stopPropagation();
      })
      .on('touchmove.fndtn.orbit', function(e) {
        if (!e.touches) { e = e.originalEvent; }
        // Ignore pinch/zoom events
        if(e.touches.length > 1 || e.scale && e.scale !== 1) return;

        var data = container.data('swipe-transition');
        if (typeof data === 'undefined') {data = {};}

        data.delta_x = e.touches[0].pageX - data.start_page_x;

        if ( typeof data.is_scrolling === 'undefined') {
          data.is_scrolling = !!( data.is_scrolling || Math.abs(data.delta_x) < Math.abs(e.touches[0].pageY - data.start_page_y) );
        }

        if (!data.is_scrolling && !data.active) {
          e.preventDefault();
          var direction = (data.delta_x < 0) ? (idx+1) : (idx-1);
          data.active = true;
          self._goto(direction);
        }
      })
      .on('touchend.fndtn.orbit', function(e) {
        container.data('swipe-transition', {});
        e.stopPropagation();
      })
      .on('mouseenter.fndtn.orbit', function(e) {
        if (settings.timer && settings.pause_on_hover) {
          self.stop_timer();
        }
      })
      .on('mouseleave.fndtn.orbit', function(e) {
        if (settings.timer && settings.resume_on_mouseout) {
          timer.start();
        }
      });
      
      $(document).on('click', '[data-orbit-link]', self.link_custom);
      $(window).on('resize', self.compute_dimensions);
      $(window).on('load', self.compute_dimensions);
      slides_container.trigger('orbit:ready');
    };

    self.init();
  };

  var Timer = function(el, settings, callback) {
    var self = this,
        duration = settings.timer_speed,
        progress = el.find('.'+settings.timer_progress_class),
        start, 
        timeout,
        left = -1;

    this.update_progress = function(w) {
      var new_progress = progress.clone();
      new_progress.attr('style', '');
      new_progress.css('width', w+'%');
      progress.replaceWith(new_progress);
      progress = new_progress;
    };

    this.restart = function() {
      clearTimeout(timeout);
      el.addClass(settings.timer_paused_class);
      left = -1;
      self.update_progress(0);
    };

    this.start = function() {
      if (!el.hasClass(settings.timer_paused_class)) {return true;}
      left = (left === -1) ? duration : left;
      el.removeClass(settings.timer_paused_class);
      start = new Date().getTime();
      progress.animate({'width': '100%'}, left, 'linear');
      timeout = setTimeout(function() {
        self.restart();
        callback();
      }, left);
      el.trigger('orbit:timer-started')
    };

    this.stop = function() {
      if (el.hasClass(settings.timer_paused_class)) {return true;}
      clearTimeout(timeout);
      el.addClass(settings.timer_paused_class);
      var end = new Date().getTime();
      left = left - (end - start);
      var w = 100 - ((left / duration) * 100);
      self.update_progress(w);
      el.trigger('orbit:timer-stopped');
    };
  };
  
  var SlideAnimation = function(container) {
    var duration = 400;
    var is_rtl = ($('html[dir=rtl]').length === 1);
    var margin = is_rtl ? 'marginRight' : 'marginLeft';

    this.next = function(current, next, callback) {
      next.animate({margin: '0%'}, duration, 'linear', function() {
        current.css(margin, '100%');
        callback();
      });
    };

    this.prev = function(current, prev, callback) {
      prev.css(margin, '-100%');
      prev.animate({margin:'0%'}, duration, 'linear', function() {
        current.css(margin, '100%');
        callback();
      });
    };
  };

  var FadeAnimation = function(container) {
    var duration = 250;

    this.next = function(current, next, callback) {
      next.css({'marginLeft':'0%', 'opacity':'0.01'});
      next.animate({'opacity':'1'}, duration, 'linear', function() {
        current.css('marginLeft', '100%');
        callback();
      });
    };

    this.prev = function(current, prev, callback) {
      prev.css({'marginLeft':'0%', 'opacity':'0.01'});
      prev.animate({'opacity':'1'}, duration, 'linear', function() {
        current.css('marginLeft', '100%');
        callback();
      });
    };
  };


  Foundation.libs = Foundation.libs || {};

  Foundation.libs.orbit = {
    name: 'orbit',

    version: '4.3.1',

    settings: {
      animation: 'slide',
      timer_speed: 10000,
      pause_on_hover: true,
      resume_on_mouseout: false,
      animation_speed: 500,
      stack_on_small: false,
      navigation_arrows: true,
      slide_number: true,
      container_class: 'orbit-container',
      stack_on_small_class: 'orbit-stack-on-small',
      next_class: 'orbit-next',
      prev_class: 'orbit-prev',
      timer_container_class: 'orbit-timer',
      timer_paused_class: 'paused',
      timer_progress_class: 'orbit-progress',
      slides_container_class: 'orbit-slides-container',
      bullets_container_class: 'orbit-bullets',
      bullets_active_class: 'active',
      slide_number_class: 'orbit-slide-number',
      caption_class: 'orbit-caption',
      active_slide_class: 'active',
      orbit_transition_class: 'orbit-transitioning',
      bullets: true,
      timer: true,
      variable_height: false,
      before_slide_change: noop,
      after_slide_change: noop
    },

    init: function (scope, method, options) {
      var self = this;
      Foundation.inherit(self, 'data_options');

      if (typeof method === 'object') {
        $.extend(true, self.settings, method);
      }

      if ($(scope).is('[data-orbit]')) {
        var $el = $(scope);
        var opts = self.data_options($el);
        new Orbit($el, $.extend({},self.settings, opts));
      }

      $('[data-orbit]', scope).each(function(idx, el) {
        var $el = $(el);
        var opts = self.data_options($el);
        new Orbit($el, $.extend({},self.settings, opts));
      });
    }
  };

    
}(Foundation.zj, this, this.document));
;/*! http://mths.be/placeholder v2.0.7 by @mathias 
	Modified to work with Zepto.js by ZURB
*/
;(function(window, document, $) {

	var isInputSupported = 'placeholder' in document.createElement('input'),
	    isTextareaSupported = 'placeholder' in document.createElement('textarea'),
	    prototype = $.fn,
	    valHooks = $.valHooks,
	    hooks,
	    placeholder;

	if (isInputSupported && isTextareaSupported) {

		placeholder = prototype.placeholder = function() {
			return this;
		};

		placeholder.input = placeholder.textarea = true;

	} else {

		placeholder = prototype.placeholder = function() {
			var $this = this;
			$this
				.filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
				.not('.placeholder')
				.bind({
					'focus.placeholder': clearPlaceholder,
					'blur.placeholder': setPlaceholder
				})
				.data('placeholder-enabled', true)
				.trigger('blur.placeholder');
			return $this;
		};

		placeholder.input = isInputSupported;
		placeholder.textarea = isTextareaSupported;

		hooks = {
			'get': function(element) {
				var $element = $(element);
				return $element.data('placeholder-enabled') && $element.hasClass('placeholder') ? '' : element.value;
			},
			'set': function(element, value) {
				var $element = $(element);
				if (!$element.data('placeholder-enabled')) {
					return element.value = value;
				}
				if (value == '') {
					element.value = value;
					// Issue #56: Setting the placeholder causes problems if the element continues to have focus.
					if (element != document.activeElement) {
						// We can't use `triggerHandler` here because of dummy text/password inputs :(
						setPlaceholder.call(element);
					}
				} else if ($element.hasClass('placeholder')) {
					clearPlaceholder.call(element, true, value) || (element.value = value);
				} else {
					element.value = value;
				}
				// `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
				return $element;
			}
		};

		isInputSupported || (valHooks.input = hooks);
		isTextareaSupported || (valHooks.textarea = hooks);

		$(function() {
			// Look for forms
			$(document).delegate('form', 'submit.placeholder', function() {
				// Clear the placeholder values so they don't get submitted
				var $inputs = $('.placeholder', this).each(clearPlaceholder);
				setTimeout(function() {
					$inputs.each(setPlaceholder);
				}, 10);
			});
		});

		// Clear placeholder values upon page reload
		$(window).bind('beforeunload.placeholder', function() {
			$('.placeholder').each(function() {
				this.value = '';
			});
		});

	}

	function args(elem) {
		// Return an object of element attributes
		var newAttrs = {},
		    rinlinejQuery = /^jQuery\d+$/;
		$.each(elem.attributes, function(i, attr) {
			if (attr.specified && !rinlinejQuery.test(attr.name)) {
				newAttrs[attr.name] = attr.value;
			}
		});
		return newAttrs;
	}

	function clearPlaceholder(event, value) {
		var input = this,
		    $input = $(input);
		if (input.value == $input.attr('placeholder') && $input.hasClass('placeholder')) {
			if ($input.data('placeholder-password')) {
				$input = $input.hide().next().show().attr('id', $input.removeAttr('id').data('placeholder-id'));
				// If `clearPlaceholder` was called from `$.valHooks.input.set`
				if (event === true) {
					return $input[0].value = value;
				}
				$input.focus();
			} else {
				input.value = '';
				$input.removeClass('placeholder');
				input == document.activeElement && input.select();
			}
		}
	}

	function setPlaceholder() {
		var $replacement,
		    input = this,
		    $input = $(input),
		    $origInput = $input,
		    id = this.id;
		if (input.value == '') {
			if (input.type == 'password') {
				if (!$input.data('placeholder-textinput')) {
					try {
						$replacement = $input.clone().attr({ 'type': 'text' });
					} catch(e) {
						$replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
					}
					$replacement
						.removeAttr('name')
						.data({
							'placeholder-password': true,
							'placeholder-id': id
						})
						.bind('focus.placeholder', clearPlaceholder);
					$input
						.data({
							'placeholder-textinput': $replacement,
							'placeholder-id': id
						})
						.before($replacement);
				}
				$input = $input.removeAttr('id').hide().prev().attr('id', id).show();
				// Note: `$input[0] != input` now!
			}
			$input.addClass('placeholder');
			$input[0].value = $input.attr('placeholder');
		} else {
			$input.removeClass('placeholder');
		}
	}

}(this, document, Foundation.zj));

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.placeholder = {
    name : 'placeholder',

    version : '4.2.2',

    init : function (scope, method, options) {
      this.scope = scope || this.scope;

      if (typeof method !== 'string') {
        window.onload = function () {
        	$('input, textarea').placeholder();
        }
      }
    }
  };
}(Foundation.zj, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.reveal = {
    name : 'reveal',

    version : '4.2.2',

    locked : false,

    settings : {
      animation: 'fadeAndPop',
      animationSpeed: 250,
      closeOnBackgroundClick: true,
      closeOnEsc: true,
      dismissModalClass: 'close-reveal-modal',
      bgClass: 'reveal-modal-bg',
      open: function(){},
      opened: function(){},
      close: function(){},
      closed: function(){},
      bg : $('.reveal-modal-bg'),
      css : {
        open : {
          'opacity': 0,
          'visibility': 'visible',
          'display' : 'block'
        },
        close : {
          'opacity': 1,
          'visibility': 'hidden',
          'display': 'none'
        }
      }
    },

    init : function (scope, method, options) {
      Foundation.inherit(this, 'data_options delay');

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      } else if (typeof options !== 'undefined') {
        $.extend(true, this.settings, options);
      }

      if (typeof method !== 'string') {
        this.events();

        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(this.scope)
        .off('.fndtn.reveal')
        .on('click.fndtn.reveal', '[data-reveal-id]', function (e) {
          e.preventDefault();

          if (!self.locked) {
            var element = $(this),
                ajax = element.data('reveal-ajax');

            self.locked = true;

            if (typeof ajax === 'undefined') {
              self.open.call(self, element);
            } else {
              var url = ajax === true ? element.attr('href') : ajax;

              self.open.call(self, element, {url: url});
            }
          }
        })
        .on('click.fndtn.reveal', this.close_targets(), function (e) {
          e.preventDefault();
          if (!self.locked) {
            var settings = $.extend({}, self.settings, self.data_options($('.reveal-modal.open')));
            if ($(e.target)[0] === $('.' + settings.bgClass)[0] && !settings.closeOnBackgroundClick) {
              return;
            }

            self.locked = true;
            self.close.call(self, $(this).closest('.reveal-modal'));
          }
        })
        .on('open.fndtn.reveal', '.reveal-modal', this.settings.open)
        .on('opened.fndtn.reveal', '.reveal-modal', this.settings.opened)
        .on('opened.fndtn.reveal', '.reveal-modal', this.open_video)
        .on('close.fndtn.reveal', '.reveal-modal', this.settings.close)
        .on('closed.fndtn.reveal', '.reveal-modal', this.settings.closed)
        .on('closed.fndtn.reveal', '.reveal-modal', this.close_video);

      $( 'body' ).bind( 'keyup.reveal', function ( event ) {
        var open_modal = $('.reveal-modal.open'),
            settings = $.extend({}, self.settings, self.data_options(open_modal));
        if ( event.which === 27  && settings.closeOnEsc) { // 27 is the keycode for the Escape key
          open_modal.foundation('reveal', 'close');
        }
      });

      return true;
    },

    open : function (target, ajax_settings) {
      if (target) {
        if (typeof target.selector !== 'undefined') {
          var modal = $('#' + target.data('reveal-id'));
        } else {
          var modal = $(this.scope);

          ajax_settings = target;
        }
      } else {
        var modal = $(this.scope);
      }

      if (!modal.hasClass('open')) {
        var open_modal = $('.reveal-modal.open');

        if (typeof modal.data('css-top') === 'undefined') {
          modal.data('css-top', parseInt(modal.css('top'), 10))
            .data('offset', this.cache_offset(modal));
        }

        modal.trigger('open');

        if (open_modal.length < 1) {
          this.toggle_bg(modal);
        }

        if (typeof ajax_settings === 'undefined' || !ajax_settings.url) {
          this.hide(open_modal, this.settings.css.close);
          this.show(modal, this.settings.css.open);
        } else {
          var self = this,
              old_success = typeof ajax_settings.success !== 'undefined' ? ajax_settings.success : null;

          $.extend(ajax_settings, {
            success: function (data, textStatus, jqXHR) {
              if ( $.isFunction(old_success) ) {
                old_success(data, textStatus, jqXHR);
              }

              modal.html(data);
              $(modal).foundation('section', 'reflow');

              self.hide(open_modal, self.settings.css.close);
              self.show(modal, self.settings.css.open);
            }
          });

          $.ajax(ajax_settings);
        }
      }
    },

    close : function (modal) {

      var modal = modal && modal.length ? modal : $(this.scope),
          open_modals = $('.reveal-modal.open');

      if (open_modals.length > 0) {
        this.locked = true;
        modal.trigger('close');
        this.toggle_bg(modal);
        this.hide(open_modals, this.settings.css.close);
      }
    },

    close_targets : function () {
      var base = '.' + this.settings.dismissModalClass;

      if (this.settings.closeOnBackgroundClick) {
        return base + ', .' + this.settings.bgClass;
      }

      return base;
    },

    toggle_bg : function (modal) {
      if ($('.reveal-modal-bg').length === 0) {
        this.settings.bg = $('<div />', {'class': this.settings.bgClass})
          .appendTo('body');
      }

      if (this.settings.bg.filter(':visible').length > 0) {
        this.hide(this.settings.bg);
      } else {
        this.show(this.settings.bg);
      }
    },

    show : function (el, css) {
      // is modal
      if (css) {
        if (/pop/i.test(this.settings.animation)) {
          css.top = $(window).scrollTop() - el.data('offset') + 'px';
          var end_css = {
            top: $(window).scrollTop() + el.data('css-top') + 'px',
            opacity: 1
          };

          return this.delay(function () {
            return el
              .css(css)
              .animate(end_css, this.settings.animationSpeed, 'linear', function () {
                this.locked = false;
                el.trigger('opened');
              }.bind(this))
              .addClass('open');
          }.bind(this), this.settings.animationSpeed / 2);
        }

        if (/fade/i.test(this.settings.animation)) {
          var end_css = {opacity: 1};

          return this.delay(function () {
            return el
              .css(css)
              .animate(end_css, this.settings.animationSpeed, 'linear', function () {
                this.locked = false;
                el.trigger('opened');
              }.bind(this))
              .addClass('open');
          }.bind(this), this.settings.animationSpeed / 2);
        }

        return el.css(css).show().css({opacity: 1}).addClass('open').trigger('opened');
      }

      // should we animate the background?
      if (/fade/i.test(this.settings.animation)) {
        return el.fadeIn(this.settings.animationSpeed / 2);
      }

      return el.show();
    },

    hide : function (el, css) {
      // is modal
      if (css) {
        if (/pop/i.test(this.settings.animation)) {
          var end_css = {
            top: - $(window).scrollTop() - el.data('offset') + 'px',
            opacity: 0
          };

          return this.delay(function () {
            return el
              .animate(end_css, this.settings.animationSpeed, 'linear', function () {
                this.locked = false;
                el.css(css).trigger('closed');
              }.bind(this))
              .removeClass('open');
          }.bind(this), this.settings.animationSpeed / 2);
        }

        if (/fade/i.test(this.settings.animation)) {
          var end_css = {opacity: 0};

          return this.delay(function () {
            return el
              .animate(end_css, this.settings.animationSpeed, 'linear', function () {
                this.locked = false;
                el.css(css).trigger('closed');
              }.bind(this))
              .removeClass('open');
          }.bind(this), this.settings.animationSpeed / 2);
        }

        return el.hide().css(css).removeClass('open').trigger('closed');
      }

      // should we animate the background?
      if (/fade/i.test(this.settings.animation)) {
        return el.fadeOut(this.settings.animationSpeed / 2);
      }

      return el.hide();
    },

    close_video : function (e) {
      var video = $(this).find('.flex-video'),
          iframe = video.find('iframe');

      if (iframe.length > 0) {
        iframe.attr('data-src', iframe[0].src);
        iframe.attr('src', 'about:blank');
        video.hide();
      }
    },

    open_video : function (e) {
      var video = $(this).find('.flex-video'),
          iframe = video.find('iframe');

      if (iframe.length > 0) {
        var data_src = iframe.attr('data-src');
        if (typeof data_src === 'string') {
          iframe[0].src = iframe.attr('data-src');
        } else {
          var src = iframe[0].src;
          iframe[0].src = undefined;
          iframe[0].src = src;
        }
        video.show();
      }
    },

    cache_offset : function (modal) {
      var offset = modal.show().height() + parseInt(modal.css('top'), 10);

      modal.hide();

      return offset;
    },

    off : function () {
      $(this.scope).off('.fndtn.reveal');
    },

    reflow : function () {}
  };
}(Foundation.zj, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

;
(function($, window, document) {
  'use strict';

  Foundation.libs.section = {
    name : 'section',

    version : '4.3.1',

    settings: {
      deep_linking: false,
      small_breakpoint: 768,
      one_up: true,
      section_selector: '[data-section]',
      region_selector: 'section, .section, [data-section-region]',
      title_selector: '.title, [data-section-title]',
      //marker: container is resized
      resized_data_attr: 'data-section-resized',
      //marker: container should apply accordion style
      small_style_data_attr: 'data-section-small-style',
      content_selector: '.content, [data-section-content]',
      nav_selector: '[data-section="vertical-nav"], [data-section="horizontal-nav"]',
      active_class: 'active',
      callback: function() {}
    },

    init: function(scope, method, options) {
      var self = this;
      Foundation.inherit(this, 'throttle data_options position_right offset_right');

      if (typeof method === 'object') {
        $.extend(true, self.settings, method);
      }

      if (typeof method !== 'string') {
        this.events();
        return true;
      } else {
        return this[method].call(this, options);
      }
    },

    events: function() {
      var self = this;

      //combine titles selector from settings for click event binding
      var click_title_selectors = [],
          section_selector = self.settings.section_selector,
          region_selectors = self.settings.region_selector.split(","),
          title_selectors = self.settings.title_selector.split(",");

      for (var i = 0, len = region_selectors.length; i < len; i++) {
        var region_selector = region_selectors[i];

        for (var j = 0, len1 = title_selectors.length; j < len1; j++) {
          var title_selector = section_selector + ">" + region_selector + ">" + title_selectors[j];

          click_title_selectors.push(title_selector + " a"); //or we can not do preventDefault for click event of <a>
          click_title_selectors.push(title_selector);
        }
      }

      $(self.scope)
        .on('click.fndtn.section', click_title_selectors.join(","), function(e) {
          var title = $(this).closest(self.settings.title_selector);

          self.close_navs(title);
          if (title.siblings(self.settings.content_selector).length > 0) {
            self.toggle_active.call(title[0], e);
          }
        });

      $(window)
        .on('resize.fndtn.section', self.throttle(function() { self.resize(); }, 30))
        .on('hashchange.fndtn.section', self.set_active_from_hash);

      $(document).on('click.fndtn.section', function (e) {
        if (e.isPropagationStopped && e.isPropagationStopped()) return;
        if (e.target === document) return;
        self.close_navs($(e.target).closest(self.settings.title_selector));
      });

      $(window).triggerHandler('resize.fndtn.section');
      $(window).triggerHandler('hashchange.fndtn.section');
    },
    
    //close nav !one_up on click elsewhere
    close_navs: function(except_nav_with_title) {
      var self = Foundation.libs.section,
          navsToClose = $(self.settings.nav_selector)
            .filter(function() { return !$.extend({}, 
              self.settings, self.data_options($(this))).one_up; });

      if (except_nav_with_title.length > 0) {
        var section = except_nav_with_title.parent().parent();

        if (self.is_horizontal_nav(section) || self.is_vertical_nav(section)) {
          //exclude current nav from list
          navsToClose = navsToClose.filter(function() { return this !== section[0]; });
        }
      }
      //close navs on click on title
      navsToClose.children(self.settings.region_selector).removeClass(self.settings.active_class);
    },

    toggle_active: function(e) {
      var $this = $(this),
          self = Foundation.libs.section,
          region = $this.parent(),
          content = $this.siblings(self.settings.content_selector),
          section = region.parent(),
          settings = $.extend({}, self.settings, self.data_options(section)),
          prev_active_region = section.children(self.settings.region_selector).filter("." + self.settings.active_class);

      //for anchors inside [data-section-title]
      if (!settings.deep_linking && content.length > 0) {
        e.preventDefault();
      }

      e.stopPropagation(); //do not catch same click again on parent

      if (!region.hasClass(self.settings.active_class)) {
        prev_active_region.removeClass(self.settings.active_class);
        region.addClass(self.settings.active_class);
        //force resize for better performance (do not wait timer)
        self.resize(region.find(self.settings.section_selector).not("[" + self.settings.resized_data_attr + "]"), true);
      } else if (!settings.one_up && (self.small(section) || self.is_vertical_nav(section) || self.is_horizontal_nav(section) || self.is_accordion(section))) {
        region.removeClass(self.settings.active_class);
      }
      settings.callback(section);
    },

    check_resize_timer: null,

    //main function that sets title and content positions; runs for :not(.resized) and :visible once when window width is medium up
    //sections:
    //  selected sections to resize, are defined on resize forced by visibility changes
    //ensure_has_active_region:
    //  is true when we force resize for no resized sections that were hidden and became visible, 
    //  these sections can have no selected region, because all regions were hidden along with section on executing set_active_from_hash
    resize: function(sections, ensure_has_active_region) {

      var self = Foundation.libs.section,
          is_small_window = self.small($(document)),
          //filter for section resize
          should_be_resized = function (section, now_is_hidden) {
            return !self.is_accordion(section) && 
              !section.is("[" + self.settings.resized_data_attr + "]") && 
              (!is_small_window || self.is_horizontal_tabs(section)) && 
              now_is_hidden === (section.css('display') === 'none' || 
              !section.parent().is(':visible'));
          };

      sections = sections || $(self.settings.section_selector);

      clearTimeout(self.check_resize_timer);

      if (!is_small_window) {
        sections.removeAttr(self.settings.small_style_data_attr);
      }

      //resize
      sections.filter(function() { return should_be_resized($(this), false); })
        .each(function() {
          var section = $(this),
            regions = section.children(self.settings.region_selector),
            titles = regions.children(self.settings.title_selector),
            content = regions.children(self.settings.content_selector),
            titles_max_height = 0;

          if (ensure_has_active_region && 
            section.children(self.settings.region_selector).filter("." + self.settings.active_class).length == 0) {
            var settings = $.extend({}, self.settings, self.data_options(section));

            if (!settings.deep_linking && (settings.one_up || !self.is_horizontal_nav(section) &&
              !self.is_vertical_nav(section) && !self.is_accordion(section))) {
                regions.filter(":visible").first().addClass(self.settings.active_class);
            }
          }

          if (self.is_horizontal_tabs(section) || self.is_auto(section)) {
            //    region: position relative
            //    title: position absolute
            //    content: position static
            var titles_sum_width = 0;

            titles.each(function() {
              var title = $(this);

              if (title.is(":visible")) {
                title.css(!self.rtl ? 'left' : 'right', titles_sum_width);
                var title_h_border_width = parseInt(title.css("border-" + (self.rtl ? 'left' : 'right') + "-width"), 10);

                if (title_h_border_width.toString() === 'Nan') {
                  title_h_border_width = 0;
                }

                titles_sum_width += self.outerWidth(title) - title_h_border_width;
                titles_max_height = Math.max(titles_max_height, self.outerHeight(title));
              }
            });
            titles.css('height', titles_max_height);
            regions.each(function() {
              var region = $(this),
                  region_content = region.children(self.settings.content_selector),
                  content_top_border_width = parseInt(region_content.css("border-top-width"), 10);

              if (content_top_border_width.toString() === 'Nan') {
                content_top_border_width = 0;
              }

              region.css('padding-top', titles_max_height - content_top_border_width);
            });

            section.css("min-height", titles_max_height);
          } else if (self.is_horizontal_nav(section)) {
            var first = true;
            //    region: positon relative, float left
            //    title: position static
            //    content: position absolute
            titles.each(function() {
              titles_max_height = Math.max(titles_max_height, self.outerHeight($(this)));
            });

            regions.each(function() {
              var region = $(this);

              region.css("margin-left", "-" + (first ? section : region.children(self.settings.title_selector)).css("border-left-width"));
              first = false;
            });

            regions.css("margin-top", "-" + section.css("border-top-width"));
            titles.css('height', titles_max_height);
            content.css('top', titles_max_height);
            section.css("min-height", titles_max_height);
          } else if (self.is_vertical_tabs(section)) {
            var titles_sum_height = 0;
            //    region: position relative, for .active: fixed padding==title.width
            //    title: fixed width, position absolute
            //    content: position static
            titles.each(function() {
              var title = $(this);

              if (title.is(":visible")) {
                title.css('top', titles_sum_height);
                var title_top_border_width = parseInt(title.css("border-top-width"), 10);

                if (title_top_border_width.toString() === 'Nan') {
                  title_top_border_width = 0;
                }

                titles_sum_height += self.outerHeight(title) - title_top_border_width;
              }
            });

            content.css('min-height', titles_sum_height + 1);
          } else if (self.is_vertical_nav(section)) {
            var titles_max_width = 0,
                first1 = true;
            //    region: positon relative
            //    title: position static
            //    content: position absolute
            titles.each(function() {
              titles_max_width = Math.max(titles_max_width, self.outerWidth($(this)));
            });

            regions.each(function () {
              var region = $(this);

              region.css("margin-top", "-" + (first1 ? section : region.children(self.settings.title_selector)).css("border-top-width"));
              first1 = false;
            });

            titles.css('width', titles_max_width);
            content.css(!self.rtl ? 'left' : 'right', titles_max_width);
            section.css('width', titles_max_width);
          }

          section.attr(self.settings.resized_data_attr, true);
        });

      //wait elements to become visible then resize
      if ($(self.settings.section_selector).filter(function() { return should_be_resized($(this), true); }).length > 0)
        self.check_resize_timer = setTimeout(function() {
          self.resize(sections.filter(function() { return should_be_resized($(this), false); }), true);
        }, 700);

      if (is_small_window) {
        sections.attr(self.settings.small_style_data_attr, true);
      }
    },

    is_vertical_nav: function(el) {
      return /vertical-nav/i.test(el.data('section'));
    },

    is_horizontal_nav: function(el) {
      return /horizontal-nav/i.test(el.data('section'));
    },

    is_accordion: function(el) {
      return /accordion/i.test(el.data('section'));
    },

    is_horizontal_tabs: function(el) {
      return /^tabs$/i.test(el.data('section'));
    },

    is_vertical_tabs: function(el) {
      return /vertical-tabs/i.test(el.data('section'));
    },
    
    is_auto: function (el) {
      var data_section = el.data('section');
      return data_section === '' || /auto/i.test(data_section);
    },

    set_active_from_hash: function() {
      var self = Foundation.libs.section,
          hash = window.location.hash.substring(1),
          sections = $(self.settings.section_selector);

      sections.each(function() {
        var section = $(this),
            settings = $.extend({}, self.settings, self.data_options(section)),
            regions = section.children(self.settings.region_selector),
            set_active_from_hash = settings.deep_linking && hash.length > 0,
            selected = false;

        regions.each(function() {
          var region = $(this);

          if (selected) {
            region.removeClass(self.settings.active_class);
          } else if (set_active_from_hash) {
            var data_slug = region.children(self.settings.content_selector).data('slug');

            if (data_slug && new RegExp(data_slug, 'i').test(hash)) {
              if (!region.hasClass(self.settings.active_class))
                region.addClass(self.settings.active_class);
              selected = true;
            } else {
              region.removeClass(self.settings.active_class);
            }
          } else if (region.hasClass(self.settings.active_class)) {
            selected = true;
          }
        });

        if (!selected && !settings.deep_linking && (settings.one_up || !self.is_horizontal_nav(section) &&
         !self.is_vertical_nav(section) && !self.is_accordion(section)))
          regions.filter(":visible").first().addClass(self.settings.active_class);
      });
    },

    reflow: function() {
      var self = Foundation.libs.section;

      $(self.settings.section_selector).removeAttr(self.settings.resized_data_attr);
      self.throttle(function() { self.resize(); }, 30)();
    },

    small: function(el) {
      var settings = $.extend({}, this.settings, this.data_options(el));

      if (this.is_horizontal_tabs(el)) {
        return false;
      }
      if (el && this.is_accordion(el)) {
        return true;
      }
      if ($('html').hasClass('lt-ie9')) {
        return true;
      }
      if ($('html').hasClass('ie8compat')) {
        return true;
      }
      return $(this.scope).width() < settings.small_breakpoint;
    },

    off: function() {
      $(this.scope).off('.fndtn.section');
      $(window).off('.fndtn.section');
      $(document).off('.fndtn.section');
    }
  };

  //resize selected sections
  $.fn.reflow_section = function(ensure_has_active_region) {
    var section = this,
        self = Foundation.libs.section;

    section.removeAttr(self.settings.resized_data_attr);
    self.throttle(function() { self.resize(section, ensure_has_active_region); }, 30)();
    return this;
  };

}(Foundation.zj, window, document));
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.tooltips = {
    name : 'tooltips',

    version : '4.2.2',

    settings : {
      selector : '.has-tip',
      additionalInheritableClasses : [],
      tooltipClass : '.tooltip',
      appendTo: 'body',
      'disable-for-touch': false,
      tipTemplate : function (selector, content) {
        return '<span data-selector="' + selector + '" class="' 
          + Foundation.libs.tooltips.settings.tooltipClass.substring(1) 
          + '">' + content + '<span class="nub"></span></span>';
      }
    },

    cache : {},

    init : function (scope, method, options) {
      Foundation.inherit(this, 'data_options');
      var self = this;

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      } else if (typeof options !== 'undefined') {
        $.extend(true, this.settings, options);
      }

      if (typeof method !== 'string') {
        if (Modernizr.touch) {
          $(this.scope)
            .on('click.fndtn.tooltip touchstart.fndtn.tooltip touchend.fndtn.tooltip', 
              '[data-tooltip]', function (e) {
              var settings = $.extend({}, self.settings, self.data_options($(this)));
              if (!settings['disable-for-touch']) {
                e.preventDefault();
                $(settings.tooltipClass).hide();
                self.showOrCreateTip($(this));
              }
            })
            .on('click.fndtn.tooltip touchstart.fndtn.tooltip touchend.fndtn.tooltip', 
              this.settings.tooltipClass, function (e) {
              e.preventDefault();
              $(this).fadeOut(150);
            });
        } else {
          $(this.scope)
            .on('mouseenter.fndtn.tooltip mouseleave.fndtn.tooltip', 
              '[data-tooltip]', function (e) {
              var $this = $(this);

              if (/enter|over/i.test(e.type)) {
                self.showOrCreateTip($this);
              } else if (e.type === 'mouseout' || e.type === 'mouseleave') {
                self.hide($this);
              }
            });
        }

        // $(this.scope).data('fndtn-tooltips', true);
      } else {
        return this[method].call(this, options);
      }

    },

    showOrCreateTip : function ($target) {
      var $tip = this.getTip($target);

      if ($tip && $tip.length > 0) {
        return this.show($target);
      }

      return this.create($target);
    },

    getTip : function ($target) {
      var selector = this.selector($target),
          tip = null;

      if (selector) {
        tip = $('span[data-selector="' + selector + '"]' + this.settings.tooltipClass);
      }

      return (typeof tip === 'object') ? tip : false;
    },

    selector : function ($target) {
      var id = $target.attr('id'),
          dataSelector = $target.attr('data-tooltip') || $target.attr('data-selector');

      if ((id && id.length < 1 || !id) && typeof dataSelector != 'string') {
        dataSelector = 'tooltip' + Math.random().toString(36).substring(7);
        $target.attr('data-selector', dataSelector);
      }

      return (id && id.length > 0) ? id : dataSelector;
    },

    create : function ($target) {
      var $tip = $(this.settings.tipTemplate(this.selector($target), $('<div></div>').html($target.attr('title')).html())),
          classes = this.inheritable_classes($target);

      $tip.addClass(classes).appendTo(this.settings.appendTo);
      if (Modernizr.touch) {
        $tip.append('<span class="tap-to-close">tap to close </span>');
      }
      $target.removeAttr('title').attr('title','');
      this.show($target);
    },

    reposition : function (target, tip, classes) {
      var width, nub, nubHeight, nubWidth, column, objPos;

      tip.css('visibility', 'hidden').show();

      width = target.data('width');
      nub = tip.children('.nub');
      nubHeight = this.outerHeight(nub);
      nubWidth = this.outerHeight(nub);

      objPos = function (obj, top, right, bottom, left, width) {
        return obj.css({
          'top' : (top) ? top : 'auto',
          'bottom' : (bottom) ? bottom : 'auto',
          'left' : (left) ? left : 'auto',
          'right' : (right) ? right : 'auto',
          'width' : (width) ? width : 'auto'
        }).end();
      };

      objPos(tip, (target.offset().top + this.outerHeight(target) + 10), 'auto', 'auto', target.offset().left, width);

      if ($(window).width() < 767) {
        objPos(tip, (target.offset().top + this.outerHeight(target) + 10), 'auto', 'auto', 12.5, $(this.scope).width());
        tip.addClass('tip-override');
        objPos(nub, -nubHeight, 'auto', 'auto', target.offset().left);
      } else {
        var left = target.offset().left;
        if (Foundation.rtl) {
          left = target.offset().left + target.offset().width - this.outerWidth(tip);
        }
        objPos(tip, (target.offset().top + this.outerHeight(target) + 10), 'auto', 'auto', left, width);
        tip.removeClass('tip-override');
        if (classes && classes.indexOf('tip-top') > -1) {
          objPos(tip, (target.offset().top - this.outerHeight(tip)), 'auto', 'auto', left, width)
            .removeClass('tip-override');
        } else if (classes && classes.indexOf('tip-left') > -1) {
          objPos(tip, (target.offset().top + (this.outerHeight(target) / 2) - nubHeight*2.5), 'auto', 'auto', (target.offset().left - this.outerWidth(tip) - nubHeight), width)
            .removeClass('tip-override');
        } else if (classes && classes.indexOf('tip-right') > -1) {
          objPos(tip, (target.offset().top + (this.outerHeight(target) / 2) - nubHeight*2.5), 'auto', 'auto', (target.offset().left + this.outerWidth(target) + nubHeight), width)
            .removeClass('tip-override');
        }
      }

      tip.css('visibility', 'visible').hide();
    },

    inheritable_classes : function (target) {
      var inheritables = ['tip-top', 'tip-left', 'tip-bottom', 'tip-right', 'noradius'].concat(this.settings.additionalInheritableClasses),
          classes = target.attr('class'),
          filtered = classes ? $.map(classes.split(' '), function (el, i) {
            if ($.inArray(el, inheritables) !== -1) {
              return el;
            }
          }).join(' ') : '';

      return $.trim(filtered);
    },

    show : function ($target) {
      var $tip = this.getTip($target);

      this.reposition($target, $tip, $target.attr('class'));
      $tip.fadeIn(150);
    },

    hide : function ($target) {
      var $tip = this.getTip($target);

      $tip.fadeOut(150);
    },

    // deprecate reload
    reload : function () {
      var $self = $(this);

      return ($self.data('fndtn-tooltips')) ? $self.foundationTooltips('destroy').foundationTooltips('init') : $self.foundationTooltips('init');
    },

    off : function () {
      $(this.scope).off('.fndtn.tooltip');
      $(this.settings.tooltipClass).each(function (i) {
        $('[data-tooltip]').get(i).attr('title', $(this).text());
      }).remove();
    },

    reflow : function () {}
  };
}(Foundation.zj, this, this.document));
;/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.topbar = {
    name : 'topbar',

    version: '4.3.1',

    settings : {
      index : 0,
      stickyClass : 'sticky',
      custom_back_text: true,
      back_text: 'Back',
      is_hover: true,
      mobile_show_parent_link: true,
      scrolltop : true, // jump to top when sticky nav menu toggle is clicked
      init : false
    },

    init : function (section, method, options) {
      Foundation.inherit(this, 'data_options');
      var self = this;

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      } else if (typeof options !== 'undefined') {
        $.extend(true, this.settings, options);
      }

      if (typeof method !== 'string') {

        $('.top-bar, [data-topbar]').each(function () {
          $.extend(true, self.settings, self.data_options($(this)));
          self.settings.$w = $(window);
          self.settings.$topbar = $(this);
          self.settings.$section = self.settings.$topbar.find('section');
          self.settings.$titlebar = self.settings.$topbar.children('ul').first();
          self.settings.$topbar.data('index', 0);

          var breakpoint = $("<div class='top-bar-js-breakpoint'/>").insertAfter(self.settings.$topbar);
          self.settings.breakPoint = breakpoint.width();
          breakpoint.remove();

          self.assemble();

          if (self.settings.is_hover) {
            self.settings.$topbar.find('.has-dropdown').addClass('not-click');
          }

          if (self.settings.$topbar.parent().hasClass('fixed')) {
            $('body').css('padding-top', self.outerHeight(self.settings.$topbar));
          }
        });

        if (!self.settings.init) {
          this.events();
        }

        return this.settings.init;
      } else {
        // fire method
        return this[method].call(this, options);
      }
    },

    timer : null,

    events : function () {
      var self = this;
      var offst = this.outerHeight($('.top-bar, [data-topbar]'));
      $(this.scope)
        .off('.fndtn.topbar')
        .on('click.fndtn.topbar', '.top-bar .toggle-topbar, [data-topbar] .toggle-topbar', function (e) {
          var topbar = $(this).closest('.top-bar, [data-topbar]'),
              section = topbar.find('section, .section'),
              titlebar = topbar.children('ul').first();

          e.preventDefault();

          if (self.breakpoint()) {
            if (!self.rtl) {
              section.css({left: '0%'});
              section.find('>.name').css({left: '100%'});
            } else {
              section.css({right: '0%'});
              section.find('>.name').css({right: '100%'});
            }

            section.find('li.moved').removeClass('moved');
            topbar.data('index', 0);

            topbar
              .toggleClass('expanded')
              .css('height', '');
          }

          if (!topbar.hasClass('expanded')) {
            if (topbar.hasClass('fixed')) {
              topbar.parent().addClass('fixed');
              topbar.removeClass('fixed');
              $('body').css('padding-top',offst);
            }
          } else if (topbar.parent().hasClass('fixed')) {
            topbar.parent().removeClass('fixed');
            topbar.addClass('fixed');
            $('body').css('padding-top','0');

            if (self.settings.scrolltop) {
              window.scrollTo(0,0);
            }
          }
        })

        .on('click.fndtn.topbar', '.top-bar li.has-dropdown', function (e) {
          if (self.breakpoint()) return;

          var li = $(this),
              target = $(e.target),
              topbar = li.closest('[data-topbar], .top-bar'),
              is_hover = topbar.data('topbar');

          if (self.settings.is_hover && !Modernizr.touch) return;

          e.stopImmediatePropagation();

          if (target[0].nodeName === 'A' && target.parent().hasClass('has-dropdown')) {
            e.preventDefault();
          }

          if (li.hasClass('hover')) {
            li
              .removeClass('hover')
              .find('li')
              .removeClass('hover');
          } else {
            li.addClass('hover');
          }
        })

        .on('click.fndtn.topbar', '.top-bar .has-dropdown>a, [data-topbar] .has-dropdown>a', function (e) {
          if (self.breakpoint()) {
            e.preventDefault();

            var $this = $(this),
                topbar = $this.closest('.top-bar, [data-topbar]'),
                section = topbar.find('section, .section'),
                titlebar = topbar.children('ul').first(),
                dropdownHeight = $this.next('.dropdown').outerHeight(),
                $selectedLi = $this.closest('li');

            topbar.data('index', topbar.data('index') + 1);
            $selectedLi.addClass('moved');

            if (!self.rtl) {
              section.css({left: -(100 * topbar.data('index')) + '%'});
              section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
            } else {
              section.css({right: -(100 * topbar.data('index')) + '%'});
              section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
            }

            topbar.css('height', self.outerHeight($this.siblings('ul'), true) + self.height(titlebar));
          }
        });

      $(window).on('resize.fndtn.topbar', function () {
        if (!self.breakpoint()) {
          $('.top-bar, [data-topbar]')
            .css('height', '')
            .removeClass('expanded')
            .find('li')
            .removeClass('hover');
        }
      }.bind(this));

      $('body').on('click.fndtn.topbar', function (e) {
        var parent = $(e.target).closest('[data-topbar], .top-bar');

        if (parent.length > 0) {
          return;
        }

        $('.top-bar li, [data-topbar] li').removeClass('hover');
      });

      // Go up a level on Click
      $(this.scope).on('click.fndtn', '.top-bar .has-dropdown .back, [data-topbar] .has-dropdown .back', function (e) {
        e.preventDefault();

        var $this = $(this),
            topbar = $this.closest('.top-bar, [data-topbar]'),
            titlebar = topbar.children('ul').first(),
            section = topbar.find('section, .section'),
            $movedLi = $this.closest('li.moved'),
            $previousLevelUl = $movedLi.parent();

        topbar.data('index', topbar.data('index') - 1);

        if (!self.rtl) {
          section.css({left: -(100 * topbar.data('index')) + '%'});
          section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
        } else {
          section.css({right: -(100 * topbar.data('index')) + '%'});
          section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
        }

        if (topbar.data('index') === 0) {
          topbar.css('height', '');
        } else {
          topbar.css('height', self.outerHeight($previousLevelUl, true) + self.height(titlebar));
        }

        setTimeout(function () {
          $movedLi.removeClass('moved');
        }, 300);
      });
    },

    breakpoint : function () {
      return $(document).width() <= this.settings.breakPoint || $('html').hasClass('lt-ie9');
    },

    assemble : function () {
      var self = this;
      // Pull element out of the DOM for manipulation
      this.settings.$section.detach();

      this.settings.$section.find('.has-dropdown>a').each(function () {
        var $link = $(this),
            $dropdown = $link.siblings('.dropdown'),
            url = $link.attr('href');

        if (self.settings.mobile_show_parent_link && url && url.length > 1) {
          var $titleLi = $('<li class="title back js-generated"><h5><a href="#"></a></h5></li><li><a class="parent-link js-generated" href="' + url + '">' + $link.text() +'</a></li>');
        } else {
          var $titleLi = $('<li class="title back js-generated"><h5><a href="#"></a></h5></li>');
        }

        // Copy link to subnav
        if (self.settings.custom_back_text == true) {
          $titleLi.find('h5>a').html('&laquo; ' + self.settings.back_text);
        } else {
          $titleLi.find('h5>a').html('&laquo; ' + $link.html());
        }
        $dropdown.prepend($titleLi);
      });

      // Put element back in the DOM
      this.settings.$section.appendTo(this.settings.$topbar);

      // check for sticky
      this.sticky();
    },

    height : function (ul) {
      var total = 0,
          self = this;

      ul.find('> li').each(function () { total += self.outerHeight($(this), true); });

      return total;
    },

    sticky : function () {
      var klass = '.' + this.settings.stickyClass;
      if ($(klass).length > 0) {
        var distance = $(klass).length ? $(klass).offset().top: 0,
            $window = $(window),
            offst = this.outerHeight($('.top-bar')),
            t_top;

          //Whe resize elements of the page on windows resize. Must recalculate distance
      		$(window).resize(function() {
            clearTimeout(t_top);
      			t_top = setTimeout (function() {
        			distance = $(klass).offset().top;
      			},105);
      		});
          $window.scroll(function() {
            if ($window.scrollTop() > (distance)) {
              $(klass).addClass("fixed");
              $('body').css('padding-top',offst);
            } else if ($window.scrollTop() <= distance) {
              $(klass).removeClass("fixed");
              $('body').css('padding-top','0');
            }
        });
      }
    },

    off : function () {
      $(this.scope).off('.fndtn.topbar');
      $(window).off('.fndtn.topbar');
    },

    reflow : function () {}
  };
}(Foundation.zj, this, this.document));
;/*!
 * VERSION: beta 1.9.8
 * DATE: 2013-06-05
 * UPDATES AND DOCS AT: http://www.greensock.com
 * 
 * Includes all of the following: TweenLite, TweenMax, TimelineLite, TimelineMax, EasePack, CSSPlugin, RoundPropsPlugin, BezierPlugin, AttrPlugin, DirectionalRotationPlugin
 *
 * @license Copyright (c) 2008-2013, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 **/
(window._gsQueue||(window._gsQueue=[])).push(function(){"use strict";window._gsDefine("TweenMax",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=[].slice,r=function(t,e,s){i.call(this,t,e,s),this._cycle=0,this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._dirty=!0},n=function(t){return t.jquery||t.length&&t[0]&&t[0].nodeType&&t[0].style&&!t.nodeType},a=r.prototype=i.to({},.1,{}),o=[];r.version="1.9.8",a.constructor=r,a.kill()._gc=!1,r.killTweensOf=r.killDelayedCallsTo=i.killTweensOf,r.getTweensOf=i.getTweensOf,r.ticker=i.ticker,a.invalidate=function(){return this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._uncache(!0),i.prototype.invalidate.call(this)},a.updateTo=function(t,e){var s,r=this.ratio;e&&this.timeline&&this._startTime<this._timeline._time&&(this._startTime=this._timeline._time,this._uncache(!1),this._gc?this._enabled(!0,!1):this._timeline.insert(this,this._startTime-this._delay));for(s in t)this.vars[s]=t[s];if(this._initted)if(e)this._initted=!1;else if(this._notifyPluginsOfEnabled&&this._firstPT&&i._onPluginEvent("_onDisable",this),this._time/this._duration>.998){var n=this._time;this.render(0,!0,!1),this._initted=!1,this.render(n,!0,!1)}else if(this._time>0){this._initted=!1,this._init();for(var a,o=1/(1-r),h=this._firstPT;h;)a=h.s+h.c,h.c*=o,h.s=a-h.c,h=h._next}return this},a.render=function(t,e,i){var s,r,n,a,h,l,_,u=this._dirty?this.totalDuration():this._totalDuration,p=this._time,f=this._totalTime,c=this._cycle;if(t>=u?(this._totalTime=u,this._cycle=this._repeat,this._yoyo&&0!==(1&this._cycle)?(this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0):(this._time=this._duration,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1),this._reversed||(s=!0,r="onComplete"),0===this._duration&&((0===t||0>this._rawPrevTime)&&this._rawPrevTime!==t&&(i=!0,this._rawPrevTime>0&&(r="onReverseComplete",e&&(t=-1))),this._rawPrevTime=t)):1e-7>t?(this._totalTime=this._time=this._cycle=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==f||0===this._duration&&this._rawPrevTime>0)&&(r="onReverseComplete",s=this._reversed),0>t?(this._active=!1,0===this._duration&&(this._rawPrevTime>=0&&(i=!0),this._rawPrevTime=t)):this._initted||(i=!0)):(this._totalTime=this._time=t,0!==this._repeat&&(a=this._duration+this._repeatDelay,this._cycle=this._totalTime/a>>0,0!==this._cycle&&this._cycle===this._totalTime/a&&this._cycle--,this._time=this._totalTime-this._cycle*a,this._yoyo&&0!==(1&this._cycle)&&(this._time=this._duration-this._time),this._time>this._duration?this._time=this._duration:0>this._time&&(this._time=0)),this._easeType?(h=this._time/this._duration,l=this._easeType,_=this._easePower,(1===l||3===l&&h>=.5)&&(h=1-h),3===l&&(h*=2),1===_?h*=h:2===_?h*=h*h:3===_?h*=h*h*h:4===_&&(h*=h*h*h*h),this.ratio=1===l?1-h:2===l?h:.5>this._time/this._duration?h/2:1-h/2):this.ratio=this._ease.getRatio(this._time/this._duration)),p===this._time&&!i)return f!==this._totalTime&&this._onUpdate&&(e||this._onUpdate.apply(this.vars.onUpdateScope||this,this.vars.onUpdateParams||o)),void 0;if(!this._initted){if(this._init(),!this._initted)return;this._time&&!s?this.ratio=this._ease.getRatio(this._time/this._duration):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._active||this._paused||(this._active=!0),0===f&&(this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._totalTime||0===this._duration)&&(e||this.vars.onStart.apply(this.vars.onStartScope||this,this.vars.onStartParams||o))),n=this._firstPT;n;)n.f?n.t[n.p](n.c*this.ratio+n.s):n.t[n.p]=n.c*this.ratio+n.s,n=n._next;this._onUpdate&&(0>t&&this._startAt&&this._startAt.render(t,e,i),e||this._onUpdate.apply(this.vars.onUpdateScope||this,this.vars.onUpdateParams||o)),this._cycle!==c&&(e||this._gc||this.vars.onRepeat&&this.vars.onRepeat.apply(this.vars.onRepeatScope||this,this.vars.onRepeatParams||o)),r&&(this._gc||(0>t&&this._startAt&&!this._onUpdate&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this.vars[r].apply(this.vars[r+"Scope"]||this,this.vars[r+"Params"]||o)))},r.to=function(t,e,i){return new r(t,e,i)},r.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new r(t,e,i)},r.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new r(t,e,s)},r.staggerTo=r.allTo=function(t,e,a,h,l,_,u){h=h||0;var p,f,c,m,d=a.delay||0,g=[],v=function(){a.onComplete&&a.onComplete.apply(a.onCompleteScope||this,a.onCompleteParams||o),l.apply(u||this,_||o)};for(t instanceof Array||("string"==typeof t&&(t=i.selector(t)||t),n(t)&&(t=s.call(t,0))),p=t.length,c=0;p>c;c++){f={};for(m in a)f[m]=a[m];f.delay=d,c===p-1&&l&&(f.onComplete=v),g[c]=new r(t[c],e,f),d+=h}return g},r.staggerFrom=r.allFrom=function(t,e,i,s,n,a,o){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,r.staggerTo(t,e,i,s,n,a,o)},r.staggerFromTo=r.allFromTo=function(t,e,i,s,n,a,o,h){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,r.staggerTo(t,e,s,n,a,o,h)},r.delayedCall=function(t,e,i,s,n){return new r(e,0,{delay:t,onComplete:e,onCompleteParams:i,onCompleteScope:s,onReverseComplete:e,onReverseCompleteParams:i,onReverseCompleteScope:s,immediateRender:!1,useFrames:n,overwrite:0})},r.set=function(t,e){return new r(t,0,e)},r.isTweening=function(t){for(var e,s=i.getTweensOf(t),r=s.length;--r>-1;)if(e=s[r],e._active||e._startTime===e._timeline._time&&e._timeline._active)return!0;return!1};var h=function(t,e){for(var s=[],r=0,n=t._first;n;)n instanceof i?s[r++]=n:(e&&(s[r++]=n),s=s.concat(h(n,e)),r=s.length),n=n._next;return s},l=r.getAllTweens=function(e){return h(t._rootTimeline,e).concat(h(t._rootFramesTimeline,e))};r.killAll=function(t,i,s,r){null==i&&(i=!0),null==s&&(s=!0);var n,a,o,h=l(0!=r),_=h.length,u=i&&s&&r;for(o=0;_>o;o++)a=h[o],(u||a instanceof e||(n=a.target===a.vars.onComplete)&&s||i&&!n)&&(t?a.totalTime(a.totalDuration()):a._enabled(!1,!1))},r.killChildTweensOf=function(t,e){if(null!=t){var a,o,h,l,_,u=i._tweenLookup;if("string"==typeof t&&(t=i.selector(t)||t),n(t)&&(t=s(t,0)),t instanceof Array)for(l=t.length;--l>-1;)r.killChildTweensOf(t[l],e);else{a=[];for(h in u)for(o=u[h].target.parentNode;o;)o===t&&(a=a.concat(u[h].tweens)),o=o.parentNode;for(_=a.length,l=0;_>l;l++)e&&a[l].totalTime(a[l].totalDuration()),a[l]._enabled(!1,!1)}}};var _=function(t,i,s,r){void 0===i&&(i=!0),void 0===s&&(s=!0);for(var n,a,o=l(r),h=i&&s&&r,_=o.length;--_>-1;)a=o[_],(h||a instanceof e||(n=a.target===a.vars.onComplete)&&s||i&&!n)&&a.paused(t)};return r.pauseAll=function(t,e,i){_(!0,t,e,i)},r.resumeAll=function(t,e,i){_(!1,t,e,i)},a.progress=function(t){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&0!==(1&this._cycle)?1-t:t)+this._cycle*(this._duration+this._repeatDelay),!1):this._time/this.duration()},a.totalProgress=function(t){return arguments.length?this.totalTime(this.totalDuration()*t,!1):this._totalTime/this.totalDuration()},a.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),t>this._duration&&(t=this._duration),this._yoyo&&0!==(1&this._cycle)?t=this._duration-t+this._cycle*(this._duration+this._repeatDelay):0!==this._repeat&&(t+=this._cycle*(this._duration+this._repeatDelay)),this.totalTime(t,e)):this._time},a.duration=function(e){return arguments.length?t.prototype.duration.call(this,e):this._duration},a.totalDuration=function(t){return arguments.length?-1===this._repeat?this:this.duration((t-this._repeat*this._repeatDelay)/(this._repeat+1)):(this._dirty&&(this._totalDuration=-1===this._repeat?999999999999:this._duration*(this._repeat+1)+this._repeatDelay*this._repeat,this._dirty=!1),this._totalDuration)},a.repeat=function(t){return arguments.length?(this._repeat=t,this._uncache(!0)):this._repeat},a.repeatDelay=function(t){return arguments.length?(this._repeatDelay=t,this._uncache(!0)):this._repeatDelay},a.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},r},!0),window._gsDefine("TimelineLite",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){e.call(this,t),this._labels={},this.autoRemoveChildren=this.vars.autoRemoveChildren===!0,this.smoothChildTiming=this.vars.smoothChildTiming===!0,this._sortChildren=!0,this._onUpdate=this.vars.onUpdate;for(var i,s,n=this.vars,a=r.length;--a>-1;)if(s=n[r[a]])for(i=s.length;--i>-1;)"{self}"===s[i]&&(s=n[r[a]]=s.concat(),s[i]=this);n.tweens instanceof Array&&this.add(n.tweens,0,n.align,n.stagger)},r=["onStartParams","onUpdateParams","onCompleteParams","onReverseCompleteParams","onRepeatParams"],n=[],a=function(t){var e,i={};for(e in t)i[e]=t[e];return i},o=n.slice,h=s.prototype=new e;return s.version="1.9.8",h.constructor=s,h.kill()._gc=!1,h.to=function(t,e,s,r){return e?this.add(new i(t,e,s),r):this.set(t,s,r)},h.from=function(t,e,s,r){return this.add(i.from(t,e,s),r)},h.fromTo=function(t,e,s,r,n){return e?this.add(i.fromTo(t,e,s,r),n):this.set(t,r,n)},h.staggerTo=function(t,e,r,n,h,l,_,u){var p,f=new s({onComplete:l,onCompleteParams:_,onCompleteScope:u});for("string"==typeof t&&(t=i.selector(t)||t),!(t instanceof Array)&&t.length&&t[0]&&t[0].nodeType&&t[0].style&&(t=o.call(t,0)),n=n||0,p=0;t.length>p;p++)r.startAt&&(r.startAt=a(r.startAt)),f.to(t[p],e,a(r),p*n);return this.add(f,h)},h.staggerFrom=function(t,e,i,s,r,n,a,o){return i.immediateRender=0!=i.immediateRender,i.runBackwards=!0,this.staggerTo(t,e,i,s,r,n,a,o)},h.staggerFromTo=function(t,e,i,s,r,n,a,o,h){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,this.staggerTo(t,e,s,r,n,a,o,h)},h.call=function(t,e,s,r){return this.add(i.delayedCall(0,t,e,s),r)},h.set=function(t,e,s){return s=this._parseTimeOrLabel(s,0,!0),null==e.immediateRender&&(e.immediateRender=s===this._time&&!this._paused),this.add(new i(t,0,e),s)},s.exportRoot=function(t,e){t=t||{},null==t.smoothChildTiming&&(t.smoothChildTiming=!0);var r,n,a=new s(t),o=a._timeline;for(null==e&&(e=!0),o._remove(a,!0),a._startTime=0,a._rawPrevTime=a._time=a._totalTime=o._time,r=o._first;r;)n=r._next,e&&r instanceof i&&r.target===r.vars.onComplete||a.add(r,r._startTime-r._delay),r=n;return o.add(a,0),a},h.add=function(r,n,a,o){var h,l,_,u,p;if("number"!=typeof n&&(n=this._parseTimeOrLabel(n,0,!0,r)),!(r instanceof t)){if(r instanceof Array){for(a=a||"normal",o=o||0,h=n,l=r.length,_=0;l>_;_++)(u=r[_])instanceof Array&&(u=new s({tweens:u})),this.add(u,h),"string"!=typeof u&&"function"!=typeof u&&("sequence"===a?h=u._startTime+u.totalDuration()/u._timeScale:"start"===a&&(u._startTime-=u.delay())),h+=o;return this._uncache(!0)}if("string"==typeof r)return this.addLabel(r,n);if("function"!=typeof r)throw"Cannot add "+r+" into the timeline; it is neither a tween, timeline, function, nor a string.";r=i.delayedCall(0,r)}if(e.prototype.add.call(this,r,n),this._gc&&!this._paused&&this._time===this._duration&&this._time<this.duration())for(p=this;p._gc&&p._timeline;)p._timeline.smoothChildTiming?p.totalTime(p._totalTime,!0):p._enabled(!0,!1),p=p._timeline;return this},h.remove=function(e){if(e instanceof t)return this._remove(e,!1);if(e instanceof Array){for(var i=e.length;--i>-1;)this.remove(e[i]);return this}return"string"==typeof e?this.removeLabel(e):this.kill(null,e)},h._remove=function(t,i){return e.prototype._remove.call(this,t,i),this._last?this._time>this._last._startTime&&(this._time=this.duration(),this._totalTime=this._totalDuration):this._time=this._totalTime=0,this},h.append=function(t,e){return this.add(t,this._parseTimeOrLabel(null,e,!0,t))},h.insert=h.insertMultiple=function(t,e,i,s){return this.add(t,e||0,i,s)},h.appendMultiple=function(t,e,i,s){return this.add(t,this._parseTimeOrLabel(null,e,!0,t),i,s)},h.addLabel=function(t,e){return this._labels[t]=this._parseTimeOrLabel(e),this},h.removeLabel=function(t){return delete this._labels[t],this},h.getLabelTime=function(t){return null!=this._labels[t]?this._labels[t]:-1},h._parseTimeOrLabel=function(e,i,s,r){var n;if(r instanceof t&&r.timeline===this)this.remove(r);else if(r instanceof Array)for(n=r.length;--n>-1;)r[n]instanceof t&&r[n].timeline===this&&this.remove(r[n]);if("string"==typeof i)return this._parseTimeOrLabel(i,s&&"number"==typeof e&&null==this._labels[i]?e-this.duration():0,s);if(i=i||0,"string"!=typeof e||!isNaN(e)&&null==this._labels[e])null==e&&(e=this.duration());else{if(n=e.indexOf("="),-1===n)return null==this._labels[e]?s?this._labels[e]=this.duration()+i:i:this._labels[e]+i;i=parseInt(e.charAt(n-1)+"1",10)*Number(e.substr(n+1)),e=n>1?this._parseTimeOrLabel(e.substr(0,n-1),0,s):this.duration()}return Number(e)+i},h.seek=function(t,e){return this.totalTime("number"==typeof t?t:this._parseTimeOrLabel(t),e!==!1)},h.stop=function(){return this.paused(!0)},h.gotoAndPlay=function(t,e){return this.play(t,e)},h.gotoAndStop=function(t,e){return this.pause(t,e)},h.render=function(t,e,i){this._gc&&this._enabled(!0,!1),this._active=!this._paused;var s,r,a,o,h,l=this._dirty?this.totalDuration():this._totalDuration,_=this._time,u=this._startTime,p=this._timeScale,f=this._paused;if(t>=l?(this._totalTime=this._time=l,this._reversed||this._hasPausedChild()||(r=!0,o="onComplete",0===this._duration&&(0===t||0>this._rawPrevTime)&&this._rawPrevTime!==t&&this._first&&(h=!0,this._rawPrevTime>0&&(o="onReverseComplete"))),this._rawPrevTime=t,t=l+1e-6):1e-7>t?(this._totalTime=this._time=0,(0!==_||0===this._duration&&this._rawPrevTime>0)&&(o="onReverseComplete",r=this._reversed),0>t?(this._active=!1,0===this._duration&&this._rawPrevTime>=0&&this._first&&(h=!0)):this._initted||(h=!0),this._rawPrevTime=t,t=0):this._totalTime=this._time=this._rawPrevTime=t,this._time!==_&&this._first||i||h){if(this._initted||(this._initted=!0),0===_&&this.vars.onStart&&0!==this._time&&(e||this.vars.onStart.apply(this.vars.onStartScope||this,this.vars.onStartParams||n)),this._time>=_)for(s=this._first;s&&(a=s._next,!this._paused||f);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;else for(s=this._last;s&&(a=s._prev,!this._paused||f);)(s._active||_>=s._startTime&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;this._onUpdate&&(e||this._onUpdate.apply(this.vars.onUpdateScope||this,this.vars.onUpdateParams||n)),o&&(this._gc||(u===this._startTime||p!==this._timeScale)&&(0===this._time||l>=this.totalDuration())&&(r&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[o]&&this.vars[o].apply(this.vars[o+"Scope"]||this,this.vars[o+"Params"]||n)))}},h._hasPausedChild=function(){for(var t=this._first;t;){if(t._paused||t instanceof s&&t._hasPausedChild())return!0;t=t._next}return!1},h.getChildren=function(t,e,s,r){r=r||-9999999999;for(var n=[],a=this._first,o=0;a;)r>a._startTime||(a instanceof i?e!==!1&&(n[o++]=a):(s!==!1&&(n[o++]=a),t!==!1&&(n=n.concat(a.getChildren(!0,e,s)),o=n.length))),a=a._next;return n},h.getTweensOf=function(t,e){for(var s=i.getTweensOf(t),r=s.length,n=[],a=0;--r>-1;)(s[r].timeline===this||e&&this._contains(s[r]))&&(n[a++]=s[r]);return n},h._contains=function(t){for(var e=t.timeline;e;){if(e===this)return!0;e=e.timeline}return!1},h.shiftChildren=function(t,e,i){i=i||0;for(var s,r=this._first,n=this._labels;r;)r._startTime>=i&&(r._startTime+=t),r=r._next;if(e)for(s in n)n[s]>=i&&(n[s]+=t);return this._uncache(!0)},h._kill=function(t,e){if(!t&&!e)return this._enabled(!1,!1);for(var i=e?this.getTweensOf(e):this.getChildren(!0,!0,!1),s=i.length,r=!1;--s>-1;)i[s]._kill(t,e)&&(r=!0);return r},h.clear=function(t){var e=this.getChildren(!1,!0,!0),i=e.length;for(this._time=this._totalTime=0;--i>-1;)e[i]._enabled(!1,!1);return t!==!1&&(this._labels={}),this._uncache(!0)},h.invalidate=function(){for(var t=this._first;t;)t.invalidate(),t=t._next;return this},h._enabled=function(t,i){if(t===this._gc)for(var s=this._first;s;)s._enabled(t,!0),s=s._next;return e.prototype._enabled.call(this,t,i)},h.progress=function(t){return arguments.length?this.totalTime(this.duration()*t,!1):this._time/this.duration()},h.duration=function(t){return arguments.length?(0!==this.duration()&&0!==t&&this.timeScale(this._duration/t),this):(this._dirty&&this.totalDuration(),this._duration)},h.totalDuration=function(t){if(!arguments.length){if(this._dirty){for(var e,i,s=0,r=this._last,n=999999999999;r;)e=r._prev,r._dirty&&r.totalDuration(),r._startTime>n&&this._sortChildren&&!r._paused?this.add(r,r._startTime-r._delay):n=r._startTime,0>r._startTime&&!r._paused&&(s-=r._startTime,this._timeline.smoothChildTiming&&(this._startTime+=r._startTime/this._timeScale),this.shiftChildren(-r._startTime,!1,-9999999999),n=0),i=r._startTime+r._totalDuration/r._timeScale,i>s&&(s=i),r=e;this._duration=this._totalDuration=s,this._dirty=!1}return this._totalDuration}return 0!==this.totalDuration()&&0!==t&&this.timeScale(this._totalDuration/t),this},h.usesFrames=function(){for(var e=this._timeline;e._timeline;)e=e._timeline;return e===t._rootFramesTimeline},h.rawTime=function(){return this._paused||0!==this._totalTime&&this._totalTime!==this._totalDuration?this._totalTime:(this._timeline.rawTime()-this._startTime)*this._timeScale},s},!0),window._gsDefine("TimelineMax",["TimelineLite","TweenLite","easing.Ease"],function(t,e,i){var s=function(e){t.call(this,e),this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._cycle=0,this._yoyo=this.vars.yoyo===!0,this._dirty=!0},r=[],n=new i(null,null,1,0),a=function(t){for(;t;){if(t._paused)return!0;t=t._timeline}return!1},o=s.prototype=new t;return o.constructor=s,o.kill()._gc=!1,s.version="1.9.8",o.invalidate=function(){return this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._uncache(!0),t.prototype.invalidate.call(this)},o.addCallback=function(t,i,s,r){return this.add(e.delayedCall(0,t,s,r),i)},o.removeCallback=function(t,e){if(t)if(null==e)this._kill(null,t);else for(var i=this.getTweensOf(t,!1),s=i.length,r=this._parseTimeOrLabel(e);--s>-1;)i[s]._startTime===r&&i[s]._enabled(!1,!1);return this},o.tweenTo=function(t,i){i=i||{};var s,a,o={ease:n,overwrite:2,useFrames:this.usesFrames(),immediateRender:!1};for(s in i)o[s]=i[s];return o.time=this._parseTimeOrLabel(t),a=new e(this,Math.abs(Number(o.time)-this._time)/this._timeScale||.001,o),o.onStart=function(){a.target.paused(!0),a.vars.time!==a.target.time()&&a.duration(Math.abs(a.vars.time-a.target.time())/a.target._timeScale),i.onStart&&i.onStart.apply(i.onStartScope||a,i.onStartParams||r)},a},o.tweenFromTo=function(t,e,i){i=i||{},t=this._parseTimeOrLabel(t),i.startAt={onComplete:this.seek,onCompleteParams:[t],onCompleteScope:this},i.immediateRender=i.immediateRender!==!1;var s=this.tweenTo(e,i);return s.duration(Math.abs(s.vars.time-t)/this._timeScale||.001)},o.render=function(t,e,i){this._gc&&this._enabled(!0,!1),this._active=!this._paused;var s,n,a,o,h,l,_=this._dirty?this.totalDuration():this._totalDuration,u=this._duration,p=this._time,f=this._totalTime,c=this._startTime,m=this._timeScale,d=this._rawPrevTime,g=this._paused,v=this._cycle;if(t>=_?(this._locked||(this._totalTime=_,this._cycle=this._repeat),this._reversed||this._hasPausedChild()||(n=!0,o="onComplete",0===u&&(0===t||0>this._rawPrevTime)&&this._rawPrevTime!==t&&this._first&&(h=!0,this._rawPrevTime>0&&(o="onReverseComplete"))),this._rawPrevTime=t,this._yoyo&&0!==(1&this._cycle)?this._time=t=0:(this._time=u,t=u+1e-6)):1e-7>t?(this._locked||(this._totalTime=this._cycle=0),this._time=0,(0!==p||0===u&&this._rawPrevTime>0&&!this._locked)&&(o="onReverseComplete",n=this._reversed),0>t?(this._active=!1,0===u&&this._rawPrevTime>=0&&this._first&&(h=!0)):this._initted||(h=!0),this._rawPrevTime=t,t=0):(this._time=this._rawPrevTime=t,this._locked||(this._totalTime=t,0!==this._repeat&&(l=u+this._repeatDelay,this._cycle=this._totalTime/l>>0,0!==this._cycle&&this._cycle===this._totalTime/l&&this._cycle--,this._time=this._totalTime-this._cycle*l,this._yoyo&&0!==(1&this._cycle)&&(this._time=u-this._time),this._time>u?(this._time=u,t=u+1e-6):0>this._time?this._time=t=0:t=this._time))),this._cycle!==v&&!this._locked){var y=this._yoyo&&0!==(1&v),T=y===(this._yoyo&&0!==(1&this._cycle)),w=this._totalTime,x=this._cycle,b=this._rawPrevTime,P=this._time;if(this._totalTime=v*u,v>this._cycle?y=!y:this._totalTime+=u,this._time=p,this._rawPrevTime=0===u?d-1e-5:d,this._cycle=v,this._locked=!0,p=y?0:u,this.render(p,e,0===u),e||this._gc||this.vars.onRepeat&&this.vars.onRepeat.apply(this.vars.onRepeatScope||this,this.vars.onRepeatParams||r),T&&(p=y?u+1e-6:-1e-6,this.render(p,!0,!1)),this._locked=!1,this._paused&&!g)return;this._time=P,this._totalTime=w,this._cycle=x,this._rawPrevTime=b}if(!(this._time!==p&&this._first||i||h))return f!==this._totalTime&&this._onUpdate&&(e||this._onUpdate.apply(this.vars.onUpdateScope||this,this.vars.onUpdateParams||r)),void 0;if(this._initted||(this._initted=!0),0===f&&this.vars.onStart&&0!==this._totalTime&&(e||this.vars.onStart.apply(this.vars.onStartScope||this,this.vars.onStartParams||r)),this._time>=p)for(s=this._first;s&&(a=s._next,!this._paused||g);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;else for(s=this._last;s&&(a=s._prev,!this._paused||g);)(s._active||p>=s._startTime&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;this._onUpdate&&(e||this._onUpdate.apply(this.vars.onUpdateScope||this,this.vars.onUpdateParams||r)),o&&(this._locked||this._gc||(c===this._startTime||m!==this._timeScale)&&(0===this._time||_>=this.totalDuration())&&(n&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[o]&&this.vars[o].apply(this.vars[o+"Scope"]||this,this.vars[o+"Params"]||r)))},o.getActive=function(t,e,i){null==t&&(t=!0),null==e&&(e=!0),null==i&&(i=!1);var s,r,n=[],o=this.getChildren(t,e,i),h=0,l=o.length;for(s=0;l>s;s++)r=o[s],r._paused||r._timeline._time>=r._startTime&&r._timeline._time<r._startTime+r._totalDuration/r._timeScale&&(a(r._timeline)||(n[h++]=r));return n},o.getLabelAfter=function(t){t||0!==t&&(t=this._time);var e,i=this.getLabelsArray(),s=i.length;for(e=0;s>e;e++)if(i[e].time>t)return i[e].name;return null},o.getLabelBefore=function(t){null==t&&(t=this._time);for(var e=this.getLabelsArray(),i=e.length;--i>-1;)if(t>e[i].time)return e[i].name;return null},o.getLabelsArray=function(){var t,e=[],i=0;for(t in this._labels)e[i++]={time:this._labels[t],name:t};return e.sort(function(t,e){return t.time-e.time}),e},o.progress=function(t){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&0!==(1&this._cycle)?1-t:t)+this._cycle*(this._duration+this._repeatDelay),!1):this._time/this.duration()},o.totalProgress=function(t){return arguments.length?this.totalTime(this.totalDuration()*t,!1):this._totalTime/this.totalDuration()},o.totalDuration=function(e){return arguments.length?-1===this._repeat?this:this.duration((e-this._repeat*this._repeatDelay)/(this._repeat+1)):(this._dirty&&(t.prototype.totalDuration.call(this),this._totalDuration=-1===this._repeat?999999999999:this._duration*(this._repeat+1)+this._repeatDelay*this._repeat),this._totalDuration)},o.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),t>this._duration&&(t=this._duration),this._yoyo&&0!==(1&this._cycle)?t=this._duration-t+this._cycle*(this._duration+this._repeatDelay):0!==this._repeat&&(t+=this._cycle*(this._duration+this._repeatDelay)),this.totalTime(t,e)):this._time},o.repeat=function(t){return arguments.length?(this._repeat=t,this._uncache(!0)):this._repeat},o.repeatDelay=function(t){return arguments.length?(this._repeatDelay=t,this._uncache(!0)):this._repeatDelay},o.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},o.currentLabel=function(t){return arguments.length?this.seek(t,!0):this.getLabelBefore(this._time+1e-8)},s},!0),function(){var t=180/Math.PI,e=Math.PI/180,i=[],s=[],r=[],n={},a=function(t,e,i,s){this.a=t,this.b=e,this.c=i,this.d=s,this.da=s-t,this.ca=i-t,this.ba=e-t},o=",x,y,z,left,top,right,bottom,marginTop,marginLeft,marginRight,marginBottom,paddingLeft,paddingTop,paddingRight,paddingBottom,backgroundPosition,backgroundPosition_y,",h=function(t,e,i,s){var r={a:t},n={},a={},o={c:s},h=(t+e)/2,l=(e+i)/2,_=(i+s)/2,u=(h+l)/2,p=(l+_)/2,f=(p-u)/8;return r.b=h+(t-h)/4,n.b=u+f,r.c=n.a=(r.b+n.b)/2,n.c=a.a=(u+p)/2,a.b=p-f,o.b=_+(s-_)/4,a.c=o.a=(a.b+o.b)/2,[r,n,a,o]},l=function(t,e,n,a,o){var l,_,u,p,f,c,m,d,g,v,y,T,w,x=t.length-1,b=0,P=t[0].a;for(l=0;x>l;l++)f=t[b],_=f.a,u=f.d,p=t[b+1].d,o?(y=i[l],T=s[l],w=.25*(T+y)*e/(a?.5:r[l]||.5),c=u-(u-_)*(a?.5*e:0!==y?w/y:0),m=u+(p-u)*(a?.5*e:0!==T?w/T:0),d=u-(c+((m-c)*(3*y/(y+T)+.5)/4||0))):(c=u-.5*(u-_)*e,m=u+.5*(p-u)*e,d=u-(c+m)/2),c+=d,m+=d,f.c=g=c,f.b=0!==l?P:P=f.a+.6*(f.c-f.a),f.da=u-_,f.ca=g-_,f.ba=P-_,n?(v=h(_,P,g,u),t.splice(b,1,v[0],v[1],v[2],v[3]),b+=4):b++,P=m;f=t[b],f.b=P,f.c=P+.4*(f.d-P),f.da=f.d-f.a,f.ca=f.c-f.a,f.ba=P-f.a,n&&(v=h(f.a,P,f.c,f.d),t.splice(b,1,v[0],v[1],v[2],v[3]))},_=function(t,e,r,n){var o,h,l,_,u,p,f=[];if(n)for(t=[n].concat(t),h=t.length;--h>-1;)"string"==typeof(p=t[h][e])&&"="===p.charAt(1)&&(t[h][e]=n[e]+Number(p.charAt(0)+p.substr(2)));if(o=t.length-2,0>o)return f[0]=new a(t[0][e],0,0,t[-1>o?0:1][e]),f;for(h=0;o>h;h++)l=t[h][e],_=t[h+1][e],f[h]=new a(l,0,0,_),r&&(u=t[h+2][e],i[h]=(i[h]||0)+(_-l)*(_-l),s[h]=(s[h]||0)+(u-_)*(u-_));return f[h]=new a(t[h][e],0,0,t[h+1][e]),f},u=function(t,e,a,h,u,p){var f,c,m,d,g,v,y,T,w={},x=[],b=p||t[0];u="string"==typeof u?","+u+",":o,null==e&&(e=1);for(c in t[0])x.push(c);if(t.length>1){for(T=t[t.length-1],y=!0,f=x.length;--f>-1;)if(c=x[f],Math.abs(b[c]-T[c])>.05){y=!1;break}y&&(t=t.concat(),p&&t.unshift(p),t.push(t[1]),p=t[t.length-3])}for(i.length=s.length=r.length=0,f=x.length;--f>-1;)c=x[f],n[c]=-1!==u.indexOf(","+c+","),w[c]=_(t,c,n[c],p);for(f=i.length;--f>-1;)i[f]=Math.sqrt(i[f]),s[f]=Math.sqrt(s[f]);if(!h){for(f=x.length;--f>-1;)if(n[c])for(m=w[x[f]],v=m.length-1,d=0;v>d;d++)g=m[d+1].da/s[d]+m[d].da/i[d],r[d]=(r[d]||0)+g*g;for(f=r.length;--f>-1;)r[f]=Math.sqrt(r[f])}for(f=x.length,d=a?4:1;--f>-1;)c=x[f],m=w[c],l(m,e,a,h,n[c]),y&&(m.splice(0,d),m.splice(m.length-d,d));return w},p=function(t,e,i){e=e||"soft";var s,r,n,o,h,l,_,u,p,f,c,m={},d="cubic"===e?3:2,g="soft"===e,v=[];if(g&&i&&(t=[i].concat(t)),null==t||d+1>t.length)throw"invalid Bezier data";for(p in t[0])v.push(p);for(l=v.length;--l>-1;){for(p=v[l],m[p]=h=[],f=0,u=t.length,_=0;u>_;_++)s=null==i?t[_][p]:"string"==typeof(c=t[_][p])&&"="===c.charAt(1)?i[p]+Number(c.charAt(0)+c.substr(2)):Number(c),g&&_>1&&u-1>_&&(h[f++]=(s+h[f-2])/2),h[f++]=s;for(u=f-d+1,f=0,_=0;u>_;_+=d)s=h[_],r=h[_+1],n=h[_+2],o=2===d?0:h[_+3],h[f++]=c=3===d?new a(s,r,n,o):new a(s,(2*r+s)/3,(2*r+n)/3,n);h.length=f}return m},f=function(t,e,i){for(var s,r,n,a,o,h,l,_,u,p,f,c=1/i,m=t.length;--m>-1;)for(p=t[m],n=p.a,a=p.d-n,o=p.c-n,h=p.b-n,s=r=0,_=1;i>=_;_++)l=c*_,u=1-l,s=r-(r=(l*l*a+3*u*(l*o+u*h))*l),f=m*i+_-1,e[f]=(e[f]||0)+s*s},c=function(t,e){e=e>>0||6;var i,s,r,n,a=[],o=[],h=0,l=0,_=e-1,u=[],p=[];for(i in t)f(t[i],a,e);for(r=a.length,s=0;r>s;s++)h+=Math.sqrt(a[s]),n=s%e,p[n]=h,n===_&&(l+=h,n=s/e>>0,u[n]=p,o[n]=l,h=0,p=[]);return{length:l,lengths:o,segments:u}},m=window._gsDefine.plugin({propName:"bezier",priority:-1,API:2,global:!0,init:function(t,e,i){this._target=t,e instanceof Array&&(e={values:e}),this._func={},this._round={},this._props=[],this._timeRes=null==e.timeResolution?6:parseInt(e.timeResolution,10);var s,r,n,a,o,h=e.values||[],l={},_=h[0],f=e.autoRotate||i.vars.orientToBezier;this._autoRotate=f?f instanceof Array?f:[["x","y","rotation",f===!0?0:Number(f)||0]]:null;for(s in _)this._props.push(s);for(n=this._props.length;--n>-1;)s=this._props[n],this._overwriteProps.push(s),r=this._func[s]="function"==typeof t[s],l[s]=r?t[s.indexOf("set")||"function"!=typeof t["get"+s.substr(3)]?s:"get"+s.substr(3)]():parseFloat(t[s]),o||l[s]!==h[0][s]&&(o=l);if(this._beziers="cubic"!==e.type&&"quadratic"!==e.type&&"soft"!==e.type?u(h,isNaN(e.curviness)?1:e.curviness,!1,"thruBasic"===e.type,e.correlate,o):p(h,e.type,l),this._segCount=this._beziers[s].length,this._timeRes){var m=c(this._beziers,this._timeRes);this._length=m.length,this._lengths=m.lengths,this._segments=m.segments,this._l1=this._li=this._s1=this._si=0,this._l2=this._lengths[0],this._curSeg=this._segments[0],this._s2=this._curSeg[0],this._prec=1/this._curSeg.length}if(f=this._autoRotate)for(f[0]instanceof Array||(this._autoRotate=f=[f]),n=f.length;--n>-1;)for(a=0;3>a;a++)s=f[n][a],this._func[s]="function"==typeof t[s]?t[s.indexOf("set")||"function"!=typeof t["get"+s.substr(3)]?s:"get"+s.substr(3)]:!1;return!0},set:function(e){var i,s,r,n,a,o,h,l,_,u,p=this._segCount,f=this._func,c=this._target;if(this._timeRes){if(_=this._lengths,u=this._curSeg,e*=this._length,r=this._li,e>this._l2&&p-1>r){for(l=p-1;l>r&&e>=(this._l2=_[++r]););this._l1=_[r-1],this._li=r,this._curSeg=u=this._segments[r],this._s2=u[this._s1=this._si=0]}else if(this._l1>e&&r>0){for(;r>0&&(this._l1=_[--r])>=e;);0===r&&this._l1>e?this._l1=0:r++,this._l2=_[r],this._li=r,this._curSeg=u=this._segments[r],this._s1=u[(this._si=u.length-1)-1]||0,this._s2=u[this._si]}if(i=r,e-=this._l1,r=this._si,e>this._s2&&u.length-1>r){for(l=u.length-1;l>r&&e>=(this._s2=u[++r]););this._s1=u[r-1],this._si=r}else if(this._s1>e&&r>0){for(;r>0&&(this._s1=u[--r])>=e;);0===r&&this._s1>e?this._s1=0:r++,this._s2=u[r],this._si=r}o=(r+(e-this._s1)/(this._s2-this._s1))*this._prec}else i=0>e?0:e>=1?p-1:p*e>>0,o=(e-i*(1/p))*p;for(s=1-o,r=this._props.length;--r>-1;)n=this._props[r],a=this._beziers[n][i],h=(o*o*a.da+3*s*(o*a.ca+s*a.ba))*o+a.a,this._round[n]&&(h=h+(h>0?.5:-.5)>>0),f[n]?c[n](h):c[n]=h;if(this._autoRotate){var m,d,g,v,y,T,w,x=this._autoRotate;for(r=x.length;--r>-1;)n=x[r][2],T=x[r][3]||0,w=x[r][4]===!0?1:t,a=this._beziers[x[r][0]],m=this._beziers[x[r][1]],a&&m&&(a=a[i],m=m[i],d=a.a+(a.b-a.a)*o,v=a.b+(a.c-a.b)*o,d+=(v-d)*o,v+=(a.c+(a.d-a.c)*o-v)*o,g=m.a+(m.b-m.a)*o,y=m.b+(m.c-m.b)*o,g+=(y-g)*o,y+=(m.c+(m.d-m.c)*o-y)*o,h=Math.atan2(y-g,v-d)*w+T,f[n]?c[n](h):c[n]=h)}}}),d=m.prototype;m.bezierThrough=u,m.cubicToQuadratic=h,m._autoCSS=!0,m.quadraticToCubic=function(t,e,i){return new a(t,(2*e+t)/3,(2*e+i)/3,i)},m._cssRegister=function(){var t=window._gsDefine.globals.CSSPlugin;if(t){var i=t._internals,s=i._parseToProxy,r=i._setPluginRatio,n=i.CSSPropTween;i._registerComplexSpecialProp("bezier",{parser:function(t,i,a,o,h,l){i instanceof Array&&(i={values:i}),l=new m;var _,u,p,f=i.values,c=f.length-1,d=[],g={};if(0>c)return h;for(_=0;c>=_;_++)p=s(t,f[_],o,h,l,c!==_),d[_]=p.end;for(u in i)g[u]=i[u];return g.values=d,h=new n(t,"bezier",0,0,p.pt,2),h.data=p,h.plugin=l,h.setRatio=r,0===g.autoRotate&&(g.autoRotate=!0),!g.autoRotate||g.autoRotate instanceof Array||(_=g.autoRotate===!0?0:Number(g.autoRotate)*e,g.autoRotate=null!=p.end.left?[["left","top","rotation",_,!0]]:null!=p.end.x?[["x","y","rotation",_,!0]]:!1),g.autoRotate&&(o._transform||o._enableTransforms(!1),p.autoRotate=o._target._gsTransform),l._onInitTween(p.proxy,g,o._tween),h}})}},d._roundProps=function(t,e){for(var i=this._overwriteProps,s=i.length;--s>-1;)(t[i[s]]||t.bezier||t.bezierThrough)&&(this._round[i[s]]=e)},d._kill=function(t){var e,i,s=this._props;for(e in this._beziers)if(e in t)for(delete this._beziers[e],delete this._func[e],i=s.length;--i>-1;)s[i]===e&&s.splice(i,1);return this._super._kill.call(this,t)
}}(),window._gsDefine("plugins.CSSPlugin",["plugins.TweenPlugin","TweenLite"],function(t,e){var i,s,r,n,a=function(){t.call(this,"css"),this._overwriteProps.length=0},o={},h=a.prototype=new t("css");h.constructor=a,a.version="1.9.8",a.API=2,a.defaultTransformPerspective=0,h="px",a.suffixMap={top:h,right:h,bottom:h,left:h,width:h,height:h,fontSize:h,padding:h,margin:h,perspective:h};var l,_,u,p,f,c,m=/(?:\d|\-\d|\.\d|\-\.\d)+/g,d=/(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,g=/(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi,v=/[^\d\-\.]/g,y=/(?:\d|\-|\+|=|#|\.)*/g,T=/opacity *= *([^)]*)/,w=/opacity:([^;]*)/,x=/alpha\(opacity *=.+?\)/i,b=/^(rgb|hsl)/,P=/([A-Z])/g,k=/-([a-z])/gi,R=/(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi,S=function(t,e){return e.toUpperCase()},A=/(?:Left|Right|Width)/i,C=/(M11|M12|M21|M22)=[\d\-\.e]+/gi,O=/progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i,D=/,(?=[^\)]*(?:\(|$))/gi,M=Math.PI/180,I=180/Math.PI,F={},E=document,N=E.createElement("div"),L=E.createElement("img"),X=a._internals={_specialProps:o},U=navigator.userAgent,z=function(){var t,e=U.indexOf("Android"),i=E.createElement("div");return u=-1!==U.indexOf("Safari")&&-1===U.indexOf("Chrome")&&(-1===e||Number(U.substr(e+8,1))>3),f=u&&6>Number(U.substr(U.indexOf("Version/")+8,1)),p=-1!==U.indexOf("Firefox"),/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(U),c=parseFloat(RegExp.$1),i.innerHTML="<a style='top:1px;opacity:.55;'>a</a>",t=i.getElementsByTagName("a")[0],t?/^0.55/.test(t.style.opacity):!1}(),Y=function(t){return T.test("string"==typeof t?t:(t.currentStyle?t.currentStyle.filter:t.style.filter)||"")?parseFloat(RegExp.$1)/100:1},B=function(t){window.console&&console.log(t)},j="",q="",V=function(t,e){e=e||N;var i,s,r=e.style;if(void 0!==r[t])return t;for(t=t.charAt(0).toUpperCase()+t.substr(1),i=["O","Moz","ms","Ms","Webkit"],s=5;--s>-1&&void 0===r[i[s]+t];);return s>=0?(q=3===s?"ms":i[s],j="-"+q.toLowerCase()+"-",q+t):null},Z=E.defaultView?E.defaultView.getComputedStyle:function(){},G=a.getStyle=function(t,e,i,s,r){var n;return z||"opacity"!==e?(!s&&t.style[e]?n=t.style[e]:(i=i||Z(t,null))?(t=i.getPropertyValue(e.replace(P,"-$1").toLowerCase()),n=t||i.length?t:i[e]):t.currentStyle&&(i=t.currentStyle,n=i[e]),null==r||n&&"none"!==n&&"auto"!==n&&"auto auto"!==n?n:r):Y(t)},$=function(t,e,i,s,r){if("px"===s||!s)return i;if("auto"===s||!i)return 0;var n,a=A.test(e),o=t,h=N.style,l=0>i;return l&&(i=-i),"%"===s&&-1!==e.indexOf("border")?n=i/100*(a?t.clientWidth:t.clientHeight):(h.cssText="border-style:solid; border-width:0; position:absolute; line-height:0;","%"!==s&&o.appendChild?h[a?"borderLeftWidth":"borderTopWidth"]=i+s:(o=t.parentNode||E.body,h[a?"width":"height"]=i+s),o.appendChild(N),n=parseFloat(N[a?"offsetWidth":"offsetHeight"]),o.removeChild(N),0!==n||r||(n=$(t,e,i,s,!0))),l?-n:n},Q=function(t,e,i){if("absolute"!==G(t,"position",i))return 0;var s="left"===e?"Left":"Top",r=G(t,"margin"+s,i);return t["offset"+s]-($(t,e,parseFloat(r),r.replace(y,""))||0)},W=function(t,e){var i,s,r={};if(e=e||Z(t,null))if(i=e.length)for(;--i>-1;)r[e[i].replace(k,S)]=e.getPropertyValue(e[i]);else for(i in e)r[i]=e[i];else if(e=t.currentStyle||t.style)for(i in e)r[i.replace(k,S)]=e[i];return z||(r.opacity=Y(t)),s=be(t,e,!1),r.rotation=s.rotation*I,r.skewX=s.skewX*I,r.scaleX=s.scaleX,r.scaleY=s.scaleY,r.x=s.x,r.y=s.y,xe&&(r.z=s.z,r.rotationX=s.rotationX*I,r.rotationY=s.rotationY*I,r.scaleZ=s.scaleZ),r.filters&&delete r.filters,r},H=function(t,e,i,s,r){var n,a,o,h={},l=t.style;for(a in i)"cssText"!==a&&"length"!==a&&isNaN(a)&&(e[a]!==(n=i[a])||r&&r[a])&&-1===a.indexOf("Origin")&&("number"==typeof n||"string"==typeof n)&&(h[a]="auto"!==n||"left"!==a&&"top"!==a?""!==n&&"auto"!==n&&"none"!==n||"string"!=typeof e[a]||""===e[a].replace(v,"")?n:0:Q(t,a),void 0!==l[a]&&(o=new ue(l,a,l[a],o)));if(s)for(a in s)"className"!==a&&(h[a]=s[a]);return{difs:h,firstMPT:o}},K={width:["Left","Right"],height:["Top","Bottom"]},J=["marginLeft","marginRight","marginTop","marginBottom"],te=function(t,e,i){var s=parseFloat("width"===e?t.offsetWidth:t.offsetHeight),r=K[e],n=r.length;for(i=i||Z(t,null);--n>-1;)s-=parseFloat(G(t,"padding"+r[n],i,!0))||0,s-=parseFloat(G(t,"border"+r[n]+"Width",i,!0))||0;return s},ee=function(t,e){(null==t||""===t||"auto"===t||"auto auto"===t)&&(t="0 0");var i=t.split(" "),s=-1!==t.indexOf("left")?"0%":-1!==t.indexOf("right")?"100%":i[0],r=-1!==t.indexOf("top")?"0%":-1!==t.indexOf("bottom")?"100%":i[1];return null==r?r="0":"center"===r&&(r="50%"),("center"===s||isNaN(parseFloat(s))&&-1===(s+"").indexOf("="))&&(s="50%"),e&&(e.oxp=-1!==s.indexOf("%"),e.oyp=-1!==r.indexOf("%"),e.oxr="="===s.charAt(1),e.oyr="="===r.charAt(1),e.ox=parseFloat(s.replace(v,"")),e.oy=parseFloat(r.replace(v,""))),s+" "+r+(i.length>2?" "+i[2]:"")},ie=function(t,e){return"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2)):parseFloat(t)-parseFloat(e)},se=function(t,e){return null==t?e:"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*Number(t.substr(2))+e:parseFloat(t)},re=function(t,e,i,s){var r,n,a,o,h=1e-6;return null==t?o=e:"number"==typeof t?o=t*M:(r=2*Math.PI,n=t.split("_"),a=Number(n[0].replace(v,""))*(-1===t.indexOf("rad")?M:1)-("="===t.charAt(1)?0:e),n.length&&(s&&(s[i]=e+a),-1!==t.indexOf("short")&&(a%=r,a!==a%(r/2)&&(a=0>a?a+r:a-r)),-1!==t.indexOf("_cw")&&0>a?a=(a+9999999999*r)%r-(0|a/r)*r:-1!==t.indexOf("ccw")&&a>0&&(a=(a-9999999999*r)%r-(0|a/r)*r)),o=e+a),h>o&&o>-h&&(o=0),o},ne={aqua:[0,255,255],lime:[0,255,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,255],navy:[0,0,128],white:[255,255,255],fuchsia:[255,0,255],olive:[128,128,0],yellow:[255,255,0],orange:[255,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[255,0,0],pink:[255,192,203],cyan:[0,255,255],transparent:[255,255,255,0]},ae=function(t,e,i){return t=0>t?t+1:t>1?t-1:t,0|255*(1>6*t?e+6*(i-e)*t:.5>t?i:2>3*t?e+6*(i-e)*(2/3-t):e)+.5},oe=function(t){var e,i,s,r,n,a;return t&&""!==t?"number"==typeof t?[t>>16,255&t>>8,255&t]:(","===t.charAt(t.length-1)&&(t=t.substr(0,t.length-1)),ne[t]?ne[t]:"#"===t.charAt(0)?(4===t.length&&(e=t.charAt(1),i=t.charAt(2),s=t.charAt(3),t="#"+e+e+i+i+s+s),t=parseInt(t.substr(1),16),[t>>16,255&t>>8,255&t]):"hsl"===t.substr(0,3)?(t=t.match(m),r=Number(t[0])%360/360,n=Number(t[1])/100,a=Number(t[2])/100,i=.5>=a?a*(n+1):a+n-a*n,e=2*a-i,t.length>3&&(t[3]=Number(t[3])),t[0]=ae(r+1/3,e,i),t[1]=ae(r,e,i),t[2]=ae(r-1/3,e,i),t):(t=t.match(m)||ne.transparent,t[0]=Number(t[0]),t[1]=Number(t[1]),t[2]=Number(t[2]),t.length>3&&(t[3]=Number(t[3])),t)):ne.black},he="(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b";for(h in ne)he+="|"+h+"\\b";he=RegExp(he+")","gi");var le=function(t,e,i,s){if(null==t)return function(t){return t};var r,n=e?(t.match(he)||[""])[0]:"",a=t.split(n).join("").match(g)||[],o=t.substr(0,t.indexOf(a[0])),h=")"===t.charAt(t.length-1)?")":"",l=-1!==t.indexOf(" ")?" ":",",_=a.length,u=_>0?a[0].replace(m,""):"";return _?r=e?function(t){var e,p,f,c;if("number"==typeof t)t+=u;else if(s&&D.test(t)){for(c=t.replace(D,"|").split("|"),f=0;c.length>f;f++)c[f]=r(c[f]);return c.join(",")}if(e=(t.match(he)||[n])[0],p=t.split(e).join("").match(g)||[],f=p.length,_>f--)for(;_>++f;)p[f]=i?p[0|(f-1)/2]:a[f];return o+p.join(l)+l+e+h+(-1!==t.indexOf("inset")?" inset":"")}:function(t){var e,n,p;if("number"==typeof t)t+=u;else if(s&&D.test(t)){for(n=t.replace(D,"|").split("|"),p=0;n.length>p;p++)n[p]=r(n[p]);return n.join(",")}if(e=t.match(g)||[],p=e.length,_>p--)for(;_>++p;)e[p]=i?e[0|(p-1)/2]:a[p];return o+e.join(l)+h}:function(t){return t}},_e=function(t){return t=t.split(","),function(e,i,s,r,n,a,o){var h,l=(i+"").split(" ");for(o={},h=0;4>h;h++)o[t[h]]=l[h]=l[h]||l[(h-1)/2>>0];return r.parse(e,o,n,a)}},ue=(X._setPluginRatio=function(t){this.plugin.setRatio(t);for(var e,i,s,r,n=this.data,a=n.proxy,o=n.firstMPT,h=1e-6;o;)e=a[o.v],o.r?e=e>0?0|e+.5:0|e-.5:h>e&&e>-h&&(e=0),o.t[o.p]=e,o=o._next;if(n.autoRotate&&(n.autoRotate.rotation=a.rotation),1===t)for(o=n.firstMPT;o;){if(i=o.t,i.type){if(1===i.type){for(r=i.xs0+i.s+i.xs1,s=1;i.l>s;s++)r+=i["xn"+s]+i["xs"+(s+1)];i.e=r}}else i.e=i.s+i.xs0;o=o._next}},function(t,e,i,s,r){this.t=t,this.p=e,this.v=i,this.r=r,s&&(s._prev=this,this._next=s)}),pe=(X._parseToProxy=function(t,e,i,s,r,n){var a,o,h,l,_,u=s,p={},f={},c=i._transform,m=F;for(i._transform=null,F=e,s=_=i.parse(t,e,s,r),F=m,n&&(i._transform=c,u&&(u._prev=null,u._prev&&(u._prev._next=null)));s&&s!==u;){if(1>=s.type&&(o=s.p,f[o]=s.s+s.c,p[o]=s.s,n||(l=new ue(s,"s",o,l,s.r),s.c=0),1===s.type))for(a=s.l;--a>0;)h="xn"+a,o=s.p+"_"+h,f[o]=s.data[h],p[o]=s[h],n||(l=new ue(s,h,o,l,s.rxp[h]));s=s._next}return{proxy:p,end:f,firstMPT:l,pt:_}},X.CSSPropTween=function(t,e,s,r,a,o,h,l,_,u,p){this.t=t,this.p=e,this.s=s,this.c=r,this.n=h||e,t instanceof pe||n.push(this.n),this.r=l,this.type=o||0,_&&(this.pr=_,i=!0),this.b=void 0===u?s:u,this.e=void 0===p?s+r:p,a&&(this._next=a,a._prev=this)}),fe=a.parseComplex=function(t,e,i,s,r,n,a,o,h,_){i=i||n||"",a=new pe(t,e,0,0,a,_?2:1,null,!1,o,i,s),s+="";var u,p,f,c,g,v,y,T,w,x,P,k,R=i.split(", ").join(",").split(" "),S=s.split(", ").join(",").split(" "),A=R.length,C=l!==!1;for((-1!==s.indexOf(",")||-1!==i.indexOf(","))&&(R=R.join(" ").replace(D,", ").split(" "),S=S.join(" ").replace(D,", ").split(" "),A=R.length),A!==S.length&&(R=(n||"").split(" "),A=R.length),a.plugin=h,a.setRatio=_,u=0;A>u;u++)if(c=R[u],g=S[u],T=parseFloat(c),T||0===T)a.appendXtra("",T,ie(g,T),g.replace(d,""),C&&-1!==g.indexOf("px"),!0);else if(r&&("#"===c.charAt(0)||ne[c]||b.test(c)))k=","===g.charAt(g.length-1)?"),":")",c=oe(c),g=oe(g),w=c.length+g.length>6,w&&!z&&0===g[3]?(a["xs"+a.l]+=a.l?" transparent":"transparent",a.e=a.e.split(S[u]).join("transparent")):(z||(w=!1),a.appendXtra(w?"rgba(":"rgb(",c[0],g[0]-c[0],",",!0,!0).appendXtra("",c[1],g[1]-c[1],",",!0).appendXtra("",c[2],g[2]-c[2],w?",":k,!0),w&&(c=4>c.length?1:c[3],a.appendXtra("",c,(4>g.length?1:g[3])-c,k,!1)));else if(v=c.match(m)){if(y=g.match(d),!y||y.length!==v.length)return a;for(f=0,p=0;v.length>p;p++)P=v[p],x=c.indexOf(P,f),a.appendXtra(c.substr(f,x-f),Number(P),ie(y[p],P),"",C&&"px"===c.substr(x+P.length,2),0===p),f=x+P.length;a["xs"+a.l]+=c.substr(f)}else a["xs"+a.l]+=a.l?" "+c:c;if(-1!==s.indexOf("=")&&a.data){for(k=a.xs0+a.data.s,u=1;a.l>u;u++)k+=a["xs"+u]+a.data["xn"+u];a.e=k+a["xs"+u]}return a.l||(a.type=-1,a.xs0=a.e),a.xfirst||a},ce=9;for(h=pe.prototype,h.l=h.pr=0;--ce>0;)h["xn"+ce]=0,h["xs"+ce]="";h.xs0="",h._next=h._prev=h.xfirst=h.data=h.plugin=h.setRatio=h.rxp=null,h.appendXtra=function(t,e,i,s,r,n){var a=this,o=a.l;return a["xs"+o]+=n&&o?" "+t:t||"",i||0===o||a.plugin?(a.l++,a.type=a.setRatio?2:1,a["xs"+a.l]=s||"",o>0?(a.data["xn"+o]=e+i,a.rxp["xn"+o]=r,a["xn"+o]=e,a.plugin||(a.xfirst=new pe(a,"xn"+o,e,i,a.xfirst||a,0,a.n,r,a.pr),a.xfirst.xs0=0),a):(a.data={s:e+i},a.rxp={},a.s=e,a.c=i,a.r=r,a)):(a["xs"+o]+=e+(s||""),a)};var me=function(t,e){e=e||{},this.p=e.prefix?V(t)||t:t,o[t]=o[this.p]=this,this.format=e.formatter||le(e.defaultValue,e.color,e.collapsible,e.multi),e.parser&&(this.parse=e.parser),this.clrs=e.color,this.multi=e.multi,this.keyword=e.keyword,this.dflt=e.defaultValue,this.pr=e.priority||0},de=X._registerComplexSpecialProp=function(t,e,i){"object"!=typeof e&&(e={parser:i});var s,r,n=t.split(","),a=e.defaultValue;for(i=i||[a],s=0;n.length>s;s++)e.prefix=0===s&&e.prefix,e.defaultValue=i[s]||a,r=new me(n[s],e)},ge=function(t){if(!o[t]){var e=t.charAt(0).toUpperCase()+t.substr(1)+"Plugin";de(t,{parser:function(t,i,s,r,n,a,h){var l=(window.GreenSockGlobals||window).com.greensock.plugins[e];return l?(l._cssRegister(),o[s].parse(t,i,s,r,n,a,h)):(B("Error: "+e+" js file not loaded."),n)}})}};h=me.prototype,h.parseComplex=function(t,e,i,s,r,n){var a,o,h,l,_,u,p=this.keyword;if(this.multi&&(D.test(i)||D.test(e)?(o=e.replace(D,"|").split("|"),h=i.replace(D,"|").split("|")):p&&(o=[e],h=[i])),h){for(l=h.length>o.length?h.length:o.length,a=0;l>a;a++)e=o[a]=o[a]||this.dflt,i=h[a]=h[a]||this.dflt,p&&(_=e.indexOf(p),u=i.indexOf(p),_!==u&&(i=-1===u?h:o,i[a]+=" "+p));e=o.join(", "),i=h.join(", ")}return fe(t,this.p,e,i,this.clrs,this.dflt,s,this.pr,r,n)},h.parse=function(t,e,i,s,n,a){return this.parseComplex(t.style,this.format(G(t,this.p,r,!1,this.dflt)),this.format(e),n,a)},a.registerSpecialProp=function(t,e,i){de(t,{parser:function(t,s,r,n,a,o){var h=new pe(t,r,0,0,a,2,r,!1,i);return h.plugin=o,h.setRatio=e(t,s,n._tween,r),h},priority:i})};var ve="scaleX,scaleY,scaleZ,x,y,z,skewX,rotation,rotationX,rotationY,perspective".split(","),ye=V("transform"),Te=j+"transform",we=V("transformOrigin"),xe=null!==V("perspective"),be=function(t,e,i,s){if(t._gsTransform&&i&&!s)return t._gsTransform;var r,n,o,h,l,_,u,p,f,c,m,d,g,v=i?t._gsTransform||{skewY:0}:{skewY:0},y=0>v.scaleX,T=2e-5,w=1e5,x=-Math.PI+1e-4,b=Math.PI-1e-4,P=xe?parseFloat(G(t,we,e,!1,"0 0 0").split(" ")[2])||v.zOrigin||0:0;for(ye?r=G(t,Te,e,!0):t.currentStyle&&(r=t.currentStyle.filter.match(C),r=r&&4===r.length?[r[0].substr(4),Number(r[2].substr(4)),Number(r[1].substr(4)),r[3].substr(4),v.x||0,v.y||0].join(","):""),n=(r||"").match(/(?:\-|\b)[\d\-\.e]+\b/gi)||[],o=n.length;--o>-1;)h=Number(n[o]),n[o]=(l=h-(h|=0))?(0|l*w+(0>l?-.5:.5))/w+h:h;if(16===n.length){var k=n[8],R=n[9],S=n[10],A=n[12],O=n[13],D=n[14];if(v.zOrigin&&(D=-v.zOrigin,A=k*D-n[12],O=R*D-n[13],D=S*D+v.zOrigin-n[14]),!i||s||null==v.rotationX){var M,I,F,E,N,L,X,U=n[0],z=n[1],Y=n[2],B=n[3],j=n[4],q=n[5],V=n[6],Z=n[7],$=n[11],Q=v.rotationX=Math.atan2(V,S),W=x>Q||Q>b;Q&&(E=Math.cos(-Q),N=Math.sin(-Q),M=j*E+k*N,I=q*E+R*N,F=V*E+S*N,k=j*-N+k*E,R=q*-N+R*E,S=V*-N+S*E,$=Z*-N+$*E,j=M,q=I,V=F),Q=v.rotationY=Math.atan2(k,U),Q&&(L=x>Q||Q>b,E=Math.cos(-Q),N=Math.sin(-Q),M=U*E-k*N,I=z*E-R*N,F=Y*E-S*N,R=z*N+R*E,S=Y*N+S*E,$=B*N+$*E,U=M,z=I,Y=F),Q=v.rotation=Math.atan2(z,q),Q&&(X=x>Q||Q>b,E=Math.cos(-Q),N=Math.sin(-Q),U=U*E+j*N,I=z*E+q*N,q=z*-N+q*E,V=Y*-N+V*E,z=I),X&&W?v.rotation=v.rotationX=0:X&&L?v.rotation=v.rotationY=0:L&&W&&(v.rotationY=v.rotationX=0),v.scaleX=(0|Math.sqrt(U*U+z*z)*w+.5)/w,v.scaleY=(0|Math.sqrt(q*q+R*R)*w+.5)/w,v.scaleZ=(0|Math.sqrt(V*V+S*S)*w+.5)/w,v.skewX=0,v.perspective=$?1/(0>$?-$:$):0,v.x=A,v.y=O,v.z=D}}else if(!(xe&&!s&&n.length&&v.x===n[4]&&v.y===n[5]&&(v.rotationX||v.rotationY)||void 0!==v.x&&"none"===G(t,"display",e))){var H=n.length>=6,K=H?n[0]:1,J=n[1]||0,te=n[2]||0,ee=H?n[3]:1;v.x=n[4]||0,v.y=n[5]||0,_=Math.sqrt(K*K+J*J),u=Math.sqrt(ee*ee+te*te),p=K||J?Math.atan2(J,K):v.rotation||0,f=te||ee?Math.atan2(te,ee)+p:v.skewX||0,c=_-Math.abs(v.scaleX||0),m=u-Math.abs(v.scaleY||0),Math.abs(f)>Math.PI/2&&Math.abs(f)<1.5*Math.PI&&(y?(_*=-1,f+=0>=p?Math.PI:-Math.PI,p+=0>=p?Math.PI:-Math.PI):(u*=-1,f+=0>=f?Math.PI:-Math.PI)),d=(p-v.rotation)%Math.PI,g=(f-v.skewX)%Math.PI,(void 0===v.skewX||c>T||-T>c||m>T||-T>m||d>x&&b>d&&false|d*w||g>x&&b>g&&false|g*w)&&(v.scaleX=_,v.scaleY=u,v.rotation=p,v.skewX=f),xe&&(v.rotationX=v.rotationY=v.z=0,v.perspective=parseFloat(a.defaultTransformPerspective)||0,v.scaleZ=1)}v.zOrigin=P;for(o in v)T>v[o]&&v[o]>-T&&(v[o]=0);return i&&(t._gsTransform=v),v},Pe=function(t){var e,i,s=this.data,r=-s.rotation,n=r+s.skewX,a=1e5,o=(0|Math.cos(r)*s.scaleX*a)/a,h=(0|Math.sin(r)*s.scaleX*a)/a,l=(0|Math.sin(n)*-s.scaleY*a)/a,_=(0|Math.cos(n)*s.scaleY*a)/a,u=this.t.style,p=this.t.currentStyle;if(p){i=h,h=-l,l=-i,e=p.filter,u.filter="";var f,m,d=this.t.offsetWidth,g=this.t.offsetHeight,v="absolute"!==p.position,w="progid:DXImageTransform.Microsoft.Matrix(M11="+o+", M12="+h+", M21="+l+", M22="+_,x=s.x,b=s.y;if(null!=s.ox&&(f=(s.oxp?.01*d*s.ox:s.ox)-d/2,m=(s.oyp?.01*g*s.oy:s.oy)-g/2,x+=f-(f*o+m*h),b+=m-(f*l+m*_)),v)f=d/2,m=g/2,w+=", Dx="+(f-(f*o+m*h)+x)+", Dy="+(m-(f*l+m*_)+b)+")";else{var P,k,R,S=8>c?1:-1;for(f=s.ieOffsetX||0,m=s.ieOffsetY||0,s.ieOffsetX=Math.round((d-((0>o?-o:o)*d+(0>h?-h:h)*g))/2+x),s.ieOffsetY=Math.round((g-((0>_?-_:_)*g+(0>l?-l:l)*d))/2+b),ce=0;4>ce;ce++)k=J[ce],P=p[k],i=-1!==P.indexOf("px")?parseFloat(P):$(this.t,k,parseFloat(P),P.replace(y,""))||0,R=i!==s[k]?2>ce?-s.ieOffsetX:-s.ieOffsetY:2>ce?f-s.ieOffsetX:m-s.ieOffsetY,u[k]=(s[k]=Math.round(i-R*(0===ce||2===ce?1:S)))+"px";w+=", sizingMethod='auto expand')"}u.filter=-1!==e.indexOf("DXImageTransform.Microsoft.Matrix(")?e.replace(O,w):w+" "+e,(0===t||1===t)&&1===o&&0===h&&0===l&&1===_&&(v&&-1===w.indexOf("Dx=0, Dy=0")||T.test(e)&&100!==parseFloat(RegExp.$1)||-1===e.indexOf("gradient(")&&u.removeAttribute("filter"))}},ke=function(){var t,e,i,s,r,n,a,o,h,l=this.data,_=this.t.style,u=l.perspective,f=l.scaleX,c=0,m=0,d=0,g=0,v=l.scaleY,y=0,T=0,w=0,x=0,b=l.scaleZ,P=0,k=0,R=0,S=u?-1/u:0,A=l.rotation,C=l.zOrigin,O=1e5;if(p&&(a=_.top?"top":_.bottom?"bottom":parseFloat(G(this.t,"top",null,!1))?"bottom":"top",i=G(this.t,a,null,!1),o=parseFloat(i)||0,h=i.substr((o+"").length)||"px",l._ffFix=!l._ffFix,_[a]=(l._ffFix?o+.05:o-.05)+h),A||l.skewX)i=f*Math.cos(A),s=v*Math.sin(A),A-=l.skewX,c=f*-Math.sin(A),v*=Math.cos(A),f=i,g=s;else if(!l.rotationY&&!l.rotationX&&1===b)return _[ye]="translate3d("+l.x+"px,"+l.y+"px,"+l.z+"px)"+(1!==f||1!==v?" scale("+f+","+v+")":""),void 0;A=l.rotationY,A&&(t=Math.cos(A),e=Math.sin(A),i=f*t,s=g*t,r=b*-e,n=S*-e,m=f*e,y=g*e,b*=t,S*=t,f=i,g=s,w=r,k=n),A=l.rotationX,A&&(t=Math.cos(A),e=Math.sin(A),i=c*t+m*e,s=v*t+y*e,r=x*t+b*e,n=R*t+S*e,m=c*-e+m*t,y=v*-e+y*t,b=x*-e+b*t,S=R*-e+S*t,c=i,v=s,x=r,R=n),C&&(P-=C,d=m*P,T=y*P,P=b*P+C),d=(i=(d+=l.x)-(d|=0))?(0|i*O+(0>i?-.5:.5))/O+d:d,T=(i=(T+=l.y)-(T|=0))?(0|i*O+(0>i?-.5:.5))/O+T:T,P=(i=(P+=l.z)-(P|=0))?(0|i*O+(0>i?-.5:.5))/O+P:P,_[ye]="matrix3d("+[(0|f*O)/O,(0|g*O)/O,(0|w*O)/O,(0|k*O)/O,(0|c*O)/O,(0|v*O)/O,(0|x*O)/O,(0|R*O)/O,(0|m*O)/O,(0|y*O)/O,(0|b*O)/O,(0|S*O)/O,d,T,P,u?1+-P/u:1].join(",")+")"},Re=function(){var t,e,i,s,r,n,a,o,h,l=this.data,_=this.t,u=_.style;p&&(t=u.top?"top":u.bottom?"bottom":parseFloat(G(_,"top",null,!1))?"bottom":"top",e=G(_,t,null,!1),i=parseFloat(e)||0,s=e.substr((i+"").length)||"px",l._ffFix=!l._ffFix,u[t]=(l._ffFix?i+.05:i-.05)+s),l.rotation||l.skewX?(r=l.rotation,n=r-l.skewX,a=1e5,o=l.scaleX*a,h=l.scaleY*a,u[ye]="matrix("+(0|Math.cos(r)*o)/a+","+(0|Math.sin(r)*o)/a+","+(0|Math.sin(n)*-h)/a+","+(0|Math.cos(n)*h)/a+","+l.x+","+l.y+")"):u[ye]="matrix("+l.scaleX+",0,0,"+l.scaleY+","+l.x+","+l.y+")"};de("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,transformPerspective,directionalRotation,parseTransform",{parser:function(t,e,i,s,n,a,o){if(s._transform)return n;var h,l,_,u,p,f,c,m=s._transform=be(t,r,!0,o.parseTransform),d=t.style,g=1e-6,v=ve.length,y=o,T={};if("string"==typeof y.transform&&ye)_=d.cssText,d[ye]=y.transform,d.display="block",h=be(t,null,!1),d.cssText=_;else if("object"==typeof y){if(h={scaleX:se(null!=y.scaleX?y.scaleX:y.scale,m.scaleX),scaleY:se(null!=y.scaleY?y.scaleY:y.scale,m.scaleY),scaleZ:se(null!=y.scaleZ?y.scaleZ:y.scale,m.scaleZ),x:se(y.x,m.x),y:se(y.y,m.y),z:se(y.z,m.z),perspective:se(y.transformPerspective,m.perspective)},c=y.directionalRotation,null!=c)if("object"==typeof c)for(_ in c)y[_]=c[_];else y.rotation=c;h.rotation=re("rotation"in y?y.rotation:"shortRotation"in y?y.shortRotation+"_short":"rotationZ"in y?y.rotationZ:m.rotation*I,m.rotation,"rotation",T),xe&&(h.rotationX=re("rotationX"in y?y.rotationX:"shortRotationX"in y?y.shortRotationX+"_short":m.rotationX*I||0,m.rotationX,"rotationX",T),h.rotationY=re("rotationY"in y?y.rotationY:"shortRotationY"in y?y.shortRotationY+"_short":m.rotationY*I||0,m.rotationY,"rotationY",T)),h.skewX=null==y.skewX?m.skewX:re(y.skewX,m.skewX),h.skewY=null==y.skewY?m.skewY:re(y.skewY,m.skewY),(l=h.skewY-m.skewY)&&(h.skewX+=l,h.rotation+=l)}for(p=m.z||m.rotationX||m.rotationY||h.z||h.rotationX||h.rotationY||h.perspective,p||null==y.scale||(h.scaleZ=1);--v>-1;)i=ve[v],u=h[i]-m[i],(u>g||-g>u||null!=F[i])&&(f=!0,n=new pe(m,i,m[i],u,n),i in T&&(n.e=T[i]),n.xs0=0,n.plugin=a,s._overwriteProps.push(n.n));return u=y.transformOrigin,(u||xe&&p&&m.zOrigin)&&(ye?(f=!0,u=(u||G(t,i,r,!1,"50% 50%"))+"",i=we,n=new pe(d,i,0,0,n,-1,"transformOrigin"),n.b=d[i],n.plugin=a,xe?(_=m.zOrigin,u=u.split(" "),m.zOrigin=(u.length>2?parseFloat(u[2]):_)||0,n.xs0=n.e=d[i]=u[0]+" "+(u[1]||"50%")+" 0px",n=new pe(m,"zOrigin",0,0,n,-1,n.n),n.b=_,n.xs0=n.e=m.zOrigin):n.xs0=n.e=d[i]=u):ee(u+"",m)),f&&(s._transformType=p||3===this._transformType?3:2),n},prefix:!0}),de("boxShadow",{defaultValue:"0px 0px 0px 0px #999",prefix:!0,color:!0,multi:!0,keyword:"inset"}),de("borderRadius",{defaultValue:"0px",parser:function(t,e,i,n,a){e=this.format(e);var o,h,l,_,u,p,f,c,m,d,g,v,y,T,w,x,b=["borderTopLeftRadius","borderTopRightRadius","borderBottomRightRadius","borderBottomLeftRadius"],P=t.style;for(m=parseFloat(t.offsetWidth),d=parseFloat(t.offsetHeight),o=e.split(" "),h=0;b.length>h;h++)this.p.indexOf("border")&&(b[h]=V(b[h])),u=_=G(t,b[h],r,!1,"0px"),-1!==u.indexOf(" ")&&(_=u.split(" "),u=_[0],_=_[1]),p=l=o[h],f=parseFloat(u),v=u.substr((f+"").length),y="="===p.charAt(1),y?(c=parseInt(p.charAt(0)+"1",10),p=p.substr(2),c*=parseFloat(p),g=p.substr((c+"").length-(0>c?1:0))||""):(c=parseFloat(p),g=p.substr((c+"").length)),""===g&&(g=s[i]||v),g!==v&&(T=$(t,"borderLeft",f,v),w=$(t,"borderTop",f,v),"%"===g?(u=100*(T/m)+"%",_=100*(w/d)+"%"):"em"===g?(x=$(t,"borderLeft",1,"em"),u=T/x+"em",_=w/x+"em"):(u=T+"px",_=w+"px"),y&&(p=parseFloat(u)+c+g,l=parseFloat(_)+c+g)),a=fe(P,b[h],u+" "+_,p+" "+l,!1,"0px",a);return a},prefix:!0,formatter:le("0px 0px 0px 0px",!1,!0)}),de("backgroundPosition",{defaultValue:"0 0",parser:function(t,e,i,s,n,a){var o,h,l,_,u,p,f="background-position",m=r||Z(t,null),d=this.format((m?c?m.getPropertyValue(f+"-x")+" "+m.getPropertyValue(f+"-y"):m.getPropertyValue(f):t.currentStyle.backgroundPositionX+" "+t.currentStyle.backgroundPositionY)||"0 0"),g=this.format(e);if(-1!==d.indexOf("%")!=(-1!==g.indexOf("%"))&&(p=G(t,"backgroundImage").replace(R,""),p&&"none"!==p)){for(o=d.split(" "),h=g.split(" "),L.setAttribute("src",p),l=2;--l>-1;)d=o[l],_=-1!==d.indexOf("%"),_!==(-1!==h[l].indexOf("%"))&&(u=0===l?t.offsetWidth-L.width:t.offsetHeight-L.height,o[l]=_?parseFloat(d)/100*u+"px":100*(parseFloat(d)/u)+"%");d=o.join(" ")}return this.parseComplex(t.style,d,g,n,a)},formatter:ee}),de("backgroundSize",{defaultValue:"0 0",formatter:ee}),de("perspective",{defaultValue:"0px",prefix:!0}),de("perspectiveOrigin",{defaultValue:"50% 50%",prefix:!0}),de("transformStyle",{prefix:!0}),de("backfaceVisibility",{prefix:!0}),de("margin",{parser:_e("marginTop,marginRight,marginBottom,marginLeft")}),de("padding",{parser:_e("paddingTop,paddingRight,paddingBottom,paddingLeft")}),de("clip",{defaultValue:"rect(0px,0px,0px,0px)",parser:function(t,e,i,s,n,a){var o,h,l;return 9>c?(h=t.currentStyle,l=8>c?" ":",",o="rect("+h.clipTop+l+h.clipRight+l+h.clipBottom+l+h.clipLeft+")",e=this.format(e).split(",").join(l)):(o=this.format(G(t,this.p,r,!1,this.dflt)),e=this.format(e)),this.parseComplex(t.style,o,e,n,a)}}),de("textShadow",{defaultValue:"0px 0px 0px #999",color:!0,multi:!0}),de("autoRound,strictUnits",{parser:function(t,e,i,s,r){return r}}),de("border",{defaultValue:"0px solid #000",parser:function(t,e,i,s,n,a){return this.parseComplex(t.style,this.format(G(t,"borderTopWidth",r,!1,"0px")+" "+G(t,"borderTopStyle",r,!1,"solid")+" "+G(t,"borderTopColor",r,!1,"#000")),this.format(e),n,a)},color:!0,formatter:function(t){var e=t.split(" ");return e[0]+" "+(e[1]||"solid")+" "+(t.match(he)||["#000"])[0]}}),de("float,cssFloat,styleFloat",{parser:function(t,e,i,s,r){var n=t.style,a="cssFloat"in n?"cssFloat":"styleFloat";return new pe(n,a,0,0,r,-1,i,!1,0,n[a],e)}});var Se=function(t){var e,i=this.t,s=i.filter,r=0|this.s+this.c*t;100===r&&(-1===s.indexOf("atrix(")&&-1===s.indexOf("radient(")?(i.removeAttribute("filter"),e=!G(this.data,"filter")):(i.filter=s.replace(x,""),e=!0)),e||(this.xn1&&(i.filter=s=s||"alpha(opacity=100)"),-1===s.indexOf("opacity")?i.filter+=" alpha(opacity="+r+")":i.filter=s.replace(T,"opacity="+r))};de("opacity,alpha,autoAlpha",{defaultValue:"1",parser:function(t,e,i,s,n,a){var o,h=parseFloat(G(t,"opacity",r,!1,"1")),l=t.style;return e=parseFloat(e),"autoAlpha"===i&&(o=G(t,"visibility",r),1===h&&"hidden"===o&&0!==e&&(h=0),n=new pe(l,"visibility",0,0,n,-1,null,!1,0,0!==h?"visible":"hidden",0===e?"hidden":"visible"),n.xs0="visible",s._overwriteProps.push(n.n)),z?n=new pe(l,"opacity",h,e-h,n):(n=new pe(l,"opacity",100*h,100*(e-h),n),n.xn1="autoAlpha"===i?1:0,l.zoom=1,n.type=2,n.b="alpha(opacity="+n.s+")",n.e="alpha(opacity="+(n.s+n.c)+")",n.data=t,n.plugin=a,n.setRatio=Se),n}});var Ae=function(t,e){e&&(t.removeProperty?t.removeProperty(e.replace(P,"-$1").toLowerCase()):t.removeAttribute(e))},Ce=function(t){if(this.t._gsClassPT=this,1===t||0===t){this.t.className=0===t?this.b:this.e;for(var e=this.data,i=this.t.style;e;)e.v?i[e.p]=e.v:Ae(i,e.p),e=e._next;1===t&&this.t._gsClassPT===this&&(this.t._gsClassPT=null)}else this.t.className!==this.e&&(this.t.className=this.e)};de("className",{parser:function(t,e,s,n,a,o,h){var l,_,u,p,f,c=t.className,m=t.style.cssText;if(a=n._classNamePT=new pe(t,s,0,0,a,2),a.setRatio=Ce,a.pr=-11,i=!0,a.b=c,_=W(t,r),u=t._gsClassPT){for(p={},f=u.data;f;)p[f.p]=1,f=f._next;u.setRatio(1)}return t._gsClassPT=a,a.e="="!==e.charAt(1)?e:c.replace(RegExp("\\s*\\b"+e.substr(2)+"\\b"),"")+("+"===e.charAt(0)?" "+e.substr(2):""),n._tween._duration&&(t.className=a.e,l=H(t,_,W(t),h,p),t.className=c,a.data=l.firstMPT,t.style.cssText=m,a=a.xfirst=n.parse(t,l.difs,a,o)),a}});var Oe=function(t){if((1===t||0===t)&&this.data._totalTime===this.data._totalDuration)for(var e,i="all"===this.e,s=this.t.style,r=i?s.cssText.split(";"):this.e.split(","),n=r.length,a=o.transform.parse;--n>-1;)e=r[n],i&&(e=e.substr(0,e.indexOf(":")).split(" ").join("")),o[e]&&(e=o[e].parse===a?ye:o[e].p),Ae(s,e)};for(de("clearProps",{parser:function(t,e,s,r,n){return n=new pe(t,s,0,0,n,2),n.setRatio=Oe,n.e=e,n.pr=-10,n.data=r._tween,i=!0,n}}),h="bezier,throwProps,physicsProps,physics2D".split(","),ce=h.length;ce--;)ge(h[ce]);h=a.prototype,h._firstPT=null,h._onInitTween=function(t,e,o){if(!t.nodeType)return!1;this._target=t,this._tween=o,this._vars=e,l=e.autoRound,i=!1,s=e.suffixMap||a.suffixMap,r=Z(t,""),n=this._overwriteProps;var h,p,c,m,d,g,v,y,T,x=t.style;if(_&&""===x.zIndex&&(h=G(t,"zIndex",r),("auto"===h||""===h)&&(x.zIndex=0)),"string"==typeof e&&(m=x.cssText,h=W(t,r),x.cssText=m+";"+e,h=H(t,h,W(t)).difs,!z&&w.test(e)&&(h.opacity=parseFloat(RegExp.$1)),e=h,x.cssText=m),this._firstPT=p=this.parse(t,e,null),this._transformType){for(T=3===this._transformType,ye?u&&(_=!0,""===x.zIndex&&(v=G(t,"zIndex",r),("auto"===v||""===v)&&(x.zIndex=0)),f&&(x.WebkitBackfaceVisibility=this._vars.WebkitBackfaceVisibility||(T?"visible":"hidden"))):x.zoom=1,c=p;c&&c._next;)c=c._next;y=new pe(t,"transform",0,0,null,2),this._linkCSSP(y,null,c),y.setRatio=T&&xe?ke:ye?Re:Pe,y.data=this._transform||be(t,r,!0),n.pop()}if(i){for(;p;){for(g=p._next,c=m;c&&c.pr>p.pr;)c=c._next;(p._prev=c?c._prev:d)?p._prev._next=p:m=p,(p._next=c)?c._prev=p:d=p,p=g}this._firstPT=m}return!0},h.parse=function(t,e,i,n){var a,h,_,u,p,f,c,m,d,g,v=t.style;for(a in e)f=e[a],h=o[a],h?i=h.parse(t,f,a,this,i,n,e):(p=G(t,a,r)+"",d="string"==typeof f,"color"===a||"fill"===a||"stroke"===a||-1!==a.indexOf("Color")||d&&b.test(f)?(d||(f=oe(f),f=(f.length>3?"rgba(":"rgb(")+f.join(",")+")"),i=fe(v,a,p,f,!0,"transparent",i,0,n)):!d||-1===f.indexOf(" ")&&-1===f.indexOf(",")?(_=parseFloat(p),c=_||0===_?p.substr((_+"").length):"",(""===p||"auto"===p)&&("width"===a||"height"===a?(_=te(t,a,r),c="px"):"left"===a||"top"===a?(_=Q(t,a,r),c="px"):(_="opacity"!==a?0:1,c="")),g=d&&"="===f.charAt(1),g?(u=parseInt(f.charAt(0)+"1",10),f=f.substr(2),u*=parseFloat(f),m=f.replace(y,"")):(u=parseFloat(f),m=d?f.substr((u+"").length)||"":""),""===m&&(m=s[a]||c),f=u||0===u?(g?u+_:u)+m:e[a],c!==m&&""!==m&&(u||0===u)&&(_||0===_)&&(_=$(t,a,_,c),"%"===m?(_/=$(t,a,100,"%")/100,_>100&&(_=100),e.strictUnits!==!0&&(p=_+"%")):"em"===m?_/=$(t,a,1,"em"):(u=$(t,a,u,m),m="px"),g&&(u||0===u)&&(f=u+_+m)),g&&(u+=_),!_&&0!==_||!u&&0!==u?void 0!==v[a]&&(f||"NaN"!=f+""&&null!=f)?(i=new pe(v,a,u||_||0,0,i,-1,a,!1,0,p,f),i.xs0="none"!==f||"display"!==a&&-1===a.indexOf("Style")?f:p):B("invalid "+a+" tween value: "+e[a]):(i=new pe(v,a,_,u-_,i,0,a,l!==!1&&("px"===m||"zIndex"===a),0,p,f),i.xs0=m)):i=fe(v,a,p,f,!0,null,i,0,n)),n&&i&&!i.plugin&&(i.plugin=n);return i},h.setRatio=function(t){var e,i,s,r=this._firstPT,n=1e-6;if(1!==t||this._tween._time!==this._tween._duration&&0!==this._tween._time)if(t||this._tween._time!==this._tween._duration&&0!==this._tween._time||this._tween._rawPrevTime===-1e-6)for(;r;){if(e=r.c*t+r.s,r.r?e=e>0?0|e+.5:0|e-.5:n>e&&e>-n&&(e=0),r.type)if(1===r.type)if(s=r.l,2===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2;else if(3===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3;else if(4===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3+r.xn3+r.xs4;else if(5===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3+r.xn3+r.xs4+r.xn4+r.xs5;else{for(i=r.xs0+e+r.xs1,s=1;r.l>s;s++)i+=r["xn"+s]+r["xs"+(s+1)];r.t[r.p]=i}else-1===r.type?r.t[r.p]=r.xs0:r.setRatio&&r.setRatio(t);else r.t[r.p]=e+r.xs0;r=r._next}else for(;r;)2!==r.type?r.t[r.p]=r.b:r.setRatio(t),r=r._next;else for(;r;)2!==r.type?r.t[r.p]=r.e:r.setRatio(t),r=r._next},h._enableTransforms=function(t){this._transformType=t||3===this._transformType?3:2,this._transform=this._transform||be(this._target,r,!0)},h._linkCSSP=function(t,e,i,s){return t&&(e&&(e._prev=t),t._next&&(t._next._prev=t._prev),i?i._next=t:s||null!==this._firstPT||(this._firstPT=t),t._prev?t._prev._next=t._next:this._firstPT===t&&(this._firstPT=t._next),t._next=e,t._prev=i),t},h._kill=function(e){var i,s,r,n=e;if(e.autoAlpha||e.alpha){n={};for(s in e)n[s]=e[s];n.opacity=1,n.autoAlpha&&(n.visibility=1)}return e.className&&(i=this._classNamePT)&&(r=i.xfirst,r&&r._prev?this._linkCSSP(r._prev,i._next,r._prev._prev):r===this._firstPT&&(this._firstPT=i._next),i._next&&this._linkCSSP(i._next,i._next._next,r._prev),this._classNamePT=null),t.prototype._kill.call(this,n)};var De=function(t,e,i){var s,r,n,a;if(t.slice)for(r=t.length;--r>-1;)De(t[r],e,i);else for(s=t.childNodes,r=s.length;--r>-1;)n=s[r],a=n.type,n.style&&(e.push(W(n)),i&&i.push(n)),1!==a&&9!==a&&11!==a||!n.childNodes.length||De(n,e,i)};return a.cascadeTo=function(t,i,s){var r,n,a,o=e.to(t,i,s),h=[o],l=[],_=[],u=[],p=e._internals.reservedProps;for(t=o._targets||o.target,De(t,l,u),o.render(i,!0),De(t,_),o.render(0,!0),o._enabled(!0),r=u.length;--r>-1;)if(n=H(u[r],l[r],_[r]),n.firstMPT){n=n.difs;for(a in s)p[a]&&(n[a]=s[a]);h.push(e.to(u[r],i,n))}return h},t.activate([a]),a},!0),function(){var t=window._gsDefine.plugin({propName:"roundProps",priority:-1,API:2,init:function(t,e,i){return this._tween=i,!0}}),e=t.prototype;e._onInitAllProps=function(){for(var t,e,i,s=this._tween,r=s.vars.roundProps instanceof Array?s.vars.roundProps:s.vars.roundProps.split(","),n=r.length,a={},o=s._propLookup.roundProps;--n>-1;)a[r[n]]=1;for(n=r.length;--n>-1;)for(t=r[n],e=s._firstPT;e;)i=e._next,e.pg?e.t._roundProps(a,!0):e.n===t&&(this._add(e.t,t,e.s,e.c),i&&(i._prev=e._prev),e._prev?e._prev._next=i:s._firstPT===e&&(s._firstPT=i),e._next=e._prev=null,s._propLookup[t]=o),e=i;return!1},e._add=function(t,e,i,s){this._addTween(t,e,i,i+s,e,!0),this._overwriteProps.push(e)}}(),window._gsDefine.plugin({propName:"attr",API:2,init:function(t,e){var i;if("function"!=typeof t.setAttribute)return!1;this._target=t,this._proxy={};for(i in e)this._addTween(this._proxy,i,parseFloat(t.getAttribute(i)),e[i],i),this._overwriteProps.push(i);return!0},set:function(t){this._super.setRatio.call(this,t);for(var e,i=this._overwriteProps,s=i.length;--s>-1;)e=i[s],this._target.setAttribute(e,this._proxy[e]+"")}}),window._gsDefine.plugin({propName:"directionalRotation",API:2,init:function(t,e){"object"!=typeof e&&(e={rotation:e}),this.finals={};var i,s,r,n,a,o,h=e.useRadians===!0?2*Math.PI:360,l=1e-6;for(i in e)"useRadians"!==i&&(o=(e[i]+"").split("_"),s=o[0],r=parseFloat("function"!=typeof t[i]?t[i]:t[i.indexOf("set")||"function"!=typeof t["get"+i.substr(3)]?i:"get"+i.substr(3)]()),n=this.finals[i]="string"==typeof s&&"="===s.charAt(1)?r+parseInt(s.charAt(0)+"1",10)*Number(s.substr(2)):Number(s)||0,a=n-r,o.length&&(s=o.join("_"),-1!==s.indexOf("short")&&(a%=h,a!==a%(h/2)&&(a=0>a?a+h:a-h)),-1!==s.indexOf("_cw")&&0>a?a=(a+9999999999*h)%h-(0|a/h)*h:-1!==s.indexOf("ccw")&&a>0&&(a=(a-9999999999*h)%h-(0|a/h)*h)),(a>l||-l>a)&&(this._addTween(t,i,r,r+a,i),this._overwriteProps.push(i)));
return!0},set:function(t){var e;if(1!==t)this._super.setRatio.call(this,t);else for(e=this._firstPT;e;)e.f?e.t[e.p](this.finals[e.p]):e.t[e.p]=this.finals[e.p],e=e._next}})._autoCSS=!0,window._gsDefine("easing.Back",["easing.Ease"],function(t){var e,i,s,r=window.GreenSockGlobals||window,n=r.com.greensock,a=2*Math.PI,o=Math.PI/2,h=n._class,l=function(e,i){var s=h("easing."+e,function(){},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,s},_=t.register||function(){},u=function(t,e,i,s){var r=h("easing."+t,{easeOut:new e,easeIn:new i,easeInOut:new s},!0);return _(r,t),r},p=function(t,e,i){this.t=t,this.v=e,i&&(this.next=i,i.prev=this,this.c=i.v-e,this.gap=i.t-t)},f=function(e,i){var s=h("easing."+e,function(t){this._p1=t||0===t?t:1.70158,this._p2=1.525*this._p1},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,r.config=function(t){return new s(t)},s},c=u("Back",f("BackOut",function(t){return(t-=1)*t*((this._p1+1)*t+this._p1)+1}),f("BackIn",function(t){return t*t*((this._p1+1)*t-this._p1)}),f("BackInOut",function(t){return 1>(t*=2)?.5*t*t*((this._p2+1)*t-this._p2):.5*((t-=2)*t*((this._p2+1)*t+this._p2)+2)})),m=h("easing.SlowMo",function(t,e,i){e=e||0===e?e:.7,null==t?t=.7:t>1&&(t=1),this._p=1!==t?e:0,this._p1=(1-t)/2,this._p2=t,this._p3=this._p1+this._p2,this._calcEnd=i===!0},!0),d=m.prototype=new t;return d.constructor=m,d.getRatio=function(t){var e=t+(.5-t)*this._p;return this._p1>t?this._calcEnd?1-(t=1-t/this._p1)*t:e-(t=1-t/this._p1)*t*t*t*e:t>this._p3?this._calcEnd?1-(t=(t-this._p3)/this._p1)*t:e+(t-e)*(t=(t-this._p3)/this._p1)*t*t*t:this._calcEnd?1:e},m.ease=new m(.7,.7),d.config=m.config=function(t,e,i){return new m(t,e,i)},e=h("easing.SteppedEase",function(t){t=t||1,this._p1=1/t,this._p2=t+1},!0),d=e.prototype=new t,d.constructor=e,d.getRatio=function(t){return 0>t?t=0:t>=1&&(t=.999999999),(this._p2*t>>0)*this._p1},d.config=e.config=function(t){return new e(t)},i=h("easing.RoughEase",function(e){e=e||{};for(var i,s,r,n,a,o,h=e.taper||"none",l=[],_=0,u=0|(e.points||20),f=u,c=e.randomize!==!1,m=e.clamp===!0,d=e.template instanceof t?e.template:null,g="number"==typeof e.strength?.4*e.strength:.4;--f>-1;)i=c?Math.random():1/u*f,s=d?d.getRatio(i):i,"none"===h?r=g:"out"===h?(n=1-i,r=n*n*g):"in"===h?r=i*i*g:.5>i?(n=2*i,r=.5*n*n*g):(n=2*(1-i),r=.5*n*n*g),c?s+=Math.random()*r-.5*r:f%2?s+=.5*r:s-=.5*r,m&&(s>1?s=1:0>s&&(s=0)),l[_++]={x:i,y:s};for(l.sort(function(t,e){return t.x-e.x}),o=new p(1,1,null),f=u;--f>-1;)a=l[f],o=new p(a.x,a.y,o);this._prev=new p(0,0,0!==o.t?o:o.next)},!0),d=i.prototype=new t,d.constructor=i,d.getRatio=function(t){var e=this._prev;if(t>e.t){for(;e.next&&t>=e.t;)e=e.next;e=e.prev}else for(;e.prev&&e.t>=t;)e=e.prev;return this._prev=e,e.v+(t-e.t)/e.gap*e.c},d.config=function(t){return new i(t)},i.ease=new i,u("Bounce",l("BounceOut",function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375}),l("BounceIn",function(t){return 1/2.75>(t=1-t)?1-7.5625*t*t:2/2.75>t?1-(7.5625*(t-=1.5/2.75)*t+.75):2.5/2.75>t?1-(7.5625*(t-=2.25/2.75)*t+.9375):1-(7.5625*(t-=2.625/2.75)*t+.984375)}),l("BounceInOut",function(t){var e=.5>t;return t=e?1-2*t:2*t-1,t=1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375,e?.5*(1-t):.5*t+.5})),u("Circ",l("CircOut",function(t){return Math.sqrt(1-(t-=1)*t)}),l("CircIn",function(t){return-(Math.sqrt(1-t*t)-1)}),l("CircInOut",function(t){return 1>(t*=2)?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)})),s=function(e,i,s){var r=h("easing."+e,function(t,e){this._p1=t||1,this._p2=e||s,this._p3=this._p2/a*(Math.asin(1/this._p1)||0)},!0),n=r.prototype=new t;return n.constructor=r,n.getRatio=i,n.config=function(t,e){return new r(t,e)},r},u("Elastic",s("ElasticOut",function(t){return this._p1*Math.pow(2,-10*t)*Math.sin((t-this._p3)*a/this._p2)+1},.3),s("ElasticIn",function(t){return-(this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*a/this._p2))},.3),s("ElasticInOut",function(t){return 1>(t*=2)?-.5*this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*a/this._p2):.5*this._p1*Math.pow(2,-10*(t-=1))*Math.sin((t-this._p3)*a/this._p2)+1},.45)),u("Expo",l("ExpoOut",function(t){return 1-Math.pow(2,-10*t)}),l("ExpoIn",function(t){return Math.pow(2,10*(t-1))-.001}),l("ExpoInOut",function(t){return 1>(t*=2)?.5*Math.pow(2,10*(t-1)):.5*(2-Math.pow(2,-10*(t-1)))})),u("Sine",l("SineOut",function(t){return Math.sin(t*o)}),l("SineIn",function(t){return-Math.cos(t*o)+1}),l("SineInOut",function(t){return-.5*(Math.cos(Math.PI*t)-1)})),h("easing.EaseLookup",{find:function(e){return t.map[e]}},!0),_(r.SlowMo,"SlowMo","ease,"),_(i,"RoughEase","ease,"),_(e,"SteppedEase","ease,"),c},!0)}),function(t){"use strict";var e,i,s,r,n,a=t.GreenSockGlobals||t,o=function(t){var e,i=t.split("."),s=a;for(e=0;i.length>e;e++)s[i[e]]=s=s[i[e]]||{};return s},h=o("com.greensock"),l=[].slice,_=function(){},u={},p=function(e,i,s,r){this.sc=u[e]?u[e].sc:[],u[e]=this,this.gsClass=null,this.func=s;var n=[];this.check=function(h){for(var l,_,f,c,m=i.length,d=m;--m>-1;)(l=u[i[m]]||new p(i[m],[])).gsClass?(n[m]=l.gsClass,d--):h&&l.sc.push(this);if(0===d&&s)for(_=("com.greensock."+e).split("."),f=_.pop(),c=o(_.join("."))[f]=this.gsClass=s.apply(s,n),r&&(a[f]=c,"function"==typeof define&&define.amd?define((t.GreenSockAMDPath?t.GreenSockAMDPath+"/":"")+e.split(".").join("/"),[],function(){return c}):"undefined"!=typeof module&&module.exports&&(module.exports=c)),m=0;this.sc.length>m;m++)this.sc[m].check()},this.check(!0)},f=t._gsDefine=function(t,e,i,s){return new p(t,e,i,s)},c=h._class=function(t,e,i){return e=e||function(){},f(t,[],function(){return e},i),e};f.globals=a;var m=[0,0,1,1],d=[],g=c("easing.Ease",function(t,e,i,s){this._func=t,this._type=i||0,this._power=s||0,this._params=e?m.concat(e):m},!0),v=g.map={},y=g.register=function(t,e,i,s){for(var r,n,a,o,l=e.split(","),_=l.length,u=(i||"easeIn,easeOut,easeInOut").split(",");--_>-1;)for(n=l[_],r=s?c("easing."+n,null,!0):h.easing[n]||{},a=u.length;--a>-1;)o=u[a],v[n+"."+o]=v[o+n]=r[o]=t.getRatio?t:t[o]||new t};for(s=g.prototype,s._calcEnd=!1,s.getRatio=function(t){if(this._func)return this._params[0]=t,this._func.apply(null,this._params);var e=this._type,i=this._power,s=1===e?1-t:2===e?t:.5>t?2*t:2*(1-t);return 1===i?s*=s:2===i?s*=s*s:3===i?s*=s*s*s:4===i&&(s*=s*s*s*s),1===e?1-s:2===e?s:.5>t?s/2:1-s/2},e=["Linear","Quad","Cubic","Quart","Quint,Strong"],i=e.length;--i>-1;)s=e[i]+",Power"+i,y(new g(null,null,1,i),s,"easeOut",!0),y(new g(null,null,2,i),s,"easeIn"+(0===i?",easeNone":"")),y(new g(null,null,3,i),s,"easeInOut");v.linear=h.easing.Linear.easeIn,v.swing=h.easing.Quad.easeInOut;var T=c("events.EventDispatcher",function(t){this._listeners={},this._eventTarget=t||this});s=T.prototype,s.addEventListener=function(t,e,i,s,a){a=a||0;var o,h,l=this._listeners[t],_=0;for(null==l&&(this._listeners[t]=l=[]),h=l.length;--h>-1;)o=l[h],o.c===e&&o.s===i?l.splice(h,1):0===_&&a>o.pr&&(_=h+1);l.splice(_,0,{c:e,s:i,up:s,pr:a}),this!==r||n||r.wake()},s.removeEventListener=function(t,e){var i,s=this._listeners[t];if(s)for(i=s.length;--i>-1;)if(s[i].c===e)return s.splice(i,1),void 0},s.dispatchEvent=function(t){var e,i,s,r=this._listeners[t];if(r)for(e=r.length,i=this._eventTarget;--e>-1;)s=r[e],s.up?s.c.call(s.s||i,{type:t,target:i}):s.c.call(s.s||i)};var w=t.requestAnimationFrame,x=t.cancelAnimationFrame,b=Date.now||function(){return(new Date).getTime()};for(e=["ms","moz","webkit","o"],i=e.length;--i>-1&&!w;)w=t[e[i]+"RequestAnimationFrame"],x=t[e[i]+"CancelAnimationFrame"]||t[e[i]+"CancelRequestAnimationFrame"];c("Ticker",function(t,e){var i,s,a,o,h,l=this,u=b(),p=e!==!1&&w,f=function(t){l.time=(b()-u)/1e3;var e=a,r=l.time-h;(!i||r>0||t===!0)&&(l.frame++,h+=r+(r>=o?.004:o-r),l.dispatchEvent("tick")),t!==!0&&e===a&&(a=s(f))};T.call(l),this.time=this.frame=0,this.tick=function(){f(!0)},this.sleep=function(){null!=a&&(p&&x?x(a):clearTimeout(a),s=_,a=null,l===r&&(n=!1))},this.wake=function(){null!==a&&l.sleep(),s=0===i?_:p&&w?w:function(t){return setTimeout(t,0|1e3*(h-l.time)+1)},l===r&&(n=!0),f(2)},this.fps=function(t){return arguments.length?(i=t,o=1/(i||60),h=this.time+o,l.wake(),void 0):i},this.useRAF=function(t){return arguments.length?(l.sleep(),p=t,l.fps(i),void 0):p},l.fps(t),setTimeout(function(){p&&(!a||5>l.frame)&&l.useRAF(!1)},1500)}),s=h.Ticker.prototype=new h.events.EventDispatcher,s.constructor=h.Ticker;var P=c("core.Animation",function(t,e){if(this.vars=e||{},this._duration=this._totalDuration=t||0,this._delay=Number(this.vars.delay)||0,this._timeScale=1,this._active=this.vars.immediateRender===!0,this.data=this.vars.data,this._reversed=this.vars.reversed===!0,N){n||r.wake();var i=this.vars.useFrames?E:N;i.add(this,i._time),this.vars.paused&&this.paused(!0)}});r=P.ticker=new h.Ticker,s=P.prototype,s._dirty=s._gc=s._initted=s._paused=!1,s._totalTime=s._time=0,s._rawPrevTime=-1,s._next=s._last=s._onUpdate=s._timeline=s.timeline=null,s._paused=!1,s.play=function(t,e){return arguments.length&&this.seek(t,e),this.reversed(!1).paused(!1)},s.pause=function(t,e){return arguments.length&&this.seek(t,e),this.paused(!0)},s.resume=function(t,e){return arguments.length&&this.seek(t,e),this.paused(!1)},s.seek=function(t,e){return this.totalTime(Number(t),e!==!1)},s.restart=function(t,e){return this.reversed(!1).paused(!1).totalTime(t?-this._delay:0,e!==!1,!0)},s.reverse=function(t,e){return arguments.length&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},s.render=function(){},s.invalidate=function(){return this},s._enabled=function(t,e){return n||r.wake(),this._gc=!t,this._active=t&&!this._paused&&this._totalTime>0&&this._totalTime<this._totalDuration,e!==!0&&(t&&!this.timeline?this._timeline.add(this,this._startTime-this._delay):!t&&this.timeline&&this._timeline._remove(this,!0)),!1},s._kill=function(){return this._enabled(!1,!1)},s.kill=function(t,e){return this._kill(t,e),this},s._uncache=function(t){for(var e=t?this:this.timeline;e;)e._dirty=!0,e=e.timeline;return this},s.eventCallback=function(t,e,i,s){if(null==t)return null;if("on"===t.substr(0,2)){var r,n=this.vars;if(1===arguments.length)return n[t];if(null==e)delete n[t];else if(n[t]=e,n[t+"Params"]=i,n[t+"Scope"]=s,i)for(r=i.length;--r>-1;)"{self}"===i[r]&&(i=n[t+"Params"]=i.concat(),i[r]=this);"onUpdate"===t&&(this._onUpdate=e)}return this},s.delay=function(t){return arguments.length?(this._timeline.smoothChildTiming&&this.startTime(this._startTime+t-this._delay),this._delay=t,this):this._delay},s.duration=function(t){return arguments.length?(this._duration=this._totalDuration=t,this._uncache(!0),this._timeline.smoothChildTiming&&this._time>0&&this._time<this._duration&&0!==t&&this.totalTime(this._totalTime*(t/this._duration),!0),this):(this._dirty=!1,this._duration)},s.totalDuration=function(t){return this._dirty=!1,arguments.length?this.duration(t):this._totalDuration},s.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),this.totalTime(t>this._duration?this._duration:t,e)):this._time},s.totalTime=function(t,e,i){if(n||r.wake(),!arguments.length)return this._totalTime;if(this._timeline){if(0>t&&!i&&(t+=this.totalDuration()),this._timeline.smoothChildTiming){this._dirty&&this.totalDuration();var s=this._totalDuration,a=this._timeline;if(t>s&&!i&&(t=s),this._startTime=(this._paused?this._pauseTime:a._time)-(this._reversed?s-t:t)/this._timeScale,a._dirty||this._uncache(!1),!a._active)for(;a._timeline;)a.totalTime(a._totalTime,!0),a=a._timeline}this._gc&&this._enabled(!0,!1),this._totalTime!==t&&this.render(t,e,!1)}return this},s.startTime=function(t){return arguments.length?(t!==this._startTime&&(this._startTime=t,this.timeline&&this.timeline._sortChildren&&this.timeline.add(this,t-this._delay)),this):this._startTime},s.timeScale=function(t){if(!arguments.length)return this._timeScale;if(t=t||1e-6,this._timeline&&this._timeline.smoothChildTiming){var e=this._pauseTime,i=e||0===e?e:this._timeline.totalTime();this._startTime=i-(i-this._startTime)*this._timeScale/t}return this._timeScale=t,this._uncache(!1)},s.reversed=function(t){return arguments.length?(t!=this._reversed&&(this._reversed=t,this.totalTime(this._totalTime,!0)),this):this._reversed},s.paused=function(t){if(!arguments.length)return this._paused;if(t!=this._paused&&this._timeline){n||t||r.wake();var e=this._timeline.rawTime(),i=e-this._pauseTime;!t&&this._timeline.smoothChildTiming&&(this._startTime+=i,this._uncache(!1)),this._pauseTime=t?e:null,this._paused=t,this._active=!t&&this._totalTime>0&&this._totalTime<this._totalDuration,t||0===i||0===this._duration||this.render(this._totalTime,!0,!0)}return this._gc&&!t&&this._enabled(!0,!1),this};var k=c("core.SimpleTimeline",function(t){P.call(this,0,t),this.autoRemoveChildren=this.smoothChildTiming=!0});s=k.prototype=new P,s.constructor=k,s.kill()._gc=!1,s._first=s._last=null,s._sortChildren=!1,s.add=s.insert=function(t,e){var i,s;if(t._startTime=Number(e||0)+t._delay,t._paused&&this!==t._timeline&&(t._pauseTime=t._startTime+(this.rawTime()-t._startTime)/t._timeScale),t.timeline&&t.timeline._remove(t,!0),t.timeline=t._timeline=this,t._gc&&t._enabled(!0,!0),i=this._last,this._sortChildren)for(s=t._startTime;i&&i._startTime>s;)i=i._prev;return i?(t._next=i._next,i._next=t):(t._next=this._first,this._first=t),t._next?t._next._prev=t:this._last=t,t._prev=i,this._timeline&&this._uncache(!0),this},s._remove=function(t,e){return t.timeline===this&&(e||t._enabled(!1,!0),t.timeline=null,t._prev?t._prev._next=t._next:this._first===t&&(this._first=t._next),t._next?t._next._prev=t._prev:this._last===t&&(this._last=t._prev),this._timeline&&this._uncache(!0)),this},s.render=function(t,e,i){var s,r=this._first;for(this._totalTime=this._time=this._rawPrevTime=t;r;)s=r._next,(r._active||t>=r._startTime&&!r._paused)&&(r._reversed?r.render((r._dirty?r.totalDuration():r._totalDuration)-(t-r._startTime)*r._timeScale,e,i):r.render((t-r._startTime)*r._timeScale,e,i)),r=s},s.rawTime=function(){return n||r.wake(),this._totalTime};var R=c("TweenLite",function(t,e,i){if(P.call(this,e,i),null==t)throw"Cannot tween a null target.";this.target=t="string"!=typeof t?t:R.selector(t)||t;var s,r,n,a=t.jquery||t.length&&t[0]&&t[0].nodeType&&t[0].style&&!t.nodeType,o=this.vars.overwrite;if(this._overwrite=o=null==o?F[R.defaultOverwrite]:"number"==typeof o?o>>0:F[o],(a||t instanceof Array)&&"number"!=typeof t[0])for(this._targets=n=l.call(t,0),this._propLookup=[],this._siblings=[],s=0;n.length>s;s++)r=n[s],r?"string"!=typeof r?r.length&&r[0]&&r[0].nodeType&&r[0].style&&!r.nodeType?(n.splice(s--,1),this._targets=n=n.concat(l.call(r,0))):(this._siblings[s]=L(r,this,!1),1===o&&this._siblings[s].length>1&&X(r,this,null,1,this._siblings[s])):(r=n[s--]=R.selector(r),"string"==typeof r&&n.splice(s+1,1)):n.splice(s--,1);else this._propLookup={},this._siblings=L(t,this,!1),1===o&&this._siblings.length>1&&X(t,this,null,1,this._siblings);(this.vars.immediateRender||0===e&&0===this._delay&&this.vars.immediateRender!==!1)&&this.render(-this._delay,!1,!0)},!0),S=function(t){return t.length&&t[0]&&t[0].nodeType&&t[0].style&&!t.nodeType},A=function(t,e){var i,s={};for(i in t)I[i]||i in e&&"x"!==i&&"y"!==i&&"width"!==i&&"height"!==i&&"className"!==i||!(!O[i]||O[i]&&O[i]._autoCSS)||(s[i]=t[i],delete t[i]);t.css=s};s=R.prototype=new P,s.constructor=R,s.kill()._gc=!1,s.ratio=0,s._firstPT=s._targets=s._overwrittenProps=s._startAt=null,s._notifyPluginsOfEnabled=!1,R.version="1.9.8",R.defaultEase=s._ease=new g(null,null,1,1),R.defaultOverwrite="auto",R.ticker=r,R.autoSleep=!0,R.selector=t.$||t.jQuery||function(e){return t.$?(R.selector=t.$,t.$(e)):t.document?t.document.getElementById("#"===e.charAt(0)?e.substr(1):e):e};var C=R._internals={},O=R._plugins={},D=R._tweenLookup={},M=0,I=C.reservedProps={ease:1,delay:1,overwrite:1,onComplete:1,onCompleteParams:1,onCompleteScope:1,useFrames:1,runBackwards:1,startAt:1,onUpdate:1,onUpdateParams:1,onUpdateScope:1,onStart:1,onStartParams:1,onStartScope:1,onReverseComplete:1,onReverseCompleteParams:1,onReverseCompleteScope:1,onRepeat:1,onRepeatParams:1,onRepeatScope:1,easeParams:1,yoyo:1,immediateRender:1,repeat:1,repeatDelay:1,data:1,paused:1,reversed:1,autoCSS:1},F={none:0,all:1,auto:2,concurrent:3,allOnStart:4,preexisting:5,"true":1,"false":0},E=P._rootFramesTimeline=new k,N=P._rootTimeline=new k;N._startTime=r.time,E._startTime=r.frame,N._active=E._active=!0,P._updateRoot=function(){if(N.render((r.time-N._startTime)*N._timeScale,!1,!1),E.render((r.frame-E._startTime)*E._timeScale,!1,!1),!(r.frame%120)){var t,e,i;for(i in D){for(e=D[i].tweens,t=e.length;--t>-1;)e[t]._gc&&e.splice(t,1);0===e.length&&delete D[i]}if(i=N._first,(!i||i._paused)&&R.autoSleep&&!E._first&&1===r._listeners.tick.length){for(;i&&i._paused;)i=i._next;i||r.sleep()}}},r.addEventListener("tick",P._updateRoot);var L=function(t,e,i){var s,r,n=t._gsTweenID;if(D[n||(t._gsTweenID=n="t"+M++)]||(D[n]={target:t,tweens:[]}),e&&(s=D[n].tweens,s[r=s.length]=e,i))for(;--r>-1;)s[r]===e&&s.splice(r,1);return D[n].tweens},X=function(t,e,i,s,r){var n,a,o,h;if(1===s||s>=4){for(h=r.length,n=0;h>n;n++)if((o=r[n])!==e)o._gc||o._enabled(!1,!1)&&(a=!0);else if(5===s)break;return a}var l,_=e._startTime+1e-10,u=[],p=0,f=0===e._duration;for(n=r.length;--n>-1;)(o=r[n])===e||o._gc||o._paused||(o._timeline!==e._timeline?(l=l||U(e,0,f),0===U(o,l,f)&&(u[p++]=o)):_>=o._startTime&&o._startTime+o.totalDuration()/o._timeScale+1e-10>_&&((f||!o._initted)&&2e-10>=_-o._startTime||(u[p++]=o)));for(n=p;--n>-1;)o=u[n],2===s&&o._kill(i,t)&&(a=!0),(2!==s||!o._firstPT&&o._initted)&&o._enabled(!1,!1)&&(a=!0);return a},U=function(t,e,i){for(var s=t._timeline,r=s._timeScale,n=t._startTime,a=1e-10;s._timeline;){if(n+=s._startTime,r*=s._timeScale,s._paused)return-100;s=s._timeline}return n/=r,n>e?n-e:i&&n===e||!t._initted&&2*a>n-e?a:(n+=t.totalDuration()/t._timeScale/r)>e+a?0:n-e-a};s._init=function(){var t,e,i,s,r=this.vars,n=this._overwrittenProps,a=this._duration,o=r.ease;if(r.startAt){if(r.startAt.overwrite=0,r.startAt.immediateRender=!0,this._startAt=R.to(this.target,0,r.startAt),r.immediateRender&&(this._startAt=null,0===this._time&&0!==a))return}else if(r.runBackwards&&r.immediateRender&&0!==a)if(this._startAt)this._startAt.render(-1,!0),this._startAt=null;else if(0===this._time){i={};for(s in r)I[s]&&"autoCSS"!==s||(i[s]=r[s]);return i.overwrite=0,this._startAt=R.to(this.target,0,i),void 0}if(this._ease=o?o instanceof g?r.easeParams instanceof Array?o.config.apply(o,r.easeParams):o:"function"==typeof o?new g(o,r.easeParams):v[o]||R.defaultEase:R.defaultEase,this._easeType=this._ease._type,this._easePower=this._ease._power,this._firstPT=null,this._targets)for(t=this._targets.length;--t>-1;)this._initProps(this._targets[t],this._propLookup[t]={},this._siblings[t],n?n[t]:null)&&(e=!0);else e=this._initProps(this.target,this._propLookup,this._siblings,n);if(e&&R._onPluginEvent("_onInitAllProps",this),n&&(this._firstPT||"function"!=typeof this.target&&this._enabled(!1,!1)),r.runBackwards)for(i=this._firstPT;i;)i.s+=i.c,i.c=-i.c,i=i._next;this._onUpdate=r.onUpdate,this._initted=!0},s._initProps=function(t,e,i,s){var r,n,a,o,h,l,_;if(null==t)return!1;this.vars.css||t.style&&t.nodeType&&O.css&&this.vars.autoCSS!==!1&&A(this.vars,t);for(r in this.vars){if(I[r]){if(("onStartParams"===r||"onUpdateParams"===r||"onCompleteParams"===r||"onReverseCompleteParams"===r||"onRepeatParams"===r)&&(h=this.vars[r]))for(n=h.length;--n>-1;)"{self}"===h[n]&&(h=this.vars[r]=h.concat(),h[n]=this)}else if(O[r]&&(o=new O[r])._onInitTween(t,this.vars[r],this)){for(this._firstPT=l={_next:this._firstPT,t:o,p:"setRatio",s:0,c:1,f:!0,n:r,pg:!0,pr:o._priority},n=o._overwriteProps.length;--n>-1;)e[o._overwriteProps[n]]=this._firstPT;(o._priority||o._onInitAllProps)&&(a=!0),(o._onDisable||o._onEnable)&&(this._notifyPluginsOfEnabled=!0)}else this._firstPT=e[r]=l={_next:this._firstPT,t:t,p:r,f:"function"==typeof t[r],n:r,pg:!1,pr:0},l.s=l.f?t[r.indexOf("set")||"function"!=typeof t["get"+r.substr(3)]?r:"get"+r.substr(3)]():parseFloat(t[r]),_=this.vars[r],l.c="string"==typeof _&&"="===_.charAt(1)?parseInt(_.charAt(0)+"1",10)*Number(_.substr(2)):Number(_)-l.s||0;l&&l._next&&(l._next._prev=l)}return s&&this._kill(s,t)?this._initProps(t,e,i,s):this._overwrite>1&&this._firstPT&&i.length>1&&X(t,this,e,this._overwrite,i)?(this._kill(e,t),this._initProps(t,e,i,s)):a},s.render=function(t,e,i){var s,r,n,a=this._time;if(t>=this._duration)this._totalTime=this._time=this._duration,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1,this._reversed||(s=!0,r="onComplete"),0===this._duration&&((0===t||0>this._rawPrevTime)&&this._rawPrevTime!==t&&(i=!0,this._rawPrevTime>0&&(r="onReverseComplete",e&&(t=-1))),this._rawPrevTime=t);else if(1e-7>t)this._totalTime=this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==a||0===this._duration&&this._rawPrevTime>0)&&(r="onReverseComplete",s=this._reversed),0>t?(this._active=!1,0===this._duration&&(this._rawPrevTime>=0&&(i=!0),this._rawPrevTime=t)):this._initted||(i=!0);else if(this._totalTime=this._time=t,this._easeType){var o=t/this._duration,h=this._easeType,l=this._easePower;(1===h||3===h&&o>=.5)&&(o=1-o),3===h&&(o*=2),1===l?o*=o:2===l?o*=o*o:3===l?o*=o*o*o:4===l&&(o*=o*o*o*o),this.ratio=1===h?1-o:2===h?o:.5>t/this._duration?o/2:1-o/2}else this.ratio=this._ease.getRatio(t/this._duration);if(this._time!==a||i){if(!this._initted){if(this._init(),!this._initted)return;this._time&&!s?this.ratio=this._ease.getRatio(this._time/this._duration):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._active||this._paused||(this._active=!0),0===a&&(this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._time||0===this._duration)&&(e||this.vars.onStart.apply(this.vars.onStartScope||this,this.vars.onStartParams||d))),n=this._firstPT;n;)n.f?n.t[n.p](n.c*this.ratio+n.s):n.t[n.p]=n.c*this.ratio+n.s,n=n._next;this._onUpdate&&(0>t&&this._startAt&&this._startAt.render(t,e,i),e||this._onUpdate.apply(this.vars.onUpdateScope||this,this.vars.onUpdateParams||d)),r&&(this._gc||(0>t&&this._startAt&&!this._onUpdate&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this.vars[r].apply(this.vars[r+"Scope"]||this,this.vars[r+"Params"]||d)))}},s._kill=function(t,e){if("all"===t&&(t=null),null==t&&(null==e||e===this.target))return this._enabled(!1,!1);e="string"!=typeof e?e||this._targets||this.target:R.selector(e)||e;var i,s,r,n,a,o,h,l;if((e instanceof Array||S(e))&&"number"!=typeof e[0])for(i=e.length;--i>-1;)this._kill(t,e[i])&&(o=!0);else{if(this._targets){for(i=this._targets.length;--i>-1;)if(e===this._targets[i]){a=this._propLookup[i]||{},this._overwrittenProps=this._overwrittenProps||[],s=this._overwrittenProps[i]=t?this._overwrittenProps[i]||{}:"all";break}}else{if(e!==this.target)return!1;a=this._propLookup,s=this._overwrittenProps=t?this._overwrittenProps||{}:"all"}if(a){h=t||a,l=t!==s&&"all"!==s&&t!==a&&(null==t||t._tempKill!==!0);for(r in h)(n=a[r])&&(n.pg&&n.t._kill(h)&&(o=!0),n.pg&&0!==n.t._overwriteProps.length||(n._prev?n._prev._next=n._next:n===this._firstPT&&(this._firstPT=n._next),n._next&&(n._next._prev=n._prev),n._next=n._prev=null),delete a[r]),l&&(s[r]=1);!this._firstPT&&this._initted&&this._enabled(!1,!1)}}return o},s.invalidate=function(){return this._notifyPluginsOfEnabled&&R._onPluginEvent("_onDisable",this),this._firstPT=null,this._overwrittenProps=null,this._onUpdate=null,this._startAt=null,this._initted=this._active=this._notifyPluginsOfEnabled=!1,this._propLookup=this._targets?{}:[],this},s._enabled=function(t,e){if(n||r.wake(),t&&this._gc){var i,s=this._targets;if(s)for(i=s.length;--i>-1;)this._siblings[i]=L(s[i],this,!0);else this._siblings=L(this.target,this,!0)}return P.prototype._enabled.call(this,t,e),this._notifyPluginsOfEnabled&&this._firstPT?R._onPluginEvent(t?"_onEnable":"_onDisable",this):!1},R.to=function(t,e,i){return new R(t,e,i)},R.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new R(t,e,i)},R.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new R(t,e,s)},R.delayedCall=function(t,e,i,s,r){return new R(e,0,{delay:t,onComplete:e,onCompleteParams:i,onCompleteScope:s,onReverseComplete:e,onReverseCompleteParams:i,onReverseCompleteScope:s,immediateRender:!1,useFrames:r,overwrite:0})},R.set=function(t,e){return new R(t,0,e)},R.killTweensOf=R.killDelayedCallsTo=function(t,e){for(var i=R.getTweensOf(t),s=i.length;--s>-1;)i[s]._kill(e,t)},R.getTweensOf=function(t){if(null==t)return[];t="string"!=typeof t?t:R.selector(t)||t;var e,i,s,r;if((t instanceof Array||S(t))&&"number"!=typeof t[0]){for(e=t.length,i=[];--e>-1;)i=i.concat(R.getTweensOf(t[e]));for(e=i.length;--e>-1;)for(r=i[e],s=e;--s>-1;)r===i[s]&&i.splice(e,1)}else for(i=L(t).concat(),e=i.length;--e>-1;)i[e]._gc&&i.splice(e,1);return i};var z=c("plugins.TweenPlugin",function(t,e){this._overwriteProps=(t||"").split(","),this._propName=this._overwriteProps[0],this._priority=e||0,this._super=z.prototype},!0);if(s=z.prototype,z.version="1.9.1",z.API=2,s._firstPT=null,s._addTween=function(t,e,i,s,r,n){var a,o;null!=s&&(a="number"==typeof s||"="!==s.charAt(1)?Number(s)-i:parseInt(s.charAt(0)+"1",10)*Number(s.substr(2)))&&(this._firstPT=o={_next:this._firstPT,t:t,p:e,s:i,c:a,f:"function"==typeof t[e],n:r||e,r:n},o._next&&(o._next._prev=o))},s.setRatio=function(t){for(var e,i=this._firstPT,s=1e-6;i;)e=i.c*t+i.s,i.r?e=e+(e>0?.5:-.5)>>0:s>e&&e>-s&&(e=0),i.f?i.t[i.p](e):i.t[i.p]=e,i=i._next},s._kill=function(t){var e,i=this._overwriteProps,s=this._firstPT;if(null!=t[this._propName])this._overwriteProps=[];else for(e=i.length;--e>-1;)null!=t[i[e]]&&i.splice(e,1);for(;s;)null!=t[s.n]&&(s._next&&(s._next._prev=s._prev),s._prev?(s._prev._next=s._next,s._prev=null):this._firstPT===s&&(this._firstPT=s._next)),s=s._next;return!1},s._roundProps=function(t,e){for(var i=this._firstPT;i;)(t[this._propName]||null!=i.n&&t[i.n.split(this._propName+"_").join("")])&&(i.r=e),i=i._next},R._onPluginEvent=function(t,e){var i,s,r,n,a,o=e._firstPT;if("_onInitAllProps"===t){for(;o;){for(a=o._next,s=r;s&&s.pr>o.pr;)s=s._next;(o._prev=s?s._prev:n)?o._prev._next=o:r=o,(o._next=s)?s._prev=o:n=o,o=a}o=e._firstPT=r}for(;o;)o.pg&&"function"==typeof o.t[t]&&o.t[t]()&&(i=!0),o=o._next;return i},z.activate=function(t){for(var e=t.length;--e>-1;)t[e].API===z.API&&(O[(new t[e])._propName]=t[e]);return!0},f.plugin=function(t){if(!(t&&t.propName&&t.init&&t.API))throw"illegal plugin definition.";var e,i=t.propName,s=t.priority||0,r=t.overwriteProps,n={init:"_onInitTween",set:"setRatio",kill:"_kill",round:"_roundProps",initAll:"_onInitAllProps"},a=c("plugins."+i.charAt(0).toUpperCase()+i.substr(1)+"Plugin",function(){z.call(this,i,s),this._overwriteProps=r||[]},t.global===!0),o=a.prototype=new z(i);o.constructor=a,a.API=t.API;for(e in n)"function"==typeof t[e]&&(o[n[e]]=t[e]);return a.version=t.version,z.activate([a]),a},e=t._gsQueue){for(i=0;e.length>i;i++)e[i]();for(s in u)u[s].func||t.console.log("GSAP encountered missing dependency: com.greensock."+s)}n=!1}(window);;/**
 * author Remy Sharp
 * url http://remysharp.com/2009/01/26/element-in-view-event-plugin/
 * fork https://github.com/zuk/jquery.inview
 */
(function($) {
    'use strict';

    function getScrollTop() {
        return window.pageYOffset ||
            document.documentElement.scrollTop ||
            document.body.scrollTop;
    }

    function getViewportHeight() {
        var height = window.innerHeight; // Safari, Opera
        // if this is correct then return it. iPad has compat Mode, so will
        // go into check clientHeight (which has the wrong value).
        if (height) {
            return height;
        }
        var mode = document.compatMode;

        if ((mode || !$.support.boxModel)) { // IE, Gecko
            height = (mode === 'CSS1Compat') ?
                document.documentElement.clientHeight : // Standards
                document.body.clientHeight; // Quirks
        }

        return height;
    }

    function offsetTop(debug) {
        // Manually calculate offset rather than using jQuery's offset
        // This works-around iOS < 4 on iPad giving incorrect value
        // cf http://bugs.jquery.com/ticket/6446#comment:9
        var curtop = 0;
        for (var obj = debug; obj; obj = obj.offsetParent) {
            curtop += obj.offsetTop;
        }
        return curtop;
    }

    function checkInView() {
        var viewportTop = getScrollTop(),
            viewportBottom = viewportTop + getViewportHeight(),
            elems = [];

        // naughty, but this is how it knows which elements to check for
        $.each($.cache, function() {
            if (this.events && this.events.inview) {
                elems.push(this.handle.elem);
            }
        });

        $(elems).each(function() {
            var $el = $(this),
                elTop = offsetTop(this),
                elHeight = $el.height(),
                elBottom = elTop + elHeight,
                wasInView = $el.data('inview') || false,
                offset = $el.data('offset') || 0,
                inView = elTop > viewportTop && elBottom < viewportBottom,
                isBottomVisible = elBottom + offset > viewportTop && elTop < viewportTop,
                isTopVisible = elTop - offset < viewportBottom && elBottom > viewportBottom,
                inViewWithOffset = inView || isBottomVisible || isTopVisible ||
                    (elTop < viewportTop && elBottom > viewportBottom);

            if (inViewWithOffset) {
                var visPart = (isTopVisible) ? 'top' : (isBottomVisible) ? 'bottom' : 'both';
                if (!wasInView || wasInView !== visPart) {
                    $el.data('inview', visPart);
                    $el.trigger('inview', [true, visPart]);
                }
            } else if (!inView && wasInView) {
                $el.data('inview', false);
                $el.trigger('inview', [false]);
            }
        });
    }

    function createFunctionLimitedToOneExecutionPerDelay(fn, delay) {
        var shouldRun = false;
        var timer = null;

        function runOncePerDelay() {
            if (timer !== null) {
                shouldRun = true;
                return;
            }
            shouldRun = false;
            fn();
            timer = setTimeout(function() {
                timer = null;
                if (shouldRun) {
                    runOncePerDelay();
                }
            }, delay);
        }

        return runOncePerDelay;
    }

    // ready.inview kicks the event to pick up any elements already in view.
    // note however, this only works if the plugin is included after the elements are bound to 'inview'
    var runner = createFunctionLimitedToOneExecutionPerDelay(checkInView, 100);
    $(window).on('checkInView.inview click.inview ready.inview scroll.inview resize.inview', runner);

})(jQuery);
