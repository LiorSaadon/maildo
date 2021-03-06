"use strict";

var BaseModel = require("base-model");

var SettingsModel = BaseModel.extend({

    defaults: {
        lang: "en-US",
        theme: 'dust',
        userName: 'demo@mailbone.com'
    },

    url:function(){
        return 'settings';
    },

    initialize: function () {
        this.set("id", _.uniqueId('_'));
    }
});

module.exports = SettingsModel;
