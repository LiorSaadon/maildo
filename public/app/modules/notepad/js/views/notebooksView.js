define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!notepad-templates/notebooksView.tmpl");

    var NavView = {};

    app.module('notepad', function (mail, app,  Backbone, Marionette, $, _) {

        NavView = Marionette.CompositeView.extend({
            template:template,

            //-----------------------------------------------

            initialize:function(){

            }
        });
    });

    return NavView;
});