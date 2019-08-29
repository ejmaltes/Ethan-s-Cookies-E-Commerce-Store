/**
 * NAME:Ethan Maltes
 * DATE: August 23, 2019
 * SECTION/TA: CSE154 AB Tal Wolman
 *
 * This JavaScript file defines the server side behavior for the Ethan's Cookies webpage.  It uses
 * the Node.js framework and express to define multiple endpoints used by the website.  These
 * endpoints allow the webpage to communicate with the Ethan's Cookies database to get and post
 * useful information such as, our current catalogue, user information, and placing orders.
 * See APIDOC for more detailed information about each specific endpoint.
 */

"use strict";

const express = require("express");
const app = express();
const mysql = require("promise-mysql");
const multer = require("multer");
const cookieParser = require("cookie-parser");

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());
app.use(cookieParser());

const REQUEST_ERROR = 400;
const SERVER_ERROR = 500;

const COOKIE_TIME = 1000 * 60 * 60 * 3;

const ID_LEAD = 8;
const ID_LIMIT = 10000;

/**
 * Retrieves all current catalogue information from the database and sends it back to the client.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in JSON format containing
 *                                        catalogue info.
 *                         If not successful: text response containing error message. In this case
 *                                            the error code is 500 (Server Error).
 */
app.get("/catalogue", async function(req, res) {
  let db;
  try {
    db = await getDB();
    let data = await db.query("SELECT * FROM catalogue;");
    data = formatCatalogue(data);
    db.end();
    res.type("json");
    res.send(data);
  } catch (error) {
    if (db) {
      db.end();
    }
    res.type("text");
    res.status(SERVER_ERROR).send("Can't reach database right now");
  }
});

/**
 * Retrieves all current catalogue information from the database filtering by a given batter,
 * and sends it back to the client.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in JSON format containing
 *                                        filtered catalogue info.
 *                         If not successful: text response containing error message. If no batter
 *                                            is specified error code 400 (Request Error), but most
 *                                            likely it is a error code 500 (Server Error).
 */
app.get("/catalogue/:batter", async function(req, res) {
  let db;
  let batter = req.params.batter;
  if (!batter) {
    res.type("text");
    res.status(REQUEST_ERROR).send("Please indicate a batter type");
  } else {
    try {
      db = await getDB();
      let query = "SELECT * FROM catalogue WHERE ingredients LIKE '%" + batter + " batter%';";
      let data = await db.query(query);
      data = formatCatalogue(data);
      db.end();
      res.type("json");
      res.send(data);
    } catch (error) {
      if (db) {
        db.end();
      }
      res.type("text");
      res.status(SERVER_ERROR).send("Can't reach database right now");
    }
  }
});

/**
 * Retrieves all information about a certain item from the catalogue.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in JSON format containing
 *                                        item information.
 *                         If not successful: text response containing error message. Error code
 *                                            can be 500 (Server Error) or 400 (Request Error) if
 *                                            no item name is specified.
 */
app.get("/item/:name", async function(req, res) {
  let db;
  let item = req.params.name;
  if (!item) {
    res.type("text");
    res.status(REQUEST_ERROR).send("No item name specified");
  } else {
    try {
      db = await getDB();
      let query = "SELECT name, description, ingredients, price FROM catalogue WHERE shortname=?;";
      let data = await db.query(query, [item]);
      db.end();
      res.type("json");
      res.send(data[0]);
    } catch (error) {
      if (db) {
        db.end();
      }
      res.type("text");
      res.status(SERVER_ERROR).send("Can't reach database right now");
    }
  }
});

/**
 * Retrieves all of the current users past orders, formats it, and sends it back to the client.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in JSON format containing
 *                                        order information.
 *                         If not successful: text response containing error message. Error code
 *                                            can be 500 (Server Error) or 400 (Request Error) if
 *                                            no user is specified.
 */
app.get("/yourorders", async function(req, res) {
  let username = req.query.username;
  if (!username) {
    res.type("text");
    res.status(REQUEST_ERROR).send("Please enter a username");
  } else {
    let db;
    try {
      db = await getDB();
      let query = "SELECT items, qtys, total_price FROM orders WHERE user=?;";
      let data = await db.query(query, [username]);
      data = formatOrders(data);
      db.end();
      res.type("json");
      res.send(data);
    } catch (error) {
      if (db) {
        db.end();
      }
      res.type("text");
      res.status(SERVER_ERROR).send("Can't reach database right now");
    }
  }
});

/**
 * Posts order information passed through the body to the Ethan's Cookies database.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in plain text format containing
 *                                        order confirmation.
 *                         If not successful: text response containing error message. Error code
 *                                            can be 500 (Server Error) or 400 (Request Error) if
 *                                            any of the required information is not specified.
 */
app.post("/order", async function(req, res) {
  let phoneNumber = req.body.phone;
  let email = req.body.email;
  let cart = JSON.parse(req.body.cart);
  res.type("text");
  if (phoneNumber && email && cart) {
    let db;
    try {
      db = await getDB();
      let query = "INSERT INTO orders(phone_number, user, email, items, qtys, ingredients," +
                  " total_price) VALUES (?, ?, ?, ?, ?, ?, ?);";
      let username;
      if (req.body.user) {
        username = req.body.user;
      }
      await db.query(query, [phoneNumber, username, email, formatItems(cart), formatQtys(cart),
                     formatIngredients(cart), sumPrice(cart)]);
      db.end();
      res.send("Your Order Has Been Placed!");
    } catch (error) {
      if (db) {
        db.end();
      }
      res.status(SERVER_ERROR).send("Cannot reach database right now.");
    }
  } else {
    res.status(REQUEST_ERROR).send("Please input all required paramters");
  }
});

/**
 * Posts feedback from client to the Ethan's Cookies database.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in plain text format containing
 *                                        order confirmation.
 *                         If not successful: text response containing error message. Error code
 *                                            can be 500 (Server Error) or 400 (Request Error) if
 *                                            any of the required information is not specified.
 */
app.post("/contact", async function(req, res) {
  let db;
  let question = req.body.question;
  let user = req.body.user;
  res.type("text");
  if (!question) {
    res.status(REQUEST_ERROR).send("No question specified");
  } else {
    try {
      db = await getDB();
      if (!user) {
        user = null;
      }
      let query = "INSERT INTO feedback(question, user) VALUES (?, ?)";
      await db.query(query, [question, user]);
      db.end();
      res.send("Your Feedback Has Been Received!");
    } catch (error) {
      if (db) {
        db.end();
      }
      res.status(SERVER_ERROR).send("Can't reach database right now");
    }
  }
});

/**
 * Posts login information to database, and sets session id cookie.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in plain text format containing
 *                                        log in confirmation.
 *                         If not successful: text response containing error message. Error code
 *                                            can be 500 (Server Error) or 400 (Request Error) if
 *                                           the username or password are invalid.
 */
app.post("/login", async function(req, res) {
  let username = req.body.username;
  let password = req.body.password;
  res.type("text");
  if (!username || !password) {
    res.status(REQUEST_ERROR).send("Invalid parameters, please try again with different ones");
  } else {
    let db;
    try {
      db = await getDB();
      let query = "SELECT username FROM users WHERE username=? AND password=?;";
      if ((await db.query(query, [username, password])).length > 0) {
        let currIds = await db.query("SELECT session_id FROM users;");
        let sessionid = getRandomId(currIds);
        await db.query("UPDATE users SET session_id=? WHERE username=?;", [sessionid, username]);
        db.end();
        res.cookie("sessionid", sessionid, {expires: new Date(Date.now() + COOKIE_TIME)});
        res.send("Successful Login!");
      } else {
        db.end();
        res.status(REQUEST_ERROR).send("Invalid parameters, please try again with different ones");
      }
    } catch (error) {
      if (db) {
        db.end();
      }
      res.status(SERVER_ERROR).send("Can't reach database right now");
    }
  }
});

/**
 * Posts logout information to database, and clears session id cookie.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in plain text format containing
 *                                        log out confirmation.
 *                         If not successful: text response containing error message. Error code
 *                                            can be 500 (Server Error) or 400 (Request Error) if
 *                                           the request contains invalid session id.
 */
app.post("/logout", async function(req, res) {
  let sessionid = req.body.sessionid;
  res.type("text");
  if (sessionid) {
    let db;
    try {
      db = await getDB();
      let query = "UPDATE users SET session_id=NULL WHERE session_id=?;";
      await db.query(query, [sessionid]);
      db.end();
      res.clearCookie("sessionid");
      res.send("Sucessful logout!");
    } catch (error) {
      if (db) {
        db.end();
      }
      res.status(SERVER_ERROR).send("Can't reach database right now");
    }
  } else {
    res.status(REQUEST_ERROR).send("Invalid session id. Try logging in first!");
  }
});

/**
 * Posts sign up information (username, email, password) to database.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in plain text format containing
 *                                        log out confirmation.
 *                         If not successful: text response containing error message. Error code
 *                                            can be 500 (Server Error) or 400 (Request Error) if
 *                                           the username, email, or password are invalid.
 */
app.post("/signup", async function(req, res) {
  let username = req.body.username;
  let password = req.body.password;
  let email = req.body.email;
  res.type("text");
  if (!username || !password || !email) {
    res.status(REQUEST_ERROR).send("Invalid paramaters. Need a username, email, and password");
  } else {
    let db;
    try {
      db = await getDB();
      let query = "INSERT INTO users(username, email, password, session_id) VALUES(?, ?, ?, NULL)";
      if (checkUnique(username, db)) {
        await db.query(query, [username, email, password]);
        db.end();
        res.send("Successful Signup!");
      } else {
        db.end();
        res.status(REQUEST_ERROR).send("Username taken, try another!");
      }
    } catch (error) {
      if (db) {
        db.end();
      }
      res.status(SERVER_ERROR).send("Can't reach database right now");
    }
  }
});

/**
 * Posts session id information to database, and responds with connected username.
 * @param {Request} req - request from client.
 * @param {Response} res - If successful: response from server in plain text format containing
 *                                        the username connected with the given session id.
 *                         If not successful: text response containing error message. Error code
 *                                            can be 500 (Server Error) or 400 (Request Error) if
 *                                           the session id is invalid.
 */
app.post("/resumesession", async function(req, res) {
  let sessionid = req.body.sessionid;
  res.type("text");
  if (sessionid) {
    let db;
    try {
      db = await getDB();
      let query = "SELECT username FROM users WHERE session_id=?";
      let data = await db.query(query, [sessionid]);
      if (data.length > 0) {
        db.end();
        res.send(data[0].username);
      } else {
        db.end();
        res.status(REQUEST_ERROR).send("Invalid sessionid");
      }
    } catch (error) {
      if (db) {
        db.end();
      }
      res.status(SERVER_ERROR).send("Can't reach database right now");
    }
  } else {
    res.status(REQUEST_ERROR).send("Please input a sessionid");
  }
});

/**
 * Creates connection with database, which is used to get and modify data.
 * @returns {DatabaseConnection} database - connection with Ethan's Cookies database.
 */
async function getDB() {
  let database = await mysql.createConnection({
    host: "localhost",
    port: "8889",
    user: "root",
    password: "root",
    database: "cookies"
  });
  return database;
}

/**
 * Calcuates the total price of a given cart of cookies.
 * @param {JSON} cart - JSON object containing the user's cart information.
 * @returns {int} totalPrice - the total price of the user's cart.
 */
function sumPrice(cart) {
  let items = Object.keys(cart);
  let totalPrice = 0;
  for (let item of items) {
    let price = cart[item].price;
    let qty = cart[item].qty;
    totalPrice += (price * qty);
  }
  return totalPrice;
}

/**
 * Formats catalogue items into easy to parse JSON for the client.
 * @param {JSONArray} data - Row packet response from database containing catalogue item info.
 * @returns {JSON} result - JSON formatted catalogue info.
 */
function formatCatalogue(data) {
  let result = {};
  for (let entry of data) {
    let name = entry.name;
    result[name] = {};
    result[name]["shortname"] = entry.shortname;
    result[name]["description"] = entry.description;
    result[name]["ingredients"] = entry.ingredients;
    result[name]["price"] = entry.price;
  }
  return result;
}

/**
 * Formats cart items, for readability in database.
 * @param {JSON} cart - JSON object containing the user's cart information.
 * @returns {String} result - String representation of the user's cart.
 */
function formatItems(cart) {
  let items = Object.keys(cart);
  let result = items.join(", ");
  return result;
}

/**
 * Formats cart quatities, for readability in database.
 * @param {JSON} cart - JSON object containing the user's cart information.
 * @returns {String} totalPrice - String representation of cart quantities.
 */
function formatQtys(cart) {
  let keys = Object.keys(cart);
  let qtys = cart[keys[0]].qty;
  for (let i = 1; i < keys.length; i++) {
    qtys += ", " + cart[keys[i]].qty;
  }
  return qtys;
}

/**
 * Formats past order information, into easy to parse JSON for the client.
 * @param {JSONArray} data - Row packet response from database containing catalogue item info.
 * @returns {JSONArray} totalPrice - the total price of the user's cart.
 */
function formatOrders(data) {
  let result = [];
  for (let datum of data) {
    let cookies = datum.items.split(", ");
    let qtys = datum.qtys.split(", ");
    let entry = {};
    for (let i = 0; i < cookies.length; i++) {
      entry[cookies[i]] = parseInt(qtys[i]);
    }
    entry["total_price"] = datum["total_price"];
    result.push(entry);
  }
  return result;
}

/**
 * Formats cart ingredients, for readability in database.
 * @param {JSON} cart - JSON object containing the user's cart information.
 * @returns {String} - String representation of cart ingredients..
 */
function formatIngredients(cart) {
  let keys = Object.keys(cart);
  let result = [];
  for (let key of keys) {
    let ingredients = cart[key].ingredients;
    let temp = "[";
    if (ingredients) {
      temp += ingredients;
    } else {
      temp += "None";
    }
    temp += "]";
    result.push(temp);
  }
  return result.toString();
}

/**
 * Generates a random session id, based on other user sessions.
 * @param {StringArray} currentIds - Array containing all current session ids.
 * @param {DatabaseConnection} db - Connection with Ethan's Cookies database.
 * @returns {String} - random session id.
 */
function getRandomId(currentIds) {
  let num;
  let contains = true;
  while (contains) {
    num = "" + Math.floor(Math.random() * ID_LEAD + 1) + "" + Math.floor(Math.random() * ID_LIMIT);
    contains = false;
    for (let id of currentIds) {
      if (id["session_id"] === num) {
        contains = true;
      }
    }
  }
  return num;
}

/**
 * Generates a random session id, based on other user sessions.
 * @param {String} username - desired username by user.
 * @param {DatabaseConnection} db - Connection with Ethan's Cookies database.
 * @returns {Boolean} - whether or not the username is taken.
 */
async function checkUnique(username, db) {
  let query = "SELECT username FROM users WHERE username=?";
  let data = await db.query(query, [username]);
  if (!(data.length > 0)) {
    return true;
  }
  return false;
}

const PORT = process.env.PORT || 8000;
app.listen(PORT);
