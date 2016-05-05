(function ($) {
    var config = {
        /**
         * Continue validation after an error occurs?
         *
         * @var boolean
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
         * Class applied to form elements that have validation errors
         *
         * @var string
         */
        errorClass: 'error',

        /**
         * Class applied to form elements that have been successfully validated
         *
         * @var string
         */
        successClass: 'success',

        /**
         * Class used for hiding elements
         *
         * @var string
         */
        hideClass: 'hide',

        /**
         * Class used for data suggestions
         *
         * @var string
         */
        suggestClass: 'suggest',

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
        errors: {},

        /**
         * User-defined constraint type methods.
         *
         * NOTE: When adding a constraint method, make sure you map it
         *
         * @var Object
         */
        constraints: {},

        /**
         * Maps a constraint key to a constraint method
         *
         * @var Object
         */
        map: {
            "__LUHN__": "Luhn"
        }
    };

    var constraints = {
        "Expression": function (val, expression) {
            return eval(expression);
        },
        "Regex": function (val, assertion) {
            var pattern = new RegExp(assertion, 'g');

            return pattern.test(val);
        },
        "Luhn": function (value) {
            var nCheck = 0;
            var bEven = false;

            if (/[^0-9-\s]+/.test(value)) {
                return false;
            }

            value = value.replace(/\D/g, "");

            for (var n = value.length - 1; n >= 0; n--) {
                var cDigit = value.charAt(n),
                    nDigit = parseInt(cDigit, 10);

                if (bEven) {
                    if ((nDigit *= 2) > 9) nDigit -= 9;
                }

                nCheck += nDigit;
                bEven = !bEven;
            }

            return (nCheck % 10) == 0;
        },
        "Count": function (element, assertion) {
            var match = assertion.match(/^COUNT\((.*)\)$/);

            if (match.length > 1) {
                var string = match[1];
                var parts = string.split('|');

                if (parts.length == 3) {
                    var selector = parts[0];
                    var min = parts[1];
                    var max = parts[2];
                    var count = 0;
                    var type = $(selector).attr('type');
                    var tag = $(selector).prop('tagName');

                    if (tag != undefined) {
                        if (tag.toUpperCase() == 'DIV') {
                            $.each($(selector).find('input[type="checkbox"]'), function (idx, el) {
                                if ($(el).is(':checked')) {
                                    count++;
                                }
                            });
                        } else if (tag.toUpperCase() == 'SELECT') {
                            $.each($(selector).find('option'), function (idx, el) {
                                if ($(el).is(':selected')) {
                                    count++;
                                }
                            });
                        }
                    }

                    if (min > 0 && min == max) {
                        if (count != min) {
                            return false;
                        }
                    } else {
                        if (min > 0) {
                            if (count < min) {
                                return false;
                            }
                        }

                        if (max > 0) {
                            if (count < max) {
                                return false;
                            }
                        }
                    }
                } else {
                    throw "Invalid format for count constraint";
                }
            }

            return true;
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

        if ($(config.formObj).prop('tagName').toUpperCase() !== 'FORM') {
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
            }).on('blur', 'input,select,textarea', function () {
                hideSuggestText(this);
                return validateElement(this);
            }).on('change', 'input,select,textarea', function () {
                return validateElement(this);
            });
        }

        $(config.formObj).on('reset', function () {
            clearErrors();
        });

        return config.formObj;
    };

    /**
     * Maps error messages back to the corresponding form field
     *
     * @param errors
     */
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

            $(config.formObj).find('[data-validation-for="' + key + '"]').removeClass(config.hideClass).html(html);
        });

        // Add optional title to root-level error message block
        if (config.rootErrorMessage) {
            var title = formatMessageTemplate(config.rootErrorMessage, 'title');
            $(config.formObj).find('[data-validation-for="' + config.formPrefix + '"]').removeClass(config.hideClass).prepend(title);
        }
    };

    /**
     * Validates all form fields
     *
     * @param form
     * @returns {boolean}
     */
    var validateForm = function (form) {
        var hasErrors = false;

        clearErrors();

        $(form).find('[data-constraints]').each(function (idx, element) {
            if (!validateElement(element)) {
                hasErrors = true;
            }
        });

        return !hasErrors;
    };

    /**
     * Validates a single form field/group
     *
     * @param el
     * @returns {boolean}
     */
    var validateElement = function (el) {

        var element = $(el);
        var errors = [];

        // Skip validation on this field
        if (element.attr('data-ignore-validation') ||
            element.attr('disabled') ||
            element.attr('readonly')
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

                // Count constraints will sometimes be added to div tags (e.g. checkbox groups).
                // It is the only scenario where we want to validate a div tag (it's children, actually).
                if (constraint.match(/^COUNT(.*)$/) || $(el).prop('tagName') != 'DIV') {
                    if (!validate(element, constraint)) {
                        errors.push(messages[idx]);

                        // Break loop
                        return config.continueOnError;
                    }
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

    /**
     * Executes a constraint's validation method
     *
     * returns true if validation passed
     * returns false if validation fails
     *
     * @param element
     * @param assertion
     * @returns {*}
     */
    var validate = function (element, assertion) {
        var value = element.val();
        var expression = assertion.match(/^__\((.*)\)__$/);
        var generic = assertion.match(/__([_a-zA-Z0-9]+)__/g);
        var required = ( $(element).attr('required') ) ? true : false;

        if (assertion.match(/^COUNT(.*)$/)) {
            return constraints.Count(element, assertion);

        } else {
            // If a field is blank and not required, there is no need to validate
            if (value == '' && !required) {
                return true;
            }

            if (expression && expression.length >= 2) {
                return constraints.Expression(value, expression[1].replace('{{value}}', element.val()));

            } else if (generic) {
                if (config.map[assertion]) {
                    var methodName = config.map[assertion];

                    if (typeof constraints[methodName] == 'function') {
                        return constraints[methodName](value, assertion);
                    }
                } else {
                    throw "No method mapped to key \"" + assertion + "\"";
                }
            } else {
                return constraints.Regex(value, assertion);
            }
        }

        return true;
    };

    /**
     * Shows suggest test for an individual form element
     *
     * @param element
     */
    var showSuggestText = function (element) {
        var text = $(element).data(config.suggestClass);

        if (text != undefined && text != '') {
            var html = formatSuggestTemplate(text);
            $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').attr('class', config.suggestClass).html(html);
        }
    };

    /**
     * Hides suggest text for an individual form element
     *
     * @param element
     */
    var hideSuggestText = function (element) {
        $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').attr('class', config.errorClass + ' ' + config.hideClass).html('');
    };

    /**
     * Hide errors for individual form element
     *
     * @param element
     */
    var hideErrors = function (element) {
        $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').addClass(config.hideClass);
        $(element).removeClass(config.errorClass).addClass(config.successClass);
    };

    /**
     * Show errors for individual form element
     *
     * @param element
     * @param errors
     */
    var showErrors = function (element, errors) {
        var alert = $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]');

        if (alert != undefined) {
            alert.removeClass(config.hideClass);
            alert.html(formatErrors(errors));
            $(element).addClass(config.errorClass).removeClass(config.successClass);
        }
    };

    /**
     * Empties and hides all error messages
     */
    var clearErrors = function () {
        $(config.formObj).find('[data-validation-for]').each(function () {
            $(this).html('').addClass(config.hideClass);
            $('#' + $(this).attr('data-validation-for')).removeClass('error');
        });
    };

    /**
     * Formats errors
     *
     * @param errors
     * @returns {string}
     */
    var formatErrors = function (errors) {
        var html = '';

        $.each(errors, function (idx, error) {
            html += formatMessageTemplate(error);
        });

        return html;
    };

    /**
     * Replaces {{message}} with the msg argument
     *
     * @param msg
     * @returns string
     */
    var formatSuggestTemplate = function (msg) {
        return config.suggestTemplate.replace('{{message}}', msg);
    };

    /**
     * Replaces {{message}} with the msg argument
     *
     * @param msg
     * @param cssClass
     * @returns string
     */
    var formatMessageTemplate = function (msg, cssClass) {
        var classAttr = (cssClass) ? ' class="' + cssClass + '"' : '';
        return '<div' + classAttr + '>' + config.messageTemplate.replace('{{message}}', msg) + '</div>';
    };
})(jQuery);
