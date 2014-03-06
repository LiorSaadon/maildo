define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/tags/templates/tags.tmpl");
    var tagSelectorTemplate = require("tpl!ui/tags-container/templates/tagSelector.tmpl");
    var TagsItemView = require("assets-ui-component/tags/views/tagsItemView");

    var AutoCompleteCompositeView = Marionette.CompositeView.extend({

        template: template,
        itemView: TagsItemView,
        className: "tags-container",
        itemViewContainer: ".selected-tags",

        events:{
            "click":"onClick",
            "keydown .tag-input": "onButtonKeyDown",
            "input .tag-input": "onInputChange",
            "blur .tags-container": "outsideClicked"
        },

        //----------------------------------------------------------
        // initialize
        //----------------------------------------------------------

        initialize: function (options) {

            this.el = options.el;
            this.vent = options.vent;
            this.listenTo(this.vent, "item:selected", this.onItemSelect);
        },

        //----------------------------------------------------------
        // onClick
        //----------------------------------------------------------

        onClick: function() {

            this.addTagSelector();
            this.setFocus(true);
            this.getInput().focus();
            this.setupErrors();
            this.trigger(TRIGGERING.INPUT_EDIT);
        },

        //------------------------------------------------------------

        addTagSelector: function() {
            this.ui.selectedTags.append(tagSelectorTemplate());
        },

        //-------------------------------------------------------------------------------------------------------------

        setFocus: function(newState) {

            if (newState) {
                this.$el.addClass("focused");
            } else {
                this.$el.removeClass("focused");
            }
        },

        //-------------------------------------------------------------------------------------------------------------

        getInput: function() {
            return this.$el.find(".tag-input");
        },

        //----------------------------------------------------------

        onButtonKeyDown: function (event) {
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
    return AutoCompleteCompositeView;
});