# Narthana

<<<<<<< HEAD
## Backend setup with MySQL

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a MySQL database server and configure connection values in a `.env` file.

3. Create a `.env` file from the sample:
   ```bash
   copy .env.example .env
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server will automatically create the specified database and the required `users` and `visitors` tables if they do not exist.
=======
## Login OTP email

Copy `.env.example` to `.env` and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Set `SMTP_FROM_NAME` to control the sender name shown for OTP emails; it defaults to `JJCET INSTITUTION`. The Login page sends a six-digit OTP to the entered account email after the email, password, and role are verified.
>>>>>>> 0e5e44e (Initial commit)
