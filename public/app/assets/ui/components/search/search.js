define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/search/ui/templates/search.tmpl");

    require("assets-plugins/jquery.ba-outside-events");

    var KeyCode = {
        ESC: 27,
        ENTER: 13,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };

    var SearchView = Marionette.ItemView.extend({

        template: template,

        ui:{
            "searchInput":".search-input"
        },

        events:{
            "click":"onClick",
            "keyup .search-input": "onButtonKeyUp",
            "clickoutside": "outsideClicked"
        },

        //----------------------------------------------------------
        // initialize
        //----------------------------------------------------------

        initialize: function (options) {

            this.el = options.el;
            this.vent = options.vent;

            this.listenTo(this.vent,"item:active", this.onItemOver, this);
        },

        //----------------------------------------------------------

        onItemOver:function(text, value){
            this.ui.searchInput.val(text);
        },

        //----------------------------------------------------------

        onButtonKeyUp: function (event) {

            var key = event.keyCode;

            if (key === KeyCode.ARROW_DOWN || key === KeyCode.ARROW_UP) {
                event.preventDefault();
                this.vent.trigger("key:press", key);
            }

            if (key === KeyCode.ENTER) {
                this.ui.tagSelector.hide();
                this.vent.trigger("input:enter", "TT");
            }
        },

        //------------------------------------------------------------

        outsideClicked: function () {

        }
    });
    return SearchView;
});