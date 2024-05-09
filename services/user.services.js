const User = require("../models/User");
const { HttpError } = require("../utils/exceptions");
const integretyTester = require("../utils/integrety.utils");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const {
  transporter,
  otpData,
  tokenData,
  generateOTP,
  generateSecretEmail,
  generateSecretResetEmail,
  generateEmailOptions,
  sendVerificationEmail,
} = require("../mail/email");

/**
 * Hasher un secret (probablement un mot de passe) avec bcrypt
 * @async
 * @function
 * @param {string} secret - Le secret à hacher
 * @returns {Promise<string>} - Le secret haché
 */
async function hashSecret(secret) {
  return bcrypt.hash(secret, 10);
}
class UserService {
  /**
   * Valide les données de l'utilisateur avant de créer un nouvel utilisateur.
   * @param {Object} userData - Données de l'utilisateur à valider.
   * @returns {Object} - Données de l'utilisateur validées.
   * @throws {HttpError} - Lance une erreur HTTP personnalisée si la validation échoue.
   */
  static async validateUserData(userData) {
    const errors = validationResult(userData);
    if (!errors.isEmpty()) {
      throw new HttpError(400, "Tester");
    }

    const {
      firstname,
      lastname,
      dateofbirth,
      placeofbirth,
      nationality,
      address,
      sexe,
      email,
      password,
      role,
      phone,
      isDeleted = false,
      ...rest // Capture tous les champs supplémentaires non destructurés explicitement
    } = userData;

    // Objet des champs validés
    const validatedUserData = {};

    // Vérifications de base
    if (!firstname || typeof firstname !== "string") {
      throw new HttpError(
        400,
        "Le prénom est requis et doit être une chaîne de caractères."
      );
    }
    validatedUserData.firstname = firstname;

    if (!lastname || typeof lastname !== "string") {
      throw new HttpError(
        400,
        "Le nom de famille est requis et doit être une chaîne de caractères."
      );
    }
    validatedUserData.lastname = lastname;

    if (!new Date(dateofbirth)) {
      throw new HttpError(400, "Date de naissance invalide.");
    }
    validatedUserData.dateofbirth = new Date(dateofbirth);

    if (!placeofbirth || typeof placeofbirth !== "string") {
      throw new HttpError(
        400,
        "Le lieu de naissance est requis et doit être une chaîne de caractères."
      );
    }
    validatedUserData.placeofbirth = placeofbirth;

    if (!nationality || typeof nationality !== "string") {
      throw new HttpError(
        400,
        "La nationalité est requise et doit être une chaîne de caractères."
      );
    }
    validatedUserData.nationality = nationality;

    if (!address || typeof address !== "string") {
      throw new HttpError(
        400,
        "L'adresse est requise et doit être une chaîne de caractères."
      );
    }
    validatedUserData.address = address;

    if (!sexe || !["M", "F"].includes(sexe)) {
      throw new HttpError(
        400,
        "Le sexe doit être 'M' (Masculin) ou 'F' (Féminin)."
      );
    }
    validatedUserData.sexe = sexe;

    if (!integretyTester.isEmail(email)) {
      throw new HttpError(400, "Format d'email invalide.");
    }
    validatedUserData.email = email;

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new HttpError(
        400,
        "Le mot de passe est requis et doit comporter au moins 6 caractères."
      );
    } else {
      // Hash du mot de passe
      const salt = await bcrypt.genSalt(10);
      const cryptPassword = await bcrypt.hash(password, salt);
      validatedUserData.password = cryptPassword;
    }

    if (
      role &&
      !["STUDENT", "TEACHER", "ADMIN", "SUPERADMIN"].includes(
        role.toUpperCase()
      )
    ) {
      throw new HttpError(400, "Rôle utilisateur invalide.");
    }

    validatedUserData.role = role;

    if (!phone || typeof phone !== "string") {
      throw new HttpError(
        400,
        "Le numéro de téléphone est requis et doit être un nombre."
      );
    }
    validatedUserData.phone = phone;

    // Vérifie s'il y a des champs supplémentaires qui n'ont pas été validés explicitement
    if (Object.keys(rest).length > 0) {
      throw new HttpError(400, "Champs supplémentaires invalides.");
    }

    return validatedUserData;
  }

  /**
   * Crée un nouvel utilisateur.
   * @param {Object} userData - Données pour le nouvel utilisateur.
   * @returns {Promise<Object>} - Promesse résolue avec l'utilisateur créé.
   * @throws {HttpError} - Lance une erreur HTTP personnalisée si la création de l'utilisateur échoue.
   */
  static async createUser(userData) {
    try {
      // Valider les données de l'utilisateur
      const validatedUserData = await UserService.validateUserData(userData);

      // Créer un nouvel utilisateur en utilisant le modèle Mongoose

      const secret = generateOTP();
      const hashedSecret = await hashSecret(secret);
      validatedUserData.secret = hashedSecret;
      const user = await User.create(validatedUserData);
      const emailOptions = generateSecretEmail(user, secret);
      await sendVerificationEmail(emailOptions);

      return res.json({ code: 200, user });
      return user;
    } catch (error) {
      console.error(error);
      if (error instanceof HttpError) {
        throw error; // Renvoie l'erreur HTTP personnalisée
      } else if (error.name === "ValidationError") {
        throw new HttpError(400, error.message);
      } else if (error.name === "MongoServerError" && error.code === 11000) {
        throw new HttpError(400, "L'email existe déjà.");
      } else if (error.name === "CastError") {
        throw new HttpError(400, "ID invalide.");
      } else {
        throw new HttpError(500, "Erreur interne du serveur."); // Par défaut, renvoie 500 pour les erreurs inattendues
      }
    }
  }

  // Méthodes supplémentaires pour la mise à jour, la suppression et la récupération des utilisateurs...
}

module.exports = UserService;
