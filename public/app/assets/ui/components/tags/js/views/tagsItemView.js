define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/tags/ui/templates/tag.tmpl");

    var TagItemView = Marionette.ItemView.extend({
        template:template,
        className:'tag',

        ui:{
            content: ".content"
        },

        onRender:function(){
            this.ui.content.toggleClass("err", !this.model.get("isValid"));
        }
     });

    return TagItemView;
});