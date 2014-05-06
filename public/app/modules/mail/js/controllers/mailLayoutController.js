define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");
    var MainLayout = require("mail-views/mailLayout");
    var HeaderView = require("mail-views/headerView");
    var NavView = require("mail-views/navView");
    var ActionView = require("mail-views/actionView/actionView");
    var ComposeView = require("mail-views/composeView/composeView");
    var SettingsView = require("mail-views/settingsView");
    var DataLayoutController = require("mail-controllers/mailDataLayoutController");

    var MainLayoutController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.mainLayout = new MainLayout();
                this.dataLayoutController = new DataLayoutController();

                this.listenTo(this.mainLayout, "render", this.onLayoutRender, this);
                this.listenTo(app.context, 'change:router.state', this.onContextChange, this);
            },

            //----------------------------------------------------
            // getLayout
            //----------------------------------------------------

            getLayout: function () {
                return this.mainLayout;
            },

            //----------------------------------------------------
            // onLayoutRender
            //----------------------------------------------------

            onLayoutRender: function () {

                var headerView = new HeaderView();
                this.mainLayout.headerRegion.show(headerView);

                var actionView = new ActionView();
                this.mainLayout.actionRegion.show(actionView);

                var navView = new NavView();
                this.mainLayout.navRegion.show(navView);
            },

            //----------------------------------------------------
            // onContextChange
            //----------------------------------------------------

            onContextChange: function () {

                var action = app.context.get("router.state.action");

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
            // compose
            //----------------------------------------------------

            compose: function () {

                var composeView = new ComposeView({
                    model:new MailModel()
                });
                this.mainLayout.dataRegion.show(composeView);
            },

            //----------------------------------------------------
            // showSettings
            //----------------------------------------------------

            showSettings: function () {

                var settingsView = new SettingsView(app.settings);
                this.mainLayout.dataRegion.show(settingsView);
            },

            //----------------------------------------------------
            // showData
            //----------------------------------------------------

            showData: function () {

                this.dataLayoutController.setLayout(this.mainLayout.dataRegion);
            }
        });
    });
    return MainLayoutController;
});
