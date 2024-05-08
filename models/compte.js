const mongoose = require("mongoose");

const { Schema } = mongoose;

const CompteSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Please provide the email"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide the password"],
    },
    inscrit: {
      type: Boolean,
      default: false,
    },
    reserver: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "comptes" }
);

module.exports = mongoose.model("Compte", CompteSchema);
