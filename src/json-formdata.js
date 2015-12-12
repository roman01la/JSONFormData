/* global JSONFormData, console */

/* Unofficial Draft: http://darobin.github.io/formic/specs/json/ */
export default class JSONFormData{
  constructor(formElement, callback) {
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
  initialize(formElement, callback) {
        const fields = formElement.elements;

        this.form = formElement;
        this.enctype = 'application/json';
        this.action = formElement.action;
        this.method = this.getMethod();

        this.formData = {};

        if (callback) {
            this.form.addEventListener('submit', e => {
                e.preventDefault();

                this.extractValues(fields, () => {
                    let xhr = new XMLHttpRequest(), requestURL, urlencoded;

                    if (this.method === 'get') {
                        urlencoded = this.toUrlEncoded(this.formData);
                    }

                    requestURL = urlencoded ? `${ this.action }?${ urlencoded }` : this.action;

                    xhr.open(this.method, requestURL);

                    xhr.setRequestHeader('Content-Type', this.enctype);

                    xhr.addEventListener('loadend', () => {
                        if (this.status !== 200) {
                            callback({
                                code: this.status,
                                message: this.statusText
                            });
                        } else {
                            callback(null, this.response);
                        }
                    }, false);

                    xhr.send(urlencoded ? null : JSON.stringify(this.formData));
                });
            }, false);
        } else {
            this.extractValues(fields);
        }
    }

  /* Determine what kind of accessor we are dealing with */
  accessorType(key) {
    return (key === '[]' || typeof key === 'number' && key % 1 === 0) ? 'array' : 'object';
  };

  /* Perform full evaluation on path and set value */
  putFormData(path, value, type) {
        let accessorRegex = /\[(.*?)]/g,
            matches,
            accessors = [],
            firstKey = path.match(/(.+?)\[/);

        if (firstKey === null) {
            firstKey = path;
        } else {
            firstKey = firstKey[1];
        }

        /* use coerced integer value if we can */
        value = (type === 'number') ? parseInt(value, 10) : value;
        while (matches = accessorRegex.exec(path)) {
         /* If this is blank then we're using array append syntax
            If this is an integer key, save it as an integer rather than a string. */
            const parsedMatch = parseInt(matches[1], 10);

            if (matches[1] === '') {
                accessors.push('[]');
            } else if (parsedMatch == matches[1]) {
                accessors.push(parsedMatch);
            } else {
                accessors.push(matches[1]);
            }
        }
        if (accessors.length > 0) {
            let accessor = accessors[0];
            let accessorType = this.accessorType(accessors[0]);
            let formDataTraverser;

            if (typeof this.formData[firstKey] === 'undefined') {
                if (accessorType === 'object') {
                    this.formData[firstKey] = {};
                } else {
                    this.formData[firstKey] = [];
                }
            } else {
                if (typeof this.formData[firstKey] !== 'object') {
                    this.formData[firstKey] = { '': this.formData[firstKey] };
                }
            }

            formDataTraverser = this.formData[firstKey];

            for (let i = 0; i < accessors.length - 1; i++) {
                accessorType = this.accessorType(accessors[i + 1]);
                accessor = accessors[i];

                if (typeof formDataTraverser[accessor] === 'undefined') {
                    if (accessorType === 'object') {
                        formDataTraverser[accessor] = {};
                    } else {
                        formDataTraverser[accessor] = [];
                    }
                }

                if (typeof formDataTraverser[accessor] !== 'object' && i < accessors.length - 1) {
                    formDataTraverser[accessor] = { '': formDataTraverser[accessor] };
                }
                formDataTraverser = formDataTraverser[accessor];
            }

            let finalAccessor = accessors[accessors.length - 1];

            if (finalAccessor === '[]') {
                formDataTraverser.push(value);
            } else if (typeof formDataTraverser[finalAccessor] === 'undefined') {
                formDataTraverser[finalAccessor] = value;
            } else if (formDataTraverser[finalAccessor] instanceof Array) {
                formDataTraverser[finalAccessor].push(value);
            } else {
                formDataTraverser[finalAccessor] = [
                    formDataTraverser[finalAccessor],
                    value
                ];
            }
        } else {
            if (typeof this.formData[firstKey] === 'undefined') {
                this.formData[firstKey] = value;
            } else if (this.formData[firstKey] instanceof Array) {
                this.formData[firstKey].push(value);
            } else {
                this.formData[firstKey] = [
                    this.formData[firstKey],
                    value
                ];
            }
        }
    }

  /* Extract values from form & construct JSONFormData object */
  extractValues(fields, callback) {
        let fieldsLn = fields.length - 1,
            hasFiles = false,
            safeIndex = null,
            isCheckable = false,
            isButton = false;

            this.formData = {};

            [].forEach.call(fields, (field, index) => {
                safeIndex = index;
                isCheckable = field.type === 'checkbox' || field.type === 'radio';
                isButton = field.type === 'button' || field.type === 'reset' || field.type === 'submit' || field.nodeName.toLowerCase() === 'button';

                if (!isButton && !field.disabled) {
                    if (field.type === 'file' && !!field.files.length) {
                        hasFiles = true;

                        this.fileToJSON(field.files, field.name, err => {
                            if (err) {
                                console.warn(err.message);
                            }
                            if (safeIndex === fieldsLn) {
                                if (callback) {
                                    callback();
                                }
                            }
                        });
                    } else if (field.type === 'select-multiple') {
                        [].forEach.call(field.selectedOptions, option => {
                            this.putFormData(`${ field.name }[]`, option.value, field.type);
                        });
                    } else if (!isCheckable || isCheckable && field.checked) {
                        this.putFormData(field.name, field.value, field.type);
                    }
                }
            });

            if (!hasFiles && callback) {
                callback();
            }
    }

  /* Read files as base64 */
  fileToJSON(files, name, callback) {
        const filesLn = files.length - 1;

        if (files.length > -1) {
            this.formData[name] = [];

            [].forEach.call(files, (file, index) => {
                if (file.size > 5 * 1024 * 1024) {
                    return callback({ message: 'One or more files is >5MB' });
                } else {
                    const fileReader = new FileReader();

                    fileReader.readAsDataURL(file);

                    fileReader.addEventListener('loadend', () => {
                        this.formData[name].push({
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
            callback({ message: 'No files has been found!' });
        }
    }

  /* https://gist.github.com/dgs700/4677933 */
  toUrlEncoded(formDataObj) {
        let urlString = [], r20 = /%20/g, output;

        if (formDataObj instanceof Array) {
            for (const name in formDataObj) {
                this.appendUrlEncoded(name, formDataObj[name], urlString);
            }
        } else {
            for (const prefix in formDataObj) {
                this.buildParams(prefix, formDataObj[prefix], urlString);
            }
        }

        output = urlString.join('&').replace(r20, '+');

        return output;
    }

  appendUrlEncoded(key, value, urlString) {
    // If value is a function, invoke it and return its value
    value = ( typeof value === 'function' ) ? value() : ( value === null ? '' : value );
    urlString[urlString.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
  };

  buildParams(prefix, obj, urlString) {
      let name, i, l, rbracket;

      rbracket = /\[\]$/;

      if (obj instanceof Array) {
          for (i = 0, l = obj.length; i < l; i++) {
              if (rbracket.test(prefix)) {
                  this.appendUrlEncoded(prefix, obj[i], urlString);
              } else {
                  this.buildParams(`${ typeof obj[i] === 'object' }${ prefix }[${ typeof obj[i] === 'object' ? i : '' }]`, obj[i], urlString);
              }
          }
      } else if (typeof obj === 'object') {
          // Serialize object item.
          for (name in obj) {
              this.buildParams(`${ prefix }[${ name }]`, obj[name], urlString);
          }
      } else {
          // Serialize scalar item.
          this.appendUrlEncoded(prefix, obj, urlString);
      }
  }

  /* Determine HTTP request method */
  getMethod() {
       const methodName = this.form.getAttribute('method') || 'get';

       return methodName.toLowerCase();
   }
}
