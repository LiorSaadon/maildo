define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/searchView.tmpl");
    var AutoComplete = require("assets-ui-component/autoComplete/autoComplete");
    var SearchComponent = require("assets-ui-component/search/search");

    var SearchView = {};

    app.module('tasks', function (tasks, app,  Backbone, Marionette, $, _) {

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

                this.listenTo(this.vent,"search",this.search, this);
                this.listenTo(app.context, 'change:mail.action', this.onActionChange, this);
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
                    caption: app.translator.translate("tasks.search.caption")
                });
                this.searchComponent.render();
            },

            //---------------------------------------------------------

            renderAutoComponent:function(){

                this.autoComplete = new AutoComplete({
                    items: this.getContacts(),
                    el:this.ui.autoCompletePlaceholder,
                    vent: this.vent
                });
                this.autoComplete.show();
            },

            //---------------------------------------------------------

            getContacts:function(){

                return [];

            },

            //---------------------------------------------------------
            // search
            //---------------------------------------------------------

            search:function(key){
                if(!_.isEmpty(key)){
                    tasks.router.navigate("search/"+key,{trigger: true});
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