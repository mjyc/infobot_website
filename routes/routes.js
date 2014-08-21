module.exports = function(app, passport) {

    // ========================================================================
    // NORMAL =================================================================
    // ========================================================================

    // login
    app.get('/', function(req, res) {
        if (req.isAuthenticated())
            res.redirect('/home')
        else
            res.render('login.jade', {
                isAuthenticated: req.isAuthenticated()
            });
    });

    // home
    app.get('/home', isLoggedIn, function(req, res) {
        res.render('home.jade', {
            isAuthenticated: req.isAuthenticated(),
            user: req.user
        });
    });

    // map
    app.get('/map', isLoggedIn, function(req, res) {
        res.render('map.jade', {
            isAuthenticated: req.isAuthenticated(),
            user: req.user
        });
    });

    // logout
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // ========================================================================
    // AUTHENTICATE (FIRST LOGIN) =============================================
    // ========================================================================

    // Google

    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));

    // ========================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) ========
    // ========================================================================

    // Google

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', {
        scope: ['profile', 'email']
    }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
        passport.authorize('google', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));

    // ========================================================================
    // UNLINK ACCOUNTS ========================================================
    // ========================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in future

    // Google
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/home');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
