define(function (require) {
    "use strict";

    var BaseModel = require("mailbone-base-models/baseModel");
    var SettingsStorage = require("common-settings/settingsStorage");

    var SettingsModel = BaseModel.extend({

        defaults : {
            lang:"en-US",
            theme:'dust',
            accountName: 'demo@mailbone.com'
        },

        //-------------------------------------------

        initialize:function(){
            this.set("id", _.uniqueId('_'));
            this.localStorage = new SettingsStorage();
        }
    });

    return SettingsModel;
});