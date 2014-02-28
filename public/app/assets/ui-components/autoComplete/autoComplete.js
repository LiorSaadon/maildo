define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var AutoCompleteCompositeView = require("assets-ui-component/autoComplete/views/autoCompleteCompositeView");

    var AutoComplete = Marionette.Controller.extend({

        initialize: function (options) {

            //this.filterModel = options.filterModel || options.collection.filterModel,
            this.collection = options.collection //new FilterDecorator(options.collection);
            this.vent = options.vent;
            this.el = options.el;

            this.listenTo( this.vent, 'filter:change', this.onFilterChange, this);
        },

        //----------------------------------------------------
        // onFilterChange
        //----------------------------------------------------

        onFilterChange: function (_filterBy) {
//           this.filterModel.setFilters(_filterBy);
//           this.collection.filterBy(this.filterModel);
        },

        //----------------------------------------------------
        // show
        //----------------------------------------------------

        show:function(){
//          this.collection.filterAll();

            this.autoCompleteTableView = new AutoCompleteCompositeView({
                collection: this.collection,
                el:this.el
            });
            this.autoCompleteTableView.render();
        },

        //----------------------------------------------------
        // close
        //----------------------------------------------------

        close:function(){
            //this.autoCompleteTableView.render();
        }
    });
    return AutoComplete;
});
