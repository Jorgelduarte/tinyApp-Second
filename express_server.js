var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

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
    password: "$2a$10$KBE35tZv5nnnhC0pcTILEuLF53pN9/eXfTsJmf1Y4sdw2/zJPLYvS"
    //"top-music"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "$2a$10$X9IqRXXMq50ljTlw/ov37OroESOk6oYXnH1ACiJFzV5zuCkxIgnV2"
    //"ferrari25"
  }
}

var urlDatabase = {
  "b2xVn2": {
    userID: "userRandomID",
    longURL: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    userID: "user2RandomID",
    longURL: "http://www.google.com"
  },
  "bwm5xK": {
    userID: "userRandomID",
    longURL: "http://www.terra.com.br"
  }
};


// We suggest creating a function named urlsForUser(id) which returns 
// the subset of the URL database that belongs to the user with ID id, so that your endpoint code remains clean.
  function urlsForUser(id) {
    var newListUrl = {};
    for (key in urlDatabase) {
      if (id === urlDatabase[key].userID){
        var newObject = {
          userID: key,
          longURL: urlDatabase[key].longURL
        }
        newListUrl[key] = newObject
      }
    }
    return newListUrl
  }



app.get("/", (req, res) => {
  res.redirect("urls");
});

// main page
app.get("/urls", (req, res) => {
if (users[req.session.user_id]){
  let templateVars = {
    urls: urlsForUser(users[req.session.user_id].id),
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
} else {
  res.render("login");
}

});

// Create a new URL if the user is logged. If not, redirect to login page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if  (templateVars.user){
  res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
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


    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    users[userID] = {
      id: userID,
      email: email,
      password: hashedPassword
    };
    req.session.user_id = userID
    res.redirect("/urls");
  }
});


//New URL
app.post("/urls", (req, res) => {
  let newUrl = req.body.longURL;
  let newShortUrl = generateRandomString()
  
  urlDatabase[newShortUrl] = {
    userID: users[req.session.user_id].id,
    longURL: newUrl
  }
  console.log(urlDatabase);
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL.longURL);
});

//Login page
app.get("/login", (req, res) => {
  res.render("login");
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
    let loginPassword = bcrypt.compareSync(req.body.password, users[key].password);
    
    if (loginEmail === existingEmail) {
      emailExists = true;
    } 
    if (loginPassword) {
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
    req.session.user_id = user
    res.redirect("/urls");
  }
});

//Logout
app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let userLogged = users[req.session.user_id];
  let ownUrl = urlDatabase[req.params.id];

  if(!userLogged){
    res.status(403);
    res.send('user is not logged');
  } else if (ownUrl.userID !== userLogged.id) {
    res.status(403);
    res.send('URL is not yours');
  } else {

  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
  // res.end('ok');
}
  
});

//Deleting URLs
app.post("/urls/:id/delete", (req, res) => {
  let userLogged = users[req.session.user_id].id;
  let userFromDatabase = urlDatabase[[req.params.id]].userID;
  if (userLogged === userFromDatabase){
    delete urlDatabase[req.params.id];
    res.redirect("/urls"); 
  } else {
    res.status(403);
    res.send("You don't have authorization to do that!");
  }
});

// Edit URls
app.post("/urls/:id", (req, res) => {
  let updateUrl = req.body.longURL;
  let ShortUrl = req.params.id
  let userLogged = users[req.session.user_id].id;
  let userFromDatabase = urlDatabase[[req.params.id]].userID;
  if (userLogged === userFromDatabase){
    urlDatabase[ShortUrl].longURL = updateUrl;
  res.redirect("/urls");
  } else {
    res.status(403);
    res.send("You don't have authorization to do that!");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});