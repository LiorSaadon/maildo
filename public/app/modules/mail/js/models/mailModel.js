define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseModel = require("assets-models/baseModel");
    var MailStorage = require("mail-storage/mailStorage");
    var dateResolver = require("assets-resolvers-date/dateResolver");

    var MailModel = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        MailModel = BaseModel.extend({
            defaults : {
                _in:'',
                from :'me',
                to:'',
                cc:'',
                bcc:'',
                subject: '',
                sentTime: null,
                body:'',
                labels:{}
            },

            initialize:function(attrs, options){

               this.localStorage = new MailStorage();
            },


            //-----------------------------------------------------------------
            // validate
            //-----------------------------------------------------------------

            validate: function (attrs,options) {

                var that = this;

                if (_.isEmpty(this.get("to")) && _.isEmpty(this.get("cc")) && _.isEmpty(this.get("bcc"))) {
                    return "Please specify at least one recipient.";
                }

//                _.each(this.get("to"), function(address){
//                    var res = that.validateAddress(address);
//                    if(!res){
//                        return "The email address '" + address + "' is not recognized. Please fix it and try again. ";
//                    }
//                });
//
//                _.each(this.get("cc"), function(address){
//                    var res = that.validateAddress(address);
//                    if(!res){
//                        return "The email address '" + address + "' is not recognized. Please fix it and try again. ";
//                    }
//                });
//
//                _.each(this.get("bcc"), function(address){
//                    var res = that.validateAddress(address);
//                    if(!res){
//                        return "The email address '" + address + "' is not recognized. Please fix it and try again. ";
//                    }
//                });
            },

            //---------------------------------------------------

            validateAddress: function(address){

                var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                return reg.test(address);
            },


            //-----------------------------------------------------------------
            // address handling
            //-----------------------------------------------------------------

            addAddress: function(attr, address){

                this.updateLastAddress(attr, address +";");
            },

            //----------------------------------------------------------------

            updateLastAddress:function(attr, address){

                var addrList = this.get(attr).split(";");
                addrList[addrList.length-1] = address;
                this.set(attr, addrList.join(";"));
            },

            //----------------------------------------------------------------

            removeAddress: function(attr, address){

                var addrList = this.get(attr).replace(address + ";", "");
                this.set(attr, addrList);
            },


            //----------------------------------------------------------------
            // label handling
            //----------------------------------------------------------------

            addLabel: function(label){

                this.set('labels.'+label, true);
            },

            //----------------------------------------------------------------

            removeLabel: function(label,options){

                options = options || {};

                var labels = this.get('labels');

                if(_.has(labels,label)){

                    delete labels[label];

                    if(!options.silent){
                        this.trigger("change:labels.*");
                    }
                }
            },

            //----------------------------------------------------------------

            removeAllLabels: function(options){

                options = options || {};

                var labels = this.get('labels');

                _.each(labels, function (value, key) {
                    removeLabel(value, options)
                });
            },

            //----------------------------------------------------------------

            replaceLabel:function(label1,label2){

                this.removeLabel(label1);
                this.addLabel(label2);
            }
        });
    });
    return MailModel;
});