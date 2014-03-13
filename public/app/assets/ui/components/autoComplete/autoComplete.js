define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var FilterDecorator = require("assets-base-objects/collections/filterCollectionDecorator");
    var AutoCompleteCompositeView = require("assets-ui-component/autoComplete/js/views/autoCompleteCompositeView");

    var AutoComplete = Marionette.Controller.extend({

        initialize: function (options) {

            this.filterModel = options.filterModel || options.collection.filterModel;
            this.collection = new FilterDecorator(options.collection);
            this.vent = options.vent;
            this.el = options.el;

            this.listenTo(this.vent, 'input:change', this.onInputChange, this);
        },

        //----------------------------------------------------
        // onFilterChange
        //----------------------------------------------------

        onInputChange: function (_filterBy) {
            this.filterModel.setFilters(_filterBy);
            this.collection.filterBy(this.filterModel);
        },

        //----------------------------------------------------
        // show
        //----------------------------------------------------

        show: function () {
            this.collection.filterAll();

            this.autoCompleteTableView = new AutoCompleteCompositeView({
                vent: this.vent,
                collection: this.collection,
                el: this.el
            });
            this.autoCompleteTableView.render();
        },

        //----------------------------------------------------
        // close
        //----------------------------------------------------

        close: function () {
            //this.autoCompleteTableView.render();
        }
    });
    return AutoComplete;
});
