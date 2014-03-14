define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var TagsView = require("assets-ui-component/tags/js/views/tagsView");
    var TagModel = require("assets-ui-component/tags/js/models/tagModel");
    var TagsCollection = require("assets-ui-component/tags/js/collections/tagCollection");

    var Tags = Marionette.Controller.extend({

        initialize: function (options) {

            this.collection = new TagsCollection();
            this.validator = options.validator;
            this.vent = options.vent;
            this.el = options.el;

            this.listenTo(this.vent,"input:enter", this.onEnter);
            this.listenTo(this.vent,"item:selected",this.onItemSelected);
        },

        //----------------------------------------------------
        // show
        //----------------------------------------------------

        show: function () {

            this.tagsView = new TagsView({
                collection: this.collection,
                vent: this.vent,
                el: this.el
            });
            this.tagsView.render();
        },

        //---------------------------------------------------

        onEnter:function(val){

            this.enterState = "unhandle";
            this.vent.trigger("key:press", 13);

            setTimeout(_.bind(function () {
                if(this.enterState === "unhandle"){
                    this.addItem(val, this._validate(val));
                }
            }, this), 100);
        },

        //---------------------------------------------------

        onItemSelected:function(val){

            this.enterState = "handle";
            this.addItem(val,true);
        },

        //---------------------------------------------------

        addItem:function(val,isValid){

            var tag = new TagModel({value:val, isValid:isValid});
            this.collection.add(tag);
        },

        //---------------------------------------------------

        _validate:function(val){

            var isValid = true;

            if(_.isFunction(this.validator)){
                isValid = this.validator(val);
            }
            return isValid;
        },

        //----------------------------------------------------
        // close
        //----------------------------------------------------

        close: function () {

        }
    });
    return Tags;
});
