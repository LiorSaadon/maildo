define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/autoComplete/templates/autoComplete.tmpl");
    var AutoCompleteItemView = require("assets-ui-component/autoComplete/views/autoCompleteItemView");

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

            this.childArr[this.selectedItem].setActive(true);
        },

        //-------------------------------------------------------------

        selectItem: function(){

            if(this.selectedItem >= 0){
                this.vent.trigger("item:selected",{title:'gg',address:'ds'})
            }
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