define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/taskDetailsView.tmpl");

    var TaskDetailsView = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TaskDetailsView = Marionette.ItemView.extend({
            template: template,

            events:{
                click:"onClick"
            },

            //-----------------------------------------------------------

            customTemplateHelpers : function () {

                return{
                    title: this.model.isNew() ? app.translator.translate("tasks.caption.new.task") : this.model.get("title")
                };
            }
        });
    });
    return TaskDetailsView;
});