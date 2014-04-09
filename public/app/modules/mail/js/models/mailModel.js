define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var BaseModel = require("assets-models/baseModel");
    var MailStorage = require("mail-storage/mailStorage");
    var dateResolver = require("assets-resolvers-date/dateResolver");

    var MailModel = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        MailModel = BaseModel.extend({

            defaults: {
                from: '',
                to: '',
                cc: '',
                bcc: '',
                subject: '',
                sentTime: '',
                body: '',
                labels: {},
                groups:{}
            },

            initialize: function (attrs, options) {

                this.localStorage = new MailStorage();
            },

            //----------------------------------------------------------------
            // validate functions
            //----------------------------------------------------------------

            validate: function (attrs, options) {

                options = options || {};

                switch (options.validateType) {
                    case "draft":
                        return this.validateDraft();
                    default:
                        return this.validateMail();
                }
            },

            //-------------------------------------------------------------

            validateDraft: function () {

                if (_.isEmpty(this.getAllAddresses()) && _.isEmpty(this.get('subject')) && _.isEmpty(this.get('body'))) {
                    return true;
                }
                return false;
            },

            //-------------------------------------------------------------

            validateMail: function () {

                var allAddresses = this.getAllAddresses();

                if (_.isEmpty(allAddresses)) {
                    return "Please specify at least one recipient.";
                }

                for (var i = 0; i < allAddresses.length; i++) {
                    if (!this.validateAddress(allAddresses[i])) {
                        return "The email address '" + allAddresses[i] + "' is not recognized. Please fix it and try again.";
                    }
                }
            },

            //-------------------------------------------------------------

            validateAddress: function (address) {

                var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                return reg.test(address);
            },

            //-------------------------------------------------------------

            getAllAddresses: function () {

                return this.getAddresses('to').concat(this.getAddresses('cc'), this.getAddresses('bcc'));
            },

            //-------------------------------------------------------------

            getAddresses: function (attr) {

                var addresses = this.get(attr).split(";");

                if (_.isEmpty(_.last(addresses))) {
                    addresses = _.first(addresses, addresses.length - 1);
                }
                return addresses;
            },


            //----------------------------------------------------------------
            // add\remove address
            //----------------------------------------------------------------


            addAddress: function (attr, address) {

                this.updateLastAddress(attr, address + ";");
            },

            //----------------------------------------------------------------

            updateLastAddress: function (attr, address) {

                var addrList = this.get(attr).split(";");
                addrList[addrList.length - 1] = address;
                this.set(attr, addrList.join(";"));
            },

            //----------------------------------------------------------------

            removeAddress: function (attr, address) {

                var addrList = this.get(attr).replace(address + ";", "");
                this.set(attr, addrList);
            },


            //----------------------------------------------------------------
            // markAs
            //----------------------------------------------------------------

            markAs: function (label) {

                var opositeLabel = this._getOpositeLabel(label);

                this._removeLabel(opositeLabel);
                this._addLabel(label)
            },

            //----------------------------------------------------------------

            _getOpositeLabel:function(label){

                if(_s.startsWith(label,"un")){
                    return _s.strRight(label, "un")
                }
                return "un" + label;
            },

            //----------------------------------------------------------------

            _addLabel:function(label){

               this.set("labels." + label, true);
            },

            //----------------------------------------------------------------

            _removeLabel: function (labelName) {

                var labels = this.get('labels');

                if (_.has(labels, labelName)) {
                    delete labels[labelName];
                }
            },

            //----------------------------------------------------------------
            // moveTo
            //----------------------------------------------------------------

            moveTo:function(dest){

                var groups = this.get('groups');

                if(_.has(groups,"trash") || _.has(groups,"spam") || dest == "trash" || dest == "spam"){

                    _.each(groups, _.bind(function (value, key) {
                        delete groups[key];
                    },this));
                }

                this.set('groups.' + dest, true);
            },


            //----------------------------------------------------------------
            // saveAsDraft
            //----------------------------------------------------------------

            saveAsDraft: function (options) {

                options = options || {};

                this.moveTo("draft");
                this.save(null, $.extend({}, options, {validateType: "draft"}));
            }
        });
    });
    return MailModel;
});