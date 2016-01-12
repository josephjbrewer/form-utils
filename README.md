# JJB/FormUtilsBundle #


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

### Step 1: Add javascript file

Add the required javascript file. I recommend using assetic in your layout template:

```html
{% javascripts '@JJBFormUtilsBundle/Resources/assets/js/jquery.validator.js' %}
<script type="text/javascript" src="{{ asset_url }}"></script>
{% endjavascripts %}
```

### Step 2: Bind validator to form
Now all you need to do is bind the validator to your form(s).

Setup the listener. This will listen to the blur event on each form field, and listen to the submit event.
```js
$(document).ready(){
    $('#myForm').validator();
}
```

If you need to manually validate a form, just use the following syntax:

```js
if ($('#myForm').validator('validate')) {
    // Do something
}
```

### Step 3: Add CSS

```css
.hide {
  display: none;
}

small.error {
  color: #990000;
}
```