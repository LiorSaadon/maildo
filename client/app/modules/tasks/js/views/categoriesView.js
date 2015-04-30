define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/categoriesView.tmpl");
    var CategoryItemView = require("tasks-views/categoryItemView");

    var CategoriesView = {};

    app.module('tasks', function (tasks, app,  Backbone, Marionette, $, _) {

        CategoriesView = Marionette.CompositeView.extend({
            name:'tasks-categories',
            template : template,
            childView : CategoryItemView,
            childViewContainer : "ul",

            //------------------------------------------------------------

            initialize:function(){

                this.listenTo(this, "childview:click", this._onChildClick);
                this.listenTo(tasks.channel.vent,"category:change",this._onCategoryChanged);
            },

            //------------------------------------------------------------

            onRenderCollection: function () {
                this._onCategoryChanged(tasks.channel.reqres.request("selected:category"));
            },

            //------------------------------------------------------------

            _onChildClick:function(itemView){
                tasks.channel.vent.trigger("category:change:request", {categoryId: itemView.model.id});
            },

            //------------------------------------------------------------

            _onCategoryChanged:function(category){

                var itemView = this.children.findByModelCid(category.cid);

                if(itemView){
                    this.children.each(function(_itemView){
                        _itemView.markAsClicked(false);
                    });
                    if(itemView){
                        itemView.markAsClicked(true);
                    }
                }
            }
        });
    });
    return CategoriesView;
});