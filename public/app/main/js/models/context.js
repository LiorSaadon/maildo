define(function (require) {
    "use strict";

    var Backbone = require('backbone');
    var DeepModel = require("backbone.deepmodel");

    var context = DeepModel.extend({

        defaults : {
            router : {
                state: ''
            }
        },

        //------------------------------------------------------

        set : function (key, val, options) {

            var oldVal = null;

            if(_.isString(key)){
                oldVal = this.get(key);
            }

            if(_.isObject(oldVal) && _.isObject(val) && _.isEqual(oldVal, val)){
                this.trigger('refresh:'+key, this, options);
                return;
            }

            if( (typeof oldVal === typeof val) && oldVal === val){
                this.trigger('refresh:'+key, this, options);
                return;
            }

            DeepModel.prototype.set.call(this, key, val, options);
        }
    });

    return context;
});