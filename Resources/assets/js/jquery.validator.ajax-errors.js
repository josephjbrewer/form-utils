(function ($) {
    var config = {
        /**
         * Set a header for the root-level form errors. Value can contain HTML or raw text
         * @var string|null
         */
        rootErrorMessage: null,

        /**
         * This should be set to the name of the root-level form.
         * @var string|null
         */
        formPrefix: null,

        /**
         * Separator character
         * @var string
         */
        separator: '_',

        /**
         * The DOM element object of the form
         * @var Object
         */
        formObj: null,

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

    $.fn.ajaxErrors = function (errObj, options) {
        if (typeof options == 'object') {
            $.extend(config, options);
        }

        hideAllErrors();

        config.formObj = $(this);
        config.formPrefix = $(this).attr('id');
        config.errors = {};

        if (!config.formPrefix) {
            throw "Root form element must have an ID that is equivalent to the form object's name";
        }

        traverseErrorObject(errObj.errors, config.formPrefix);
        bindErrors(config.errors);
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
     * @param errors
     */
    var bindErrors = function (errors) {
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

    /**
     * Removes all error messages and hides its container for the stored config.formObj
     */
    var hideAllErrors = function () {
        $(config.formObj).find('small.error').addClass('hide').html('');
    };
})(jQuery);