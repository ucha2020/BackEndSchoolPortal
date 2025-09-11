
const db = require("./config/database");
const dotenv = require('dotenv');
const parsed = dotenv.config({debug: true});
const app = require('./app-s');

const PORT = process.env.PORT || 3000;

(async () => {
  console.log("Authenticating the database connection...");

  try {
    await db.authenticate();
    console.log("Database successfully connected");
    
    app.listen(PORT, () => {
      console.log(`Server1 is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
  
})()
