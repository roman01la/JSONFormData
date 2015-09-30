/* global JSONFormData, console */

/* Unofficial Draft: http://darobin.github.io/formic/specs/json/ */

(function (window, undefined) {
  'use strict';

  /* Constructor */
  window.JSONFormData = function (formElement, callback) {

    if (!window.console) {
      window.console.log = window.console.warn = function(){};
    }

    if (formElement.getAttribute('enctype') !== 'application/json') {
        console.warn('Wrong form enctype!');
    } else {
      return this.initialize(formElement, callback);
    }
  };

  /* Initialize form */
  JSONFormData.prototype.initialize = function (formElement, callback) {
    var self = this,
        fields = formElement.elements;

    this.form = formElement;

    this.enctype = 'application/json';
    this.action = formElement.action;
    this.method = this.getMethod();

    this.formData = {};

    if (callback) {
      this.form.addEventListener('submit', function (e) {
        e.preventDefault();

        self.extractValues(fields, function() {
          var xhr = new XMLHttpRequest(),
              requestURL,
              urlencoded;

          if (self.method === 'get') {
            urlencoded = self.toUrlEncoded(self.formData);
          }

          requestURL = urlencoded ? self.action + '?' + urlencoded : self.action;

          xhr.open(self.method, requestURL);
          xhr.setRequestHeader('Content-Type', self.enctype);

          xhr.addEventListener('loadend', function() {
            if (this.status !== 200) {
              callback({
                code: this.status,
                message: this.statusText
              });
            } else {
              callback(null, this.response);
            }
          }, false);

          xhr.send(urlencoded ? null : JSON.stringify(self.formData));
        });
      }, false);
    } else {
      self.extractValues(fields);
    }
  };

  /* Determine what kind of accessor we are dealing with */
  JSONFormData.prototype.accessorType = function(key) {
    return (key === '[]' || typeof key === 'number' && key % 1 === 0) ? 'array' : 'object';
  };

  /* Perform full evaluation on path and set value */
  JSONFormData.prototype.putFormData = function(path, value, type) {
    var self = this,
      accessorRegex = /\[(.*?)]/g,
      matches,
      accessors = [],
      firstKey = path.match(/(.+?)\[/);

    if(firstKey === null) {
      firstKey = path;
    } else {
      firstKey = firstKey[1];
    }

    /* use coerced integer value if we can */
    value = (type === 'number') ? parseInt(value, 10) : value;

    while ((matches = accessorRegex.exec(path))) {

      /* If this is blank then we're using array append syntax
         If this is an integer key, save it as an integer rather than a string. */
      var parsedMatch = parseInt(matches[1], 10);
      if(matches[1] === '') {
        accessors.push('[]');
      } else if (parsedMatch == matches[1]) {
        accessors.push(parsedMatch);
      } else {
        accessors.push(matches[1]);
      }
    }

    if(accessors.length > 0) {
      var accessor = accessors[0];
      var accessorType = self.accessorType(accessors[0]);
      var formDataTraverser;

      if(typeof self.formData[firstKey] === 'undefined') {
        if(accessorType === 'object') {
          self.formData[firstKey] = {};
        } else {
          self.formData[firstKey] = [];
        }
      } else {
        if(typeof self.formData[firstKey] !== 'object') {
          self.formData[firstKey] = {'':self.formData[firstKey]};
        }
      }

      formDataTraverser = self.formData[firstKey];
      for (var i = 0; i < accessors.length - 1; i++) {
        accessorType = self.accessorType(accessors[i + 1]);
        accessor = accessors[i];

        if(typeof formDataTraverser[accessor] === 'undefined') {
          if(accessorType === 'object') {
            formDataTraverser[accessor] = {};
          } else {
            formDataTraverser[accessor] = [];
          }
        }

        if(typeof formDataTraverser[accessor] !== 'object' && i < accessors.length - 1) {
          formDataTraverser[accessor] = {'': formDataTraverser[accessor]};
        }

        formDataTraverser = formDataTraverser[accessor];
      }

      var finalAccessor = accessors[accessors.length - 1];
      if(finalAccessor === '[]') {
        formDataTraverser.push(value);
      } else if(typeof formDataTraverser[finalAccessor] === 'undefined') {
        formDataTraverser[finalAccessor] = value;
      } else if(formDataTraverser[finalAccessor] instanceof Array) {
        formDataTraverser[finalAccessor].push(value);
      } else {
        formDataTraverser[finalAccessor] = [formDataTraverser[finalAccessor], value];
      }
    } else {
      if(typeof self.formData[firstKey] === 'undefined') {
        self.formData[firstKey] = value;
      } else if(self.formData[firstKey] instanceof Array) {
        self.formData[firstKey].push(value);
      } else {
        self.formData[firstKey] = [self.formData[firstKey], value];
      }
    }
  };

  /* Extract values from form & construct JSONFormData object */
  JSONFormData.prototype.extractValues = function (fields, callback) {
    var self = this,
        fieldsLn = fields.length - 1,
        hasFiles = false,
        safeIndex = null,
        isCheckable = false,
        isButton = false;

    self.formData = {};

    [].forEach.call(fields, function (field, index) {
      safeIndex = index;
      isCheckable = (field.type === 'checkbox' || field.type === 'radio');
      isButton = (field.type === 'button' || field.type === 'reset' || field.type === 'submit' || field.nodeName.toLowerCase() === 'button');

      if (!isButton && !field.disabled) {
        if (field.type === 'file' && !!field.files.length) {
          hasFiles = true;
          self.fileToJSON(field.files, field.name, function (err) {
            if (err) {
              console.warn(err.message);
            }
            if (safeIndex === fieldsLn) {
              if (callback) {
                callback();
              }
            }
          });
        } else if(field.type === 'select-multiple'){
          [].forEach.call(field.selectedOptions, function(option){
            self.putFormData(field.name + '[]', option.value, field.type);
          });
        } else if(!isCheckable || (isCheckable && field.checked)) {
          self.putFormData(field.name, field.value, field.type);
        }
      }
    });

    if (!hasFiles && callback) {
      callback();
    }
  };

  /* Read files as base64 */
  JSONFormData.prototype.fileToJSON = function (files, name, callback) {
    var self = this,
        filesLn = files.length - 1;

    if (files.length > -1) {
      self.formData[name] = [];

      [].forEach.call(files, function (file, index) {
        if (file.size > 5*1024*1024) {
          return callback({message: 'One or more files is >5MB'});
        } else {
          var fileReader = new FileReader();

          fileReader.readAsDataURL(file);

          fileReader.addEventListener('loadend', function() {
            self.formData[name].push({
              type: file.type,
              name: file.name,
              body: fileReader.result.split('base64,')[1]
            });

            if (index === filesLn) {
              callback(null);
            }
          }, false);
        }
      });
    } else {
      callback({message: 'No files has been found!'});
    }
  };

  /* https://gist.github.com/dgs700/4677933 */
  JSONFormData.prototype.toUrlEncoded = function (formDataObj) {
    var urlString = [],
        r20 = /%20/g,
        output;

    if (formDataObj instanceof Array) {
      for (var name in formDataObj) {
        this.appendUrlEncoded(name, formDataObj[name], urlString);
      }
    } else {
      for (var prefix in formDataObj) {
        this.buildParams(prefix, formDataObj[prefix], urlString);
      }
    }

    output = urlString.join('&').replace(r20, '+');

    return output;
  };

  JSONFormData.prototype.appendUrlEncoded = function (key, value, urlString) {
    // If value is a function, invoke it and return its value
    value = ( typeof value === 'function' ) ? value() : ( value === null ? '' : value );
    urlString[urlString.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
  };

  JSONFormData.prototype.buildParams = function (prefix, obj, urlString) {
    var name, i, l, rbracket;

    rbracket = /\[\]$/;

    if (obj instanceof Array) {
      for (i = 0, l = obj.length; i < l; i++) {
        if (rbracket.test(prefix)) {
          this.appendUrlEncoded(prefix, obj[i], urlString);
        } else {
          this.buildParams(prefix + '[' + ( typeof obj[i] === 'object' ? i : '' ) + ']', obj[i], urlString);
        }
      }
    } else if (typeof obj === 'object') {
      // Serialize object item.
      for (name in obj) {
        this.buildParams(prefix + '[' + name + ']', obj[name], urlString);
      }
    } else {
      // Serialize scalar item.
      this.appendUrlEncoded(prefix, obj, urlString);
    }
  };

  /* Determine HTTP request method */
  JSONFormData.prototype.getMethod = function() {
    var methodName = this.form.getAttribute('method') || 'get';
    return methodName.toLowerCase();
  };

})(window);
