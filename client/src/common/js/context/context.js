"use strict";

var DeepModel = require("backbone-deep-model");

var Context = DeepModel.extend({

    defaults: {
        module: '',
        mail: {
            action: {}
        },
        tasks: {
            selectedCategory: {}
        }
    }
});

module.exports = Context;
