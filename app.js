//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    passport = require( 'passport' ),
    session = require( 'express-session' ),
    WebAppStrategy = require( 'ibmcloud-appid' ).WebAppStrategy,
    app = express();

var settings = require( './settings' );

//. setup session
app.use( session({
  secret: 'appid_normalui',
  resave: false,
  saveUninitialized: false
}));

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


//. setup passport
app.use( passport.initialize() );
app.use( passport.session() );
passport.use( new WebAppStrategy({
  tenantId: settings.tenantId,
  clientId: settings.clientId,
  secret: settings.secret,
  oauthServerUrl: settings.oauthServerUrl,
  redirectUri: settings.redirectUri
}));
passport.serializeUser( ( user, cb ) => cb( null, user ) );
passport.deserializeUser( ( user, cb ) => cb( null, user ) );


//. login UI(**カスタムログインページでは変更)
app.get( '/login', passport.authenticate( WebAppStrategy.STRATEGY_NAME, {
  successRedirect: '/',
  forceLogin: true,
}));

//. logout
app.get( '/appid/logout', function( req, res ){
  WebAppStrategy.logout( req );
  res.redirect( '/' );
});

//. callback(*カスタムログインページでは不要)
app.get( '/appid/callback', function( req, res, next ){
  next();
}, 
  passport.authenticate( WebAppStrategy.STRATEGY_NAME )
);

//. ログイン済みでないとトップページが見れないようにする
app.all( '/*', function( req, res, next ){
  if( !req.user || !req.user.sub ){
    //. ログイン済みでない場合は強制的にログインページへ
    res.redirect( '/login' );
  }else{
    next();
  }
});

//. トップページ
app.get( '/', function( req, res ){
  //. 正しくユーザー情報が取得できていれば、トップページでユーザー情報を表示する
  if( req.user ){
    res.render( 'index', { user: req.user } );
  }else{
    res.render( 'index', { user: null } );
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

