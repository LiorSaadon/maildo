define(function (require) {
    "use strict";

    var DeepModel = require("backbone.deepmodel");

    var BaseModel = DeepModel.extend({

        //-------------------------------------------
        // save
        //-------------------------------------------

        save:function (key, val, options) {

            if (key == null || typeof key === 'object') {
                options = val;
            }
            if (options.invalid) {
                this.on("invalid", options.invalid);
            }

            var result = DeepModel.prototype.save.call(this, key, val, options);

            if (options.invalid) {
                this.off("invalid", options.invalid);
            }
            return result;
        },

        //------------------------------------------------
        // toJSON
        //------------------------------------------------

        toJSON:function(options){

            options = options || {};

            if(options.fields){
                var copy = {}, clone = _.deepClone(this.attributes);

                _.each(options.fields, function(field){
                    copy[field] = clone[field];
                });

                return copy;
            }
            return DeepModel.prototype.toJSON.call(this, options);
        }
    });

    return BaseModel;
});




