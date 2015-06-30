"use strict";

var app = require("app");
var template = require("mail-templates/emptyFolderView.hbs");

var EmptyFolderView = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

    EmptyFolderView = Marionette.ItemView.extend({
        template: template,
        isPermanent: true,
        className: "empty-folder",

        ui: {
            "msgTitle": ".msgTitle"
        },

        //--------------------------------------------------

        initialize: function () {

            this.mails = mail.channel.reqres.request("mail:collection");
            this._bindEvents();
        },

        //--------------------------------------------------

        _bindEvents: function () {

            this.listenTo(this.mails, "change:items update:success delete:success fetch:success", this._checkIfEmpty, this);
        },

        //--------------------------------------------------

        _checkIfEmpty: function () {

            var isEmpty = this.mails.isEmpty();

            if (isEmpty) {
                var action = app.context.get("mail.action");
                this.ui.msgTitle.html(app.translator.translate("mail:emptyFolder." + action.type));
            }
            this.$el.toggle(isEmpty);
        }
    });
});

module.exports = EmptyFolderView;
