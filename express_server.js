var express = require("express");
var app = express();
var PORT = process.env.PORT || 5000; // default port 8080
var cookieParser = require('cookie-parser')

app.set("view engine", "ejs");
app.use(cookieParser())

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// Generate a Random String
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

// users on database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "test"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.redirect("urls");
});

// main page
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

// Go to Register page
app.get("/register", (req, res) => {
  res.render("registration");
});

//New user- Check if the email or password is empty. After, if the email exist in database
// If one of them is false, status 400. Otherwise, create the user in database, set cookies and redirect.
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let userID = generateRandomString();

  var emptyFields = false;
  var emailExists = false;
  for (key in users) {
    let existingEmail = users[key].email
    if ((!email) || (!password)) {
      emptyFields = true;
    } else if (email === existingEmail) {
      emailExists = true;
    } 
  }
  
  if(emptyFields){
    res.status(400);
    res.send('Password or email empty');
  } else if (emailExists){
    res.status(400);
    res.send('Email already exist');
  } else {
    users[userID] = {
      id: userID,
      email: email,
      password: password
    };
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});


//New URL
app.post("/urls", (req, res) => {
  let newUrl = req.body.longURL;
  let newShortUrl = generateRandomString()
  urlDatabase[newShortUrl] = newUrl;
  res.redirect(`urls/${newShortUrl}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Edit URls
app.post("/urls/:id", (req, res) => {
  let updateUrl = req.body.longURL;
  let ShortUrl = req.params.id
  urlDatabase[ShortUrl] = updateUrl;
  res.redirect("/urls");
});

// Login Page - Check if the email exist in database and the password match.
// If one of them is false, status 403. Otherwise, set cookies and redirect.
app.post("/login", (req, res) => {
  let user = "";
  let passwordMatch = false;
  let emailExists = false;
  for (key in users) {
    let existingEmail = users[key].email
    let loginEmail = req.body.email
    let loginPassword = req.body.password
    
    if (loginEmail === existingEmail) {
      emailExists = true;
    } 
    if (loginPassword === users[key].password) {
      passwordMatch = true
      user = users[key].id
    }
  }

  if(!emailExists){
    res.status(403);
    res.send('Email cannot be found');
  } else if (!passwordMatch){
    res.status(403);
    res.send('password invalid');
  } else {
    res.cookie("user_id", user) 
    res.redirect("/urls");
  }
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

//Deleting URLs
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});