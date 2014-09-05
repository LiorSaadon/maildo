define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var eModules = require('json!assets-data/eModules.json');

    var MailRouterController = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        MailRouterController = Marionette.Controller.extend({

            //-----------------------------------------------------------------
            //  actions
            //-----------------------------------------------------------------

            compose:function(){
                app.context.set("mail.action",{'type':'compose', 'params':{}});
            },

            //-------------------------------------------------

            settings:function(){
                app.context.set("mail.action",{'type':'settings', 'params':{}});
            },

            //-------------------------------------------------

            inbox:function (param) {
                app.context.set("mail.action",{'type':'inbox', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            sent:function(param){
                app.context.set("mail.action",{'type':'sent', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            draft:function(param){
                app.context.set("mail.action",{'type':'draft', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            trash:function(param){
                app.context.set("mail.action",{'type':'trash', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            spam:function(param){
                app.context.set("mail.action",{'type':'spam', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            search:function(param1,param2){
                app.context.set("mail.action",{'type':'search', 'params':this.analyzeParams(param2, param1)});
            },

            //-------------------------------------------------

            analyzeParams:function(id,query){

                var params = {page:1, query:query};

                if(_s.startsWith(id, "p")){
                    var page = id.split("p")[1];

                    if(_.isFinite(page)){
                        params.page = page;
                    }
                }
                return params;
            },

            //-----------------------------------------------------------------
            // beforeRoute
            //-----------------------------------------------------------------

            beforeRoute:function(){

                var action = app.context.get("mail.action");

                app.context.set("module",eModules.MAIL);
                app.context.set("mail.action",null, {silent:true});
            }
        });
    });
    return MailRouterController;
});
