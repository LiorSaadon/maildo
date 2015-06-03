define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var dateResolver = require("resolvers/date/dateResolver");

    var Formatter = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        Formatter = (function () {

            var formatAddresses = function(titles){

                var res = "";

                titles = titles || [];

                if(titles.length === 1){
                    return titles[0];
                }
                _.each(titles, function(title){
                    res += _s.strLeftBack(title, " ") + ", ";
                });

                return _s.strLeftBack(res,",");
            };

            //-------------------------------------------------------------

            var formatShortDate = function(ticks){

                if(_.isFinite(ticks)){

                    var now = new Date();
                    var date = new Date(parseInt(ticks));
                    var timeDiff = Math.abs(now.getTime() - date.getTime());
                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    if(diffDays > 1){
                        return app.translator.translate("mail:timerange.months." +date.getMonth()) + " " + date.getDay();
                    }
                    return date.toLocaleTimeString().replace(/:\d+ /, ' ');
                }
                return "";
            };

            //-------------------------------------------------------------

            var formatSubject =  function (subject) {

                if (_.isEmpty(subject)) {
                    subject = "(" + app.translator.translate("mail:nosubject") + ")";
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

            return{
                formatSubject:formatSubject,
                formatContent:formatContent,
                formatShortDate:formatShortDate,
                formatAddresses:formatAddresses
            };
        })();
    });

    return Formatter;
});
