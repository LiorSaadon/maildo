define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseModel = require("assets-base-objects/models/baseModel");
    var SettingsStorage = require("main-storage/settingsStorage");

    var SettingsModel = BaseModel.extend({
        defaults : {
            selectedTheme:'dust'
        },

        //-------------------------------------------

        initialize:function(){

            this.localStorage = new SettingsStorage();
        }
    });

    return SettingsModel;
});