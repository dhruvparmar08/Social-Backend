const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const passport = require('passport');
const cookieSession = require('cookie-session')
require('./passport-setup');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client("927461945891-9jotg3r55pkvia1093qr7bjsckcnbl2l.apps.googleusercontent.com");

app.use(cors())

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

// For an actual app you should configure this with an experation time, better keys, proxy and secure
app.use(cookieSession({
    name: 'tuto-session',
    keys: ['key1', 'key2']
  }))

// Auth middleware that checks if the user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
}


// Initializes passport and passport sessions
app.use(passport.initialize());
app.use(passport.session());

// Example protected and unprotected routes
app.get('/', (req, res) => res.send('Example Home page!'))
app.get('/failed', (req, res) => res.send('You Failed to log in!'))

app.post('/verify/auth-google', (req, res)=> {
  token = req.body.tokenId;
  if(token == '') {
    res.send("not");
  } else {
    async function verify() {
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: "927461945891-9jotg3r55pkvia1093qr7bjsckcnbl2l.apps.googleusercontent.com",  // Specify the CLIENT_ID of the app that accesses the backend
          // Or, if multiple clients access the backend:
          //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
      });
      const payload = ticket.getPayload();

      if (payload.iss !== 'accounts.google.com' && payload.aud !== "927461945891-9jotg3r55pkvia1093qr7bjsckcnbl2l.apps.googleusercontent.com") {
        return res.status(400).json({ status: 'error', error: 'Bad Request' });
      } else {
        const userid = payload['sub'];
        res.json({user: payload});
      }
      // If request specified a G Suite domain:
      // const domain = payload['hd'];
    }
    
    verify().catch(console.error);
  }
})
// In this route you can see that if the user is logged in u can acess his info in: req.user
app.get('/good', isLoggedIn, (req, res) => res.send(`Welcome mr ${req.user.displayName}!`))

// Auth Routes
app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/failed' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/good');
  }
);

app.get('/logout', (req, res) => {
    req.session = null;
    req.logout();
    res.redirect('/');
})

app.listen(3000, () => console.log(`Example app listening on port ${3000}!`))