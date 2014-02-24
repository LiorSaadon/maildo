define(function (require) {
    "use strict";

    var DeepModel = require("backbone.deepmodel");

    var contactModel = DeepModel.extend({

        defaults : {
            title:'',
            address:''
        }
    });

    return contactModel;
});