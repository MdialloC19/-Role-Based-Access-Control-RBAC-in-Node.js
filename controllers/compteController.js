const Compte = require("../models/compte");
// const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserService = require("../services/user.services");

const {
  otpData,
  tokenData,
  generateOTP,
  generateEmailOptions,
  sendVerificationEmail,
} = require("../mail/email");
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const userRole = require("../roles/enumUsersRoles");

/**
 * Vérifie si le code OTP soumis est valide et non expiré.
 * @param {Object} storedData Données stockées de l'OTP.
 * @param {string} codeOtpSoumis Code OTP soumis par l'utilisateur.
 * @returns {boolean} true si le code est valide et non expiré, sinon false.
 */
const isValidCode = (storedData, codeOtpSoumis) => {
  return (
    storedData &&
    storedData.code === codeOtpSoumis &&
    Date.now() < storedData.expiration
  );
};
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phoneNumber);
};

const updateUserConfirmationStatus = async (identifiant) => {
  let user;

  if (isValidEmail(identifiant)) {
    user = await UserService.getUserByEmail(identifiant);
  } else if (isValidPhoneNumber(identifiant)) {
    user = await UserService.getUserByPhone(identifiant);
  } else {
    user = await UserService.getUserById(identifiant);
  }

  if (!user) {
    throw createNotFoundError("User", "L'utilisateur n'est pas trouvé !");
  }

  await user.updateOne({ $set: { confirmed: true } });
};

/**
 * Crée un token JWT avec l'ID de l'utilisateur.
 * @param {string} id ID de l'utilisateur.
 * @returns {string} Token JWT généré.
 */
const createToken = (id) => {
  return jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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

/**
 * Compare le mot de passe soumis avec le mot de passe hashé.
 * @param {string} password Mot de passe soumis.
 * @param {string} hashedPassword Mot de passe hashé.
 * @returns {Promise<boolean>} Promise résolue avec true si les mots de passe correspondent, sinon false.
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
module.exports = class CompteController {
  /**
   * Vérifie l'identité de l'utilisateur en envoyant un code OTP ou en demandant le code secret personnel.
   * @param {Object} req Objet de requête Express.
   * @param {Object} res Objet de réponse Express.
   * @param {Function} next Fonction de middleware suivant.
   */
  async verifyIdentity(req, res, next) {
    try {
      const { email } = req.body;
      const user = await UserService.getUserByEmail(email);

      if (!user) {
        throw createNotFoundError("User", "L'utilisateur n'est pas trouvé !");
      }
      console.log(userRole, user.role);

      if (user.role === userRole.STUDENT) {
        if (user.secret) {
          return res.json({
            code: 200,
            msg: "Renseignez votre code secret personnel",
            user: user,
          });
        }
        throw createNotFoundError("User", "No secret found for this user!");
      }

      const otp = generateOTP();
      const emailOptions = generateEmailOptions(user, otp);
      await sendVerificationEmail(emailOptions);

      otpData.set(user.email, { code: otp, expiration: Date.now() + 600000 });

      return res.json({
        code: 200,
        msg: "E-mail de vérification envoyé avec succès",
        etudiant: {
          email: user.email,
          num_carte: user.num_carte,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie le code OTP ou le code secret personnel pour la confirmation de l'utilisateur.
   * @param {Object} req Objet de requête Express.
   * @param {Object} res Objet de réponse Express.
   * @param {Function} next Fonction de middleware suivant.
   */
  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      const user = await UserService.getUserByEmail(email);
      console.log(user);
      if (user && user.role === userRole.STUDENT) {
        const valid = await comparePassword(otp, user.secret);

        if (!valid) {
          throw createNotFoundError(
            "Compte",
            "Le code secret personnel est incorrect !"
          );
        }

        await updateUserConfirmationStatus(email);

        return res.json({
          code: 200,
          msg: "Code Secret valide, vérification réussie.",
          email,
        });
      }

      const storedData = otpData.get(email);
      if (isValidCode(storedData, otp)) {
        otpData.delete(email);
        await updateUserConfirmationStatus(num_carte);

        return res.json({
          code: 200,
          msg: "Code OTP valide, vérification réussie.",
          num_carte,
        });
      } else {
        let error = new Error(
          "Code OTP invalide ou expiré, vérification échouée."
        );
        error.statusCode = 498;
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Définit le mot de passe pour le compte de l'utilisateur.
   * @param {Object} req Objet de requête Express.
   * @param {Object} res Objet de réponse Express.
   * @param {Function} next Fonction de middleware suivant.
   */
  async setPassword(req, res, next) {
    try {
      let dataCompte = {};
      const { email, password } = req.body;
      if (isValidEmail(email)) {
        dataCompte.email = email;
      }
      let newPassword = await hashPassword(password);
      dataCompte.password = newPassword;
      console.log(dataCompte);
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

        const token = createToken(user._id);
        const userObject = updatedUser.toObject();

        return res.status(200).json({
          new: true,
          user: {
            ...userObject,
            token: token,
          },
        });
      }

      try {
        const compte = await Compte.findById(user.compte);

        if (!compte) {
          throw createNotFoundError("Compte", "Compte non trouvé");
        }

        await compte.updateOne({ $set: { password: newPassword } });
        // let room = null;

        // if (compte.reserver) {
        //   const resa = await findResaByCompteId(compte._id);
        //   room = await findChambreById(resa.chambre);
        // }

        const token = createToken(user._id);
        const userObject = user.toObject();

        return res.status(200).json({
          user: {
            ...userObject,
            token: token,
          },
        });
      } catch (error) {
        next(error);
      }
    } catch (error) {
      next(error);
    }
  }

  //   /**
  //    * Connecte l'utilisateur avec son numéro de carte et son mot de passe.
  //    * @param {Object} req Objet de requête Express.
  //    * @param {Object} res Objet de réponse Express.
  //    * @param {Function} next Fonction de middleware suivant.
  //    */
  //   async signin(req, res, next) {
  //     try {
  //       const { num_carte, password } = req.body;
  //       let room = null;

  //       const user = await findUserByNumCarte(num_carte);
  //       if (!user) {
  //         throw createNotFoundError(
  //           "Compte",
  //           "Utilisateur non trouvé, contactez le support technique !"
  //         );
  //       }

  //       const compte = await findCompteById(user.compte);
  //       if (!compte) {
  //         throw createNotFoundError(
  //           "Compte",
  //           "Utilisateur non trouvé, veuillez vous inscrire ou contacter le support technique !"
  //         );
  //       }
  //       if (!compte.password) {
  //         throw createNotFoundError(
  //           "Compte",
  //           "Le champs mot de passe est requis !"
  //         );
  //       }

  //       const valid = await comparePassword(password, compte.password);
  //       if (!valid) {
  //         throw createNotFoundError(
  //           "Compte",
  //           "Nom d'utilisateur ou mot de passe incorrect !"
  //         );
  //       }

  //       if (compte.reserver) {
  //         const resa = await findResaByCompteId(compte._id);
  //         room = await findChambreById(resa.chambre);
  //       }

  //       const token = createToken(user._id);
  //       const userObject = user.toObject();

  //       res.status(200).json({
  //         chambre: room,
  //         codifier: compte.codifier,
  //         user: {
  //           ...userObject,
  //           token: token,
  //         },
  //       });
  //     } catch (error) {
  //       next(error);
  //     }
  //   }

  //   /**
  //    * Récupère le compte de l'utilisateur en fonction de son numéro de carte.
  //    * @param {Object} req Objet de requête Express.
  //    * @param {Object} res Objet de réponse Express.
  //    */
  //   async getCompte(req, res) {
  //     const num_carte = req.params.num_carte;
  //     try {
  //       const user = await User.findOne({ num_carte: num_carte });
  //       const id = user.compte;
  //       if (id != null) {
  //         const compte = await Compte.findById(id);
  //         return res.json({ code: 200, compte: compte, user: user });
  //       } else {
  //         return res.json({ code: 500, msg: "l'utilisateur n'a pas de compte" });
  //       }
  //     } catch (err) {
  //       return res.json({ code: 500, msg: err.message });
  //     }
  //   }
};
