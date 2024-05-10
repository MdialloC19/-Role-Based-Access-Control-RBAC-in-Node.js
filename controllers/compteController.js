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
const CompteService = require("../services/compte.service");

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

/**
 * Crée un token JWT avec l'ID de l'utilisateur.
 * @param {string} id ID de l'utilisateur.
 * @returns {string} Token JWT généré.
 */
const createToken = (id, role) => {
  return jwt.sign({ userId: id, userRole: role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
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
        user: {
          email: user.email,
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
      if (
        user &&
        (user.role === userRole.STUDENT || user.role === userRole.TEACHER)
      ) {
        const valid = await comparePassword(otp, user.secret);
        if (!valid) {
          throw createNotFoundError(
            "Compte",
            "Le code secret personnel est incorrect !"
          );
        }

        await UserService.updateUserConfirmationStatus(email);

        return res.json({
          code: 200,
          msg: "Code Secret valide, vérification réussie.",
          email,
        });
      }

      const storedData = otpData.get(email);
      if (isValidCode(storedData, otp)) {
        otpData.delete(email);
        await updateUserConfirmationStatus(email);

        return res.json({
          code: 200,
          msg: "Code OTP valide, vérification réussie.",
          email,
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
      const { email, password } = req.body;

      // const { id } = req.params; si on veut le manipuler par l'ID
      const user = await UserService.getUserByEmail(email);

      if (!user.compte) {
        const user = await CompteService.createCompte(email, password);
        const token = createToken(user._id, user.role);
        const userObject = user.toObject();

        return res.status(200).json({
          new: true,
          user: {
            ...userObject,
            token: token,
          },
        });
      }
      const compte = await CompteService.getCompteById(user.compte);

      if (!compte) {
        throw createNotFoundError("Compte", "Compte non trouvé");
      }

      await CompteService.updateCompte({ password: newPassword }, compte._id);

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
  }

  /**
   * Connecte l'utilisateur avec son numéro de carte et son mot de passe.
   * @param {Object} req Objet de requête Express.
   * @param {Object} res Objet de réponse Express.
   * @param {Function} next Fonction de middleware suivant.
   */
  async signin(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserService.getUserByEmail(email);
      if (!user) {
        throw createNotFoundError(
          "Compte",
          "Utilisateur non trouvé, contactez le support technique !"
        );
      }

      const compte = await CompteService.getCompteById(user.compte);
      if (!compte) {
        throw createNotFoundError(
          "Compte",
          "Utilisateur non trouvé, veuillez vous inscrire ou contacter le support technique !"
        );
      }
      if (!compte.password) {
        throw createNotFoundError(
          "Compte",
          "Le champs mot de passe est requis !"
        );
      }

      const valid = await comparePassword(password, compte.password);
      if (!valid) {
        throw createNotFoundError(
          "Compte",
          "Nom d'utilisateur ou mot de passe incorrect !"
        );
      }

      const token = createToken(user._id);
      const userObject = user.toObject();

      res.status(200).json({
        user: {
          ...userObject,
          token: token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
};
