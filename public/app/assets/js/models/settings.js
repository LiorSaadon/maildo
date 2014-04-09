define(function (require) {
    "use strict";

    var BaseModel = require("assets-models/baseModel");
    var SettingsStorage = require("assets-storage/settingsStorage");

    var SettingsModel = BaseModel.extend({

        defaults : {
            selectedTheme:'dust',
            accountName: 'demo@mailbone.com'
        },

        //-------------------------------------------

        initialize:function(){
            this.id = _.uniqueId('_');
            this.localStorage = new SettingsStorage();
        }
    });

    return SettingsModel;
});