# Changelog

---

### Technologies Used:

![Node.js](https://img.icons8.com/color/48/000000/nodejs.png) 
![MongoDB](https://img.icons8.com/color/48/000000/mongodb.png) 
![EJS](https://img.icons8.com/color/48/000000/html-5.png)
![CSS](https://img.icons8.com/color/48/000000/css3.png) 
![JavaScript](https://img.icons8.com/color/48/000000/javascript.png)

---

### Packages Used

- **Express**: "^4.19.2" - A fast, unopinionated, minimalist web framework for Node.js.
- **MongoDB**: "^6.7.0" - A source-available cross-platform document-oriented database program.
- **Mongoose**: "^8.4.1" - A MongoDB object modeling tool designed to work in an asynchronous environment.
- **EJS**: "^3.1.10" - A simple templating language that lets you generate HTML markup with plain JavaScript.
- **JavaScript**: Used throughout the project for both server-side and client-side scripting.
- **CSS**: Used for styling the application.
- **bcrypt**: "^5.1.1" - A library to help you hash passwords.
- **cookie-parser**: "^1.4.6" - Parse HTTP request cookies.
- **dotenv**: "^16.4.5" - Loads environment variables from a `.env` file into `process.env`.
- **jsonwebtoken**: "^9.0.2" - A library to create, sign, and verify JSON Web Tokens.

---

## Version 0.1

### Initial Release
- Set up a basic Express application.

## Version 0.2

### User Interface for Authentication
- Designed login and registration forms for user registration.
- Created front-end validation for input fields.

## Version 0.2.1

### User Authentication Functionality
- Implemented backend routes for user login and registration.
- Integrated password hashing using bcrypt before saving to the database.
- Added JWT token generation for authentication and sent the token to the browser upon successful login.
- Established session management for logged-in users.

## Version 0.2.2

### Database Integration and Bug Fixes
- Resolved minor bugs related to database operations.
- Connected the application to MongoDB Atlas for global database access.
- Ensured secure storage of user data in the database.

## Version 0.3

### Middleware for Authentication
- Developed middleware to verify whether the user is logged in.
- Applied middleware to protect routes that require user authentication.
- Enhanced error handling and user feedback for authentication-related processes.