define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");

    var ContactsFilterModel = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ContactsFilterModel = Backbone.Model.extend({

            setInput: function (input) {
                this.input = _.isString(input) ? input.toLowerCase() : "";
            },

            //-----------------------------------------------------------------------

            filterBy: function (contactModel) {

                var res = false,
                    subTitles = contactModel.get("title").toLowerCase().split(" ");

                 _.each(subTitles, _.bind(function(subTitle){
                    res = res || _s.startsWith(subTitle, this.input);
                },this));

                return res;
            }
        });
    });
    return ContactsFilterModel;
});