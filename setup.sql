--
-- NAME:Ethan Maltes
-- DATE: August 23, 2019
-- SECTION/TA: CSE154 AB Tal Wolman
--
-- This SQL file sets up the cookies data base for the Ethan's Cookies webpage
-- with all required tables and starter information.
--


CREATE DATABASE IF NOT EXISTS cookies;

USE cookies;

DROP TABLE IF EXISTS catalogue;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS users;

-- Table that holds Ethan's Cookies current catalogue --
CREATE TABLE catalogue(
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  shortname VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  ingredients VARCHAR(255) NOT NULL,
  price DECIMAL(9, 2)
);

 -- Table that holds Ethan's Cookies current users --
CREATE TABLE users(
 username VARCHAR(64) PRIMARY KEY NOT NULL,
 email VARCHAR(64) NOT NULL,
 password VARCHAR(64) NOT NULL,
 session_id VARCHAR(32)
);

-- Table that holds all of Ethan's Cookies current orders --
CREATE TABLE orders(
  order_number INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  phone_number VARCHAR(64),
  user VARCHAR(64),
  email VARCHAR(64),
  items TEXT NOT NULL,
  qtys VARCHAR(1024) NOT NULL,
  ingredients TEXT,
  total_price DECIMAL(9, 2),
  FOREIGN KEY (user) REFERENCES users(username)
);

-- Table that holds all of Ethan's Cookies feedback --
CREATE TABLE feedback(
  question_number INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  question TEXT NOT NULL,
  user VARCHAR(64),
  FOREIGN KEY (user) REFERENCES users(username)
);

-- All catalogue information to populate the catalogue table --
INSERT INTO catalogue(name, shortname, description, ingredients, price)
VALUES ('Chocolate Chip Cookie', 'chocolatechip', 'Simple and Sweet',
        'Classic Batter,Chocolate Chips,Love', 2.50),
       ('Snickerdoodle Suprise', 'snickerdoodlesuprise',
        'Snickerdoodle with a dash of magic (sugar)', 'Snickerdoodle Batter,Sugar,?', 3.00),
       ('Dark Chocolate Double Chocolate Chocolate Cookie', 'dcdccc' ,'Chocolate',
        'Chocolate Batter,Chocolate,...', 3.50),
       ('Sprinkles Galore', 'sprinklesgalore', 'Who doesn\'t like sprinkles?',
        'Classic Batter,Lots of sprinkles,Brown Sugar', 3.00),
       ('Oat-Doodle and Raisin\'s', 'oatdoodle', 'Oatmeal and Snickerdoodle? That\'s weird...',
        'Snickerdoodle Batter,Oatmeal,Raisins', 3.25),
       ('Sugar Cookie With Holiday Frosting', 'sugarcookie',
        'For all those times you thought, \'I really want a halloween themed sugar cookie rn\'',
        'Classic Batter,Sugar?,Stale Frosting', 0.50),
       ('Brownie-ookie', 'brownieookie', 'What a minute, this isn\'t a cookie',
        'Chocolate Batter,Brownie Bits,Powdered Sugar', 4.00),
       ('Snickerdoodle Fortune Cookie', 'fortune', 'Where am I?!?',
        'Snickerdoodle Batter,Vanilla,Paper', 1.00),
       ('Peanut Butter Deluxe', 'pbd', 'My mouth is already dry',
        'Classic Batter,Peanut Butter,Peanuts', 3.00),
       ('Chocolate Ice Cream Sandwich', 'chocsandwich', 'This is the best one',
        'Chocolate Batter,Chocolate Chips,Vanilla Ice Cream', 4.50),
       ('Snickerdoodle Gingersnap Macadamia', 'snickergingermac', 'Does this actually taste good?',
        'Snickerdoodle Batter,Ginger,Macadamia Nuts', 3.50),
       ('The Party Cookie', 'tpc', 'Good for any kind of party...',
        'Classic Batter,Chocolate Dipped,Assorted Candies', 3.00),
       ('Choco-Latte', 'chocolatte', 'Coffee and cookies, what could be better?',
        'Chocolate Batter,Coffee,Powdered Sugar', 3.50),
       ('1lb Classic Cookie Dough', 'classicdough', 'We sell a lot of this one for some reason',
        'Classic Batter,Chocolate Chips', 4.00),
       ('1lb Snickerdoodle Dough', 'doodledough', 'We sell a lot of this one too...',
        'Snickerdoodle Batter', 3.50),
       ('Mystery Cookie', 'mystery', '?', '?,?,?', 3.00);
