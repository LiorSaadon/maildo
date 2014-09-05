define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ActionsController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        ActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.tasks = tasks.channel.reqres.request("task:collection");
                this._bindEvents();
            },

            //----------------------------------------------------

            _bindEvents:function(){

                this.listenTo(tasks.channel.vent, 'task:save:request', this.saveTask, this);
                this.listenTo(tasks.channel.vent, 'task:delete:request', this.deleteTask, this);
            },

            //----------------------------------------------------

            saveTask: function (taskModel) {

                if (_.isObject(taskModel)) {

                    taskModel.save(null, {
                        success: _.bind(function () {
                            this.tasks.refresh();
                        },this),
                        error:function(){
                           tasks.channel.vent.trigger("task:save:error", taskModel);
                        }
                    });
                }
            },

            //----------------------------------------------------

            deleteTask: function (taskModel) {

                if (_.isObject(taskModel)) {

                    taskModel.destroy({
                        success: _.bind(function () {
                            this.tasks.refresh();
                        },this),
                        error:function(){
                            tasks.channel.vent.trigger("task:delete:error", taskModel);
                        }
                    });
                }
            }
        });
    });
    return ActionsController;
});
