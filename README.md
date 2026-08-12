# Narthana

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
