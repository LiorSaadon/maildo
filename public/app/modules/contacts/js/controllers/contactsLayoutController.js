define(function (require) {
    "use strict";

    var App = require("mbApp");
    var ContactsLayoutController = {};
    var ContactsLayout = require("contactsApp-views/contactsLayout");
    var NavView = require("contactsApp-views/navView");
    var ActionView = require("contactsApp-views/actionView");
    var ContactsView = require("contactsApp-views/contactsView");


    App.module('contacts', function (contacts, App,  Backbone, Marionette, $, _) {

        ContactsLayoutController = Marionette.Controller.extend({

            initialize:function () {
                this.contactsLayout = new ContactsLayout();

                this.listenTo(this.contactsLayout, "render", function () {

                    var actionView = new ActionView();
                    this.contactsLayout.actionRegion.show(actionView);

                    var navView = new NavView();
                    this.contactsLayout.navRegion.show(navView);

                });
            },

            contacts:function () {
                var contactsView = new ContactsView();
                this.contactsLayout.dataRegion.show(contactsView);
            },

            getLayout:function(){
                return this.contactsLayout;
            }
        });
    });
    return ContactsLayoutController;
});
