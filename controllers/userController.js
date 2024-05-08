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

module.exports = {
  userRegisterUser,
  userLoginUser,
};
