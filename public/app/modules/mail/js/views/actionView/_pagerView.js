define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var template = require("tpl!mail-templates/pagerView.tmpl");

    var PagerView = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {
        PagerView = Marionette.ItemView.extend({

            template: template,
            className: 'pageInfoView',

            ui: {
                container:".pagerInnerContainer",
                btnNext: ".btnNext",
                btnPrev: ".btnPrev",
                icoNext: ".nextIcon",
                icoPrev: ".prevIcon",
                lblTotal: ".total",
                lblFrom: ".lblForm",
                lblTo: ".lblTo"
            },

            events: {
                "click .btnNext": "showNewerItems",
                "click .btnPrev": "showOlderItems"
            },

            states:{
                btnNext:'disable',
                btnPrev:'disable'
            },

            //------------------------------------------------------
            // initialize
            //------------------------------------------------------

            initialize: function () {

                this.collection = mail.dataController.getMailCollection();
                this.listenTo(this.collection, "change:metadata",this.onCollectionMetadataChange, this);
            },

            //------------------------------------------------------
            // onCollectionMetadataChange
            //------------------------------------------------------

            onCollectionMetadataChange: function () {

                debugger;
                if(this.collection.metadata.total === 0){
                    this.ui.container.hide();
                }else{
                    this.pageInfo = this.collection.metadata;

                    this.adjustButtons();
                    this.adjustLabels();
                    this.updateUrlWithoutNavigate();

                    this.ui.container.show();
                }
            },

            //-----------------------------------------------------

            adjustButtons: function(){

                if(this.pageInfo.from === 1){
                    this.ui.btnNext.addClass("disable");
                    this.ui.icoNext.addClass("disable");
                    this.states.btnNext = 'disable';
                }else{
                    this.ui.btnNext.removeClass("disable");
                    this.ui.icoNext.removeClass("disable");
                    this.states.btnNext = 'enable';
                }

                if(this.pageInfo.to < this.pageInfo.total){
                    this.ui.btnPrev.removeClass("disable");
                    this.ui.icoPrev.removeClass("disable");
                    this.states.btnPrev = 'enable';
                }else{
                    this.ui.btnPrev.addClass("disable");
                    this.ui.icoPrev.addClass("disable");
                    this.states.btnPrev = 'disable';
                }
            },

            //-----------------------------------------------------

            adjustLabels: function(){

                this.ui.lblFrom.html(this.pageInfo.from);
                this.ui.lblTo.html(Math.min(this.pageInfo.to, this.pageInfo.total));
                this.ui.lblTotal.html(this.pageInfo.total);
            },

            //-----------------------------------------------------

            updateUrlWithoutNavigate:function(){

                var param = this.pageInfo.currPage > 1 ? ("/p" + this.pageInfo.currPage.toString()) : "";
                mail.router.navigate(app.context.get("router.state.action") + param);
            },


            //------------------------------------------------------
            // on buttons click
            //------------------------------------------------------

            showNewerItems: function (e) {

                if (this.states.btnNext === 'enable'){
                    this.navigate(this.pageInfo.currPage - 1);
                }
            },

            //----------------------------------------------------

            showOlderItems: function (e) {

                if (this.states.btnPrev === 'enable'){
                    this.navigate(this.pageInfo.currPage + 1);
                }
            },

            //----------------------------------------------------

            navigate: function(page){

                var state = app.context.get("router.state");
                var search = state.params.query ? "/" + state.params.query : "";
                mail.router.navigate(state.action + search + "/p" + page.toString(), { trigger: true });
            }
        });
    });

    return PagerView;
});