var BaseModel = require("base-model");

var SettingsModel = BaseModel.extend({

    defaults: {
        lang: "en-US",
        theme: 'dust',
        userName: 'demo@mailbone.com'
    },

    url: 'settings',

    //-------------------------------------------

    initialize: function () {
        this.set("id", _.uniqueId('_'));
    }
});

module.exports = SettingsModel;
