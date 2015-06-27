"use strict";

var template = require("../../ui/templates/tagsContainer.hbs");
var TagsItemView = require("./tagsItemView");

require("plugins/jquery.ba-outside-events");

var KeyCode = {
    ESC: 27,
    ENTER: 13,
    ARROW_UP: 38,
    ARROW_DOWN: 40
};

var AutoCompleteCompositeView = Marionette.CompositeView.extend({

    template: template,
    childView: TagsItemView,
    childViewContainer: ".selectedTags",

    ui: {
        container: ".tags-container",
        tagSelector: ".tag-input"
    },

    events: {
        "click": "onClick",
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
        this.listenTo(this.vent, "tag:add", this.afterItemAdded);
    },

    //--------------------------------------------------------------

    buildChildView: function (item, ItemView) {

        var view = new ItemView({
            model: item,
            vent: this.vent
        });
        return view;
    },

    //------------------------------------------------------------

    afterItemAdded: function () {

        this.ui.tagSelector.text("");
        if (this.inFocus) {
            this.onClick();
        }
    },

    //----------------------------------------------------------
    // onClick
    //----------------------------------------------------------

    onClick: function () {

        if (_.isEmpty(this.ui.tagSelector.text())) {
            this.resetSelector();
            this.inFocus = true;
        }
    },

    //------------------------------------------------------------

    resetSelector: function () {

        this.ui.tagSelector.text("");
        this.ui.tagSelector.show();
        this.ui.tagSelector.focus();
    },

    //----------------------------------------------------------

    onButtonKeyDown: function (event) {

        var key = event.keyCode;

        if (key === KeyCode.ARROW_DOWN || key === KeyCode.ARROW_UP) {
            event.preventDefault();
            this.vent.trigger("key:press", key);
        }

        if (key === KeyCode.ENTER) {
            this.ui.tagSelector.hide();
            this.vent.trigger("tag:input:enter", this.ui.tagSelector.text());
        }
    },

    //------------------------------------------------------------

    onInputChange: function () {
        this.vent.trigger("input:change", this.ui.tagSelector.text());
    },

    //------------------------------------------------------------

    outsideClicked: function () {

        if (!_.isEmpty(this.ui.tagSelector.text())) {

            this.inFocus = false;
            this.vent.trigger("closeAll");
        }
    }
});
module.exports = AutoCompleteCompositeView;
