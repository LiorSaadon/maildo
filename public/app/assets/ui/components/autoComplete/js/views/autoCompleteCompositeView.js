define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/autoComplete/ui/templates/autoComplete.tmpl");
    var AutoCompleteItemView = require("assets-ui-component/autoComplete/js/views/autoCompleteItemView");

    var KeyCode = {
        ENTER: 13,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };

    var AutoCompleteCompositeView = Marionette.CompositeView.extend({

        template: template,
        itemView: AutoCompleteItemView,
        itemViewContainer: ".menu",

        //-------------------------------------------------------------

        initialize: function (options) {

            this.vent = options.vent;

            this.listenTo(this.vent, "item:click", this.selectItem);
            this.listenTo(this.vent, "item:over", this.onHover);
            this.listenTo(this.vent, "key:press", this.onKeyPress);
            this.listenTo(this.vent, "closeAll", this.closeEl);
        },

        //--------------------------------------------------------------

        buildItemView: function (item, ItemView) {

            var view = new ItemView({
                model: item,
                vent: this.vent
            });
            return view;
        },

        //------------------------------------------------------------

        onCompositeCollectionRendered: function () {

            this.childArr = [];

            this.children.each(_.bind(function (view) {
                this.childArr.push(view);
            }, this));

            if (this.collection.isEmpty()) {
                this.selectedItem = -1;
                this.closeEl();
            } else {
                this.selectedItem = 0;
                this.showEl();
            }
        },

        //-------------------------------------------------------------

        closeEl: function () {
            this.selectedItem = -1;
            this.$el.hide();
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
                    this.setActive(true);
                    break;
                case KeyCode.ARROW_DOWN:
                    this.selectedItem = Math.min(this.children.length - 1, this.selectedItem + 1);
                    this.setActive(true);
                    break;
                case KeyCode.ENTER:
                    this.selectItem();
                    break;
            }
        },

        //--------------------------------------------------------------

        setActive: function (report) {

            this.children.each(function (view) {
                view.setActive(false);
            });

            var selectedView = this.childArr[this.selectedItem];

            if(_.isObject(selectedView)){
                selectedView.setActive(true);
            }
            if(report){
               this.vent.trigger("item:active",selectedView.model.get("text"),selectedView.model.get("value"));
            }
        },

        //-------------------------------------------------------------

        selectItem: function(){

            if(this.selectedItem >= 0){

                var selectedItem = this.selectedItem;

                setTimeout(_.bind(function () {
                    var itemModel = this.childArr[selectedItem].model;
                    this.vent.trigger("item:selected",itemModel.get("text"),itemModel.get("value"));
                }, this), 50);
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