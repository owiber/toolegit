(function( $ ) {

  var defaultOptions = {
    errorClass : 'error',
    validClass : 'success',
    ignore : ['.ignore'],
    errorElement : function ($el) {
      return $el.closest('.control-group').find('.help-block');
    },
    container : function ($el) {
      return $el.closest('.control-group');
    },
    counter : function ($el, min) {
      return Math.max(0, min - $el.val().length) || '';
    },
    submit : null //function () { console.log('submit!'); }
  };

  var defaultRules = {
    required : function ($el) {
      return !$el.val() ? 'required' : false;
    },
    minlength : function ($el, min) {
      var diff = min - $el.val().length;
      return (diff > 0) ? 'requires ' + diff + ' more character(s)' : false;
    }
  };

  var defaultRuleSelectors = {
    // selector : { rule : param }
  };

  var Validator = function (config, form) {
    var self = this;
    self.errorElementsCache = {};
    self.containerCache = {};
    self.elementRulesCache = {}
    self.options = $.extend({}, defaultOptions, config.options);
    self.ruleSelectors = $.extend({}, defaultRuleSelectors, config.ruleSelectors);
    self.rules = $.extend({}, defaultRules, config.rules);
    self.options.ignore = self.options.ignore.join(',');
    self.myForm = form;
    self.inputs = form.find('input, button, textarea, select').not(self.options.ignore);
    $.each(self.inputs, function (index, input) {
      var $el = $(input);
      var elementRules;
      if ($el.attr('name')) {
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
      var name = $el.attr('name');
      var elementRules = {};
      if (self.elementRulesCache[name]) {
        return self.elementRulesCache[name];
      }
      self.elementRulesCache[name] = {}
      $.each(self.ruleSelectors, function (selector, rules) {
        if ($el.is(selector)) {
          $.each(rules, function (rule, param) {
            self.elementRulesCache[name][rule] = param;
          });
        }
      });
      return self.elementRulesCache[name];
    },
    cachedErrorElement : function ($el) {
      var name = $el.attr('name');
      this.errorElementsCache[name] = this.errorElementsCache[name] || this.options.errorElement($el);
      return this.errorElementsCache[name];
    },
    cachedContainer : function ($el) {
      var name = $el.attr('name');
      this.containerCache[name] = this.containerCache[name] || this.options.container($el);
      return this.containerCache[name];
    },
    addRule : function (ruleName, ruleFn) {
      this.rules[ruleName] = ruleFn;
      return this;
    },
    removeRule : function (ruleName, ruleFn) {
      this.rules[ruleName] = function () { return false; };
      return this;
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
    setupHandlers : function () {
      //console.log('init', this);
      var self = this;

      function checkEl (e) {
        var $el = $(e.currentTarget);
        var name = $el.attr('name');
        var elementRules;
        if (name) {
          elementRules = self.cachedElementRules($el);
          if (e.type === 'keyup') {
            if (elementRules.minlength) {
              self.cachedErrorElement($el).html(self.options.counter($el, elementRules.minlength));
            }
          }
          if ((e.type === 'focusout' || e.type === 'change' || name in self.containerCache) && $el.not(self.options.ignore)) {
            self.check($el);
          }
        }
      }

      self.myForm
        .on('focusin focusout keyup', '[type=text], [type=password], [type=file], select, textarea', checkEl)
        .on('change', '[type=radio], [type=checkbox], select, option', checkEl);

      self.myForm.submit(function (e) {
        e.preventDefault();
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
    check : function ($el) {
      var self = this;
      var name = $el.attr('name');
      var errorElement;
      var container;
      var error = false;
      // only validate elements with names
      if (name) {
        $.each(self.cachedElementRules($el), function (rule, param) {
          var ruleFailed = self.rules[rule]($el, param);
          if (ruleFailed) {
            error = ruleFailed;
          }
        });
        if (error) {
          self.cachedErrorElement($el).html(error);
          self.cachedContainer($el).addClass(self.options.errorClass).removeClass(self.options.validClass);
        } else {
          self.cachedErrorElement($el).html('');
          self.cachedContainer($el).removeClass(self.options.errorClass).addClass(self.options.validClass);
        }
        return !error;
      }
      return true;
      //console.log('element', self.myForm[0].id, $el);
    },
    valid : function () {
      var self = this;
      var valid = true;
      $(self.inputs).each(function (index, input) {
        valid = self.check($(input)) && valid;
      });
      return valid;
    }
  });


  $.fn.toolegit = function(config) {
    if (!this.length) {
      return;
    }
    return new Validator(config || {}, $(this[0]));
  };

})(Zepto);