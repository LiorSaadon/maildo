define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/tags/ui/templates/tagsContainer.tmpl");
    var tagSelectorTemplate = require("tpl!assets-ui-component/tags/ui/templates/tagSelector.tmpl");
    var TagsItemView = require("assets-ui-component/tags/js/views/tagsItemView");

    require("assets-plugins/jquery.ba-outside-events");

    var KeyCode = {
        ESC: 27,
        ENTER: 13,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };

    var AutoCompleteCompositeView = Marionette.CompositeView.extend({

        template: template,
        itemView: TagsItemView,
        itemViewContainer: ".tags-container",

        ui:{
            container:".tags-container"
        },

        events:{
            "click":"onClick",
            "keydown .tag-input": "onButtonKeyDown",
            "input .tag-input": "onInputChange",
            "clickoutside": "outsideClicked"
        },

        //----------------------------------------------------------
        // initialize
        //----------------------------------------------------------

        initialize: function (options) {

            this.el = options.el;
            this.vent = options.vent;
        },

        //--------------------------------------------------------------

        buildItemView: function (item, ItemView) {

            var view = new ItemView({
                model: item,
                vent: this.vent
            });
            return view;
        },

        //------------------------------------------------------------

        onRender: function(){

            this.ui.container.append(tagSelectorTemplate());
        },

        //------------------------------------------------------------

        onAfterItemAdded: function () {

            this.onClick();
        },

        //----------------------------------------------------------
        // onClick
        //----------------------------------------------------------

        onClick: function() {

            this.resetInput();
            this.setFocus(true);
        },

        //------------------------------------------------------------

        resetInput: function() {

            var tagSelector = this.$el.find(".tag-input");

            tagSelector.text("");
            tagSelector.show();
            tagSelector.focus();
        },

        //-------------------------------------------------------------

        setFocus: function(newState) {

            if (newState) {
                this.$el.addClass("focused");
            } else {
                this.$el.removeClass("focused");
            }
        },

        //----------------------------------------------------------

        onButtonKeyDown: function (event) {

            var key = event.keyCode;

            if (key === KeyCode.ARROW_DOWN || key === KeyCode.ARROW_UP) {
                this.vent.trigger("key:press", key);
            }

            if (key === KeyCode.ENTER) {
                $('.tag-input').hide();
                this.vent.trigger("input:enter", $('.tag-input').text());
            }
        },

        //------------------------------------------------------------

        onInputChange: function () {

            this.vent.trigger("input:change", $('.tag-input').text());
        },

        //------------------------------------------------------------

        outsideClicked: function () {

            var input = $('.tag-input');

            if(!_.isEmpty(input.text())){
                this.vent.trigger("closeAll");
            }
        }
    });
    return AutoCompleteCompositeView;
});