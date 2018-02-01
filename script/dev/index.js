module.exports = function (passport) {
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    var express = require('express');
    var app = express();

    app.use(express.static('assets'));

    app.get('/', passport.isLoggedIn, (req, res) => {
        res.render('devHome');
    });

    require('./task.js')(app, passport);

    app.get('/taskDB', (req, res) => {
        res.render('devTemplate');
    });

    app.all('/*',(req,res) => {
        res.render('404');
    });

    return app;
}