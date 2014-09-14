define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseModel = require("mailbone-base-models/baseModel");

    var CategoryModel = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        CategoryModel = BaseModel.extend({

            defaults: {
                title:"",
                isDefault:false
            },

            initialize: function (attrs, options) {

            }
        });
    });
    return CategoryModel;
});
