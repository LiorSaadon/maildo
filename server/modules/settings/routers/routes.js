module.exports = function(app, Settings) {

    app.get('/settings', function (req, res) {

        Settings.findOne({userName:req.user.email}, function(err, settings) {

            if (err){
                res.send({"err":err});
            }
            if (!settings){
                res.send({ userName:req.user.email});
            }
            else{
                res.send(settings);
            }
        });
    });

    //----------------------------------------------------

    app.put('/settings', function(req, res){

        Settings.findOneAndUpdate({userName:req.body.userName}, {userName:req.body.userName,"lang": req.body.lang,"theme":req.body.theme}, {new: true, upsert:true},
            function(err, settings) {

                if (err){
                    res.send(err);
                }
                res.send({ message: 'Settings updated!' });
            });
    });
};
