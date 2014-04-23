define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var dateResolver = require("assets-resolvers-date/dateResolver");

    var Formatter = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        Formatter = (function () {

            var formatAddresses = function(addressList){

                var res = "",
                    titles = mail.dataController.getContactsCollection().getTitles(addressList);

                if(titles.length === 1){
                    return titles[0];
                }
                _.each(titles, function(title){
                    res += _s.strLeftBack(title, " ") + ", ";
                });

                return _s.strLeftBack(res,",");
            };

            //-------------------------------------------------------------

            var formatShortDate = function(date){
                if(_.isString(date)){
                    date = dateResolver.strToDate(date);
                }
                if(_.isDate(date)){
                    var day = date.getDate();
                    var month = date.getMonth() + 1;
                    var monthStr = app.translator.translate("mail.timerange.months."+month);
                    return monthStr + ' ' + day;
                }
                return '';
            };

            //-------------------------------------------------------------

            var formatSubject =  function (subject) {

                if (_.isEmpty(subject)) {
                    subject = "(" + app.translator.translate("mail.nosubject") + ")";
                }
                return subject;
            };

            //-------------------------------------------------------------

            var formatContent = function (content) {

                if (!_.isEmpty(content)) {
                   return content.replace(/(<([^>]+)>)/ig, "").replace(/&nbsp;/ig, " ");
                }
                return content;
            };

            //-------------------------------------------------------------

            return{
                formatSubject:formatSubject,
                formatContent:formatContent,
                formatShortDate:formatShortDate,
                formatAddresses:formatAddresses
            }
        })();
    });

    return Formatter;
});
