define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!common-ui-component/search/ui/templates/search.tmpl");

    require("mailbone-plugins/jquery.ba-outside-events");

    var KeyCode = {
        ESC: 27,
        ENTER: 13,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };

    var SearchView = Marionette.ItemView.extend({

        template: template,

        ui: {
            "searchInput": ".search-input"
        },

        events: {
            "click .btnSearch": "search",
            "keyup .search-input": "onButtonKeyUp",
            "input .search-input": "onInputChange",
            "clickoutside": "outsideClicked"
        },

        //----------------------------------------------------------

        initialize: function (options) {

            this.el = options.el;
            this.vent = options.vent;
            this.caption = options.caption;

            this.listenTo(this.vent, "autocomplete:item:selected", this.search, this);
            this.listenTo(this.vent, "autocomplete:item:active", this.onItemActive, this);
        },

        //-----------------------------------------------------------

        customTemplateHelpers : function () {

            return{
                caption: this.caption
            };
        },

        //----------------------------------------------------------

        onItemActive: function (text, value) {
            this.ui.searchInput.val(text);
        },

        //----------------------------------------------------------

        onButtonKeyUp: function (event) {

            var key = event.keyCode;

            if (key === KeyCode.ARROW_DOWN || key === KeyCode.ARROW_UP || key === KeyCode.ENTER) {
                event.preventDefault();
                this.vent.trigger("key:press", key);
            }
        },

        //-----------------------------------------------------------

        onInputChange: function () {
            this.vent.trigger("input:change", this.ui.searchInput.val(), {"addSearchKey": true});
        },

        //-----------------------------------------------------------

        search: function () {
            this.vent.trigger("closeAll");
            this.vent.trigger("search", this.ui.searchInput.val());
        },

        //------------------------------------------------------------

        clear: function () {
            this.ui.searchInput.val("");
        },

        //------------------------------------------------------------

        outsideClicked: function () {
            this.vent.trigger("closeAll");
        }
    });
    return SearchView;
});