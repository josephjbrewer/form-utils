;
/**
 *
 */
(function ($) {
//////////////////////////////////////////////////////////////////

    $.fn.validatePlease = function (options) {

        var opts = $.extend({}, $.fn.validatePlease.defaults, options);

        this.on('focus', function (e) {
            var input = $(this);
            var st = input.attr('data-suggestive-text');

            if (st && $.fn.validatePlease.fieldTest(this, 'error', 'focus')) {
                input.siblings('small.error').html(st).addClass('suggestiveText');
                input.parent().addClass('notice');
                input.siblings('small.error').show();
            }
        }).on('blur', function (e) {
            return $.fn.validatePlease.fieldTest(this, 'error', 'blur');
        }).on('change', function (e) {
            return $.fn.validatePlease.fieldTest(this, 'error', 'change');
        });


        return this;
    };

    $.fn.validatePlease.defaults = {
        autoRun: true,
        target: 'input',
        useAngular: false
    };

    $.fn.validatePlease.fieldTest = function (input, type, action) {

        input = $(input);
        type = type || 'error';

        // Don't validate if field is hidden from view
        if ($(input).attr('data-ignore-validation')) {
            return true;
        }

        var constraints = input.attr("data-constraints"),
            messages = input.attr("data-error-messages");

        // make sure the input actually has constraints
        if (constraints !== undefined && constraints.length > 0) {
            constraints = JSON.parse(constraints);
            messages = JSON.parse(messages);

        } else if ($(input).hasClass('.masked') && $(input).hasClass('.formatPlease')) {
            return true;
        } else {
            return true;
        }

        // remove any lingering error classes.
        this.hideErrorsAndNotices(input);

        // don't try and validate disabled inputs
        if (input.attr('disabled')) {
            $(input).removeAttr('pattern');
            return true;
        }

        for (var x = 0, y = constraints.length; x < y; x++) {
            var testVal = $(input).val(),
                pattern = new RegExp(constraints[x], 'g'),
                prefix = constraints[x].match(/__([\_a-zA-Z0-9]+)__/g),
                notblank = false;

            prefix = (prefix !== null && typeof prefix === 'object') ? prefix[0] : prefix;

            if ($(input).attr('data-using-format-please-mask') !== undefined && $(input).attr('data-using-format-please-mask') !== null) {
                testVal = $(input).siblings('input[type="hidden"].formatPlease.masked').val();
            }

            if (constraints[x] === '__NOT_BLANK__') {
                notblank = true;
                pattern = /.*/;
            }

            if (notblank && !this.fieldTestNotBlank(testVal)) {
                if (action == 'focus') {
                    return true;
                }
                $(input).attr("pattern", pattern).siblings("small.error").html(messages[x]);
                this.showErrorsAndNotices(input, type);
                return false;
            }

            else if (prefix === "__MATCH__") {
                var other = $("#" + constraints[x].substring(prefix.length));

                if (!this.fieldTestMatch(testVal, other.val())) {
                    $(input).attr("pattern", '^' + other.val() + '$').siblings("small.error").html(messages[x]);
                    this.showErrorsAndNotices(input, type);
                    return false;
                }
            }

            else if (prefix === '__GROUP__') {
                var group_members = prefix.split(',');
                if (!this.fieldTestGroup(testVal, group_members)) {
                    $(input).attr("pattern", pattern).siblings("small.error").html(messages[x]);
                    this.showErrorsAndNotices(input, type);
                    return false;
                }
            }

            else if (prefix === '__LUHN__') {
                var field_id = prefix.split(',');
                if (!this.fieldTestLuhn(testVal)) {
                    $(input).attr("pattern", pattern).siblings("small.error").html(messages[x]);
                    this.showErrorsAndNotices(input, type);
                    return false;
                }
            }

            else if (prefix === '__BINCODE__') {
                var rangeString = input.attr("data-bin_code-ranges");
                if (!this.fieldTestBincode(testVal, rangeString, action)) {
                    $(input).attr("pattern", pattern).siblings("small.error").html(messages[x]);
                    this.showErrorsAndNotices(input, type);
                    return false;
                }
            }

            else if (prefix === '__OVER18__') {
                if (!this.fieldTestAge(input, pattern, type, messages[x], true)) {
                    return false
                }
            }

            else if (prefix === '__UNDER18__') {
                if (!this.fieldTestAge(input, pattern, type, messages[x], false)) {
                    return false
                }
            }

            else if (pattern && !this.fieldTestPattern(testVal, pattern)) {
                $(input).attr("pattern", pattern).siblings("small.error").html(messages[x]);
                this.showErrorsAndNotices(input, type);
                return false;
            }
        }

        $(input).removeAttr('pattern');

        return true;
    };

    $.fn.validatePlease.hideErrorsAndNotices = function (input) {
        $(input).parent().removeClass("notice");
        $(input).parent().removeClass("error");
        $(input).parent().find("small.error").attr('style', 'display: none');
    };

    $.fn.validatePlease.showErrorsAndNotices = function (input, type) {
        $(input).parent().addClass(type);
        $(input).parent().find('small.error').attr('style', 'display: block');
    };

    $.fn.validatePlease.fieldTestNotBlank = function (val) {
        return (val.trim() !== "");
    };

    $.fn.validatePlease.fieldTestPattern = function (val, pattern) {
        if (val == "") {
            return true;
        }

        return pattern.test(val)
    };

    $.fn.validatePlease.fieldTestMatch = function (val1, val2) {
        return (val1 == val2)
    };

    // returns false if field is empty and any of group_members is not empty
    $.fn.validatePlease.fieldTestGroup = function (val, group_members) {
        var valid = true;

        if (val === "") {
            return false;
        }

        if (val.trim() === "") {
            $.each(group_members, function (i, member) {
                if ($('#' + member).val().trim() !== "") {
                    valid = false;
                }
            })
        }

        return valid;
    };

    $.fn.validatePlease.fieldTestLuhn = function (value) {
        var nCheck = 0, nDigit = 0, bEven = false;
        for (var n = value.length - 1; n >= 0; n--) {
            var cDigit = value.charAt(n), nDigit = parseInt(cDigit, 10);
            if (bEven) {
                if ((nDigit *= 2) > 9) nDigit -= 9;
            }
            nCheck += nDigit;
            bEven = !bEven;
        }
        return (nCheck % 10) == 0;

    };

    $.fn.validatePlease.fieldTestAge = function (input, pattern, type, message, isAdult) {

        var parentRow = $(input).parents('.row'),
            month = $(parentRow).find('select[data-dob-month]'),
            day = $(parentRow).find('select[data-dob-day]'),
            year = $(parentRow).find('select[data-dob-year]'),
            dobMessage = $(parentRow).find('select[data-dob-message]');


        if (month.val() == '' || day.val() == '' || year.val() == '') {
            return true;
        }

        var ageLimit = 18,
            birthdate = new Date(parseInt(year.val()) + ageLimit, month.val() - 1, day.val()),
            dateDiff = ((new Date()) - birthdate),
            result = isAdult ? dateDiff <= ageLimit : dateDiff > ageLimit;

        if (result) {
            year.attr("pattern", pattern);
            year.parent().addClass(type);

            $(dobMessage).siblings("small.error").html(message);
            return false;
        }
        else {
            parentRow.find('select').each(function () {
                $(this).removeAttr('pattern');
                $(this).parent().removeClass('error');
            });
        }
    };

    $.fn.validatePlease.fieldTestBincode = function (value, rangeString, action) {
        var result = false;
        if (action == 'focus' && value.length == 0) {
            return true;
        }
        var ranges = rangeString.split(",");
        for (var i = 0; i < ranges.length - 1; i++) {
            var numbers = ranges[i].split(":");
            if (value >= numbers[0] && value <= numbers[1]) {
                result = true;
                break;
            }
        }
        return result;
    };

//////////////////////////////////////////////////////////////////
})(jQuery);

