define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/taskItemView.tmpl");
    var formatter = require("mailbone-resolvers/formatter");

    var TaskRowView = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TaskRowView = Marionette.ItemView.extend({
            template: template,
            tagName: 'li',

            ui:{
              "title":".title",
              "content":".content"
            },

            triggers: {
               "click": "click"
            },

            events:{
                "click .delete-wrapper" : "deleteItem"
            },

            modelEvents:{
               "change":"updateUI"
            },

            onRender: function () {
                this.updateUI();
            },

            updateUI:function(){
               this.ui.title.html(this.model.get("title"));
               this.ui.content.html(formatter.formatContent(this.model.get("content")));
            },

            markAsClicked:function(select){
                this.$el.toggleClass("select", select);
            },

            deleteItem:function(event){
                event.stopPropagation();
                tasks.channel.vent.trigger("task:delete:request", this.model);
            }
        });
    });
    return TaskRowView;
});