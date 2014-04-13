define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailLayout = require("mail-views/mailLayout");
    var HeaderView = require("mail-views/headerView");
    var NavView = require("mail-views/navView");
    var DataLayout = require("mail-views/dataLayout");
    var ActionView = require("mail-views/actionView/actionView");
    var MailTableView = require("mail-views/mailTableView");
    var ComposeView = require("mail-views/composeView/composeView");
    var SettingsView = require("mail-views/settingsView");
    var MailModel = require("mail-models/mailModel");

    var MailLayoutController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        MailLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.mailLayout = new MailLayout();

                this.listenTo(this.mailLayout, "render", this.onLayoutRender, this);
                this.listenTo(app.context, 'change:router.state', this.onContextChange, this);
            },

            //----------------------------------------------------
            // getLayout
            //----------------------------------------------------

            getLayout: function () {
                return this.mailLayout;
            },

            //----------------------------------------------------
            // onLayoutRender
            //----------------------------------------------------

            onLayoutRender: function () {

                var headerView = new HeaderView();
                this.mailLayout.headerRegion.show(headerView);

                var actionView = new ActionView();
                this.mailLayout.actionRegion.show(actionView);

                var navView = new NavView();
                this.mailLayout.navRegion.show(navView);

                this.dataLayout = new DataLayout();
                this.mailLayout.dataRegion.show(this.dataLayout);
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
                        this.showData(action);
                }
            },

            //----------------------------------------------------
            // compose
            //----------------------------------------------------

            compose: function () {

                var mailModel = mail.newMailActionsController.composeModel();

                var composeView = new ComposeView({
                    model:mailModel
                });
                this.mailLayout.dataRegion.show(composeView);
            },

            //----------------------------------------------------
            // showSettings
            //----------------------------------------------------

            showSettings: function () {

                var settingsView = new SettingsView(app.settings);
                this.mailLayout.dataRegion.show(settingsView);
            },

            //----------------------------------------------------
            // showData
            //----------------------------------------------------

            showData: function (action) {

                var params = app.context.get("router.state.params");

                if (params.id) {
                    this.showItem(params.id);
                } else {
                    this.showCollection(action, params);
                }
            },

            //----------------------------------------------------

            showCollection: function (action, params) {

                var that = this;

                this.mails = mail.dataController.getMailCollection();

                this.mails.fetchBy({
                    filters: {
                        page: params.page,
                        query: params.query || 'groups:' + action
                    },
                    success: function () {
                        that.mails.clearSelected();

                        if(that.mails.size === 0){

                        }else{
                            var tableView = new MailTableView({collection: that.mails, action:action});
                            that.dataLayout.itemsRegion.show(tableView);
                        }
                     }
                });
            },

            //----------------------------------------------------

            showItem: function (id) {

                var that = this;

                var mailModel = new MailModel({id: id});

                mailModel.fetch({
                    success: function () {
                        mail.vent.trigger("actions", {action: 'markAs', label: 'read', target: id});
                        var composeView = new ComposeView({model: mailModel});
                        that.dataLayout.previewRegion.show(composeView);
                    },
                    error:function(){
                        mail.router.previous();
                    }
                });
            }
        });
    });
    return MailLayoutController;
});
