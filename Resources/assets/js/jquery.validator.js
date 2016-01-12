(function ($) {
    var config = {
        continueOnError: false,
        messageTemplate: '{{message}}'
    };

    $.fn.validator = function (a, b) {
        if (typeof a == 'object') {
            $.extend(config, a);
        }

        if (typeof b == 'object') {
            $.extend(config, b);
        }

        if (a == 'validate') {
            return validateForm(this);
        } else {
            $(this).each(function (idx, form) {
                $(form).on('submit', function (e) {
                    if (!validateForm(this)) {
                        e.stopPropagation();
                        e.preventDefault();

                        return false;
                    }
                });

                $(form).on('focus', 'input,select,textarea', function () {
                    showSuggestText(this);
                }).on('blur', 'input,select,textarea', function (e) {
                    hideSuggestText(this);
                    return validateElement(this, e);
                }).on('change', 'input,select,textarea', function (e) {
                    return validateElement(this, e);
                });
            });
        }
    };

    var validateForm = function (form) {
        var hasErrors = false;

        clearErrors(form);

        $(form).find('input,select,textarea').each(function (idx, element) {
            if (!validateElement(element)) {
                hasErrors = true;
            }
        });

        return (hasErrors) ? false : true;
    };

    var validateElement = function (el, event) {

        var element = $(el);
        var errors = [];
        var required = ( $(el).attr('required') ) ? true : false;

        // Skip validation
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
                if (!assertConstraint(element, constraint)) {
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

    var clearErrors = function (element) {
        $(element).find('[data-validation-for]').html('').addClass('hide');
    };

    var showSuggestText = function (element) {
        var text = $(element).data('suggest');

        if (text != undefined && text != '') {
            $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').attr('class', 'suggest').html(text);
        }
    };
    var hideSuggestText = function (element) {
        $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').attr('class', 'error hide').html('');
    };

    var hideErrors = function (element) {
        $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]').addClass('hide');
    };

    var showErrors = function (element, errors) {
        var alert = $(element).parent().find('[data-validation-for="' + $(element).attr('id') + '"]');

        if (alert != undefined) {
            alert.removeClass('hide');
            alert.html(formatErrors(errors));
        }
    };

    var formatErrors = function (errors) {
        var html = '';

        $.each(errors, function (idx, error) {
            html += '<div>' + formatMessageTemplate(error) + '</div>';
        });

        return html;
    };

    var assertConstraint = function (element, assertion) {
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

    var formatMessageTemplate = function (msg) {
        return config.messageTemplate.replace('{{message}}', msg);
    };
})(jQuery);