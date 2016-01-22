(function ($) {
    var config = {
        /**
         * Continue validation after an error occurs?
         *
         * @var bool
         */
        continueOnError: false,
        /**
         *
         * Set a header for the root-level form errors. Value can contain HTML or raw text
         *
         * @var string|null
         */
        rootErrorMessage: null,

        /**
         * This should be set to the name of the root-level form.
         *
         * @var string|null
         */
        formPrefix: null,

        /**
         * Separator character
         *
         * @var string
         */
        separator: '_',

        /**
         * The DOM element object of the form
         *
         * @var Object
         */
        formObj: null,

        /**
         * A template for your input suggestions. Can contain HTML.
         *
         * NOTE: You MUST use {{message}} in the template of the error message will not be rendered
         *
         *  @var string
         */
        suggestTemplate: '{{message}}',

        /**
         * A template for your individual error messages. Can contain HTML.
         *
         * NOTE: You MUST use {{message}} in the template of the error message will not be rendered
         *
         * @var string
         */
        messageTemplate: '{{message}}',

        /**
         * Container for error message that are found in the response object.
         *
         * @var Object
         */
        errors: {}
    };

    var constraints = {
        "Expression": function (val, expression) {
            return eval(expression);
        },
        "Regex": function (val, assertion) {
            var pattern = new RegExp(assertion, 'g');

            return pattern.test(val);
        },
        "NotBlank": function (val) {
            return (val.trim() !== "");
        }
    };

    $.fn.validator = function (a, b, c) {
        if (typeof a == 'object') {
            $.extend(config, a);
        }

        if (typeof c == 'object') {
            $.extend(config, c);
        } else if (typeof b == 'object') {
            $.extend(config, b);
        }

        config.formObj = $(this);
        config.formPrefix = $(config.formObj).attr('id');
        config.errors = {};

        if ($(config.formObj).prop('tagName') !== 'FORM') {
            throw "Root element must be a form";
        }

        if (!config.formPrefix) {
            throw "Root form element must have an ID that is equivalent to the form object's name";
        }

        /**
         * Method: validate()
         *
         * Manually validate a form
         */
        if (a == 'validate') {
            return validateForm(config.formObj);
        }

        /**
         * Method: handleErrors()
         *
         * Bind AJAX Errors back to form fields
         */
        else if (a == 'handleErrors') {
            if (typeof b.errors == 'object') {
                return ajaxErrors(b.errors);
            }
        }

        /**
         * Default action
         *
         * Set up listeners for form and all elements
         */
        else {
            $(config.formObj).on('submit', function (e) {
                if (!validateForm(config.formObj)) {
                    e.stopPropagation();
                    e.preventDefault();

                    return false;
                }
            });

            $(config.formObj).on('focus', 'input,select,textarea', function () {
                showSuggestText(this);
            }).on('blur', 'input,select,textarea', function (e) {
                hideSuggestText(this);
                return validateElement(this, e);
            }).on('change', 'input,select,textarea', function (e) {
                return validateElement(this, e);
            });
        }

        return config.formObj;
    };

    var ajaxErrors = function (errors) {
        clearErrors();
        traverseErrorObject(errors, config.formPrefix);
        bindErrors();
    };

    /**
     * Adds errors to config.errors
     *
     * NOTE: The key for each error message is dynamically generated
     *       based on the tree structure of the errors argument.
     *
     * @param errors
     * @param prefix
     */
    var traverseErrorObject = function (errors, prefix) {
        if (errors.errors != undefined) {
            if (config.errors[prefix] == undefined) {
                config.errors[prefix] = [];
            }

            $.each(errors.errors, function (idx, msg) {
                config.errors[prefix].push(msg);
            });
        }

        if (errors.children != undefined) {
            $.each(errors.children, function (key, child) {
                traverseErrorObject(child, (prefix + config.separator + key));
            });
        }
    };

    /**
     * Traverse errors and bind/render them to the DOM.
     */
    var bindErrors = function () {
        var errors = config.errors;

        $.each(errors, function (key, _errors) {
            var html = '';

            $.each(_errors, function (idx, error) {
                html += formatMessageTemplate(error);
            });

            $(config.formObj).find('[data-validation-for="' + key + '"]').removeClass('hide').html(html);
        });

        // Add optional title to root-level error message block
        if (config.rootErrorMessage) {
            var title = formatMessageTemplate(config.rootErrorMessage, 'title');
            $(config.formObj).find('[data-validation-for="' + config.formPrefix + '"]').removeClass('hide').prepend(title);
        }
    };

    var validateForm = function (form) {
        var hasErrors = false;

        clearErrors();

        $(form).find('input,select,textarea').each(function (idx, element) {
            if (!validateElement(element)) {
                hasErrors = true;
            }
        });

        return !hasErrors;
    };

    var validateElement = function (el, event) {

        var element = $(el);
        var errors = [];
        var required = ( $(el).attr('required') ) ? true : false;

        // Skip validation on this field
        if (element.attr('data-ignore-validation') ||
            element.attr('disabled') ||
            element.attr('readonly') ||
            (!required && element.val() == '')
        ) {
            hideErrors(element);
            return true;
        }

        var constraints = element.attr("data-constraints");
        var messages = element.attr("data-error-messages");

        if (constraints !== undefined && constraints.length > 0 &&
            messages !== undefined && messages.length > 0
        ) {
            constraints = JSON.parse(constraints);
            messages = JSON.parse(messages);

            $.each(constraints, function (idx, constraint) {
                if (!validate(element, constraint)) {
                    errors.push(messages[idx]);

                    // Break loop
                    return config.continueOnError;
                }
            });

            if (errors.length > 0) {
                showErrors(element, errors);

                return false;
            } else {
                hideErrors(element);
            }
        }

        return true;
    };

    var clearErrors = function () {
        $(config.formObj).find('[data-validation-for]').each(function () {
            $(this).html('').addClass('hide');
            $('#' + $(this).attr('data-validation-for')).removeClass('error');
        });
    };

    var showSuggestText = function (element) {
        var text = $(element).data('suggest');

        if (text != undefined && text != '') {
            var html = formatSuggestTemplate(text);
            $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').attr('class', 'suggest').html(html);
        }
    };
    var hideSuggestText = function (element) {
        $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').attr('class', 'error hide').html('');
    };

    var hideErrors = function (element) {
        $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').addClass('hide');
        $(element).removeClass('error');
    };

    var showErrors = function (element, errors) {
        var alert = $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]');

        if (alert != undefined) {
            alert.removeClass('hide');
            alert.html(formatErrors(errors));
            $(element).addClass('error');
        }
    };

    var formatErrors = function (errors) {
        var html = '';

        $.each(errors, function (idx, error) {
            html += formatMessageTemplate(error);
        });

        return html;
    };

    var validate = function (element, assertion) {
        var value = element.val();
        var expression = assertion.match(/^__\((.*)\)__$/);
        var generic = assertion.match(/__([\_a-zA-Z0-9]+)__/g);
        var map = {
            "__NOT_BLANK__": "NotBlank",
            "__LUHN__": "Luhn"
        };

        if (expression && expression.length >= 2 && value != '') {
            return constraints.Expression(value, expression[1].replace('{{value}}', element.val()));

        } else if (generic) {
            if (map[assertion] != undefined) {

                var method = map[assertion];

                if (typeof constraints[method] == 'function') {
                    return constraints[method](value, assertion);
                }
            }
        } else {
            return constraints.Regex(value, assertion);
        }

        return true;
    };

    var formatSuggestTemplate = function (msg) {
        return config.suggestTemplate.replace('{{message}}', msg);
    };

    /**
     * Replaces {{message}} with the msg argument
     *
     * @param msg
     * @param cssClass
     * @returns {string}
     */
    var formatMessageTemplate = function (msg, cssClass) {
        var classAttr = (cssClass) ? ' class="' + cssClass + '"' : '';
        return '<div' + classAttr + '>' + config.messageTemplate.replace('{{message}}', msg) + '</div>';
    };
})(jQuery);
