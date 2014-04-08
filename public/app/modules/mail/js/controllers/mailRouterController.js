define(function (require) {
    "use strict";

    var app = require("mbApp");

    var MailRouterController = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        MailRouterController = Marionette.Controller.extend({

            _prevState: null,

            //-----------------------------------------------------------------
            //  actions
            //-----------------------------------------------------------------

            compose:function(){
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

                var params = {id:null, page:1, query:query};

                if(_.isString(id)){

                    var page = id.split('p')[1];

                    if(!_.isNumber(page)){
                        params.page = page;
                    }else{
                        params.id = id;
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
                    var search = this._prevState.params.query ? "/" + this._prevState.params.query : "";
                    var id = this._prevState.params.id ? this._prevState.params.id : "p"+this._prevState.params.page;
                    url = this._prevState.action + search + "/" + id;
                }
                return url;
            }
        });
    });
    return MailRouterController;
});
