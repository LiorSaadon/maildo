define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/tags/templates/tags.tmpl");

    var KeyCode = {
        ESC: 27,
        ENTER: 13,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };

    var TagsView = Marionette.ItemView.extend({

        template: template,
        className: 'tagsView',

        ui: {
            tagsInput: ".tagsInput"
        },

        events: {
            "keydown .tagsInput": "_handleButtonKeyDown",
            "input .tagsInput": "onInputChange",
            "blur .tagsContainer": "outsideClicked"
        },

        //----------------------------------------------------------

        initialize: function (options) {
            this.vent = options.vent;
            this.el = options.el;

            this.listenTo(this.vent, "item:selected", this.onItemSelect);
        },

        //----------------------------------------------------------

        _handleButtonKeyDown: function (event) {
            var key = event.keyCode;

            if (key === KeyCode.ARROW_DOWN || key === KeyCode.ARROW_UP) {
                this.vent.trigger("key:press", key);
            }

            if (key === KeyCode.ENTER) {
                this.enterState = "unhandle"
                this.vent.trigger("key:press", key);

                setTimeout(_.bind(function () {
                    this.handleEnter();
                }, this), 100)
            }
        },

        //-----------------------------------------------------------

        handleEnter: function () {
            if (this.enterState === "unhandle") {
                console.log("tags:handleEnter");
                this.vent.trigger("closeAll");
            }
        },

        //-----------------------------------------------------------

        onItemSelect: function () {
            this.enterState = "handle";
            console.log("tags:onItemSelect");
            this.vent.trigger("closeAll");
        },

        //------------------------------------------------------------

        onInputChange: function () {
            this.vent.trigger("input:change", this.ui.tagsInput.val());
        },

        //------------------------------------------------------------

        outsideClicked: function () {
            this.vent.trigger("closeAll");
        }
    });

    return TagsView;
});
