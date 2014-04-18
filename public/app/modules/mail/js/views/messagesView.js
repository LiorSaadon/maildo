define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/messagesView.tmpl");

    var MessagesView = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        MessagesView = Marionette.ItemView.extend({
            template:template
        });
    });

    return MessagesView;
});