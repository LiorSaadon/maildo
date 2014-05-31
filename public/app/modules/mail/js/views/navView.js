define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/navView.tmpl");

    var NavView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        NavView = Marionette.CompositeView.extend({
            template:template,

            //-----------------------------------------------

            initialize:function(){

                this.listenTo(app.context, 'change:router.state', this.onContextChange, this);
            },

            //-----------------------------------------------

            onContextChange:function(){

                this.$el.find('a').removeClass('selected');
                var action = app.context.get("router.state.action");
                this.$el.find('.nav-'+action).addClass('selected');
            }
        });
    });

    return NavView;
});