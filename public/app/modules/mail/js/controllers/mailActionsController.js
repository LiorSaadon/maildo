define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ActionsController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.mails = mail.channel.reqres.request("mail:collection");
                this._bindEvents();
            },

            //-----------------------------------------------------

            _bindEvents:function(){

                this.listenTo(this.mails, "change:metadata",this.fixUrl, this);
                this.listenTo(mail.channel.vent, 'mail:send', this.send, this);
                this.listenTo(mail.channel.vent, 'mail:select', this.select, this);
                this.listenTo(mail.channel.vent, 'mail:moveTo', this.moveTo, this);
                this.listenTo(mail.channel.vent, 'mail:delete', this.deleteItems, this);
                this.listenTo(mail.channel.vent, 'mail:markAs', this.markAs, this);
                this.listenTo(mail.channel.vent, 'mail:discard', this.discard, this);
                this.listenTo(mail.channel.vent, 'mail:change', this.saveAsDraft, this);
            },

            //----------------------------------------------------

            select: function (options) {

                switch (options.selectBy) {

                    case 'all':
                        this.mails.selectAll();
                        break;
                    case 'none':
                        this.mails.clearSelected();
                        break;
                    case 'read':
                        this.mails.selectModels(this.mails.filterByLabel("read"), {exclusively: true});
                        break;
                    case 'unread':
                        this.mails.selectModels(this.mails.filterByLabel("unread"), {exclusively: true});
                        break;
                }
            },

            //----------------------------------------------------

            markAs: function (options) {

                var that = this, items = options.items || this.mails.getSelected();

                _.each(items, function (item) {
                    var model = that.mails.get(item);
                    if (model) {
                        model.markAs(options.label);
                    }
                });
                this.updateItems(items, options);
            },

            //----------------------------------------------------

            moveTo: function (options) {

                var that = this, items = options.items || this.mails.getSelected();

                _.each(items, function (item) {
                    var model = that.mails.get(item);
                    if (model) {
                        model.moveTo(options.target, options);
                    }
                });
                this.updateItems(items, _.extend({}, options, {"refresh": true}));
            },

            //----------------------------------------------------

            updateItems: function (items, options) {

                this.mails.update({

                    selectedItems: items,
                    fields: ['id', 'labels', 'groups'],

                    success: _.bind(function () {
                        if (options.refresh) {
                            this.mails.refresh();
                        }
                    }, this),
                    error:function(){
                        mail.channel.vent.trigger("mail:updateItems:error");
                    }
                });
            },

            //----------------------------------------------------

            deleteItems: function () {

                this.mails.destroy({

                    selectedItems: this.mails.getSelected(),

                    success: _.bind(function () {
                        this.mails.refresh();
                    }, this),
                    error:function(){
                        mail.channel.vent.trigger("mail:deleteItems:error");
                    }
                });
            },

            //-------------------------------------------

            send: function (mailModel) {

                if (_.isObject(mailModel)) {

                    mailModel.set("groups.draft", false, {silent:true});

                    mailModel.save(null, {

                        success: function () {
                            mail.router.previous();
                        },
                        error:function(){
                            mail.channel.vent.trigger("mail:save:error", mailModel);
                        }
                    });
                }
            },

            //-------------------------------------------

            discard: function (mailModel) {

                if(mailModel.isNew()){
                    mail.router.previous();
                }else{
                    if (mailModel.get("groups.draft")) {

                        mailModel.destroy({
                            success: _.bind(function () {
                                this.mails.refresh();
                            },this),
                            error:function(){
                                mail.channel.vent.trigger("mail:delete:error", mailModel);
                            }
                        });
                    }
                }
            },

            //-------------------------------------------

            saveAsDraft: function (mailModel) {

                mailModel.set("groups.draft", true, {silent:true});

                mailModel.save(null, {
                    saveAs: "draft"
                });
            },

            //------------------------------------------

            fixUrl:function(metadata){
                mail.router.fixUrl({page:metadata.currPage + 1});
            }
        });
    });
    return ActionsController;
});
