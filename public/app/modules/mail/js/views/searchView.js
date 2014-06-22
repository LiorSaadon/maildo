define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/searchView.tmpl");
    var AutoComplete = require("assets-ui-component/autoComplete/autoComplete");

    var SearchView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        SearchView = Marionette.ItemView.extend({
            template:template,
            className:"searchPanel",

            ui: {
                btnSearch: ".btnSearch",
                autoCompletePlaceholder: ".autoCompletePlaceholder"
            },

            events: {
                "click .btnSearch": "onSearchClick"
            },

            //-----------------------------------------------

            initialize:function(){
                this.vent = new Backbone.Wreqr.EventAggregator();
//                this.listenTo(app.context, 'change:mail.action', this.onActionChange, this);
            },

            //-----------------------------------------------

            customTemplateHelpers:function(){

                return{
                    accountName:app.settings.get("accountName")
                };
            },

            //-----------------------------------------------
            // onRender
            //-----------------------------------------------

            onRender:function(){

                //this.renderAutoComponent();
                //this.vent.trigger("input:change","e");
            },

            //-----------------------------------------------

            renderAutoComponent:function(){

                this.autoComplete = new AutoComplete({
                    collection:this.getContacts(),
                    el:this.ui.autoCompletePlaceholder,
                    vent: this.vent
                });
                this.autoComplete.show();
            },

            //-----------------------------------------------------------------

            getContacts:function(){

                var contacts =  [];

                mail.dataController.getContactsCollection().each(function(model){

                    contacts.push({
                        text: model.get("title"),
                        value: model.get("address")
                    })
                });
                return new AutoComplete.Collection(contacts);
            }//,
//            //-----------------------------------------------
//
//            onActionChange:function(){
//
//                var action = app.context.get("mail.action.type");
//
//                if(action !== "search"){
//                   this.ui.inputSearch.val('');
//                }
//            },
//
//            //-----------------------------------------------
//
//            onSearchClick:function(){
//
//                var url = "search/" + this.ui.inputSearch.val().replace("label", "labels") + "/p1";
//                mail.router.navigate(url, {trigger: true});
//            }
        });
    });

    return SearchView;
});