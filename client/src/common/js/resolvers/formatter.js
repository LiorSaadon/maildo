"use strict";

var Formatter = (function () {

    var formatAddresses = function (titles) {

        var res = "";

        titles = titles || [];

        if (titles.length === 1) {
            return titles[0];
        }
        _.each(titles, function (title) {
            res += _s.strLeftBack(title, " ") + ", ";
        });

        return _s.strLeftBack(res, ",");
    };

    //-------------------------------------------------------------

    var formatShortDate = function (ticks,translator) {

        if (_.isFinite(ticks)) {

            var now = new Date();
            var date = new Date(parseInt(ticks, 10));
            var timeDiff = Math.abs(now.getTime() - date.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (diffDays > 1) {
                return translator.translate("mail:timerange.months." + date.getMonth()) + " " + date.getDay();
            } else {
                var hours = date.getHours();
                var minutes = date.getMinutes();
                var ampm = hours >= 12 ? 'pm' : 'am';

                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;

                return hours + ':' + minutes + ' ' + ampm;
            }
        }
        return "";
    };

    //-------------------------------------------------------------

    var formatSubject = function (subject,translator) {

        if (_.isEmpty(subject)) {
            subject = "(" + translator.translate("mail:nosubject") + ")";
        }
        return subject;
    };

    //-------------------------------------------------------------

    var formatContent = function (content) {

        if (!_.isEmpty(content)) {
            return content.replace(/(<([^>]+)>)/ig, " ").replace(/&nbsp;/ig, " ");
        }
        return content;
    };

    //-------------------------------------------------------------

    return {
        formatSubject: formatSubject,
        formatContent: formatContent,
        formatShortDate: formatShortDate,
        formatAddresses: formatAddresses
    };
})();

module.exports = Formatter;

