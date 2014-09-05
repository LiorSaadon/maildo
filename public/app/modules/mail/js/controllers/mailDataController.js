define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailCollection = require("mail-collections/mailCollection");
    var ContactsCollection = require("mail-collections/contactsCollection");
    var SelectableDecorator = require("assets-decorators/selectableCollectionDecorator");

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
                this._fetchAll();
            },

            //-----------------------------------------------------

            _bindEvents: function () {

                this.listenTo(this.mailCollection, "fetch:success", this._updateSelection, this);
                this.listenTo(app.context, "change:mail.action", this._refreshMailCollection, this);
            },

            //------------------------------------------------------

            _setHandlers: function () {

                mail.channel.reqres.setHandler("mail:collection", this._getMailCollection, this);
                mail.channel.reqres.setHandler("contact:collection", this._getContactCollection, this);
            },

            //-----------------------------------------------------

            _fetchAll: function () {

                setTimeout(_.bind(function () {
                    this.mailCollection.persist();
                    this.contactCollection.fetch();
                }, this), 150);
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
            // update collections
            //-----------------------------------------------------

            _updateSelection: function () {
                this.mailCollection.updateSelection({});
            },

            //-----------------------------------------------------

            _refreshMailCollection: function () {

                var action = app.context.get("mail.action") || {};
                var params = action.params || {};

                if (_.isFinite(params.page)) {

                    this.mailCollection.fetchBy({
                        filters: {
                            page: params.page,
                            query: params.query || 'groups:' + action.type
                        }
                    });
                }
            }
        });
    });
    return DataController;
});


