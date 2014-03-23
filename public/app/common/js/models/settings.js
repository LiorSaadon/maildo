define(function (require) {
    "use strict";

    var BaseModel = require("common-models/baseModel");
    var SettingsStorage = require("common-storage/settingsStorage");

    var SettingsModel = BaseModel.extend({
        defaults : {
            selectedTheme:'dust'
        },

        //-------------------------------------------

        initialize:function(){
            this.id = _.uniqueId('_');
            this.localStorage = new SettingsStorage();
        }
    });

    return SettingsModel;
});