define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!ui-components/autoComplete/ui/templates/autoComplete.tmpl");
    var AutoCompleteItemView = require("ui-components/autoComplete/js/views/autoCompleteItemView");

    var KeyCode = {
        ENTER: 13,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };

    var AutoCompleteCompositeView = Marionette.CompositeView.extend({

        template: template,
        childView: AutoCompleteItemView,
        childViewContainer: ".menu",

        //-------------------------------------------------------------

        initialize: function (options) {

            this.vent = options.vent;

            this.listenTo(this.collection, "empty:collection", this.closeEl);
            this.listenTo(this.vent, "autocomplete:item:click", this.selectItem);
            this.listenTo(this.vent, "autocomplete:item:over", this.onHover);
            this.listenTo(this.vent, "key:press", this.onKeyPress);
            this.listenTo(this.vent, "closeAll", this.closeEl);
        },

        //--------------------------------------------------------------

        buildChildView: function (item, ItemView) {

            var view = new ItemView({
                model: item,
                vent: this.vent,
                filterModel:this.collection.filterModel
            });
            return view;
        },

        //------------------------------------------------------------

        onRender: function () {

            this.closeEl();
        },
        //------------------------------------------------------------

        onRenderCollection: function () {

            this.childArr = [];

            this.children.each(_.bind(function (view) {
                this.childArr.push(view);
            }, this));

            this.selectedItem = 0;
            this.showEl();
        },

        //-------------------------------------------------------------

        closeEl: function () {
            _.defer(_.bind(function(){
                this.selectedItem = -1;
                this.$el.hide();
            }, this));
        },

        //-------------------------------------------------------------

        showEl: function () {
            this.setActive();
            this.$el.show();
        },

        //-------------------------------------------------------------

        onKeyPress: function (key) {

            switch (key) {
                case KeyCode.ARROW_UP:
                    this.selectedItem = Math.max(0, this.selectedItem - 1);
                    this.setActive();
                    break;
                case KeyCode.ARROW_DOWN:
                    this.selectedItem = Math.min(this.children.length - 1, this.selectedItem + 1);
                    this.setActive();
                    break;
                case KeyCode.ENTER:
                    this.selectItem();
                    break;
            }
        },

        //--------------------------------------------------------------

        setActive: function () {

            this.children.each(function (view) {
                view.setActive(false);
            });

            var selectedView = this.childArr[this.selectedItem];

            if(_.isObject(selectedView)){
                selectedView.setActive(true);
                this.vent.trigger("autocomplete:item:active",selectedView.model.get("text"),selectedView.model.get("value"));
            }
        },

        //-------------------------------------------------------------

        selectItem: function(){

            var selectedView = this.childArr[this.selectedItem];

            if(_.isObject(selectedView)){
                this.vent.trigger("autocomplete:item:selected",selectedView.model.get("text"),selectedView.model.get("value"));
            }
            this.closeEl();
        },

        //--------------------------------------------------------------

        onHover: function (item) {

            for (var i = 0; i < this.childArr.length; i++) {
                if (this.childArr[i].cid === item.cid) {
                    this.selectedItem = i;
                    break;
                }
            }
            this.setActive();
        }
    });
    return AutoCompleteCompositeView;
});