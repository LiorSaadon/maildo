define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MainLayout = require("notepad-views/notepadLayout");

    var MainLayoutController = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.mainLayout = new MainLayout();
                this.listenTo(this.mainLayout, "render", this.onLayoutRender, this);
            },

            //----------------------------------------------------
            // getLayout
            //----------------------------------------------------

            getLayout: function () {
                return this.mainLayout;
            },

            //----------------------------------------------------
            // onLayoutRender
            //----------------------------------------------------

            onLayoutRender: function () {

            }
        });
    });
    return MainLayoutController;
});
