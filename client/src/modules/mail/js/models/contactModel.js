"use strict";

var app = require("app");
var DeepModel = require("base-model");

var ContactModel = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

    ContactModel = DeepModel.extend({

        defaults : {
            title:'',
            address:''
        },

        parse: function(response, options) {
            return {
                title:response.replace(",", " "),
                address:response.replace(",", ".").toLowerCase() + "@maildo.com"
            };
        }
    });
});

module.exports = ContactModel;
