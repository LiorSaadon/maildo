define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/searchView.tmpl");
    var AutoComplete = require("assets-ui-component/autoComplete/autoComplete");
    var SearchComponent = require("assets-ui-component/search/search");

    var SearchView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        SearchView = Marionette.ItemView.extend({
            template:template,
            className:"searchPanel",

            ui: {
                searchPlaceholder: ".search-placeholder",
                autoCompletePlaceholder: ".autoCompletePlaceholder"
            },

            //-----------------------------------------------

            initialize:function(){
                this.vent = new Backbone.Wreqr.EventAggregator();
            },

            //-----------------------------------------------
            // onRender
            //-----------------------------------------------

            onRender:function(){

                this.renderSearchComponent();
                this.renderAutoComponent();
            },

            //-----------------------------------------------

            renderSearchComponent:function(){

                this.searchComponent = new SearchComponent({
                    el:this.ui.searchPlaceholder,
                    vent: this.vent
                });
                this.searchComponent.render();
            },

            //-----------------------------------------------

            renderAutoComponent:function(){

                this.autoComplete = new AutoComplete({
                    items: this.getContacts(),
                    el:this.ui.autoCompletePlaceholder,
                    vent: this.vent
                });
                this.autoComplete.show();
            },

            //-----------------------------------------------------------------

            getContacts:function(){

                var contacts = [];

                mail.dataController.getContactsCollection().each(function(model){
                    contacts.push({
                        text: model.get("title"),
                        value: model.get("address"),
                        type: AutoComplete.TYPES.CONTACT
                    })
                });
                return contacts;
            }
        });
    });

    return SearchView;
});