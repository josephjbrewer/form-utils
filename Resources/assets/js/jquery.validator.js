(function ($) {
    var defaults = {
        /**
         * Continue validation after an error occurs?
         *
         * @var boolean
         */
        continueOnError: false,

        /**
         * Scroll the first error message into view
         *
         * @var boolean
         */
        scrollToFirstError: true,

        /**
         * Height, in pixels, to offset the scroll's top position
         *
         * @var int
         */
        scrollOffset: 125,

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
         * The selector to use for containing form error messages
         *
         * @var string
         */
        errorMessageSelector: 'small.error',

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
         * Maps a constraint key to a constraint method
         *
         * @var Object
         */
        map: {
            "__LUHN__": "Luhn"
        },

        /**
         * User-defined constraint type methods.
         *
         * NOTE: When adding a constraint method, make sure you map it
         *
         * @var Object
         */
        constraints: {
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
        }
    };

    $.fn.validator = function (a, b, c) {
        /**
         * Declare options object for each instance of validator
         */
        var options = $.extend(true, {}, defaults);

        if (typeof a == 'object') {
            $.extend(true, options, a);
        }

        if (typeof c == 'object') {
            $.extend(true, options, c);
        } else if (typeof b == 'object') {
            $.extend(true, options, b);
        }

        options.formObj = $(this);
        options.formPrefix = $(options.formObj).attr('id');
        options.errors = {};

        if ($(options.formObj).prop('tagName').toUpperCase() !== 'FORM') {
            throw "Root element must be a form";
        }

        if (!options.formPrefix) {
            throw "Root form element must have an ID that is equivalent to the form object's name";
        }

        /**
         * Method: validate()
         *
         * Manually validate a form
         */
        if (a == 'validate') {
            return validateForm(options.formObj);
        }

        /**
         * Method: clearErrors()
         *
         * Manually validate a form
         */
        else if (a == 'clearErrors') {
            clearErrors();
        }

        /**
         * Method: handleErrors()
         *
         * Bind AJAX Errors back to form fields
         */
        else if (a == 'handleErrors') {
            if (typeof b.errors == 'object') {
                ajaxErrors(b.errors);
            }
        }

        /**
         * Default action
         *
         * Set up listeners for form and all elements
         */
        else {
            $(options.formObj).on('submit', function (e) {
                if (!validateForm(options.formObj)) {
                    e.stopPropagation();
                    e.preventDefault();

                    return false;
                }
            });

            $(options.formObj).on('focus', 'input,select,textarea', function () {
                showSuggestText(this);
            }).on('blur', 'input,select,textarea', function () {
                hideSuggestText(this);
                return validateElement(this);
            }).on('change', 'input,select,textarea', function () {
                return validateElement(this);
            });
        }

        $(options.formObj).on('reset', function () {
            clearErrors();
        });

        /**
         * Maps error messages back to the corresponding form field
         *
         * @param errors
         */
        function ajaxErrors(errors) {
            clearErrors();
            traverseErrorObject(errors, options.formPrefix);
            bindErrors();
        }

        /**
         * Adds errors to options.errors
         *
         * NOTE: The key for each error message is dynamically generated
         *       based on the tree structure of the errors argument.
         *
         * @param errors
         * @param prefix
         */
        function traverseErrorObject(errors, prefix) {
            if (errors.errors != undefined) {
                if (options.errors[prefix] == undefined) {
                    options.errors[prefix] = [];
                }

                $.each(errors.errors, function (idx, msg) {
                    options.errors[prefix].push(msg);
                });
            }

            if (errors.children != undefined) {
                $.each(errors.children, function (key, child) {
                    traverseErrorObject(child, (prefix + options.separator + key));
                });
            }
        }

        /**
         * Traverse errors and bind/render them to the DOM.
         */
        function bindErrors() {
            var errors = options.errors;

            $.each(errors, function (key, _errors) {
                var html = '';

                $.each(_errors, function (idx, error) {
                    html += formatMessageTemplate(error);
                });

                $(options.formObj).find('[data-validation-for="' + key + '"]').removeClass(options.hideClass).html(html);
                $(options.formObj).find('[id="' + key + '"]').addClass('error');
            });

            // Add optional title to root-level error message block
            if (options.rootErrorMessage) {
                var title = formatMessageTemplate(options.rootErrorMessage, 'title');
                $(options.formObj).find('[data-validation-for="' + options.formPrefix + '"]').removeClass(options.hideClass).prepend(title);
            }

            if (options.scrollToFirstError === true) {
                scrollToFirstError();
            }
        }


        /**
         * Validates all form fields
         *
         * @param form
         * @returns {boolean}
         */
        function validateForm(form) {
            var hasErrors = false;

            clearErrors();

            $(form).find('[data-constraints]').each(function (idx, element) {
                if (!validateElement(element)) {
                    hasErrors = true;
                }
            });

            options.valid = !hasErrors;

            if (hasErrors && options.scrollToFirstError === true) {
                scrollToFirstError();
            }

            return !hasErrors;
        }

        /**
         * Validates a single form field/group
         *
         * @param el
         * @returns {boolean}
         */
        function validateElement(el) {

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
                            return options.continueOnError;
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
        }

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
        function validate(element, assertion) {
            var value = element.val();
            var expression = assertion.match(/^__\((.*)\)__$/);
            var generic = assertion.match(/__([_a-zA-Z0-9]+)__/g);
            var required = ( $(element).attr('required') ) ? true : false;

            if (assertion.match(/^COUNT(.*)$/)) {
                return options.constraints.Count(element, assertion);

            } else {
                // If a field is blank and not required, there is no need to validate
                if (value == '' && !required) {
                    return true;
                }

                if (expression && expression.length >= 2) {
                    return options.constraints.Expression(value, expression[1].replace('{{value}}', element.val()));

                } else if (generic) {
                    if (options.map[assertion]) {
                        var methodName = options.map[assertion];

                        if (typeof options.constraints[methodName] == 'function') {
                            return options.constraints[methodName](value, assertion);
                        }
                    } else {
                        throw "No method mapped to key \"" + assertion + "\"";
                    }
                } else {
                    return options.constraints.Regex(value, assertion);
                }
            }

            return true;
        }

        /**
         * Moves the first error message into view in the DOM
         */
        function scrollToFirstError() {
            var visibleErrors = $(options.formObj).find(options.errorMessageSelector + ':visible').first();

            if (visibleErrors.length > 0 && typeof visibleErrors[0] != 'undefined') {
                var first = visibleErrors[0];
                var container = $('html,body');

                $(container).animate({
                    scrollTop: $(first).offset().top - $(container).offset().top - options.scrollOffset,
                    scrollLeft: 0
                }, 250);

                $(first).focus();
            }
        }

        /**
         * Shows suggest test for an individual form element
         *
         * @param element
         */
        function showSuggestText(element) {
            var text = $(element).data(options.suggestClass);

            if (text != undefined && text != '') {
                var html = formatSuggestTemplate(text);
                $(options.formObj).find('[data-validation-for="' + $(element).attr('id') + '"]').attr('class', options.suggestClass).html(html);
            }
        }

        /**
         * Hides suggest text for an individual form element
         *
         * @param element
         */
        function hideSuggestText(element) {
            $(options.formObj).find('[data-validation-for="' + $(element).attr('id') + '"]').attr('class', options.errorClass + ' ' + options.hideClass).html('');
        }

        /**
         * Hide errors for individual form element
         *
         * @param element
         */
        function hideErrors(element) {
            $(options.formObj).find('[data-validation-for="' + $(element).attr('id') + '"]').addClass(options.hideClass);
            $(element).removeClass(options.errorClass).addClass(options.successClass);
        }

        /**
         * Show errors for individual form element
         *
         * @param element
         * @param errors
         */
        function showErrors(element, errors) {
            var alert = $(options.formObj).find('[data-validation-for="' + $(element).attr('id') + '"]');

            if (alert != undefined) {
                alert.removeClass(options.hideClass);
                alert.html(formatErrors(errors));
                $(element).addClass(options.errorClass).removeClass(options.successClass);
            }
        }

        /**
         * Empties and hides all error messages
         */
        function clearErrors() {
            $(options.formObj).find('[data-validation-for]').each(function () {
                $(this).html('').addClass(options.hideClass);
                $('#' + $(this).attr('data-validation-for')).removeClass('error');
            });
        }

        /**
         * Formats errors
         *
         * @param errors
         * @returns {string}
         */
        function formatErrors(errors) {
            var html = '';

            $.each(errors, function (idx, error) {
                html += formatMessageTemplate(error);
            });

            return html;
        }

        /**
         * Replaces {{message}} with the msg argument
         *
         * @param msg
         * @returns string
         */
        function formatSuggestTemplate(msg) {
            return options.suggestTemplate.replace('{{message}}', msg);
        }

        /**
         * Replaces {{message}} with the msg argument
         *
         * @param msg
         * @param cssClass
         * @returns string
         */
        function formatMessageTemplate(msg, cssClass) {
            var classAttr = (cssClass) ? ' class="' + cssClass + '"' : '';
            return '<div' + classAttr + '>' + options.messageTemplate.replace('{{message}}', msg) + '</div>';
        }

        return options.formObj;
    };
})(jQuery);