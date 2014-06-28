define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/autoComplete/ui/templates/autoCompleteItem.tmpl");

    var AutoCompleteItemView = Marionette.ItemView.extend({
        template:template,
        tagName:'li',
        className:'li_row',

        events:{
            "mouseenter":"_onMouseEnter",
            "click":"_onClick"
        },

        //-------------------------------------------------------------

        initialize: function (options) {

            this.vent = options.vent;
        },

        //-------------------------------------------------------------

        customTemplateHelpers: function () {

            var type = this.model.get("type");

            return{
                isContact: type === AutoCompleteItemView.TYPES.CONTACT,
                isSearch: type === AutoCompleteItemView.TYPES.SEARCH,
                isRecent: type === AutoCompleteItemView.TYPES.RECENT
            };
        },

        //-------------------------------------------------------------

        _onMouseEnter:function(){

            this.vent.trigger("item:over", this);
        },

        //-------------------------------------------------------------

        _onClick:function(){

            this.vent.trigger("item:click");
        },

        //-------------------------------------------------------------

        setActive:function(isActive){
            this.$el.toggleClass('active', isActive);
        }
     });


    AutoCompleteItemView.TYPES = {
        CONTACT: 1,
        SEARCH: 2,
        RECENT: 3
    }

    return AutoCompleteItemView;
});