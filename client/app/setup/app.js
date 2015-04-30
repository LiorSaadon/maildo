define(function (require) {
    "use strict";

    var Marionette = require("marionette");

    return new Marionette.Application({ channelName: 'appChannel' });
});