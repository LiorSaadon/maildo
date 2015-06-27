"use strict";

var app = require("app");
var template = require("mail-templates/navView.hbs");

var NavView = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

    NavView = Marionette.ItemView.extend({
        template: template,

        //-----------------------------------------------

        initialize: function () {
            this.listenTo(app.context, 'change:mail.action', this.onActionChange, this);
        },

        //-----------------------------------------------

        onActionChange: function () {

            this.$el.find('li').removeClass('selected');
            var action = app.context.get("mail.action.type");
            this.$el.find('.nav-' + action).addClass('selected');
        }
    });
});

module.exports = NavView;
