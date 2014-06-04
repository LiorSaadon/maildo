define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/searchView.tmpl");

    var SearchView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        SearchView = Marionette.ItemView.extend({
            template:template,
            className:"searchPanel",

            ui: {
                btnSearch: ".btnSearch",
                inputSearch: ".inputSearch"
            },

            events: {
                "click .btnSearch": "onSearchClick"
            },

            //-----------------------------------------------

            initialize:function(){
                this.listenTo(app.context, 'change:mail.action', this.onActionChange, this);
            },

            //-----------------------------------------------

            customTemplateHelpers:function(){

                return{
                    accountName:app.settings.get("accountName")
                };
            },

            //-----------------------------------------------

            onActionChange:function(){

                var action = app.context.get("mail.action.type");

                if(action !== "search"){
                   this.ui.inputSearch.val('');
                }
            },

            //-----------------------------------------------

            onSearchClick:function(){

                var url = "search/" + this.ui.inputSearch.val().replace("label", "labels") + "/p1";
                mail.router.navigate(url, {trigger: true});
            }
        });
    });

    return SearchView;
});