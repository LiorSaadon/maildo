define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/searchView.tmpl");
    var ContactsFilterModel = require("mail-models/contactsFilterModel");
    var AutoComplete = require("common-ui-component/autoComplete/autoComplete");
    var SearchComponent = require("common-ui-component/search/search");

    var SearchView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        SearchView = Marionette.ItemView.extend({
            template:template,
            className:"searchPanel",

            ui: {
                searchPlaceholder: ".search-placeholder",
                autoCompletePlaceholder: ".autoCompletePlaceholder"
            },

            //---------------------------------------------------------

            initialize:function(){

                this.vent = new Backbone.Wreqr.EventAggregator();
                this.contacts = mail.channel.reqres.request("contact:collection");

                this._bindEvents();
            },

            //--------------------------------------------------------

            _bindEvents:function(){

                this.listenTo(this.vent,"search",this.search, this);
                this.listenTo(app.context, "change:mail.action", this.onActionChange, this);
                this.listenTo(this.contacts, "fetch:success", this.renderAutoComponent, this);
            },

            //---------------------------------------------------------
            // onRender
            //---------------------------------------------------------

            onRender:function(){

                this.renderSearchComponent();
                this.renderAutoComponent();
            },

            //---------------------------------------------------------

            renderSearchComponent:function(){

                this.searchComponent = new SearchComponent({
                    el:this.ui.searchPlaceholder,
                    vent: this.vent,
                    caption: app.translator.translate("mail.search.caption")
                });
                this.searchComponent.render();
            },

            //---------------------------------------------------------

            renderAutoComponent:function(){

                if(!this.autoComplete && !this.contacts.isEmpty()){

                    this.autoComplete = new AutoComplete({
                        items: this.getContactArray(),
                        el:this.ui.autoCompletePlaceholder,
                        filterModel: new ContactsFilterModel(),
                        vent: this.vent
                    });
                    this.autoComplete.show();
                }
            },

            //---------------------------------------------------------

            getContactArray:function(){

                var _contacts = [];

                this.contacts.each(function(model){
                    _contacts.push({
                        text: model.get("title"),
                        value: model.get("address"),
                        type: AutoComplete.TYPES.CONTACT
                    });
                });
                return _contacts;
            },

            //---------------------------------------------------------
            // search
            //---------------------------------------------------------

            search:function(key){

                if(!_.isEmpty(key)){
                    mail.router.navigate("search/"+key,{trigger: true});
                }
            },

            //----------------------------------------------------
            // onActionChange
            //----------------------------------------------------

            onActionChange: function () {

                var action = app.context.get("mail.action.type");

                if (action != "search") {
                    if(this.searchComponent){
                        this.searchComponent.clear();
                    }
                }
            }
        });
    });

    return SearchView;
});