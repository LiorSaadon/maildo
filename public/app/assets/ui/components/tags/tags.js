define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var TagsCompositeView = require("assets-ui-component/autoComplete/views/tagsCompositeView");
    var BaseCollection = require("assets-base-objects/collections/baseCollection");

    var Tags = Marionette.Controller.extend({

        initialize: function (options) {

            this.collection = new BaseCollection();
            this.vent = options.vent;
            this.el = options.el;

            this.listenTo(this.vent, 'input:change', this.onInputChange, this);
        },

        //----------------------------------------------------
        // show
        //----------------------------------------------------

        show: function () {

            this.tagsView = new TagsCompositeView({
                vent: this.vent,
                collection: this.collection,
                el: this.el
            });
            this.tagsView.render();
        },

        //----------------------------------------------------
        // close
        //----------------------------------------------------

        close: function () {

        }
    });
    return AutoComplete;
});
