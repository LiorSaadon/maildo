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
               title:response,
               address: this._getAddress(response)
           }
        },

        _getAddress:function(response){
           return response == "me" ? "demo@mailbone.com" : response + "@mailbone.com"
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