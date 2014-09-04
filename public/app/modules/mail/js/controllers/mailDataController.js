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

                this.contactCollection = new ContactsCollection();
                this.mailCollection = new SelectableDecorator(new MailCollection());

                this.listenTo(app.context, "change:mail.action", this._onActionChange, this);
                this.listenTo(this.mailCollection, "change:items", this._updateSelection, this);

                this._fetchAll();
            },

            //-----------------------------------------------------

            _fetchAll:function(){

                setTimeout(_.bind(function(){
                    this.mailCollection.persist();
                    this.contactCollection.fetch();
                },this),30);
            },

            //------------------------------------------------------

            getMailCollection : function () {
                return this.mailCollection;
            },

            //------------------------------------------------------

            getContactsCollection: function(){
                return this.contactCollection;
            },
            //-----------------------------------------------------

            _updateSelection:function(){
                this.mailCollection.updateSelection();
            },

            //-----------------------------------------------------

            _onActionChange:function(){

                var action = app.context.get("mail.action");

                if(_.isObject(action) && _.isObject(action.params)){

                    this.mailCollection.fetchBy({
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


