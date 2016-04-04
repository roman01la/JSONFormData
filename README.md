![](https://img.shields.io/badge/maintainer%20needed-!-red.svg)

#JSONFormData

HTML JSON form submission polyfill based on [W3C HTML JSON form submission](http://darobin.github.io/formic/specs/json/) unofficial draft.

This is an early stage project. 

##Usage
There are two ways of using `JSONFormData` object, both similar to usual form submission handling.

###Raw HTML form
It's possible to submit form asynchronously with minimum amount of JavaScript code.

```
<form enctype='application/json' action="/person" method="post">
    <input type="text" name="firstName">
    <input type="text" name="lastName">
    <button type="submit">Submit</button>
</form>
```

####Attributes settings
- enctype `application/json` ― set request `Content-Type` header for JSON data.
- action `url` ― request endpoint.
- method `GET` `POST` `PUT` `DELETE` ― HTTP request method.

Both `PUT` and `DELETE` HTTP methods were removed in HTML5, but it makes sense to provide them for JSON form submission, which nicely fits into REST API paradigm.

A chunk of JS code to init JSON form and handle response:

*It's common to run some UI code in response callback*

```
var form = document.querySelector('form');

new JSONFormData(form, function (err, res) {
    // Callback...
});
```

###JSONFormData object
Form data can be sent manually, similar to a way of sending FormData object.

```
var form = document.querySelector('form');

form.addEventListener('submit', function (e) {
    e.preventDefault();

    var xhr = new XMLHttpRequest();

    xhr.open('POST', '/human');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(new JSONFormData(form).formData));

    xhr.addEventListener('loadend', function() {
        // Callback...
    }, false);
}, false);
```

When submitting form manually, the data is stored in `JSONFormData.formData`. Since it's an object, data can be get/set as usual, using both dot or bracket notation.
