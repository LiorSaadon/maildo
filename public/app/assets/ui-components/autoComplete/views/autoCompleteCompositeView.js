define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/autoComplete/templates/autoComplete.tmpl");
    var AutoCompleteItemView = require("assets-ui-component/autoComplete/views/autoCompleteItemView");

    var KeyCode = {
        ENTER:13,
        ARROW_UP:38,
        ARROW_DOWN:40
    };

    var  AutoCompleteCompositeView = Marionette.CompositeView.extend({

        template : template,
        itemView : AutoCompleteItemView,
        itemViewContainer : ".menu",

        //-------------------------------------------------------------

        initialize: function (options) {

           this.vent = options.vent;
           this.listenTo(this.vent, "item:over", this.onHover);
           this.listenTo(this.vent, "key:press", this.onKeyPress);
        },

        //--------------------------------------------------------------

        buildItemView : function (item, ItemView) {

            var view = new ItemView({
                model: item,
                vent:this.vent
            });
            return view;
        },

        //------------------------------------------------------------

        onCompositeCollectionRendered:function(){

            var that = this;

            this.childArr=[];

            this.selectedItem = 0;

            this.children.each(function(view){

                that.childArr.push(view);
            });
        },

        //-------------------------------------------------------------

        onKeyPress:function (key) {

            switch (key) {
                case KeyCode.ARROW_UP:
                    this.selectedItem = Math.max(0, this.selectedItem-1);
                    this.setActive();
                    break;
                case KeyCode.ARROW_DOWN:
                    this.selectedItem = Math.min(this.children.length, this.selectedItem+1);
                    this.setActive();
                    break;
                case KeyCode.ENTER:
                    break;
            }
        },

        //--------------------------------------------------------------

        setActive:function(){
            console.log(this.selectedItem.toString());
        },

        //--------------------------------------------------------------

        onHover:function(item){

            for(var i=0;i<this.childArr.length;i++){
                if(this.childArr[i].cid === item.cid){
                   this.selectedItem = i;
                   break;
                }
            }
            this.setActive();
        }
    });
    return AutoCompleteCompositeView;
});