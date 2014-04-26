define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");

    var MailRouterController = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        MailRouterController = Marionette.Controller.extend({

            _prevState: null,

            //-----------------------------------------------------------------
            //  actions
            //-----------------------------------------------------------------

            compose:function(param){
                app.context.set("router.state",{'action':'compose'});
            },

            //-------------------------------------------------

            settings:function(){
                app.context.set("router.state",{'action':'settings'});
            },

            //-------------------------------------------------

            inbox:function (param) {
                app.context.set("router.state",{'action':'inbox', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            sent:function(param){
                app.context.set("router.state",{'action':'sent', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            draft:function(param){
                app.context.set("router.state",{'action':'draft', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            trash:function(param){
                app.context.set("router.state",{'action':'trash', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            spam:function(param){
                app.context.set("router.state",{'action':'spam', 'params':this.analyzeParams(param)});
            },

            //-------------------------------------------------

            search:function(param1,param2){
                app.context.set("router.state",{'action':'search', 'params':this.analyzeParams(param2, param1)});
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
            // backupState
            //-----------------------------------------------------------------

            backupState:function(){

                var state = app.context.get("router.state");
                this._prevState = $.extend(true, {},state);
            },

            //-----------------------------------------------------------------
            // buildPrevURL
            //-----------------------------------------------------------------

            buildPrevURL:function(){

                var url = "inbox";

                if(!_.isEmpty(this._prevState)){
                    var page = "p" + this._prevState.params.page;
                    var query = this._prevState.params.query ? "/" + this._prevState.params.query : "";
                    url = this._prevState.action + query + "/" + page;
                }
                return url;
            }
        });
    });
    return MailRouterController;
});
