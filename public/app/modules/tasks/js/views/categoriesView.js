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

            initialize:function(options){

                options = options || {};
                this.selectedId = options.selectedId;
                this.listenTo(this, "childview:click", this._handleChildClick);
            },

            //------------------------------------------------------------

            onRenderCollection: function () {

                if(!_.isUndefined(this.selectedId)){
                    var itemView = this.children.findByModelCid(this.selectedId);

                    if(_.isObject(itemView)){
                        this._handleChildClick(itemView);
                    }
                }
            },

            //------------------------------------------------------------

            _handleChildClick:function(itemView){

                this.children.each(function(_itemView){
                    _itemView.markAsClicked(false);
                });

                if(itemView){
                   itemView.markAsClicked(true);
                   tasks.vent.trigger("category:item:click", itemView.model.id);
                }
            }
        });
    });
    return CategoriesView;
});