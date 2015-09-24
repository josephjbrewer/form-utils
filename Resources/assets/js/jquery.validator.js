(function ($) {
    var config = {
        continueOnError: false
    };

    $.fn.validator = function (options) {
        $.extend(config, options);

        var form = $(this);

        $(form).on('submit', function (e) {
            if (!validateForm(this)) {
                e.stopPropagation();
                return false;
            }
        });

        $.each($(form).find('input,select,textarea'), function (idx, element) {
            $.fn.bindElement(element);
        });
    };

    $.fn.bindElement = function (el) {
        $(el).on('focus', function () {
            showSuggestText(this);
        }).on('blur', function (e) {
            hideSuggestText(this);
            return validateElement(this, e);
        }).on('change', function (e) {
            return validateElement(this, e);
        });

        return this;
    };

    var validateForm = function (form) {
        var hasErrors = false;

        $.each($(form).find('input,select,textarea'), function (idx, element) {
            if (!validateElement(element)) {
                hasErrors = true;
            }
        });

        return (hasErrors) ? false : true;
    };

    var validateElement = function (el, event) {

        var element = $(el);
        var errors = [];

        // Skip validation
        if (element.attr('data-ignore-validation') ||
            element.attr('disabled') ||
            element.attr('readonly')
        ) {
            return true;
        }

        var constraints = element.attr("data-constraints");
        var messages = element.attr("data-error-messages");

        if (constraints !== undefined && constraints.length > 0) {
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
                clearErrors(element);
                hideErrors(element);
            }
        }

        return true;
    };

    var showSuggestText = function (element) {
        var text = $(element).data('suggest');

        if (text != undefined && text != '') {
            $(element).parent().find("small.error").attr('class', 'suggest').html(text);
        }
    };
    var hideSuggestText = function (element) {
        $(element).parent().find("small.suggest").attr('class', 'error hide').html('');
    };

    var clearErrors = function (element) {
        $(element).parent().find("small.error").html('');
    };

    var hideErrors = function (element) {
        $(element).parent().find("small.error").addClass('hide');
    };

    var showErrors = function (element, errors) {
        var alert = $(element).parent().find("small.error");

        if (alert != undefined) {
            alert.removeClass('hide');
            alert.html(iterateErrors(errors));
        }
    };

    var iterateErrors = function (errors) {
        var html = '';

        $.each(errors, function (idx, error) {
            html += '<div>' + error + '</div>';
        });

        return html;
    };

    var assertConstraint = function (element, assertion) {
        var generic = assertion.match(/__([\_a-zA-Z0-9]+)__/g);
        var map = {
            "__NOT_BLANK__": "NotBlank",
            "__LUHN__": "Luhn",
            "__EMAIL__": "Email"
        };

        var value = element.val();

        if (generic) {
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
        "Regex": function (val, assertion) {
            var pattern = new RegExp(assertion, 'g');

            return pattern.test(val)
        },
        "NotBlank": function (val) {
            return (val.trim() !== "");
        }
    };
})
(jQuery);