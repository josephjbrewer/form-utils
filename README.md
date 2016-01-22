# JJB/FormUtilsBundle #

This bundle is designed to validate Symfony forms on the front-end without duplicating code or validation efforts. This plugin also fully supports translations for error messages and suggestion text.

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

### Step 4: Set default form theme

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
### Rendering Forms

Rendering forms with twig is required. Data attributes are added to each form field that are populated with the form constraints and error messages. Without using the FormUtils template, form validation with this plugin will not work.

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

#### Form Method

This method uses the "attr" option in the form builder.

```php
public function buildForm(FormBuilderInterface $builder, array $options)
{
    $builder->add(
        'password',
        'password', [
            'attr' => [
                'data-suggest' => 'Must contain ...'
            ],
            'constraints' => [
                new Assert\NotBlank()
            ]
        ]
    );
}
```

#### Twig Method

This method adds the attribute directly to the form field.

```html
{{ form_row(form.password.second, { 'attr' : {
    'data-suggest' : 'Must contain ...'
}}) }}
```

### Bind validator to form

```js
var form = $('#myForm');
    
// Enable validation
$(form).validator([options]);
```

In some cases, event propagation will be stopped before the validation listeners are triggered. In this case, you will need to manually execute to validator on your form. To do this, just use the following syntax:

```js
if ($(form).validator('validate'[, options])) {
    // Do something
}
```

### Handle AJAX Errors

This jQuery plugin is designed to handle serialized form errors from Symfony. When the form object is serialized (e.g. from a Symfony controller), Symfony will return a standard JSON payload with any errors that occurred. By looping over the keys and errors in the jQuery plugin, we can reliably map the errors back to the correct field after an AJAX request has occurred.

```js
// Submit form using jQuery Form Plugin
$(form).ajaxForm({
    url: '/path/to/rest/endpoint',
    success: function () {
        // Do something
    },
    error: function (response) {
        // Bind errors in response to form fields
        $(form).validator('handleErrors', response[, options]);
    }
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
