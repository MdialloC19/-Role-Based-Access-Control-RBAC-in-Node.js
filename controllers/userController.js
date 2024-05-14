const UserService = require("../services/user.services");
const { HttpError } = require("../utils/exceptions");
const enumUsersRoles = require("../roles/enumUsersRoles");
const {
  createValidationError,
  createNotFoundError,
} = require("../utils/errorshandler");
const {
  otpData,
  tokenData,
  generateOTP,
  generateEmailOptions,
  sendVerificationEmail,
  generateSecretResetEmail,
} = require("../mail/email");
/**
 * Enregistre un nouvel utilisateur
 * @param {import('express').Request} req - Requête Express
 * @param {import('express').Response} res - Réponse Express
 * @returns {Promise<void>} - Promesse indiquant la fin du traitement
 */
async function hashSecret(secret) {
  return bcrypt.hash(secret, 10);
}
const bcrypt = require("bcryptjs");
const userRegisterUser = async (req, res) => {
  try {
    const registerUser = await UserService.createUser(req.body);

    return res.status(201).json(registerUser);
  } catch (error) {
    console.error(error);
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

/**
 * Authentifie un utilisateur
 * @param {import('express').Request} req - Requête Express
 * @param {import('express').Response} res - Réponse Express
 * @returns {Promise<void>} - Promesse indiquant la fin du traitement
 */
const userLoginUser = async (req, res) => {
  try {
    const loginUser = await UserService.loginUser(req.body);
    return res.status(200).json(loginUser);
  } catch (error) {
    console.error(error);
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

/**
 * Réinitialiser le secret (mot de passe) d'un utilisateur
 * @async
 * @function
 * @param {object} req - La requête HTTP
 * @param {object} res - La réponse HTTP
 * @param {function} next - La fonction de middleware suivante
 * @returns {Promise<object>} - L'utilisateur avec le secret réinitialisé
 */
const resetSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw createValidationError(
        "User",
        "Veuillez fournir l'identifiant de l'utilisateur."
      );
    }
    const user = await UserService.getUserByCompte(id);
    if (!user) {
      throw createNotFoundError("User", `Utilisateur introuvable`);
    }

    if (!Object.values(enumUsersRoles).includes(user.role)) {
      throw createNotFoundError(
        "User",
        "Le rôle de l'utilisateur n'est pas connu."
      );
    }

    if (res.locals.loggedInUser.role !== user.role) {
      // Utilisation de enumUsersRoles au lieu de userRole
      throw createNotFoundError(
        "User",
        "Vous n'êtes pas autorisé à réinitialiser le secret."
      );
    }

    const secret = generateOTP();
    const hashedSecret = await hashSecret(secret);

    const updatedUser = await UserService.updateUserById(user._id, {
      secret: hashedSecret,
    });
    const emailOptions = generateSecretResetEmail(updatedUser, secret);
    await sendVerificationEmail(emailOptions);

    return res.json({ code: 200, user });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  userRegisterUser,
  userLoginUser,
  resetSecret,
};
