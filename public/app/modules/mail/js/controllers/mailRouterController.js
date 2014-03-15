define(function (require) {
    "use strict";

    var app = require("mbApp");

    var MailRouterController = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        MailRouterController = Marionette.Controller.extend({

            _prevState: null,

            skipStates:  ['compose', 'settings'],


            //-------------------------------------------------
            //  actions
            //-------------------------------------------------

            compose:function(){
                app.context.set("router.state",{'action':'compose'});
            },

            //-------------------------------------------------

            settings:function(param1,param2){
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
            // state management
            //-------------------------------------------------

            backupState:function(){

                var state = app.context.get("router.state");

                if(!_.isEmpty(state)){
                    if(_.indexOf(this.skipStates, state.action, 0) === -1){
                        this._prevState = $.extend(true, {},state);
                    }
                }
            },

            //-------------------------------------------------

            getPrevURL:function(){

                var url = "inbox";

                if(!_.isEmpty(this._prevState)){
                    var search = this._prevState.params.query ? "/" + this._prevState.params.query : "";
                    var id = this._prevState.params.id ? this._prevState.params.id : "p"+this._prevState.params.page;
                    url = this._prevState.action + search + "/" + id;
                }
                return url;
            },


            //-------------------------------------------------
            // analyzeParam
            //-------------------------------------------------

            analyzeParams:function(idParam,queryParam){

                return $.extend({}, this.analyzeIdParam(idParam),this.analyzeQuery(queryParam));
            },

            //--------------------------------------------

            analyzeIdParam:function(idParam){

                if(typeof idParam === 'undefined'){
                    return {id:null, page: 1};
                }

                var page = this.extractPage(idParam);

                if(!_.isNull(page)){
                    return {id:null, page: page};
                }

                return{id: idParam, page:null};
            },

            //------------------------------------------

            extractPage:function(param){

                var p = param.split('p');

                if(p.length == 2){
                   return _.isFinite(p[1]) ? parseInt(p[1],10) : 1;
                }
                return null;
            },

            //------------------------------------------

            analyzeQuery:function(queryParam){

               return{
                   query: queryParam || null
               };
            }
        });
    });
    return MailRouterController;
});
