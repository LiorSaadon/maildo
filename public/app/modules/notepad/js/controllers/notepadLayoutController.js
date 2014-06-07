define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MainLayout = require("notepad-views/notepadLayout");
    var SearchView = require("notepad-views/searchView");
    var ActionView = require("notepad-views/actionView");
    var NotebooksView = require("notepad-views/notebooksView");

    var MainLayoutController = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.searchView = new SearchView();
                this.mainLayout = new MainLayout();
                this.actionView = new ActionView();

                this.listenTo(app.context, 'change:module', this.setViews, this);
                this.listenTo(app.context, 'change:notepad.action', this.onActionChange, this);
                this.listenTo(this.mainLayout, "render", this.onMainLayoutRender, this);
            },

            //----------------------------------------------------
            // setViews
            //----------------------------------------------------

            setViews: function () {

                if(app.context.get("module") === "notepad"){

                    app.frame.setRegion("search", this.searchView);
                    app.frame.setRegion("actions", this.actionView);
                    app.frame.setRegion("main", this.mainLayout);
                }
            },

            //----------------------------------------------------

            onMainLayoutRender:function(){

                this.notebooks = notepad.dataController.getNotebooksCollection();

                this.notebooks.fetch({
                    success: _.bind(function () {
                        var notebooksView = new NotebooksView({collection: this.notebooks});
                        this.mainLayout.notebooksRegion.show(notebooksView);
                    }, this)
                });
            },

            onActionChange:function(){

            }
        });
    });
    return MainLayoutController;
});
