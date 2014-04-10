define(function (require) {
    "use strict";

    var DeepModel = require("backbone.deepmodel");

    var contactModel = DeepModel.extend({

        defaults : {
            title:'',
            address:''
        },

        parse: function(response, options) {
           return {
               title:response.replace(",", " "),
               address:(response.replace(",", ".") + "@mailbone.com").toLowerCase()
           };
        },

        getText:function(){
            return this.get("title");
        },

        getValue: function(){
            return this.get("address");
        }
    });

    return contactModel;
});