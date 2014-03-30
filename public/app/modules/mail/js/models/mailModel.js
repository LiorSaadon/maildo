define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseModel = require("assets-models/baseModel");
    var MailStorage = require("mail-storage/mailStorage");
    var dateResolver = require("assets-resolvers-date/dateResolver");

    var MailModel = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        MailModel = BaseModel.extend({
            defaults: {
                _in: '',
                from: 'me',
                to: '',
                cc: '',
                bcc: '',
                subject: '',
                sentTime: null,
                body: '',
                labels: {}
            },

            initialize: function (attrs, options) {

                this.localStorage = new MailStorage();
            },

            //-----------------------------------------------------------------
            // validate
            //-----------------------------------------------------------------

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

                var error = false;

                if (_.isEmpty(this.getAllAddresses()) && _.isEmpty(this.get('subject')) && _.isEmpty(this.get('body'))) {
                    error = true;
                }

                return error;
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

            //-------------------------------------------------------------

            validateAddress: function (address) {

                var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                return reg.test(address);
            },


            //-----------------------------------------------------------------
            // add\remove address
            //-----------------------------------------------------------------

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
            // label handling
            //----------------------------------------------------------------

            addLabel: function (label) {

                this.set('labels.' + label, true);
            },

            //----------------------------------------------------------------

            removeLabel: function (label, options) {

                options = options || {};

                var labels = this.get('labels');

                if (_.has(labels, label)) {

                    delete labels[label];

                    if (!options.silent) {
                        this.trigger("change:labels.*");
                    }
                }
            },

            //----------------------------------------------------------------

            removeAllLabels: function (options) {

                options = options || {};

                var labels = this.get('labels');

                _.each(labels, function (value, key) {
                    removeLabel(value, options)
                });
            },

            //----------------------------------------------------------------

            replaceLabel: function (label1, label2) {

                this.removeLabel(label1);
                this.addLabel(label2);
            },

            //-----------------------------------------------------------------
            // saveAsDraft
            //-----------------------------------------------------------------

            saveAsDraft: function (options) {

                options = options || {};

                this.addLabel("draft");
                this.set("in", "draft");
                this.save(null, $.extend({}, options, {validateType: "draft"}));
            }
        });
    });
    return MailModel;
});