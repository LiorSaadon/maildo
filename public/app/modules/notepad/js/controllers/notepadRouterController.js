define(function (require) {
    "use strict";

    var app = require("mbApp");

    var NotepadRouterController = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

        NotepadRouterController = Marionette.Controller.extend({


            //-----------------------------------------------------------------
            //  actions
            //-----------------------------------------------------------------

            notes:function(){
                app.context.set("notepad.action",{'type':'notes'});
            },

            newNote:function(){
                app.context.set("notepad.action",{'action':'newNote'});
            }
        });
    });
    return NotepadRouterController;
});
