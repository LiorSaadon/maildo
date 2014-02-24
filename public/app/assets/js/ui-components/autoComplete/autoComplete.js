define(function (require) {
    "use strict";

    var app = require("mbApp");

    var AutoComplete = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        AutoComplete = Marionette.Controller.extend({

            initialize: function (options) {

                this.filterModel = options.filterModel || options.collection.filterModel,
                //this.collection = new FilterDecorator(options.collection);
                this.vent = options.vent;
                this.el = options.el;

                this.listenTo( this.vent, 'filter:change', this.onFilterChange, this);
            },

            //----------------------------------------------------
            // onFilterChange
            //----------------------------------------------------

            onFilterChange: function (_filterBy) {
                this.filterModel.setFilters(_filterBy);
                this.collection.filterBy(this.filterModel);
            },

            //----------------------------------------------------
            // show
            //----------------------------------------------------

            show:function(){
//                this.collection.filterAll();
//
//                this.autoCompleteTableView = new AutoCompleteTableView({
//                    collection: this.collection,
//                    el:el
//                });
//                this.autoCompleteTableView.render();
            },

            //----------------------------------------------------
            // show
            //----------------------------------------------------

            close:function(){
                //this.autoCompleteTableView.render();
            }
        });
    });
    return AutoComplete;
});
