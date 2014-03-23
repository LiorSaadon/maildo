define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var FilterDecorator = require("common-decorators/filterCollectionDecorator");
    var AutoCompleteCompositeView = require("common-ui-component/autoComplete/js/views/autoCompleteCompositeView");

    var AutoComplete = Marionette.Controller.extend({

        initialize: function (options) {

            this.filterModel = options.filterModel || options.collection.filterModel;
            this.collection = new FilterDecorator(options.collection);
            this.maxItems = options.maxItems || 5;
            this.vent = options.vent;
            this.el = options.el;

            this.listenTo(this.vent, 'input:change', this.onInputChange, this);
        },

        //----------------------------------------------------
        // onFilterChange
        //----------------------------------------------------

        onInputChange: function (input) {

            if(_.isEmpty(input)){
                this.collection.filterAll();
            }else{
                this.filterModel.setInput(input);
                this.collection.filterBy(this.filterModel,this.maxItems);
            }
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
        }
    });
    return AutoComplete;
});
