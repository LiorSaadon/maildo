define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ContactsFilterModel = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        ContactsFilterModel = Backbone.Model.extend({

            defaults: {
                criteria:""
            },

            //-----------------------------------------------------------------------

            setFilters:function(filter){
                filter = _.isString(filter) ? filter : "";
                this.set("criteria", filter);
            },

            //-----------------------------------------------------------------------

            filterBy:function(contactModel){

               if(this.get("criteria") === ""){
                   return false;
               }
               return true;
            }
        });
    });
    return ContactsFilterModel;
});