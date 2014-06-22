define(function (require) {
    "use strict";

    var Backbone = require("backbone");
    var _s = require("underscore.string");

    var AutoCompleteFilterModel = Backbone.Model.extend({

            setInput: function (input) {
                this.input = _.isString(input) ? input.toLowerCase() : "";
            },

            //-----------------------------------------------------------------------

            filterBy: function (model) {

                var res = false, splittedText = model.get("text").split(" ");

                _.each(splittedText, _.bind(function(item){
                    res = res || _s.startsWith(item, this.input);
                },this));

                return res;
            }

    });
    return AutoCompleteFilterModel;
});