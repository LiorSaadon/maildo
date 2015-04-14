define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var template = require("tpl!frame-templates/loader.tmpl");

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

    return LoadingView;
});