define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/emptyMailView.tmpl");

    var EmptyMailView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        EmptyMailView = Marionette.CompositeView.extend({
            template:template,

             initialize: function(options){

                 options = options || {};
                 this.selected = options.selected || 0;
             },

            //-------------------------------------------------------------
            // customTemplateHelpers
            //-------------------------------------------------------------

            customTemplateHelpers : function () {

                return{
                    counter: this.selected,
                    showCounter: this.selected > 0,
                    showMessage: this.selected === 0
                };
            }
        });
    });

    return EmptyMailView;
});
