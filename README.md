TooLegit.js
===========
JS library for simple form validation. Requires Zepto or jQuery.

http://en.wikipedia.org/wiki/Too_Legit_to_Quit

Usage
=====

This is a work in progress...

```javascript
var validator = TooLegit($('#form1'), {
  ruleSelectors : {
    '.required' : {
      required : true
    },
    '[name="username"]' : {
      minlength : 10
    },
    '[name="email"]' : {
      email : true
    }
  },
  rules : {
    // these should return false if the field is valid
    // if invalid, return the message to be shown
    email : function ($el, enabled, otherRules) {
      var value = $.trim($el.val());
      var length = value.length;
      var message = (length && myIsEmailFn(value)) ? false : 'email required';
      if (!otherRules.required && length === 0) {
        return false;
      }
      return message;
    }
  },
  options : {
    errorClass : 'error',
    validClass : 'valid',
    ignore : ['.ignore'],
    onError : function ($el, rule) {
      // called whenever an error message is shown for a field
    },
    errorElement : function ($el) {
      // element to insert error message into
      // return value is cached
    },
    container : function ($el) {
      // element to add/remove error/valid classes from
      // return value is cached
    },
    preSubmit : function () {
      // called right before submission
    },
    submit : function (form) {
      // custom submit handler
      // should probably call form.submit()
    }
  }
});
```