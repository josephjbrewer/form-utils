(function ($) {

    var options = {
        errorTemplate: '<span class="error">{{errors}}</span>',
        stopOnFirstError: true
    };

    $.fn.validator = function (o) {
        options = $.extend($.fn.validator.defaults, o);

        var form = $(this);

        $(form).on('submit', function () {
            validateForm(this);
        });

        $.each($(form).find('input,select,textarea'), function (idx, element) {
            $.fn.bindElement(element);
        });
    };

    $.fn.bindElement = function (el) {

        var element = $(el);

        element.on('blur', function (e) {
            return validateElement(this, e);
        }).on('change', function (e) {
            return validateElement(this, e);
        });

        return this;
    };

    var validateForm = function (form) {
        $.each($(form).find('input,select,textarea'), function (idx, element) {
            validateElement(el);
        });
    };

    var validateElement = function (el, event) {

        var element = $(el);
        var errors = [];

        hideErrors(element);

        if (element.attr('data-ignore-validation') ||
            element.attr('disabled')
        ) {
            return;
        }

        var constraints = element.attr("data-constraints");
        var messages = element.attr("data-error-messages");

        if (constraints !== undefined && constraints.length > 0) {
            constraints = JSON.parse(constraints);
            messages = JSON.parse(messages);

            $.each(constraints, function (idx, constraint) {
                errors.push = assertConstraint(element, constraint);

                if (options.stopOnFirstError == true) {
                    // Break loop
                    return false;
                }
            });
        }
    };

    var hideErrors = function (element) {
        $(element).parent().find("small.error").attr('style', 'display: none');
    };

    var showErrors = function (element, errors) {
        var alert = $(element).parent().find("small.error");

        if (typeof alert != 'undefined') {
            alert.attr('style', 'display: block');
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

    var assertConstraint = function (element, constraint) {
        console.log(constraint);
    };
})
(jQuery);