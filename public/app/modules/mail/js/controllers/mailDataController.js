define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailCollection = require("mail-collections/mailCollection");
    var ContactsCollection = require("mail-collections/contactsCollection");
    var SelectableDecortator = require("assets-decorators/selectableCollectionDecorator");

    var DataController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

            initialize: function () {

                this.mails = new SelectableDecortator(new MailCollection());

                this.contactsCollection = new ContactsCollection();
                this.contactsCollection.fetch();

                this._bindEvents();
            },

            //------------------------------------------------------

            _bindEvents:function(){
                this.listenTo(app.context, 'change:mail.action', this.onActionChange, this);
            },

            //------------------------------------------------------

            getMailCollection : function () {
                return this.mails;
            },

            //------------------------------------------------------

            getContactsCollection: function(){
               return this.contactsCollection;
            },

            //-----------------------------------------------------

            onActionChange:function(){

                var action = app.context.get("mail.action");

                if(_.isObject(action) && _.isObject(action.params)){

                    this.mails.fetchBy({
                        filters: {
                            page: action.params.page,
                            query: action.params.query || 'groups:' + action.type
                        },
                        success: _.bind(function(){
                            this.mails.clearSelected();
                        },this)
                    });
                }
            }
        });
    });
    return DataController;
});


