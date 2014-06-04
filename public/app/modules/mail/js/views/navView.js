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

                this.listenTo(app.context, 'change:mail.action', this.onActionChange, this);
            },

            //-----------------------------------------------

            onActionChange:function(){

                this.$el.find('a').removeClass('selected');
                var action = app.context.get("mail.action.type");
                this.$el.find('.nav-'+action).addClass('selected');
            }
        });
    });

    return NavView;
});