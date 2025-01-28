const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  gamefiles: [String, String, String, String, String]
});

// compile model from schema
module.exports = mongoose.model("user", UserSchema);