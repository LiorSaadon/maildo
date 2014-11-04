define(function (require) {
    "use strict";
    var $ = require("jquery");
    var _ = require("underscore");
    var Backbone = require("backbone");
    var Marionette = require("marionette");

    var AppMock = {

        moduleObject: {
            channel: Backbone.Wreqr.radio.channel("name")
        },

        module: function (name, callback) {

            var backboneObj = new Backbone.Wreqr.CommandStorage();

            var module1 =  $.extend(this.moduleObject, backboneObj);

            callback.call(this, module1, this, Backbone, Marionette, $, _);

            return module1;
        },
        channel: Backbone.Wreqr.radio.channel("app")
    }
    return AppMock;
});
