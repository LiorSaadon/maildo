define(function (require) {
    "use strict";

    var Backbone = require('backbone');
    var DeepModel = require("backbone.deepmodel");

    var context = DeepModel.extend({

        defaults : {
            module: '',
            mail:{
                action:{}
            },
            tasks:{
                category:''
            }
        }
    });

    return context;
});