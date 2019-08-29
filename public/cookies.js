/**
 * NAME:Ethan Maltes
 * DATE: August 23, 2019
 * SECTION/TA: CSE154 AB Tal Wolman
 *
 * This JavaScript file defines the behavior for the Ethan's Cookies Webpage. It handles all of the
 * client side functionality such as, populating the various views with information, adding items
 * to the cart, making custom cookies, writing feedback, and communicating with the Ethan's Cookies
 * API for getting and modifying database information.
 */

"use strict";

(function() {

  /** Constant to store all webpage views to facilitate toggling between them. */
  const VIEWS = ["welcome", "catalogue", "single-view", "customize", "cart",
                "contact", "login", "your-orders"];

  /** Constant used to indicate that there is no user session. */
  const NO_SESSION = -1;

  /** Constant representing the length of a phone number */
  const PHONE_LENGTH = 10;

  /** Constant representing the length of the string "-btn" used in string manipulation. */
  const BUTTON_LENGTH = 4;

  /** Constant representing the length of the sessionId cookie string. */
  const SESSIONID_LENGTH = 10;

  /** Constant representing how long the "Hi :)" text should be visible. */
  const HI_DURATION = 500;

  /** Constant representing what is returned by indexOf(param) when param is not found. */
  const NO_INDEX = -1;

  /** The current users cart. */
  let cart = {};

  /** The session Id of the current user, -1 if not logged in. */
  let sessionId;

  /** Count to keep track of the number of custom orders created. */
  let customCount = 1;

  /** The username of the current user */
  let user = "";

  window.addEventListener("load", init);

  /** Called on window load, and initializes all client side functionality and displays */
  function init() {
    sessionId = NO_SESSION;
    checkSession();
    addCards();
    setupFilter();
    setupNav();
    setupLogin();
    setupCustomize();
    setupContact();
  }

  /** Sets up the buttons in the naviagation bar, which allows toggle between views */
  function setupNav() {
    for (let view of VIEWS) {
      if (view !== "single-view" && view !== "status" && view !== "login") {
        id(view + "-btn").addEventListener("click", () => {
          toggleView(view);
        });
      }
    }
    id("order-btn").addEventListener("click", postOrder);
  }

  /**
   * Called on nav button press, and changes to requested view .
   * @param {String} show - the id of the view to display.
   */
  function toggleView(show) {
    for (let view of VIEWS) {
      if (view !== show && !id(view).classList.contains("hidden")) {
        id(view).classList.add("hidden");
      } else if (view === show && id(view).classList.contains("hidden")) {
        id(view).classList.remove("hidden");
      }
    }
  }

  /**
   * Fetches the current catalogue from the API and adds the information to the catalogue view.
   */
  function addCards() {
    fetch("/catalogue")
      .then(checkStatus)
      .then(resp => resp.json())
      .then(showCards)
      .catch(() => {
        displayStatus("Something went wrong getting the catalogue, try refreshing!");
      });
  }

  /**
   * Creates DOM elements that represent catalogue items and gives them additional functionality,
   * such as being able to be added to the cart.
   * @param {JSON} response - JSON response from API containing catalogue item information.
   */
  function showCards(response) {
    let cookies = Object.keys(response);
    for (let cookie of cookies) {
      let newCard = document.createElement("div");
      newCard.classList.add("card", "fade");

      let name = document.createElement("h2");
      name.textContent = cookie;
      name.addEventListener("click", () => {
        showItem(response[cookie].shortname);
      });
      newCard.appendChild(name);

      let description = document.createElement("p");
      description.classList.add("description");
      description.textContent = response[cookie].description;
      newCard.appendChild(description);

      helperAddIngredients(response[cookie], newCard);

      let price = document.createElement("p");
      price.classList.add("price");
      price.textContent = "$" + response[cookie].price;
      newCard.appendChild(price);

      let orderButton = document.createElement("button");
      orderButton.classList.add("order");
      orderButton.textContent = "Order";
      orderButton.addEventListener("click", () => {
        addItemToCart(cookie, response[cookie]);
      });
      newCard.appendChild(orderButton);

      id("card-area").appendChild(newCard);
    }
  }

  /**
   * Helper function used by showCards to add ingredient information to the catalogue view.
   * @param {JSON} cookie - JSON opject containing information for one a specific catalogue cookie.
   * @param {DOMElement} newCard = DOM element that holds the information for the catalogue cookie.
   */
  function helperAddIngredients(cookie, newCard) {
    let ingredientHeader = document.createElement("h3");
    ingredientHeader.classList.add("underline");
    ingredientHeader.textContent = "Ingredients";
    newCard.appendChild(ingredientHeader);

    let ingredientList = document.createElement("ul");
    ingredientList.classList.add("ingredients");

    let ingredients = cookie.ingredients.split(",");
    let batter = true;
    for (let ingredient of ingredients) {
      let newIngredient = document.createElement("li");
      if (batter) {
        newIngredient.classList.add("batter");
        batter = false;
      }
      newIngredient.textContent = ingredient;
      ingredientList.appendChild(newIngredient);
    }
    newCard.appendChild(ingredientList);
  }

  /**
   * Adds a given cookie to the cart so that it can be orderd.
   * @param {String} cookie - name of cookie, used as a key for the cart JSON object.
   * @param {JSON} cookieInfo - JSON formatted information about the given cookie.
   */
  function addItemToCart(cookie, cookieInfo) {
    if (!cart[cookie]) {
      cart[cookie] = cookieInfo;
      cart[cookie]["qty"] = 1;
    } else {
      cart[cookie]["qty"]++;
    }
    updateCart();
    displayStatus(cookie + " Added To Cart!");
  }

  /** Updates the users cart view when an item is added to it. */
  function updateCart() {
    id("items").innerHTML = "";
    let items = Object.keys(cart);
    for (let item of items) {
      let itemWrapper = document.createElement("div");

      let newItem = document.createElement("div");
      newItem.classList.add("cart-card");

      let itemName = document.createElement("p");
      itemName.classList.add("item-name");
      if (item.indexOf("Custom Order") > NO_INDEX) {
        itemName.textContent = item + " " + cart[item].ingredients;
      } else {
        itemName.textContent = item;
      }
      newItem.appendChild(itemName);

      helperAddInfo(item, newItem);

      let remove = document.createElement("p");
      remove.classList.add("remove");
      remove.textContent = "Remove Item";
      remove.addEventListener("click", () => {
        delete cart[item];
        id("items").removeChild(itemWrapper);
      });
      newItem.appendChild(remove);
      itemWrapper.appendChild(newItem);
      itemWrapper.appendChild(document.createElement("hr"));

      id("items").appendChild(itemWrapper);
    }
  }

  /**
   * Helper function for updateCart which adds information about the item to the cart view.
   * @param {String} item - name of item, used as a key for the cart JSON object.
   * @param {DOMElement} newItem - DOM element containing item information in the cart.
   */
  function helperAddInfo(item, newItem) {
    let quantity = document.createElement("input");
    quantity.classList.add("quantity");
    quantity.type = "number";
    quantity.value = cart[item].qty;
    quantity.addEventListener("change", () => {
      cart[item].qty = quantity.value;
    });
    newItem.appendChild(quantity);

    let price = document.createElement("p");
    price.textContent = cart[item].price;
    newItem.appendChild(price);
  }

  /**
   * Sets up the batter filter in the catalogue view, which fetches item information from the API
   * given a certain batter type.
   */
  function setupFilter() {
    qs("select[name=batter]").addEventListener("change", () => {
      let filter = qs("select[name=batter]").value;
      id("card-area").innerHTML = "";
      let toHide = Array.from(id("catalogue").children);
      for (let i = 0; i < toHide.length; i++) {
        toHide[i].classList.add("hidden");
      }
      if (filter === "none") {
        addCards();
        for (let i = 0; i < toHide.length; i++) {
          toHide[i].classList.remove("hidden");
        }
      } else {
        fetch("/catalogue/" + filter)
          .then(checkStatus)
          .then(resp => resp.json())
          .then(showCards)
          .then(() => {
            for (let i = 0; i < toHide.length; i++) {
              toHide[i].classList.remove("hidden");
            }
          })
          .catch(() => {
            displayStatus("Something went wrong getting the catalogue, try refreshing!");
          });
      }
    });
  }

  /**
   * Fetches information about given item from API and displays it.
   * @param {String} shortname - the shortname of the given item, used in retreiving information.
   */
  function showItem(shortname) {
    let url = "/item/" + shortname;
    fetch(url)
      .then(checkStatus)
      .then(resp => resp.json())
      .then(toggleSingleView)
      .catch(() => {
        displayStatus("Something went wrong getting the cookie information, try refreshing!");
      });
  }

  /**
   * Populates the single item view with information about the requested item.
   * @param {JSON} response - JSON formatted response from API, with information about given cookie.
   */
  function toggleSingleView(response) {
    let view = id("item-area");
    view.innerHTML = "";

    let header = document.createElement("h2");
    header.textContent = response.name;
    view.appendChild(header);

    let description = document.createElement("p");
    description.textContent = response.description;
    view.appendChild(description);

    let price = document.createElement("p");
    price.textContent = "$" + response.price;
    view.appendChild(price);

    let orderButton = document.createElement("button");
    orderButton.textContent = "Order";
    orderButton.addEventListener("click", () => {
      addItemToCart(response.name, response);
    });
    view.appendChild(orderButton);

    id("single-view").appendChild(view);
    toggleView("single-view");
  }

  /** Posts the users order to the API, with all necessary information. */
  function postOrder() {
    let phone = id("phone-number").value;
    let email = id("email").value;
    let emailRegex = /^\S+@\S+.\S+$/;
    if (Object.keys(cart).length > 0 && phone.length === PHONE_LENGTH && emailRegex.test(email)) {

      let order = new FormData();
      order.append("phone", phone);
      order.append("email", email);
      order.append("cart", JSON.stringify(cart));
      if (user.length > 0) {
        order.append("user", user);
      }

      fetch("/order", {method: "POST", body: order})
        .then(checkStatus)
        .then(() => {
          displayStatus("Your Order Is On The Way!");
          cart = {};
          updateCart();
          clearFields();
          if (user.length > 0) {
            populateYourOrders();
          }
        })
        .catch(() => {displayStatus("Something went wrong placing your order, try again!");});
    } else {
      displayStatus("Please input all required information");
    }
    highlightOrder(phone, emailRegex.test(email));
  }

  /**
   * Helps facilitate form validation in the cart/order view.
   * @param {String} phone - the phone number of the user tied to the order.
   * @param {email} email - the email of the user tied to the order.
   */
  function highlightOrder(phone, email) {
    if (Object.keys(cart).length === 0) {
      id("items").classList.add("highlight");
    } else {
      id("items").classList.remove("highlight");
    }
    if (phone.length !== PHONE_LENGTH) {
      id("phone-number").classList.add("highlight");
    } else {
      id("phone-number").classList.remove("highlight");
    }
    if (!email) {
      id("email").classList.add("highlight");
    } else {
      id("email").classList.remove("highlight");
    }
  }

  /** Sets up the inputs in the customize view, which modify the display. */
  function setupCustomize() {
    let batterButtons = qsa("#batter fieldset input");
    for (let button of batterButtons) {
      button.addEventListener("click", () => {
        updateBatter(button.id);
      });
    }

    let toppingButtons = qsa("#toppings fieldset input");
    for (let button of toppingButtons) {
      button.addEventListener("click", () => {
        updateToppings(button.id);
      });
    }
    id("custom-order-btn").addEventListener("click", placeCustomOrder);
  }

  /**
   * Updates what type of batter is displayed to the user.
   * @param {String} name - the name of the type of batter to be dispplayed.
   */
  function updateBatter(name) {
    let path = name.substring(0, name.length - BUTTON_LENGTH).toLowerCase();
    id("cookie").style.backgroundImage = "url('img/" + path + ".png')";
  }

  /**
   * Updates what type of topping is displayed to the user
   * @param {String} name - the name of the type of topping to be displayed.
   */
  function updateToppings(name) {
    let toppings = qsa(".toppings");
    for (let topping of toppings) {
      if (topping.id + "-btn" === name) {
        topping.classList.remove("hidden");
      } else {
        topping.classList.add("hidden");
      }
    }
  }

  /** Adds the users custom order to the cart. */
  function placeCustomOrder() {
    let batter = qs("#batter input:checked");
    let topping = qs("#toppings input:checked");
    let addOns = qsa("#add-ons input:checked");
    if (batter && topping) {
      let order = {};
      order["Custom Order"] = {};

      let ingredients = "";
      ingredients += formatButtonId(batter.id) + ", ";
      ingredients += formatButtonId(topping.id) + ", ";
      for (let addOn of addOns) {
        ingredients += formatButtonId(addOn.id) + ", ";
      }
      ingredients = ingredients.substring(0, ingredients.length - 2);
      order["Custom Order"]["ingredients"] = ingredients;
      order["Custom Order"]["price"] = 3;
      order["Custom Order"]["qty"] = 1;

      addItemToCart("Custom Order " + customCount, order["Custom Order"]);
      customCount++;

      let checked = qsa("#custom-selection input:checked");
      for (let input of checked) {
        input.checked = false;
      }
    } else {
      displayStatus("Please check a batter and a topping!");
    }
    highlightCustom(batter, topping);
  }

  /**
   * Used in form validation in the customize view, to make sure all required information is there.
   * @param {DOMElement} batter - DOM element of input tied to the batter in customize view.
   * @param {DOMElement} topping - DOM element of input tied to the topping in customize view.
   */
  function highlightCustom(batter, topping) {
    if (!batter) {
      qs("#batter fieldset").classList.add("highlight");
    } else {
      qs("#batter fieldset").classList.remove("highlight");
    }
    if (!topping) {
      qs("#toppings fieldset").classList.add("highlight");
    } else {
      qs("#toppings fieldset").classList.remove("highlight");
    }
  }

  /**
   * Formats the button id for the desired batter, topping, and add-on in the customize view.
   * Useful in displaying relevant information in the cart about a custom order.
   * @param {String} button - text to be formatted.
   * @returns {String} - formatted text.
   */
  function formatButtonId(button) {
    button = button.substring(0, button.length - BUTTON_LENGTH);
    let words = button.split("-");
    let result = "";
    for (let word of words) {
      let capital = word[0].toUpperCase();
      result += capital + word.substring(1) + " ";
    }
    return result.substring(0, result.length - 1);
  }

  /** Sets up the form for submitting feedback to API. */
  function setupContact() {
    id("question-submit").addEventListener("click", () => {
      postQuestion(id("question").value);
    });
  }

  /**
   * Posts the users feedback to the API.
   * @param {String} question - feedback to be posted.
   */
  function postQuestion(question) {
    if (question.length > 0) {
      id("question").classList.remove("highlight");
      let form = new FormData();
      form.append("question", question);
      if (user) {
        form.append("user", user);
      }
      fetch("/contact", {method: "POST", body: form})
        .then(checkStatus)
        .then(() => {
          displayStatus("Your feedback has been received!");
          clearFields();
        })
        .catch(() => {
          displayStatus("Something went wrong posting your feedback, try again!");
        });
    } else {
      id("question").classList.add("highlight");
      displayStatus("Please Write A Question or Complaint!");
    }
  }

  /**
   * Helper function used in various form validation, errors, and other messages.
   * @param {String} message - message to be displayed to the user.
   */
  function displayStatus(message) {
    let statusView = id("status");
    statusView.innerHTML = "";

    let status = document.createElement("h2");
    status.id = "status-message";
    status.textContent = message;
    statusView.appendChild(status);

    status.classList.add("fadeout");
  }

  /** Sets up various event listeners a form submission used by users for login and signup. */
  function setupLogin() {
    id("login-btn").addEventListener("click", () => {
      toggleView("login");
      id("login-form").classList.remove("hidden");
      id("signup-form").classList.add("hidden");
    });
    id("signup-btn").addEventListener("click", () => {
      toggleView("login");
      id("signup-form").classList.remove("hidden");
      id("login-form").classList.add("hidden");
    });
    id("login-form").addEventListener("submit", function(click) {
      click.preventDefault();
      postLogin(id("login-username").value, id("login-password").value);
    });
    id("signup-form").addEventListener("submit", function(click) {
      click.preventDefault();
      postSignup();
    });
    id("logout-btn").addEventListener("click", postLogout);
    id("user-welcome").addEventListener("click", () => {
      id("cookies").textContent = "Hi! :)";
      setTimeout(() => {
        id("cookies").textContent = "Ethan's Cookies";
      }, HI_DURATION);
    });
  }

  /**
   * Posts the users login to the API, which returns a session id
   * @param {String} username - the user's username.
   * @param {String} password - the user's password.
   */
  function postLogin(username, password) {
    let userInfo = new FormData();
    userInfo.append("username", username);
    userInfo.append("password", password);

    fetch("/login", {method: "POST", body: userInfo})
      .then(checkStatus)
      .then(() => {
        sessionId = document.cookie.substring(SESSIONID_LENGTH);
        user = username;
        toggleLoginView();
        populateYourOrders();
        clearFields();
        customCount = 1;
      })
      .catch(() => {
        displayStatus("Username or Password Incorrect");
      });
  }

  /** Post the users logout to the API, which also gets rid of the current session id. */
  function postLogout() {
    let sessionInfo = new FormData();
    sessionInfo.append("sessionid", sessionId);
    fetch("/logout", {method: "POST", body: sessionInfo})
      .then(checkStatus)
      .then(() => {
        toggleLoginView();
        user = "";
        sessionId = NO_SESSION;
      })
      .catch(() => {
        displayStatus("Can't logout right now, try again!");
      });
  }

  /** Posts a new users signup information to the API, adding them to the user database. */
  function postSignup() {
    let username = id("signup-username").value;
    let email = id("signup-email").value;
    let password = id("signup-password").value;
    let repassword = id("signup-repassword").value;
    if (password !== repassword) {
      displayStatus("Passwords do not match. Try again!");
    } else {
      let userInfo = new FormData();
      userInfo.append("username", username);
      userInfo.append("email", email);
      userInfo.append("password", password);
      user = username;
      fetch("/signup", {method: "POST", body: userInfo})
        .then(checkStatus)
        .then(() => {
          postLogin(username, password);
        })
        .catch(() => {
          displayStatus("Can't signup right now, try again! (Try another username)");
        });
    }
  }

  /** Helper function used to toggle between what login button can be seen */
  function toggleLoginView() {
    let toToggle = qsa("#login-nav h2");
    for (let element of toToggle) {
      element.classList.toggle("hidden");
    }
    id("user-welcome").textContent = "Welcome " + user + "!";
    toggleView("welcome");
  }

  /** Checks if the user has a session id cookie, and logs them into the website if they do. */
  function checkSession() {
    let cookies = document.cookie;
    if (cookies.indexOf("sessionid") >= 0) {
      let tempSessionId = document.cookie.substring(SESSIONID_LENGTH);
      let sessionData = new FormData();
      sessionData.append("sessionid", tempSessionId);
      fetch("/resumesession", {method: "POST", body: sessionData})
        .then(checkStatus)
        .then(resp => resp.text())
        .then((resp) => {
          sessionId = tempSessionId;
          user = resp;
          id("logout-btn").classList.remove("hidden");
          id("user-welcome").classList.remove("hidden");
          id("your-orders-btn").classList.remove("hidden");
          id("user-welcome").textContent = "Welcome " + user + "!";
          populateYourOrders();
        })
        .catch(() => {
          id("login-btn").classList.remove("hidden");
          id("signup-btn").classList.remove("hidden");
          displayStatus("Can't get session right now, try refreshing!");
        });
    } else {
      id("login-btn").classList.remove("hidden");
      id("signup-btn").classList.remove("hidden");
    }
  }

  /** Fetches the users previous orders from the API, and displays them. */
  function populateYourOrders() {
    if (user.length > 0) {
      fetch("/yourorders?username=" + user)
        .then(checkStatus)
        .then(resp => resp.json())
        .then(showYourOrders)
        .catch(() => {
          displayStatus("Can't get your past orders right now, try refreshing!");
        });
    }
  }

  /**
   * Populates the Your Orders view with given information about the users previous orders.
   * @param {JSON} response - JSON object holding information about the users previous orders.
   */
  function showYourOrders(response) {
    let view = id("order-list");
    view.innerHTML = "";
    for (let entry of response) {
      let card = document.createElement("div");
      card.classList.add("order-card");

      let items = Object.keys(entry);
      for (let item of items) {
        if (item !== "total_price") {
          let orderItem = document.createElement("h2");
          orderItem.textContent = item + " x" + entry[item];
          card.appendChild(orderItem);
        }
      }

      let price = document.createElement("p");
      price.textContent = "$" + entry["total_price"];
      card.appendChild(price);
      card.appendChild(document.createElement("hr"));
      view.appendChild(card);
    }
  }

  /** Clears all text and password input fields. */
  function clearFields() {
    let fields = qsa("input[type='text'], input[type='password'], textarea");
    for (let field of fields) {
      field.value = "";
    }
  }

  /** CSE 154 Helper Functions */

  /**
   * Makes sure that any fetch requests were successful and did not produce any errors.
   * @param {Object} response - response object from API.
   * @return {object} response - checked response object from API.
   */
  function checkStatus(response) {
    if (!response.ok) { // response.status >= 200 && response.status < 300
      throw Error("Error in request: " + response.statusText);
    }
    return response;
  }

  /**
   * Returns the HTML element that has the given id.
   * @param {string} name - element ID.
   * @return {object} - DOM object associated with id.
   */
  function id(name) {
    return document.getElementById(name);
  }

  /**
   * Returns an array of elements matching the given query.
   * @param {string} query - CSS query selector.
   * @returns {object} - DOM object matching the given query.
   */
  function qs(query) {
    return document.querySelector(query);
  }

  /**
   * Returns an array of elements matching the given query.
   * @param {string} query - CSS query selector.
   * @returns {object} - array of DOM objects matching the given query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }

})();
