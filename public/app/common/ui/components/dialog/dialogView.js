define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!../../ui/templates/dialog.tmpl");

    var DialogView = Marionette.ItemView.extend({

        className:"dialog",
        template: template,
        insideView: null,
        templateId: null,

        ui:{
            btnClose:".dialog-header-closeBtn"
        },

        events:{
            "click @ui.btnClose":"closeBtn"
        },


        initialize: function (options) {

            if (options && options.insideView) {

                this.zIndex = options.zIndex;
                this.insideView = options.insideView;
                this.templateId = (new Date()).getTime().toString();
            }
        },

        //-----------------------------------------------
        // render
        //-----------------------------------------------

        onBeforeRender:function(){

            this._$el = this.$el;
            this.$el = $("<div/>").addClass(this.className).addClass(this.templateId)
        },

        //-----------------------------------------------

        onRender: function () {

            if (this.insideView) {
                this.$el.find(".dialog-innerBox").append(this.insideView.render().el);
                this._$el.append(this.$el);
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

    return DialogView;
});
