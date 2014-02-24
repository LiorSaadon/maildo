define(function (require) {
    "use strict";

    var App = require("mbApp");

    App.module('contacts', function (mail, App,  Backbone, Marionette, $, _) {

        var LayoutController = require("contacts-controllers/contactsLayoutController");
        var Router = require("contacts-routers/contactsRouter");

        this.addInitializer(function (options) {
            this.layoutController = new LayoutController(options);
            this.router =  new Router({ controller: this.layoutController });
        });

        this.on("start", function (options) {

        });

        this.getLayout =function(){

            return this.layoutController.getLayout();
        };
    });

    return App.module("contacts");
});