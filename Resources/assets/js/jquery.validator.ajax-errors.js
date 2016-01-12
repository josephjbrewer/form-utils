(function ($) {
    var config = {
        rootErrorMessage: null,
        formPrefix: '_root_',
        separator: '_',
        formObj: null,
        color: 'inherit',
        messageTemplate: '{{message}}',
        errors: {}
    };

    $.fn.ajaxErrors = function (errObj, options) {
        if (typeof options == 'object') {
            $.extend(config, options);
        }

        hideAllErrors();

        config.formObj = $(this);
        config.errors = {};

        traverseErrorObject(errObj.errors, config.formPrefix);

        if (Object.keys(config.errors).length > 0) {
            if (config.rootErrorMessage) {
                if (!config.errors[config.formPrefix]) {
                    config.errors[config.formPrefix] = [];
                }

                config.errors[config.formPrefix].unshift(config.rootErrorMessage)
            }
        }

        bindErrors(config.errors);
    };

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

                var pfx = prefix;

                if (prefix == '_root_') {
                    pfx = '';
                }

                var _prefix = key;

                if (pfx != '') {
                    _prefix = pfx + config.separator + key;
                }

                traverseErrorObject(child, _prefix);
            });
        }
    };

    var bindErrors = function (errors) {
        var rootElementId = $(config.formObj).attr('id');

        $.each(errors, function (key, _errors) {
            var html = '';

            if (key == '_root_') {
                key = rootElementId;
            }

            $.each(_errors, function (idx, error) {
                html += formatMessageTemplate(error);
            });

            $(config.formObj).find('[data-validation-for="' + key + '"]').removeClass('hide').html(html);
        });
    };

    var formatMessageTemplate = function (msg) {
        return config.messageTemplate.replace('{{message}}', msg);
    };

    var hideAllErrors = function () {
        $(config.formObj).find('small.error').addClass('hide').html('');
    };
})(jQuery);