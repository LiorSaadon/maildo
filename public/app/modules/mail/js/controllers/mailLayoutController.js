define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");
    var MainLayout = require("mail-views/mailLayout");
    var SearchView = require("mail-views/searchView");
    var NavView = require("mail-views/navView");
    var ActionView = require("mail-views/actionView/actionView");
    var ComposeView = require("mail-views/composeView/composeView");
    var SettingsView = require("mail-views/settingsView");
    var DataLayoutController = require("mail-controllers/mailDataLayoutController");

    var MainLayoutController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.dataLayoutController = new DataLayoutController();

                this.listenTo(app.context, 'change:module', this.setViews, this);
                this.listenTo(app.context, 'change:mail.action', this.onActionChange, this);
            },

            //----------------------------------------------------
            // setViews
            //----------------------------------------------------

            setViews: function () {

               if(app.context.get("module") === "mail"){

                    this.searchView = new SearchView();
                    this.mainLayout = new MainLayout();
                    this.actionView = new ActionView();

                    this.listenTo(this.mainLayout, "render", this.onMainLayoutRender, this);

                    app.frame.setRegion("search", this.searchView);
                    app.frame.setRegion("actions", this.actionView);
                    app.frame.setRegion("main", this.mainLayout);
                }
            },

            //----------------------------------------------------

            onMainLayoutRender:function(){

                var navView = new NavView();
                this.mainLayout.navRegion.show(navView);
            },

            //----------------------------------------------------
            // onActionChange
            //----------------------------------------------------

            onActionChange: function () {

                var action = app.context.get("mail.action.type");

                switch (action) {
                    case "compose":
                        this.compose();
                        break;
                    case "settings":
                        this.showSettings();
                        break;
                    default:
                        this.showData();
                }
            },

            //----------------------------------------------------

            compose: function () {

                var composeView = new ComposeView({
                    model:new MailModel()
                });
                this.mainLayout.dataRegion.show(composeView);
            },

            //----------------------------------------------------

            showSettings: function () {

                var settingsView = new SettingsView(app.settings);
                this.mainLayout.dataRegion.show(settingsView);
            },

            //----------------------------------------------------

            showData: function () {

                var dataLayout = this.dataLayoutController.newLayout();
                this.mainLayout.dataRegion.show(dataLayout);
            }
        });
    });
    return MainLayoutController;
});
