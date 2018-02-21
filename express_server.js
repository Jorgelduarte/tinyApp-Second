var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
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


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.redirect("urls");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

//new URL
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

// Edit URls
app.post("/urls/:id", (req, res) => {
  let updateUrl = req.body.longURL;
  let ShortUrl = req.params.id
  urlDatabase[ShortUrl] = updateUrl;
  res.redirect("/urls");
});

// Set Cookies
app.post("/login", (req, res) => {
  let username = req.body.username
  res.cookie("username", username ) 
  res.redirect("/urls");
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("username")
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
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