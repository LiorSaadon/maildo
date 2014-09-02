define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/taskDetailsView.tmpl");

    var TaskDetailsView = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TaskDetailsView = Marionette.ItemView.extend({
            template: template,

            ui:{
                content:".task-body",
                title:".task-title-input",
                save:".save",
                cancel:".cancel"
            },

            events:{
                "click .save" : "onSave",
                "click .cancel" : "onCancel"
            },


            onRender:function(){

                var title = this.model.isNew() ? app.translator.translate("tasks.task.new.caption") : this.model.get("title");

                this.ui.title.val(title);
                this.ui.content.html(this.model.get("content"));
            },

            //------------------------------------------------------

            onSave:function(){

                this.model.set("title", this.ui.title.val());
                this.model.set("content", this.ui.content.html());

                tasks.channel.vent.trigger("task:save",this.model);
            }
        });
    });
    return TaskDetailsView;
});