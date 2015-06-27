"use strict";

var template = require("../../ui/templates/tag.hbs");

var TagItemView = Marionette.ItemView.extend({
    template: template,
    className: 'tag',

    ui: {
        content: ".content",
        btnClose: ".close-button"
    },

    events: {
        "click .close-button": "_onCloseBtnClick"
    },

    initialize: function (options) {
        this.vent = options.vent;
    },

    onRender: function () {
        this.$el.toggleClass("err", !this.model.get("isValid"));
    },

    _onCloseBtnClick: function () {
        this.vent.trigger("tag:item:remove", this.model.cid);
    }
});

module.exports = TagItemView;
