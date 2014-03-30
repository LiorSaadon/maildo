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
            this.listenTo(this.vent,"item:remove", this.onRemoveItem);
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
                    this.addItem(val, val);
                }
            }, this), 200);
        },

        //---------------------------------------------------

        onItemSelected:function(text, value){

            this.enterState = "handle";
            this.addItem(text,value,true);
        },

        //---------------------------------------------------

        onRemoveItem:function(tagId){

            var tagModel = this.collection.get(tagId);

            if(_.isObject(tagModel)){
                this.collection.remove(tagModel);
                this.vent.trigger("tag:remove", tagModel.get("value"));
            }
        },

        //---------------------------------------------------

        addItem:function(text, val){

            if(!_.isEmpty(val)){

                text = _.isEmpty(text) ? val : text;

                var tag = new TagModel({value:val, text:text, isValid:this._validate(val)});
                this.collection.add(tag);

                this.vent.trigger("tag:add", val);
            }
        },

        //---------------------------------------------------

        _validate:function(val){

            var isValid = true;

            if(_.isFunction(this.validator)){
                isValid = this.validator(val);
            }
            return isValid;
        }
    });
    return Tags;
});
