const UserService = require("../services/user.services");
const { HttpError } = require("../utils/exceptions");

/**
 * Enregistre un nouvel utilisateur
 * @param {import('express').Request} req - Requête Express
 * @param {import('express').Response} res - Réponse Express
 * @returns {Promise<void>} - Promesse indiquant la fin du traitement
 */

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
    const user = await User.findById(id);
    if (!user) {
      throw createNotFoundError("User", `Utilisateur introuvable`);
    }

    if (userRole.STUDENT !== user.role) {
      throw createNotFoundError(
        "User",
        "Le rôle de l'utilisateur n'est pas connu."
      );
    }

    if (res.locals.loggedInUser.role !== userRole.ADMIN) {
      throw createNotFoundError(
        "User",
        "Vous n'êtes pas autorisé à réinitialiser le secret."
      );
    }

    const secret = generateOTP();
    const hashedSecret = await hashSecret(secret);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { secret: hashedSecret },
      { new: true }
    );
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
};
