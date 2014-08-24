define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailCollection = require("mail-collections/mailCollection");
    var ContactsCollection = require("mail-collections/contactsCollection");
    var SelectableDecorator = require("assets-decorators/selectableCollectionDecorator");

    var DataController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

            initialize: function () {

                this.mails = new SelectableDecorator(new MailCollection());
                this.mails.persist();

                this.contactsCollection = new ContactsCollection();
                this.contactsCollection.fetch();

                this._bindEvents();
            },

            //------------------------------------------------------

            _bindEvents:function(){
                this.listenTo(this.mails, 'fetch:success', this.updateSelection, this);
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

            updateSelection:function(){
                this.mails.updateSelection();
            },

            //-----------------------------------------------------

            onActionChange:function(){

                var action = app.context.get("mail.action");

                if(_.isObject(action) && _.isObject(action.params)){

                    this.mails.fetchBy({
                        filters: {
                            page: action.params.page,
                            query: action.params.query || 'groups:' + action.type
                        }
                    });
                }
            }
        });
    });
    return DataController;
});


