/**
 * Created with IntelliJ IDEA.
 * User: elinar
 * Date: 11/12/13
 * Time: 3:51 PM
 * To change this template use File | Settings | File Templates.
 */

define(function (require) {
    "use strict";
    var $ = require("jquery");
    var _ = require("underscore");
    var Backbone = require("backbone");
    var Marionette = require("marionette");

    var LEDependencyMocks = function () {

        var Channel = Backbone.Wreqr.radio.channel("app");

        var module = {
            channel: Channel
        };

        this.module = module;
        this.channel = Channel;

        this.app = function () {
            return {
                module: function (name, callback) {
                    callback.call(this, module, this, Backbone, Marionette, $, _);

                    return module;
                },

                channel: Channel
            };
        };
    };


    return LEDependencyMocks;
});
