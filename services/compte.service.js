const UserService = require("./user.services");
const bcrypt = require("bcryptjs");
const Compte = require("../models/compte");

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Hashe le mot de passe avec bcrypt.
 * @param {string} password Mot de passe à hasher.
 * @returns {Promise<string>} Promise résolue avec le mot de passe hashé.
 */

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

/**
 * Recherche un compte par son ID.
 * @param {string} compteId ID du compte.
 * @returns {Promise<Compte>} Promise résolue avec le compte trouvé ou null.
 */
const findCompteById = async (compteId) => {
  return await Compte.findById(compteId);
};
class CompteService {
  constructor() {
    // Initialisation des variables ou dépendances nécessaires
  }

  // Méthode pour créer un compte
  static async createCompte(email, password) {
    let dataCompte = {};
    if (isValidEmail(email)) {
      dataCompte.email = email;
    }
    let newPassword = await hashPassword(password);
    dataCompte.password = newPassword;
    // const { id } = req.params; si on veut le manipuler par l'ID
    const user = await UserService.getUserByEmail(email);

    if (!user) {
      throw createValidationError("User", "L'utilisateur n'est pas trouvé !");
    }

    if (!user.confirmed) {
      throw createValidationError(
        "Compte",
        "Votre compte n'est pas encore vérifié, veuillez recommencer !"
      );
    }

    if (!user.compte) {
      const newCompte = new Compte(dataCompte);
      await newCompte.save();
      const updatedUser = await UserService.updateUserByEmail(email, {
        compte: newCompte._id,
      });
      return updatedUser;
    }
    throw createValidationError("Compte", "L'utilisateur à déja un compte !");
  }

  /**
   * Recherche un compte par son ID.
   * @param {string} compteId ID du compte.
   * @returns {Promise<Compte>} Promise résolue avec le compte trouvé ou null.
   */
  static async getCompteById(compteId) {
    return await Compte.findById(compteId);
  }

  /**
   * Récupère le compte de l'utilisateur en fonction de son numéro de carte.
   * @param {Object} req Objet de requête Express.
   * @param {Object} res Objet de réponse Express.
   */
  static async getCompteByEmail(email) {
    try {
      const user = await UserService.getUserByEmail(email);
      const id = user.compte;
      if (id != null) {
        const compte = await Compte.findById(id);
        return compte;
      }
      throw createValidationError(
        "Compte",
        "L'utilisateur n'a pas de compte !"
      );
    } catch (err) {
      throw err;
    }
  }
  /**
   * Récupère le compte de l'utilisateur en fonction de son numéro de carte.
   * @param {Object} req Objet de requête Express.
   * @param {Object} res Objet de réponse Express.
   */
  async getCompteById(idCompte) {
    try {
      const compte = await Compte.findById(idCompte);
      return compte;
    } catch (err) {
      throw err;
    }
  }
  // Méthode pour mettre à jour un compte
  static async updateCompte(dataToUpdate, id) {
    const updateFields = {};
    for (const key in dataToUpdate) {
      updateFields[key] = dataToUpdate[key];
    }
    const newCompte = await Compte.updateOne(
      { _id: id },
      { $set: updateFields }
    );
    return newCompte;
  }

  // Méthode pour supprimer un compte
  static async deleteCompte(identifier) {
    let query;
    if (isValidEmail(identifier)) {
      query = { email: identifier };
    } else {
      query = { _id: identifier };
    }
    const updatedCompte = await Compte.updateOne(query, { isDeleted: true });
    return updatedCompte;
  }

  // Méthode pour récupérer tous les comptes
  static async getAllComptes() {
    return await Compte.find();
  }
}

module.exports = CompteService;
