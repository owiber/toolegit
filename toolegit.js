/**
 * toolegit.js - Basic Form Validation
 * https://github.com/owiber/toolegit
 *
 * Copyright (c) 2012 Oliver Wong
 *
 * Inspired by:
 * jQuery Validation Plugin 1.9.0
 * http://bassistance.de/jquery-plugins/jquery-plugin-validation/
 * http://docs.jquery.com/Plugins/Validation
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function($) {

  window.TooLegit = function($form, config) {
    if (!$form.length) {
      return;
    }
    return new Validator(config || {}, $form.first());
  };

  var defaultOptions = TooLegit.defaultOptions = {
    errorClass : 'error',
    validClass : 'success',
    ignore : ['.ignore'],
    onError : function () {},
    errorElement : function ($el) {
      return $el.closest('.control-group').find('.help-block');
    },
    container : function ($el) {
      return $el.closest('.control-group');
    },
    counter : function ($el, min) {
      return Math.max(0, min - $.trim($el.val()).length) || '';
    },
    preSubmit : function () {},
    submit : null //function () { console.log('submit!'); }
  };

  var defaultRules = TooLegit.defaultRules = {
    required : function ($el, required) {
      var noValue = $el.is('[type=radio], [type=checkbox]') ? !$el.length : !$.trim($el.val());
      return (required && noValue) ? 'required' : false;
    },
    minlength : function ($el, min, otherRules) {
      var length = $.trim($el.val()).length;
      var diff = min - length;
      var returnValue = (diff > 0) ? diff + ' character(s) too short' : false;
      if (!otherRules.required && length === 0) {
        return false;
      }
      return returnValue;
    },
    maxlength : function ($el, max) {
      var diff = $.trim($el.val()).length - max;
      return (diff > 0) ? diff + ' character(s) too long' : false;
    }
  };

  var defaultRuleSelectors = TooLegit.defaultRuleSelectors = {
    // selector : { rule : param }
  };

  var Validator = function (config, form) {
    var self = this;
    self.cache = {
      errorElements : {},
      elementRules : {},
      containers : {},
      shouldShowErrors : {}
    };
    self.options = $.extend({}, defaultOptions, config.options);
    self.ruleSelectors = $.extend({}, defaultRuleSelectors, config.ruleSelectors);
    self.rules = $.extend({}, defaultRules, config.rules);
    self.options.ignore = self.options.ignore.join(',');
    self.myForm = form;
    form.prop('novalidate', 'novalidate');
    self.inputs = form.find('input, button, textarea, select').not(self.options.ignore);
    $.each(self.inputs, function (index, input) {
      var $el = $(input);
      var elementRules;
      if ($el.prop('name')) {
        elementRules = self.cachedElementRules($el);
        if (elementRules.minlength) {
          self.cachedErrorElement($el).html(self.options.counter($el, elementRules.minlength));
        }
      }
    });
    self.setupHandlers();
    return self;
  };

  $.extend(Validator.prototype, {
    cachedElementRules : function ($el) {
      var self = this;
      var name = $el.prop('name');
      var elementRules = {};
      if (self.cache.elementRules[name]) {
        return self.cache.elementRules[name];
      }
      self.cache.elementRules[name] = {}
      $.each(self.ruleSelectors, function (selector, rules) {
        if ($el.is(selector)) {
          $.each(rules, function (rule, param) {
            self.cache.elementRules[name][rule] = param;
          });
        }
      });
      return self.cache.elementRules[name];
    },
    cachedErrorElement : function ($el) {
      var name = $el.prop('name');
      this.cache.errorElements[name] = this.cache.errorElements[name] || this.options.errorElement($el);
      return this.cache.errorElements[name];
    },
    cachedContainer : function ($el) {
      var name = $el.prop('name');
      this.cache.containers[name] = this.cache.containers[name] || this.options.container($el);
      return this.cache.containers[name];
    },
    addRule : function (ruleName, ruleFn) {
      this.rules[ruleName] = ruleFn;
      return this;
    },
    removeRule : function (ruleName) {
      var self = this;
      var rules = $.isArray(ruleName) ? ruleName : [ruleName];
      $.each(rules, function (index, rule) {
        self.rules[rule] = function () { return false; };
      })
      return self;
    },
    removeSelectorRules : function ($el, rules) {
      var elementRules = this.cachedElementRules($el);
      $.each(rules, function (index, rule) {
        delete elementRules[$.isArray(rules) ? rule : index];
      });
      return this;
    },
    addSelectorRules : function ($el, rules) {
      $.extend(this.cachedElementRules($el), rules);
      return this;
    },
    counter : function (el) {
      var $el = $(el);
      var minlength = this.cachedElementRules($el).minlength;
      if (minlength) {
        this.cachedErrorElement($el).html(this.options.counter($el, minlength));
      }
    },
    setupHandlers : function () {
      //console.log('init', this);
      var self = this;

      function checkEl (e) {
        var $el = $(e.currentTarget);
        var name = $el.prop('name');
        if (name) {
          if ($.trim($el.val()).length === 0) {
            self.cachedContainer($el).removeClass(self.options.validClass + ' ' + self.options.errorClass);
            delete self.cache.shouldShowErrors[name];
          }
          if (e.type === 'keyup') {
            self.counter($el);
          }
          if ((e.type === 'focusout' || e.type === 'change' || name in self.cache.shouldShowErrors) && $el.not(self.options.ignore)) {
            self.check($el);
          }
        }
      }

      self.myForm
        .on('focusin focusout keyup', '[type=text], [type=password], [type=file], select, textarea', checkEl)
        .on('change', '[type=radio], [type=checkbox], select, option', checkEl);

      self.myForm.submit(function (e) {
        //e.preventDefault();
        self.options.preSubmit.call(self, e);
        if (!self.valid()) {
          return false;
        }
        if (self.options.submit) {
          self.options.submit.call(self, self.myForm[0]);
          return false;
        }
        return true;
      });
    },
    element : function (el) {
      return this.check($(el));
    },
    check : function ($el) {
      var self = this;
      var name = $el.prop('name');
      var error = false;
      var $validationEl = $el;
      var elementRules;
      // only validate elements with names
      if (name) {
        if ($el.is('[type=radio], [type=checkbox]')) {
          $validationEl = self.myForm.find('[name="' + name + '"]').filter(':checked');
        }
        elementRules = self.cachedElementRules($el);
        $.each(elementRules, function (rule, param) {
          var ruleFailed = self.rules[rule]($validationEl, param, elementRules);
          if (ruleFailed) {
            error = ruleFailed;
            self.options.onError.call(self, $el, rule);
          }
        });
        if (error) {
          self.cachedErrorElement($el).html(error);
          self.cachedContainer($el).addClass(self.options.errorClass).removeClass(self.options.validClass);
        }
        else {
          self.cachedErrorElement($el).html('');
          self.cachedContainer($el).removeClass(self.options.errorClass).addClass(self.options.validClass);
        }
        self.cache.shouldShowErrors[name] = true;
        return !error;
      }
      return true;
      //console.log('element', self.myForm[0].id, $el);
    },
    valid : function () {
      var self = this;
      var valid = true;
      $(self.inputs).each(function (index, input) {
        valid = self.element(input) && valid;
      });
      return valid;
    }
  });

})(Zepto || jQuery);