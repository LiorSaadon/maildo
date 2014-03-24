define(function (require) {
    "use strict";

    var Backbone = require("backbone");

    var BaseCollection = Backbone.Collection.extend({

        metadata:{},

        //------------------------------------------------
        // override fetch for error handling.
        //------------------------------------------------

        fetch:function (options) {

            this.extendError(options);
            return Backbone.Collection.prototype.fetch.call(this, options);
        },

        //------------------------------------------------

        extendError:function (options) {
            if (_.isObject(options)) {
                var error = options.error;

                options.error = function (collection, resp, options) {
                    if (404 === resp.status && options.success) {
                        options.success.apply(this, []);
                    } else if (error) {
                        error.apply(this, [].slice.apply(arguments));
                    }
                };
            }
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

            options.data = options.selectedItems || this.getModelIds();

            _.each(options.data, function(item){
                var model = that.get(item);
                if(!model || model.isNew()){
                    options.data.slice($.inArray(item, options.data),1);
                }
            });

            if(_.isEmpty(options.data)){
                options.success();
                return false;
            }
            options.success = function(resp) {
                if (success){
                    success(that, resp, options);
                }
                that.trigger('delete-success', that, resp, options);
            };

            return Backbone.sync.apply(this,['delete', this, options]);
        },


        //--------------------------------------------------
        // update
        //--------------------------------------------------

        update:function(_options){

            var that = this,
                options = _options ? _.clone(_options) : {},
                success = options.success;

            options.success = function(resp) {
                if (success){
                    success(that, resp, options);
                }
                that.trigger('update-success', that, resp, options);
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