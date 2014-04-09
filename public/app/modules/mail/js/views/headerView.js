define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var template = require("tpl!mail-templates/headerView.tmpl");

    var HeaderView = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        HeaderView = Marionette.ItemView.extend({
            template:template,

            ui: {
                btnSearch: ".btnSearch",
                inputSearch: ".inputSearch"
            },

            events: {
                "click .btnSearch": "onSearchClick"
            },

            //-----------------------------------------------

            initialize:function(options){
                this.listenTo(app.context, 'change:router.state', this.onContextChange, this);
            },

            //-----------------------------------------------

            customTemplateHelpers:function(){

                return{
                    accountName:app.settings.get("accountName")
                };
            },

            //-----------------------------------------------

            onContextChange:function(){

                var action = app.context.get("router.state.action");

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

    return HeaderView;
});