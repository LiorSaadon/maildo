define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/actionView.tmpl");

    var ActionView = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {
        ActionView = Marionette.ItemView.extend({
            template: template,
            className: 'actionView',

            ui:{
                btnDelete:".btnDeleteTask"
            },

            events : {
                "click .btnNewTask" : "createTask"
            },

            initialize: function () {

                this.listenTo(tasks.channel.vent, "task:show", _.bind(function(){this.showDelete(true)},this));
                this.listenTo(tasks.channel.vent, "category:tasks:show", _.bind(function(){this.showDelete(false)},this));
            },

            //-------------------------------------------------------------

            showDelete:function(show){
                this.ui.btnDelete.find("a").toggleClass("disable",!show);
            },

            //-------------------------------------------------------------

            createTask:function(){
                debugger;
                tasks.channel.vent.trigger("task:create");
            }
        });
    });

    return ActionView;
});