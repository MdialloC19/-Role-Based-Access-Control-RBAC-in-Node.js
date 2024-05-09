const User = require("../models/user");
const Resa = require("../models/reservation");
const Compte = require("../models/compte");
const { userRole } = require("../models/user/userRole");
const {
  createValidationError,
  createNotFoundError,
} = require("../middlewares/errorHandlers");
const ResaController = require("./reservation");
const {
  generateOTP,
  generateSecretResetEmail,
  sendVerificationEmail,
  generateSecretEmail,
} = require("../mail/email");
const bcrypt = require("bcryptjs");

/**
 * Niveaux d'études correspondants
 * @constant
 * @type {object}
 */
const NIVEAU = {
  5: "DIC3",
  4: "DIC2",
  3: "DIC1",
  2: "DUT2",
  1: "DUT1",
};

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

/**
 * Formater les informations d'un étudiant
 * @function
 * @param {object} etudiant - Les informations de l'étudiant
 * @param {string} chambre - La chambre de l'étudiant
 * @param {string} statut - Le statut de réservation de l'étudiant
 * @returns {object} - Les informations formatées de l'étudiant
 */
function formatEtudiant(etudiant, chambre, statut) {
  return {
    num_carte: etudiant.num_carte,
    nom: etudiant.nom,
    prenom: etudiant.prenom,
    sexe: etudiant.sexe,
    tel: etudiant.tel,
    niveau: NIVEAU[etudiant.niveau],
    chambre,
    statut,
  };
}

/**
 * Contrôleur pour la gestion des utilisateurs
 * @class
 */
module.exports = class UserController {
  /**
   * Créer un nouvel utilisateur
   * @async
   * @function
   * @param {object} req - La requête HTTP
   * @param {object} res - La réponse HTTP
   * @param {function} next - La fonction de middleware suivante
   * @returns {Promise<object>} - L'utilisateur créé
   */
  async createUser(req, res, next) {
    try {
      const { num_carte, role } = req.body;
      const currentUser = await User.findOne({ num_carte: num_carte });
      if (currentUser) {
        throw createValidationError(
          "User",
          "Le numéro de la carte fourni existe déjà."
        );
      }
      if (!role) {
        throw createNotFoundError(
          "User",
          "Le rôle de l'utilisateur n'est pas connu."
        );
      }
      if (role === userRole.ADMIN || role === userRole.EDITOR) {
        const { num_carte, email, prenom, nom, role, tel } = req.body;
        if (!num_carte || !email || !prenom || !nom || !tel) {
          throw createValidationError(
            "User",
            "Les informations de l'utilisateur sont incomplètes."
          );
        }
        const userData = {
          num_carte: num_carte,
          email: email,
          prenom: prenom,
          nom: nom,
          role: role,
          tel: tel,
        };

        const user = await User.create(userData);
        return res.json({ code: 200, user });
      } else if (role === userRole.STUDENT) {
        const { num_carte, email, prenom, nom, tel, sexe, niveau } = req.body;
        if (
          !num_carte ||
          !email ||
          !prenom ||
          !nom ||
          !tel ||
          !sexe ||
          !niveau
        ) {
          createValidationError(
            "User",
            "Les informations de l'utilisateur sont incomplètes."
          );
        }

        const secret = generateOTP();
        const hashedSecret = await hashSecret(secret);
        const userData = {
          num_carte: num_carte,
          email: email,
          prenom: prenom,
          nom: nom,
          role: role,
          tel: tel,
          sexe: sexe,
          niveau: niveau,
          secret: hashedSecret,
        };
        const user = await User.create(userData);
        const emailOptions = generateSecretEmail(user, secret);
        await sendVerificationEmail(emailOptions);

        return res.json({ code: 200, user });
      }

      throw createNotFoundError(
        "User",
        "Le rôle de l'utilisateur n'est pas connu."
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupérer tous les utilisateurs
   * @async
   * @function
   * @param {object} req - La requête HTTP
   * @param {object} res - La réponse HTTP
   * @param {function} next - La fonction de middleware suivante
   * @returns {Promise<object>} - Les utilisateurs
   */
  async getUsers(req, res, next) {
    try {
      const users = await User.find({});
      res.status(200).json({ data: users });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Récupérer tous les étudiants
   * @async
   * @function
   * @param {object} req - La requête HTTP
   * @param {object} res - La réponse HTTP
   * @param {function} next - La fonction de middleware suivante
   * @returns {Promise<object>} - Les étudiants
   */
  async getStudents(req, res, next) {
    try {
      const users = await User.find({ role: userRole.STUDENT }).populate(
        "compte"
      );
      const finalResult = await Promise.all(
        users.map(async function (etudiant) {
          const compte = etudiant.compte;

          if (!compte) {
            return formatEtudiant(etudiant, "non codifié");
          }

          const resa = await Resa.findOne({ compte }).populate("chambre");
          const chambre = resa
            ? `${resa.chambre.numero}${resa.chambre.pavillon}`
            : "non codifié";
          const statut = resa ? `${resa.statut}` : "";

          return formatEtudiant(etudiant, chambre, statut);
        })
      );

      return res.json({ code: 200, etudiant: finalResult });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   * @async
   * @function
   * @param {object} req - La requête HTTP
   * @param {object} res - La réponse HTTP
   * @param {function} next - La fonction de middleware suivante
   * @returns {Promise<object>} - L'utilisateur
   */
  async getUserById(req, res, next) {
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
      return res.json({ code: 200, user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réinitialiser le secret (mot de passe) d'un utilisateur
   * @async
   * @function
   * @param {object} req - La requête HTTP
   * @param {object} res - La réponse HTTP
   * @param {function} next - La fonction de middleware suivante
   * @returns {Promise<object>} - L'utilisateur avec le secret réinitialisé
   */
  async resetSecret(req, res, next) {
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
  }

  /**
   * Mettre à jour un utilisateur
   * @async
   * @function
   * @param {object} req - La requête HTTP
   * @param {object} res - La réponse HTTP
   * @param {function} next - La fonction de middleware suivante
   * @returns {Promise<object>} - L'utilisateur mis à jour
   */
  async updateUser(req, res, next) {
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
      const { role } = req.body;
      if (
        role !== userRole.STUDENT &&
        role !== userRole.EDITOR &&
        role !== userRole.ADMIN
      ) {
        throw createValidationError(
          "User",
          "Veuillez fournir le rôle correct de l'utilisateur."
        );
      }

      if (userRole.STUDENT === role) {
        if (res.locals.loggedInUser.role === userRole.ADMIN) {
          const {
            date_naissance,
            lieu_naissance,
            num_identite,
            nationalite,
            departement,
            option,
            email,
            prenom,
            nom,
            tel,
            sexe,
            niveau,
          } = req.body;
          const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
              date_naissance,
              lieu_naissance,
              num_identite,
              nationalite,
              departement,
              option,
              email,
              prenom,
              nom,
              tel,
              sexe,
              niveau,
            },
            { new: true }
          );
          res.json({ code: 200, user: updatedUser });
        } else {
          const {
            date_naissance,
            lieu_naissance,
            num_identite,
            nationalite,
            departement,
            option,
          } = req.body;
          const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
              date_naissance,
              lieu_naissance,
              num_identite,
              nationalite,
              departement,
              option,
            },
            { new: true }
          );
          res.json({ code: 200, user: updatedUser });
        }
      } else {
        if (res.locals.loggedInUser.role === userRole.ADMIN) {
          const { type, fonction, email, prenom, nom, tel } = req.body;
          const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { type, fonction, email, prenom, nom, tel },
            { new: true }
          );
          res.json({ code: 200, user: updatedUser });
        } else {
          const { type, fonction } = req.body;
          const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { type, fonction },
            { new: true }
          );
          res.json({ code: 200, user: updatedUser });
        }
      }
    } catch (e) {
      next(e);
    }
  }

  /**
   * Supprimer un utilisateur
   * @async
   * @function
   * @param {object} req - La requête HTTP
   * @param {object} res - La réponse HTTP
   * @param {function} next - La fonction de middleware suivante
   * @returns {Promise<object>} - Message de succès de suppression
   */
  async deleteUser(req, res, next) {
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
      const compte = user.compte;
      if (compte) {
        const reservation = await Resa.findOne({ compte: compte });
        if (!reservation) {
          await Compte.deleteOne({ _id: compte });
        } else {
          await Resa.deleteOne({ _id: reservation._id });
          const controllerInstance = new ResaController();
          await controllerInstance.updateReservationStatut(reservation.chambre);
          await Compte.deleteOne({ _id: compte });
        }
      }
      await User.deleteOne({ _id: user._id });
      res.status(200).json({
        code: 200,
        message: "L'utilisateur a été supprimé avec succès !",
      });
    } catch (e) {
      next(e);
    }
  }
};
