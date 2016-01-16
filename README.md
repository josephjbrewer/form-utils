# JJB/FormUtilsBundle #

This bundle will allow you to perform javascript validation on Symfony forms without having to duplicate your efforts on the front-end and back-end. When using a REST API to submit your forms, you can bind error messages directly to the coresponding form element when you return a 400 error with a serialized form object that contains errors.


Installation
------------

### Step 1: Add Repository to composer

Edit your composer.json file and add the following repository:

```
"repositories": [
  ...
  {
    "type": "vcs",
    "url": "git@bitbucket.org:josephjbrewer/form-utils.git"
  },
  ...
]
```

### Step 2: Require composer package

```
composer require josephjbrewer/form-utils dev-develop
```

### Step 3: Enable the bundle

```php
// app/AppKernel.php
public function registerBundles()
{
    return array(
        // ...
        new JJB\FormUtilsBundle\JJBFormUtilsBundle(),
    );
}
```

### Step 4: Set default form template

Edit app/config.yml and set the default form template provided by the form-utils bundle.

```yaml
twig:
    form:
        resources:
            - 'JJBFormUtilsBundle:Form:form_theme.html.twig'
```


Usage
-----

### Add javascript & css dependencies

Add the required javascript files. I recommend using assetic in your layout template:

```html
{% javascripts 
'@JJBFormUtilsBundle/Resources/assets/js/jquery.validator.js'
'@JJBFormUtilsBundle/Resources/assets/js/jquery.validator.ajax-errors.js' %}
<script type="text/javascript" src="{{ asset_url }}"></script>
{% endjavascripts %}
```

Add the required SASS file. I recommend using assetic in your layout template:

```html
{% stylesheets
'@JJBFormUtilsBundle/Resources/assets/css/style.scss' filter='compass' %}
<link rel="stylesheet" href="{{ asset_url }}"/>
{% endstylesheets %}
```

### Bind validator to form

```js
$(document).ready(){
    $('#myForm').validator();
}
```

In some cases, event propagation will be stopped before the validation listeners are triggered. In this case, you will need to manually execute to validator on your form. To do this, just use the following syntax:

```js
if ($('#myForm').validator('validate')) {
    // Do something
}
```

### Handle AJAX Errors

```js
$('#myForm').ajaxForm({
    url: '/path/to/rest/endpoint',
    success: function () {
        // Do something
    },
    error: function (response) {
        $('#myForm').ajaxErrors(response);
    }
});
```

Validator Options
-----------------

| Key | Description | Default Value |
| --- | ----------- | ------------- |
| continueOnError | Continue validation after an error occurs? | false |
| suggestTemplate | Template used for data suggestions | {{message}} |
| messageTemplate | Template used for error messages | {{message}} |

AJAX Errors Options
-------------------

| Key | Description | Default Value |
| --- | ----------- | ------------- |
| rootErrorMessage | Prepend root-level error with a title? (e.g. "Your form contains errors") | null |
| separator | Character used to concatenate form id's. | _ |
| messageTemplate | Template used for error messages | {{message}} |
