"use strict";

var DateUtility = (function () {

    var pad = function (number, length) {

        var str = '' + number;
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    };

    //----------------------------------------------------------------
    // strToDate
    //--------------------------------------------------------------

    /**
     * @param str "Y_M_D H-M-S" - single letter is conceptual only
     * _ is a separator for date can be "-" or "/" or ":"
     * - is a separator for time can be "-" or "/" or ":"
     * @returns {Date}
     */
    var strToDate = function (str) {
        var retDateObj = {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        };

        var date = str.split(" ")[0];

        var dateSep = date.indexOf("-") > -1 ? "-" :
            date.indexOf("/") > -1 ? "/" : ":";

        retDateObj.year = parseInt(date.split(dateSep)[0], 10);
        retDateObj.month = parseInt(date.split(dateSep)[1], 10) - 1;
        retDateObj.day = parseInt(date.split(dateSep)[2], 10);

        if (str.split(" ").length > 1) {
            var time = str.split(" ")[1];

            var timeSep = time.indexOf("-") > -1 ? "-" :
                time.indexOf("/") > -1 ? "/" : ":";

            retDateObj.hours = parseInt(time.split(timeSep)[0], 10);
            retDateObj.minutes = parseInt(time.split(timeSep)[1], 10);
            retDateObj.seconds = parseInt(time.split(timeSep)[2], 10);
            retDateObj.milliseconds = 0;
        }

        return new Date(retDateObj.year, retDateObj.month, retDateObj.day, retDateObj.hours, retDateObj.minutes, retDateObj.seconds, retDateObj.milliseconds);
    };

    //----------------------------------------------------------------
    // date2Str
    //--------------------------------------------------------------

    /**
     * @param date
     * @param clearTime boolean, optional, reset time to 00:00:00.
     * @returns str "Y_M_D H-M-S" - single letter is conceptual only
     */
    var date2Str = function (date, clearTime) {

        var str = '', hour = "00", min = "00", sec = "00", dateSeparator = "-", timeSeparator = ":";

        if (_.isDate(date)) {

            var day = pad(date.getDate(), 2);
            var month = pad(date.getMonth() + 1, 2);
            var year = date.getFullYear();

            if (!clearTime) {
                hour = pad(date.getHours(), 2);
                min = pad(date.getMinutes(), 2);
                sec = pad(date.getSeconds(), 2);
            }

            str = year + dateSeparator + month + dateSeparator + day + ' ' + hour + timeSeparator + min + timeSeparator + sec;
        }
        return str;
    };

    return {
        strToDate: strToDate,
        date2Str: date2Str
    };
})();

module.exports = DateUtility;

