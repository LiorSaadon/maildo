define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!contacts-templates/contacts.tmpl");

    var ContactsView = Marionette.CompositeView.extend({
        template:template,

        initialize:function (options) {
        }
    });

    return ContactsView;
});