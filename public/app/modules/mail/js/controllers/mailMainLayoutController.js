define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");
    var MainLayout = require("mail-views/mailMainLayout");
    var SearchView = require("mail-views/searchView");
    var NavView = require("mail-views/navView");
    var ActionView = require("mail-views/actionView/actionView");
    var ComposeView = require("mail-views/composeView/composeView");
    var SettingsView = require("mail-views/settingsView");
    var EmptyFoldersView = require("mail-views/emptyFolderView");
    var ContentLayoutController = require("mail-controllers/mailContentLayoutController");

    var MainLayoutController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.contentLayoutController = new ContentLayoutController();
                this.listenTo(app.context, 'change:mail.action', this.onActionChange, this);
            },

            //----------------------------------------------------
            // setViews
            //----------------------------------------------------

            setViews: function () {

                this.searchView = new SearchView();
                this.mainLayout = new MainLayout();
                this.actionView = new ActionView();

                this.listenTo(this.mainLayout, "render", this.onMainLayoutRender, this);

                app.frame.setRegion("search", this.searchView);
                app.frame.setRegion("actions", this.actionView);
                app.frame.setRegion("main", this.mainLayout);
            },

            //----------------------------------------------------

            onMainLayoutRender:function(){

                var navView = new NavView();
                this.mainLayout.navRegion.add(navView);

                var emptyFolderView = new EmptyFoldersView();
                this.mainLayout.workRegion.add(emptyFolderView);
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
                        this.showMails();
                }
            },

            //----------------------------------------------------

            compose: function () {

                var composeView = new ComposeView({
                    model:new MailModel()
                });
                this.mainLayout.workRegion.add(composeView);
            },

            //----------------------------------------------------

            showSettings: function () {

                var settingsView = new SettingsView(app.settings);
                this.mainLayout.workRegion.add(settingsView);
            },

            //----------------------------------------------------

            showMails: function () {

                var contentLayout = this.contentLayoutController.newLayout();
                this.mainLayout.workRegion.add(contentLayout);
            }
        });
    });
    return MainLayoutController;
});
