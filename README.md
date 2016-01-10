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

### Step 2: Add package to composer

Edit your composer.json file and add the following package:

```
"require": {
  ...
  "josephjbrewer/form-utils": "dev-develop",
  ...
}
```

### Step 3: Set default form template

Edit app/config.yml and set the default form template provided by the form-utils bundle.

```
twig:
    form:
        resources:
            - 'JJBFormUtilsBundle:Form:form_theme.html.twig'
```