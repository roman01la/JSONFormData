/* global JSONFormData, console */

/* Unofficial Draft: http://darobin.github.io/formic/specs/json/ */

(function (window, undefined) {
  'use strict';

  /* Constructor */
  window.JSONFormData = function (formElement, callback) {
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
          var xhr = new XMLHttpRequest();

          xhr.open(self.method, self.action);
          xhr.setRequestHeader('Content-Type', self.enctype);
          xhr.send(JSON.stringify(self.formData));

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
        });
      }, false);
    } else {
      self.extractValues(fields);
    }
  };

  /* Extract values from form & construct JSONFormData object */
  JSONFormData.prototype.extractValues = function (fields, callback) {
    var self = this,
        fieldsLn = fields.length - 1,
        hasFiles = false,
        safeIndex = null;

    [].forEach.call(fields, function (field, index) {
      safeIndex = index;

      if (field.type !== 'submit') {
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
        } else {
          self.formData[field.name] = field.value;
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

  /* Determine HTTP request method */
  JSONFormData.prototype.getMethod = function() {
    var methodName = this.form.getAttribute('method').toLowerCase(),
        method;

    switch (methodName) {
      case 'post':
        method = 'post';
        break;
      case 'put':
        method = 'put';
        break;
      case 'delete':
        method = 'delete';
        break;
      default:
        method = 'get';
    }

    return method;
  };

})(window);
