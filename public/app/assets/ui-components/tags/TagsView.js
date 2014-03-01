define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/tags/templates/tags.tmpl");

    var KeyCode = {
        ESC:27,
        ENTER:13,
        ARROW_UP:38,
        ARROW_DOWN:40
    };

    var TagsView = Marionette.ItemView.extend({

        template : template,
        className: 'tagsView',

        ui:{
            tagsInput:".tagsInput"
        },

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

            switch(key){
                case KeyCode.ARROW_DOWN: case KeyCode.ARROW_UP: case KeyCode.ENTER:
                    this.vent.trigger("key:press",key);
                    break;
                default:
                    this.vent.trigger("item:change",this.ui.tagsInput.val());
            }
        }
    });

    return TagsView;
});
