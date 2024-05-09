const mongoose = require("mongoose");
const { Schema } = mongoose; // Importez Schema depuis mongoos
const enumUsersRoles = require("../roles/usersRoles");

const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, "Please give the firstname"],
  },
  lastname: {
    type: String,
    required: [true, "Please give the lastname"],
  },
  dateofbirth: {
    type: Date,
    required: [true, "Please give the date of birth"],
  },
  placeofbirth: {
    type: String,
    required: [true, "Please give the place of birth"],
  },
  nationality: {
    type: String,
    required: [true, "Please give the nationality"],
  },
  address: {
    type: String,
    required: [true, "Please give the address"],
  },
  sexe: {
    type: String,
    required: [true, "Please give thesexe"],
    enum: ["M", "F"], // ['M', 'F']
  },
  email: {
    type: String,
    required: [true, "Please give the email"],
    unique: true,
    trim: true,
    // match: /^\S+@\S+\.\S+$/, // Regex for a simple email validation
  },
  role: {
    type: String,
    enum: [
      enumUsersRoles.ADMIN,
      enumUsersRoles.SUPERADMIN,
      enumUsersRoles.EDITOR,
      enumUsersRoles.STUDENT,
    ], // ['student', 'teacher', 'admin', 'superadmin'
    default: enumUsersRoles.STUDENT,
  },
  compte: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: "Compte",
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  secret: {
    type: String,
    default: null,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const skipDeleted = function () {
  this.where({ isDeleted: false });
};

UserSchema.pre("find", skipDeleted);
UserSchema.pre("findOne", skipDeleted);
UserSchema.pre("findById", skipDeleted);
UserSchema.pre("updateOne", skipDeleted);
UserSchema.pre("updateMany", skipDeleted);
UserSchema.pre("findOneAndUpdate", skipDeleted);
UserSchema.pre("deleteOne", skipDeleted);
UserSchema.pre("deleteMany", skipDeleted);

const User = mongoose.model("user", UserSchema);
module.exports = User;
