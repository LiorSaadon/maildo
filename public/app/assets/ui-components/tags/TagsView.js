define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/tags/templates/tags.tmpl");

    var TagsView = Marionette.ItemView.extend({

        template : template,
        className: 'tagsView',

        events:{
            "keydown .tagsContainer":"_handleButtonKeyDown"
        },

        //----------------------------------------------------------

        initialize: function (options) {
            this.vent = options.vent;
            this.el = options.el;
        },

        //----------------------------------------------------------

        _handleButtonKeyDown:function (event) {
            var key = event.keyCode;
            this.vent.trigger("item:change",key);
        }
    });

    return TagsView;
});
