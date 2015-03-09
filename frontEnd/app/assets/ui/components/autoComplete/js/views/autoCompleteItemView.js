define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-components/autoComplete/ui/templates/autoCompleteItem.tmpl");

    var AutoCompleteItemView = Marionette.ItemView.extend({
        template:template,
        tagName:'li',
        className:'li_row',

        ui:{
           "title": ".title",
           "text": ".text"
        },

        events:{
            "mouseenter":"_onMouseEnter",
            "click":"_onClick"
        },

        //-------------------------------------------------------------

        initialize: function (options) {

            this.vent = options.vent;
            this.filterModel = options.filterModel;
        },

        //-------------------------------------------------------------

        customTemplateHelpers: function () {

            var type = this.model.get("type");

            return{
                isContact: type === AutoCompleteItemView.TYPES.CONTACT,
                isSearch: type === AutoCompleteItemView.TYPES.SEARCH
            };
        },

        //-------------------------------------------------------------

        onRender:function(){

            this.ui.title.html(this.filterModel.highlightKey(this.model.get("text")));
            this.ui.text.html(this.filterModel.highlightKey(this.model.get("value")));
        },

        //-------------------------------------------------------------

        _onMouseEnter:function(){

            this.vent.trigger("autocomplete:item:over", this);
        },

        //-------------------------------------------------------------

        _onClick:function(){

            this.vent.trigger("autocomplete:item:click");
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
    };

    return AutoCompleteItemView;
});