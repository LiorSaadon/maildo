"use strict";

var app = require("app");
var template = require("frame-templates/loader.hbs");

var LoadingView = Marionette.ItemView.extend({
    template:template,

    ui:{
        loader:".loader"
    },

    showLoader: function () {
        this.$el.show();
    },

    closeLoader: function () {
        this.$el.hide();
    }
});

module.exports = LoadingView;
