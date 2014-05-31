define(function (require) {
    "use strict";

    var app = require("mbApp");
    var DeepModel = require("backbone.deepmodel");

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
                    address:response.replace(",", ".").toLowerCase() + "@mailbone.com"
                };
            },

            getText:function(){
                return this.get("title");
            },

            getValue: function(){
                return this.get("address");
            }
        });
    });

    return ContactModel;
});