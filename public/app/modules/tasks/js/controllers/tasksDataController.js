define(function (require) {
    "use strict";

    var app = require("mbApp");
    var TaskCollection = require("tasks-collections/taskCollection");
    var CategoryCollection = require("tasks-collections/categoryCollection");

    var DataController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

            initialize: function () {

                this.categoryCollection = new CategoryCollection();
                this.taskCollection = new TaskCollection();

                tasks.channel.reqres.setHandler("selected:category",this.getSelectedCategory, this);
                this.listenTo(tasks.channel.vent,"category:change:request", this.loadTasks);
                this.listenTo(this.taskCollection, "change:metadata", this.updateSelectedCategory);

                this._fetchAll();
            },

            //-----------------------------------------------------

            _fetchAll:function(){

                setTimeout(_.bind(function(){
                    this.categoryCollection.fetch();
                    this.taskCollection.persist();
                },this),30);
            },

            //-----------------------------------------------------

            getSelectedCategory:function(){

                var category = this.categoryCollection.get(this.taskCollection.metadata.categoryId);

                if(_.isObject(category)){
                    return {cid:category.cid, att:category.toJSON()};
                }
                return {};
            },

            //-----------------------------------------------------

            updateSelectedCategory:function(){

                var category = this.categoryCollection.get(this.taskCollection.metadata.categoryId);

                if(_.isObject(category)){
                    tasks.channel.vent.trigger("category:change",{cid:category.cid, att:category.toJSON()});
                }
            },

            //-----------------------------------------------------

            loadTasks:function(options){

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


