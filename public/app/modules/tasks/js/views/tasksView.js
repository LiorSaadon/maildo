define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/tasksView.tmpl");
    var EmptyView = require("tasks-views/messagesView");
    var TaskItemView = require("tasks-views/taskItemView");

    var TasksView = {};

    app.module('tasks', function (tasks, app,  Backbone, Marionette, $, _) {

        TasksView = Marionette.CompositeView.extend({
            name:'tasks-list',
            template : template,
            childView : TaskItemView,
            childViewContainer : "ul",
            emptyView: EmptyView,

            initialize:function(){

                this.setEmptyViewOptions();
                this.listenTo(this, "childview:click", this._handleChildClick);
            },

            //-----------------------------------------------------

            setEmptyViewOptions:function(){
                this.emptyViewOptions =  {
                    msg:app.translator.translate("tasks:noTasks")
                };
            },

            //-----------------------------------------------------

            _handleChildClick:function(item){

                this.children.each(function(itemView){
                    itemView.markAsClicked(false);
                });
                if(item){
                    item.markAsClicked(true);
                    tasks.channel.vent.trigger("task:show", item.model);
                }
            }
        });
    });
    return TasksView;
});