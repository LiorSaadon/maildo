define(function (require) {
    "use strict";

    var $ = require("jquery");
    var _ = require("underscore");

    var SelectableCollectionDecorator = function (original) {

        var decoratedCollection = $.extend({}, original);

        decoratedCollection.selected = [];

        //--------------------------------------------------

        decoratedCollection.getSelected = function () {

            return this.selected.slice();
        };

        //--------------------------------------------------

        decoratedCollection.isSelected = function (model) {

            var id = model.get("id");
            return $.inArray(id, decoratedCollection.selected) !== -1;
        };

        //-------------------------------------------------

        decoratedCollection.unselectModel = function (model, options) {

            var id = model.get("id");

            if (this.get(id) && $.inArray(id, this.selected) !== -1) {
                this.selected.splice($.inArray(id, this.selected), 1);
                raiseTrigger(options);
                return true;
            }
            return false;
        };

        //--------------------------------------------------

        decoratedCollection.updateSelection = function(options){

            var itemsToRemove = [];

            _.each(this.selected, _.bind(function(selectedItem) {
                var model = this.get(selectedItem);

                if(_.isEmpty(model)){
                    itemsToRemove.push(selectedItem);
                }
            },this));

            if(!_.isEmpty(itemsToRemove)){
                this.selected = _.difference(this.selected, itemsToRemove);
                raiseTrigger(options);
            }
        };

        //--------------------------------------------------

        decoratedCollection.clearSelected = function (options) {

            this.selected.length = 0;
            raiseTrigger(options);
        };

        //--------------------------------------------------

        decoratedCollection.selectAll = function (options) {

            decoratedCollection.selectModels(this.models,options);
        };

        //--------------------------------------------------

        decoratedCollection.selectModels = function (models, options) {

            var exclusively = options ? options.exclusively : null, raise = false;

            if (exclusively) {
                raise = true;
                this.selected.length = 0;
            }

            _.each(models, function (model) {
                raise = decoratedCollection.selectModel(model, {silent:true}) || raise;
            }, this);

            if(raise){raiseTrigger(options);}
        };

        //--------------------------------------------------

        decoratedCollection.selectModel = function (model, options) {

            var id = model.get("id");

            if (this.get(id) && $.inArray(id, this.selected) === -1) {
                this.selected.push(id);
                raiseTrigger(options);
                return true;
            }
            return false;
        };

        //----------------------------------------------------

        decoratedCollection.toggleSelection = function (model, options) {

             if(this.isSelected(model)){
                this.unselectModel(model,options);
             }else{
                 this.selectModel(model,options);
             }
        };

        //-----------------------------------------------------

        var raiseTrigger = function (options) {

            var silent = options ? options.silent : null;

            if (!silent) {
                decoratedCollection.trigger('change:selection', decoratedCollection.selected, options);
                return true;
            }
        };

        return decoratedCollection;
    };

    return SelectableCollectionDecorator;
});
