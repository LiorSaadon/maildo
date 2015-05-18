module.exports = function(app, Settings) {

    app.get('/settings', function (req, res) {

        Settings.find({email:req.user.email}, function(err, settings) {

            if (err){
                res.send({"err":err});
            }
            if (!settings){
                res.send({});
            }
            else{
                res.send(settings);
            }
        });
    });

    //----------------------------------------------------

    app.post('/settings', function(){

    });
};
