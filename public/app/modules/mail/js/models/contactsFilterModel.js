define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ContactsFilterModel = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        ContactsFilterModel = Backbone.Model.extend({

            setInput: function (input) {
                this.input = _.isString(input) ? input : "";
            },

            //-----------------------------------------------------------------------

            filterBy: function (contactModel) {

                var inTitle = (contactModel.get("title").substring(0, this.input.length) === this.input);
                var inAddress = (contactModel.get("address").substring(0, this.input.length) === this.input);

                return inTitle || inAddress;
            }
        });
    });
    return ContactsFilterModel;
});