define(function (require) {
    "use strict";

    var BaseModel = require("base-models/baseModel");

    var SettingsModel = BaseModel.extend({

        defaults : {
            lang:"en-US",
            theme:'dust',
            userName: 'demo@mailbone.com'
        },

        url: 'settings',

        //-------------------------------------------

        initialize:function(){
            this.set("id", _.uniqueId('_'));
        }
    });

    return SettingsModel;
});