"use strict";

var app = require("app");
var MailCollection = require("mail-collections/mailCollection");
var ContactsCollection = require("mail-collections/contactsCollection");
var SelectableDecorator = require("decorators/selectableCollectionDecorator");

var DataController = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

    DataController = Marionette.Controller.extend({

        //---------------------------------------------------
        // initialize
        //---------------------------------------------------

        initialize: function () {

            this.contactCollection = new ContactsCollection();
            this.mailCollection = new SelectableDecorator(new MailCollection());

            this._bindEvents();
            this._setHandlers();
        },

        //-----------------------------------------------------

        _bindEvents: function () {

            this.listenTo(this.mailCollection, "fetch:success", this._updateSelection, this);
            this.listenTo(app.context, "change:mail.action", this._refreshMailCollection, this);
            this.listenTo(app.vent,"onSettingsLoaded", this._updateContacts,this);
            this.listenTo(app.vent, "data:change", this._onDataChange, this);
        },

        //------------------------------------------------------

        _setHandlers: function () {

            mail.channel.reqres.setHandler("mail:collection", this._getMailCollection, this);
            mail.channel.reqres.setHandler("contact:collection", this._getContactCollection, this);
        },


        //------------------------------------------------------
        // get collections
        //-------------------------------------------------------

        _getMailCollection: function () {
            return this.mailCollection;
        },

        //------------------------------------------------------

        _getContactCollection: function () {
            return this.contactCollection;
        },


        //-----------------------------------------------------
        // data change
        //-----------------------------------------------------

        _onDataChange: function () {
            this._refreshMailCollection();
        },

        //------------------------------------------------------

        _updateSelection: function () {
            this.mailCollection.updateSelection({});
        },

        //-----------------------------------------------------

        _updateContacts:function(){
            this.contactCollection.addContact(app.settings.get("userName"));
        },

        //-----------------------------------------------------

        _refreshMailCollection: function () {

            var action = app.context.get("mail.action") || {};
            var params = action.params || {};

            if (_.isFinite(params.page)) {
                this.mailCollection.fetchBy({
                    filters: {
                        pageNumber: params.page,
                        query: params.query || 'groups:' + action.type
                    }
                });
            }
        }
    });
});
module.exports = DataController;


