define(function (require) {
    "use strict";

    var Backbone = require("backbone");

    var BaseCollection = Backbone.Collection.extend({

        metadata:{},

        //------------------------------------------------
        // override fetch for triggering.
        //------------------------------------------------

        fetch:function (options) {

            options = options || {};

            var successFunc = options.success;
            var errorFunc = options.error;

            options.success = function(collection, response, options) {
                collection.trigger("fetch:success");
                if (_.isFunction(successFunc)) {
                    successFunc(collection, response, options);
                }
            };
            options.error = function(collection, response, options) {
                collection.trigger("fetch:error");
                if (_.isFunction(errorFunc)) {
                    errorFunc(collection, response, options);
                }
            };

            return Backbone.Collection.prototype.fetch.call(this, options);
        },


        //------------------------------------------------
        // set
        //------------------------------------------------

        set: function (response, options) {

            response = _.isObject(response) ? response : {};

            this.updateMetadata(response.metadata);
            Backbone.Collection.prototype.set.call(this, response.collection, options);
        },

        //--------------------------------------------------

        updateMetadata: function(metadata){

            if(!_.isEqual(this.metadata, metadata)){

                this.metadata.total = metadata.total;
                this.metadata.currPage = metadata.currPage + 1;
                this.metadata.from = metadata.from + 1;
                this.metadata.to = Math.min(metadata.total, metadata.to + 1);

                this.trigger("change:metadata");
            }
        },

        //--------------------------------------------------
        // destroy
        //--------------------------------------------------

        destroy:function(_options){

            var that = this,
                options = _options ? _.clone(_options) : {},
                success = options.success;

            if(_.isArray(options.selectedItems)){
                options.data = options.selectedItems.splice(0);
            }else{
                options.data = this.getModelIds();
            }

            _.each(options.data, function(item){ // remove new or not existed items
                var model = that.get(item);
                if(!model || model.isNew()){
                    options.data.slice($.inArray(item, options.data),1);
                }
            });

            if(_.isEmpty(options.data)){ //no items to delete
                options.success();
                return false;
            }
            options.success = function(resp) {
                if (success){
                    success(that, resp, options);
                }
                that.trigger('delete:success', that, resp, options);
            };

            return Backbone.sync.apply(this,['delete', this, options]);
        },

        //--------------------------------------------------
        // update
        //--------------------------------------------------

        update:function(_options){

            var that = this,
                options = _options ? _.clone(_options) : {},
                successFunc = options.success;

            options.success = function(resp) {
                if (successFunc){
                    successFunc(that, resp, options);
                }
                that.trigger('update:success', that, resp, options);
            };

            return Backbone.sync.apply(this,['update', this, options]);
        },


        //--------------------------------------------------
        // toJSON
        //--------------------------------------------------

        toJSON: function(_options){

            var arr = [],
                that = this,
                options = _options || {},
                items = options.selectedItems || this.getModelIds();

            _.each(items, function(item){

                var model = that.get(item);

                if(model){
                    if(!model.isNew() && options.fields){
                        model = model.toJSON({fields: options.fields});
                    }else{
                        model = model.toJSON();
                    }
                    arr.push(model);
                }
            });
            return arr;
        },

        //---------------------------------------------------

        getModelIds: function(){

            this.map(function(model){ return model.id;});
        }
    });

    return  BaseCollection;
});