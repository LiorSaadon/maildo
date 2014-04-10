define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/tags/ui/templates/tag.tmpl");

    var TagItemView = Marionette.ItemView.extend({
        template:template,
        className:'tag',

        ui:{
            content: ".content",
            btnClose: ".close-button"
        },

        events:{
          "click .close-button":"_onCloseBtnClick"
        },

        initialize: function (options) {
            this.vent = options.vent;
        },

        onRender:function(){
            this.$el.toggleClass("err", !this.model.get("isValid"));
        },

        _onCloseBtnClick:function(){
            this.vent.trigger("item:remove", this.model.cid);
        }
     });

    return TagItemView;
});