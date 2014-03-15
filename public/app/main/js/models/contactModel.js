define(function (require) {
    "use strict";

    var DeepModel = require("backbone.deepmodel");

    var contactModel = DeepModel.extend({

        defaults : {
            title:'',
            address:''
        },

        parse: function(response, options) {
           var res = {};

           if(_.isString(response)){
               res = {
                   title:response,
                   address: response + "@mailbone.com"
               }
           }
            return res;
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