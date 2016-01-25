# JJB/FormUtilsBundle #

This bundle is designed to validate Symfony forms on the front-end without duplicating code or validation efforts. This plugin also fully supports translations for error messages and suggestion text.

Installation
------------

### Require composer package

```
composer require josephjbrewer/form-utils
```

### Enable the bundle

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

### Set default form theme

Edit app/config.yml and set the default form template provided by the form-utils bundle.

```yaml
twig:
    form:
        resources:
            - 'JJBFormUtilsBundle:Form:form_theme.html.twig'
```


Usage
-----

### Assets

Add the assets provided in this bundle. I recommend using assetic.

```html
{% javascripts 
'@JJBFormUtilsBundle/Resources/assets/js/jquery.validator.js' %}
<script type="text/javascript" src="{{ asset_url }}"></script>
{% endjavascripts %}

{% stylesheets
'@JJBFormUtilsBundle/Resources/assets/css/style.scss' filter='compass' %}
<link rel="stylesheet" href="{{ asset_url }}"/>
{% endstylesheets %}
```
### Overriding the form theme

By default, the provided form template uses the bootstrap theme provided by Symfony. This can be easily changed by making your own form theme and extending what is provided by this bundle.

The example below uses Symfony's default form theme.

```twig
<!-- AppBundle/Resources/views/form-template.html.twig -->
{% extends 'form_div_layout.html.twig' %}
{% use 'JJBFormUtilsBundle:Form:form_blocks.html.twig' %}
```

### Rendering Forms

In order for the form elements to render the data attributes required for validation, you will need to use twig to render the form fields.

```html
{{ form_start(form) }}
{{ form_errors(form) }}

{{ form_row(form.username) }}
{{ form_row(form.password) }}
{{ form_row(form.submit) }}

{{ form_end(form) }}
```

### Data Suggestions

Data suggestions are used to provide information to the user about a form field. For example, if the form is focused on a password field, it might be helpful to show the user what characters are allowed in the password. To do this, you have to add an attribute to your form field called ```data-suggest```. This can be done in one of two ways.

#### With a form class

This method uses the "attr" option in the form builder.

```php
public function buildForm(FormBuilderInterface $builder, array $options)
{
    $builder->add(
        'password',
        'password', [
            'attr' => [
                'data-suggest' => 'Must contain ...'
            ]
        ]
    );
}
```

#### With twig attributes

This method adds the attribute directly to the form field.

```html
{{ form_row(form.password.second, { 'attr' : {
    'data-suggest' : 'Must contain ...'
}}) }}
```

### Bind validator to form

Binding the validator to the form sets up listeners on the form and all of its elements. When the blur event is triggered on a form element, the plugin will validate it. When the submit event is triggered on the form, the plugin will validate all of the form elements. If validation fails, event propagation will stop and the form will not be submitted.

```js
var form = $('#myForm');
    
// Enable validation (optional configuration)
$(form).validator(options);
```

In some cases, event propagation will be stopped before the validation listeners are triggered. This can happen if other javascript plugins are also listening to the submit event on the form. If this happens, you will need to manually trigger validator on your form. To do this, just use the following syntax:

```js
if ($(form).validator('validate'[, options])) {
    // Do something
}
```

### Handle AJAX Errors

One of the reasons this bundle was developed is to help with binding errors that occur on the server-side to the form elements on the front-end. When validation fails on the server side, an error object is created. To handle AJAX errors on the front-end, return the serialized error object and the plugin will do the rest.

```js
$(form).validator('handleErrors', response[, options]);
```

### Formatting Errors & Data Suggestions

Formatting errors and data suggestions is as simple as providing an inline template. The `messageTemplate` key is used for errors and the `suggestTemplate` key is used for data suggestions.

```js
$(document).ready(function() {
    $('#myForm').validator({
        messageTemplate: '<i class="fa fa-exclamation-triangle"></i> {{message}}'
    });
});
```

Validator Options
-----------------

| Key | Description | Default Value |
| --- | ----------- | ------------- |
| rootErrorMessage | Prepend root-level error with a title? (e.g. "Your form contains errors") ***Only works with AJAX errors*** | null |
| continueOnError | Continue validation after an error occurs? | false |
| separator | Character used to concatenate form id's. | _ |
| suggestTemplate | Template used for data suggestions | {{message}} |
| messageTemplate | Template used for error messages | {{message}} |

Advanced Usage
--------------

### Supporting YAML/XML/Annotation Constraints

In a lot of cases, developers will use annotations or yaml/xml files to add constraints to a model. When a form is validated in Symfony, these constraints are validated along with any constraints added to the form.

If you instantiate a form that extends `AbstractBaseForm` with `MetaDataConstraintService` then the form will add the yaml/xml/annotation constraints to the form object when building the form view.

#### Create the form class

```php
<?php

namespace ApiBundle\Form\Type;

use JJB\FormUtilsBundle\Form\Type\AbstractBaseForm;

class ExampleType extends AbstractBaseForm
{
   // ...
}
```

#### Instantiate form with metadata constraint service

```php
<?php

namespace AppBundle\Controller;

class DefaultController
{
    public function someAction()
    {
        $service = $this->get('jjb.form_utils.service.meta_data_constraint');
        $form    = $this->createForm(new ExampleType($service));
         
        return $this->render('...', [
            'form' => $form->createView()
        ]);
    }
}
```