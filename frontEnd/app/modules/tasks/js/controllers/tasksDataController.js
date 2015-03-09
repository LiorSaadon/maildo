define(function (require) {
    "use strict";

    var app = require("mbApp");
    var TaskCollection = require("tasks-collections/taskCollection");
    var CategoryCollection = require("tasks-collections/categoryCollection");

    var DataController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

            initialize: function () {

                this.taskCollection = new TaskCollection();
                this.categoryCollection = new CategoryCollection();

                this._bindEvents();
                this._setHandlers();
                this._fetchAll();
            },

            //-----------------------------------------------------

            _bindEvents:function(){

                this.listenTo(this.taskCollection,"change:metadata", this.updateSelectedCategory);
                this.listenTo(tasks.channel.vent,"category:change:request", this.refreshTaskCollection);
            },

            //------------------------------------------------------

            _setHandlers:function(){

                tasks.channel.reqres.setHandler("task:collection",this._getTaskCollection, this);
                tasks.channel.reqres.setHandler("category:collection",this._getCategoryCollection, this);
                tasks.channel.reqres.setHandler("selected:category",this._getSelectedCategory, this);
            },

            //-----------------------------------------------------

            _fetchAll:function(){

                setTimeout(_.bind(function(){
                    this.categoryCollection.fetch();
                    this.taskCollection.persist();
                },this),30);
            },

            //-----------------------------------------------------

            _getTaskCollection:function(){
               return this.taskCollection;
            },

            //-----------------------------------------------------

            _getCategoryCollection:function(){
                return this.categoryCollection;
            },

            //-----------------------------------------------------

            _getSelectedCategory:function(){
                return this.categoryCollection.get(this.taskCollection.metadata.categoryId);
            },

            //-----------------------------------------------------

            updateSelectedCategory:function(){

                var category = this.categoryCollection.get(this.taskCollection.metadata.categoryId);

                if(_.isObject(category)){
                    tasks.channel.vent.trigger("category:change",{cid:category.cid, att:category.toJSON()});
                }
            },

            //-----------------------------------------------------

            refreshTaskCollection:function(options){

                options = options || {};

                this.taskCollection.fetchBy({
                    filters: {
                        categoryId: options.categoryId
                    }
                });
            }
        });
    });
    return DataController;
});


