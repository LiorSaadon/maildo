"use strict";

var template = require("../../ui/templates/dialog.hbs");

var DialogView = Marionette.ItemView.extend({

    className: "dialog",
    template: template,
    insideView: null,
    templateId: null,

    ui: {
        btnClose: ".dialog-header-closeBtn"
    },

    events: {
        "click @ui.btnClose": "closeBtn"
    },


    initialize: function (options) {

        if (options && options.insideView) {

            this.title = options.title;
            this.zIndex = options.zIndex;
            this.insideView = options.insideView;
            this.templateId = (new Date()).getTime().toString();
        }
    },

    //-----------------------------------------------
    // render
    //-----------------------------------------------

    onBeforeRender: function () {

        this._$el = this.$el;
        this.$el = $("<div/>").addClass(this.className).addClass(this.templateId);
    },

    //-----------------------------------------------

    onRender: function () {

        if (this.insideView) {
            this.$el.find(".dialog-header-title").html(this.title);
            this.$el.find(".dialog-innerBox").append(this.insideView.render().el);
            this._$el.append(this.$el);

            this.$el.find(".dialog-outerbox").css("margin-top", -this.insideView.$el.height() / 2 + "px");
            this.$el.find(".dialog-outerbox").css("margin-left", -this.insideView.$el.width() / 2 + "px");
        }
        return this;
    },

    //-----------------------------------------------
    // close
    //-----------------------------------------------

    closeBtn: function (ev) {

        this.insideView.destroy();
        this._$el.find(".dialog." + this.templateId).remove();
    }
});

module.exports = DialogView;


