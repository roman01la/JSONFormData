![](https://img.shields.io/badge/maintainer%20needed-!-red.svg)

# JSONFormData

HTML JSON form submission polyfill based on [W3C HTML JSON form submission](http://darobin.github.io/formic/specs/json/) unofficial draft.

This is an early stage project. 

## Usage
There are two ways of using `JSONFormData` object, both similar to usual form submission process.

### Raw HTML form
Once polyfill is included on a page, it's possible to submit a form asynchronously with minimum amount of JavaScript code.

```html
<form enctype='application/json' action="/person" method="post">
    <input type="text" name="firstName">
    <input type="text" name="lastName">
    <button type="submit">Submit</button>
</form>
```

```js
var form = document.querySelector('form');

new JSONFormData(form, (error, response) => {
    // Callback is called when response or error is received
});
```

#### HTML attributes
- enctype `application/json` ― set request `Content-Type` header for JSON data.
- action `url` ― request endpoint.
- method `GET` `POST` `PUT` `DELETE` ― HTTP request method.

Both `PUT` and `DELETE` HTTP methods were removed in HTML5, but it makes sense to provide them for JSON form submission, which nicely fits CRUD approach.

### JSONFormData object
Form data can be sent manually, similar to a way of sending `FormData` object. The data is stored in `JSONFormData.formData`.

```js
form.addEventListener('submit', function (e) {

    const formData = new JSONFormData(form).formData;
    
    fetch("/api", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json"
      }
    });
}, false);
```
