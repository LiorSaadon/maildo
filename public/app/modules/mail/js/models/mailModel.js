define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseModel = require("assets-base-objects/models/baseModel");
    var MailStorage = require("mail-storage");
    var dateResolver = require("assets-resolvers-date/dateResolver");

    var MailModel = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        MailModel = BaseModel.extend({
            defaults : {
                _in:'',
                to:'',
                from : 'me',
                cc:'',
                bcc:'',
                subject: '',
                sentTime: null,
                body:'',
                labels:{}
            },

            //-------------------------------------------

            initialize:function(attrs, options){

               this.localStorage= new MailStorage();
               this.set("sentTime", dateResolver.date2Str(new Date(),false));
            },


            //-------------------------------------------

            validate: function (attrs,options) {

                if(options.silent !== true){
                    if (this.get("to") === '' && this.get("cc") === '' && this.get("bcc") === '') {
                        return "Please specify at least one recipient.";
                    }
                }
            },

            //-------------------------------------------

            validateAddress: function(address){

                var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
                return reg.test(address);
            },

            //-------------------------------------------

            addLabel: function(label){

                this.set('labels.'+label, true);
            },

            //-------------------------------------------

            removeLabel: function(label){

                var labels = this.get('labels');

                if(_.has(labels,label)){
                    delete labels[label];
                    this.trigger("change:labels.*");
                }
            },

            //-------------------------------------------

            removeAlLabels: function(){

                var labels = this.get('labels');

                _.each(labels, function (value, key) {
                    delete labels[key];
                });

            },

            //-------------------------------------------

            replaceLabel:function(label1,label2){

                this.removeLabel(label1);
                this.addLabel(label2);
            }
        });
    });
    return MailModel;
});