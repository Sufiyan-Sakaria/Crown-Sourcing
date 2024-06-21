# Changelog

## Technologies Used

![Node.js](https://img.icons8.com/color/48/000000/nodejs.png)
![MongoDB](https://img.icons8.com/color/48/000000/mongodb.png)
![EJS](https://img.icons8.com/color/48/000000/html-5.png)
![CSS](https://img.icons8.com/color/48/000000/css3.png)
![JavaScript](https://img.icons8.com/color/48/000000/javascript.png)

### Packages Used

- _Express_: "^4.19.2" - Fast, unopinionated, minimalist web framework for Node.js.
- _MongoDB_: "^6.7.0" - Cross-platform document-oriented database program.
- _Mongoose_: "^8.4.1" - MongoDB object modeling tool designed to work in an asynchronous environment.
- _EJS_: "^3.1.10" - Simple templating language that lets you generate HTML markup with plain JavaScript.
- _CSS_: Used for styling the application.
- _bcrypt_: "^5.1.1" - Library to help hash passwords.
- _cookie-parser_: "^1.4.6" - Middleware for parsing cookies in Express.
- _dotenv_: "^16.4.5" - Loads environment variables from a .env file into process.env.
- _jsonwebtoken_: "^9.0.2" - Library to create, sign, and verify JSON Web Tokens.
- _connect-flash_: "^0.1.1" - Used for flash messages.
- _express-session_: "^1.17.2" - Middleware for managing sessions.

---

## Version 0.1

### Initial Setup

- Set up a basic Express application.
- Implemented initial folder structure and configurations.

## Version 0.2

### User Authentication Setup

- Designed and implemented login and registration forms.
- Integrated frontend validation for user inputs.

## Version 0.2.1

### Backend Integration

- Created backend routes for user registration and login.
- Implemented password hashing using bcrypt before saving to MongoDB.
- Introduced JWT token generation for authentication and session management.

## Version 0.2.2

### Database Integration and Bug Fixes

- Connected the application to MongoDB Atlas for global database access.
- Resolved bugs related to database operations and connection issues.

## Version 0.3

### Middleware Implementation

- Added middleware to verify user authentication status.
- Secured routes requiring authentication with middleware checks.

## Version 0.4

### Enhanced User Experience and Security Features

- Redesigned frontend with responsive CSS for improved UI/UX.
- Implemented password strength meter and enforced stronger password policies.
- Introduced CSRF protection and input sanitization for enhanced security.

## Version 0.5 (Major Update)

### Admin Panel and Enhanced Security

- _Admin Panel Design and Functionality_

  - Created admin home page and users page.
  - Designed UI updates for admin interface including navbar and header.
  - Added functionality to manage users (edit, delete, view all).

- _Middleware Enhancements_

  - Implemented middleware for user authentication status and admin role verification.

- _Security Enhancements_
  - Introduced CSRF protection across application forms.
  - Implemented input sanitization to prevent XSS attacks.
  - Added flash messages for better user feedback.

### Package Updates

- _New Packages_
  - _connect-flash_: "^0.1.1" - Used for flash messages.
  - _express-session_: "^1.17.2" - Middleware for managing sessions.

### Other Changes

- Updated existing packages:

  - _Express_: "^4.19.2"
  - _MongoDB_: "^6.7.0"
  - _Mongoose_: "^8.4.1"
  - _EJS_: "^3.1.10"
  - _bcrypt_: "^5.1.1"
  - _cookie-parser_: "^1.4.6"
  - _dotenv_: "^16.4.5"
  - _jsonwebtoken_: "^9.0.2"

- Fixed various bugs related to database operations and UI/UX improvements.

---

This version focuses on enhancing security with CSRF protection, improving admin functionality, and updating UI elements for a better user experience.
