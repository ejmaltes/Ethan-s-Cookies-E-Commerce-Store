# *Ethan's Cookies* API Documentation
This API is used to facilitate user interactions with the Ethan's Cookies webpage. It allows the
user to see our current catalogue of cookies, make their own custom cookies, and place orders.

For all endpoints below, if the server cannot connect with the database, the API will respond with
a 500 (Server Error) error code and some supplementary text.  Additionally, all 400 (Request Error)
error codes will be accompanied with some more descriptive error messages.

## /catalogue
**Request Format:** /catalogue

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns Ethan's Cookies current catalogue which includes information about each
                 individual cookie.

**Example Request:** /catalogue

**Example Response:**

```json
{
  "Chocolate Chip Cookie": {
  "shortname": "chocolatechip",
  "description": "Simple and Sweet",
  "ingredients": "Classic Batter,Chocolate Chips,Love",
  "price": 2.5
  },
  "Snickerdoodle Suprise": {
  "shortname": "snickerdoodlesuprise",
  "description": "Snickerdoodle with a dash of magic (sugar)",
  "ingredients": "Snickerdoodle Batter,Sugar,?",
  "price": 3
  },
  "Dark Chocolate Double Chocolate Chocolate Cookie": {
  "shortname": "dcdccc",
  "description": "Chocolate",
  "ingredients": "Chocolate Batter,Chocolate,...",
  "price": 3.5
  }
}
```

**Error Handling:**
If the API cannot get the information, response will be in text with code 500 (Server Error).

## /catalogue/:batter
**Request Format:** /catalogue/:batter

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns a filtered version of Ethan's Cookies current catalogue which includes information
                 about each individual cookie with the given type of batter.

**Example Request:** /catalogue/classic

**Example Response:**

```json
{
  "Chocolate Chip Cookie": {
  "shortname": "chocolatechip",
  "description": "Simple and Sweet",
  "ingredients": "Classic Batter,Chocolate Chips,Love",
  "price": 2.5
  }
}
```

**Error Handling:**
If no batter is specified, the API will respond in text with code 400 (Request Error).

## /item/:name
**Request Format:** /item/:name

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Retrieves all information about a certain item from the catalogue.

**Example Request:** /item/chocolatechip

**Example Response:**

```json
{
  "name": "Chocolate Chip Cookie",
  "description": "Simple and Sweet",
  "ingredients": "Classic Batter,Chocolate Chips,Love",
  "price": 2.5
}
```

**Error Handling:**
If no item name is specified, the API will respond in text with code 400 (Request Error).

## /yourorders
**Request Format:** /yourorders?username=

**Required Query Parameters:** username

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Retrieves all of the current users past orders, formats it, and
                 sends it back to the client.

**Example Request:** /yourorders?username=example

**Example Response:**

```json
[
  {
    "Snickerdoodle Suprise": 1,
    "Custom Order 1": 2,
    "total_price": 9
  }
]
```

**Error Handling:**
If no username is specified, the API will respond in text with code 400 (Request Error).

## /order
**Request Format:** /order

**Required Body Parameters:** phone (a phone number), email (a email), user (a username),
                              cart (the user's cart)

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** Posts order information passed through the body to the Ethan's Cookies database.

**Example Request:** /order {phone="1234567890", email="example@example.com", user="username",
                            cart={"Chocolate Chip Cookie" : ...}}

**Example Response:**

```
Your Order Has Been Placed!
```

**Error Handling:**
If any of the required parameters are missing, the API will respond in
text with code 400 (Request Error).

## /contact
**Request Format:** /contact

**Required Body Parameters:** question (the user's question)

**Optional Body Parameters:** user (a username)

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** Posts feedback from client to the Ethan's Cookies database.

**Example Request:** /contact {question="What are cookies?", user="username"}

**Example Response:**

```
Your Feedback Has Been Received!
```

**Error Handling:**
If any of the required parameters are missing, the API will respond in
text with code 400 (Request Error).

## /login
**Request Format:** /login

**Required Body Parameters:** username (a username), password (a password)

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** Posts login information to database, and sets session id cookie.

**Example Request:** /login {username="Example", password="example123"}

**Example Response:**

```
Successful Login!
```

**Error Handling:**
If any of the required parameters are missing or invalid, the API will respond in
text with code 400 (Request Error).

## /logout
**Request Format:** /logout

**Required Body Parameters:** sessionid (the user's session id cookie)

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** Posts logout information to database, and clears session id cookie.

**Example Request:** /logout {sessionid="12345"}

**Example Response:**

```
Successful Logout!
```

**Error Handling:**
If any of the required parameters are missing or invalid, the API will respond in
text with code 400 (Request Error).

## /signup
**Request Format:** /signup

**Required Body Parameters:** username (a username), password (a password), email (a email)

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** Posts sign up information (username, email, password) to database.

**Example Request:** /signup {username="Example", password="example123", email="example@example.com"}

**Example Response:**

```
Successful Signup!
```

**Error Handling:**
If any of the required parameters are missing or invalid, the API will respond in
text with code 400 (Request Error).

## /resumesession
**Request Format:** /resumesession

**Required Body Parameters:** sessionid (the user's session id cookie)

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** Posts session id information to database, and responds with connected username.

**Example Request:** /resumesession {sessionid="12345"}

**Example Response:**

```
ExampleUsername
```

**Error Handling:**
If any of the required parameters are missing or invalid, the API will respond in
text with code 400 (Request Error).
