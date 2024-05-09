// const Compte = require("../models/compte");
// const User = require("../models/user");
// const Resa = require("../models/reservation");
// const Chambre = require("../models/chambre");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const {
//   otpData,
//   tokenData,
//   generateOTP,
//   generateEmailOptions,
//   sendVerificationEmail,
// } = require("../mail/email");
// const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/config");
// const {
//   createNotFoundError,
//   createValidationError,
// } = require("../middlewares/errorHandlers");
// const { userRole } = require("../roles/enumUsersRoles");

// /**
//  * Vérifie si le code OTP soumis est valide et non expiré.
//  * @param {Object} storedData Données stockées de l'OTP.
//  * @param {string} codeOtpSoumis Code OTP soumis par l'utilisateur.
//  * @returns {boolean} true si le code est valide et non expiré, sinon false.
//  */
// const isValidCode = (storedData, codeOtpSoumis) => {
//   return (
//     storedData &&
//     storedData.code === codeOtpSoumis &&
//     Date.now() < storedData.expiration
//   );
// };

// /**
//  * Met à jour le statut de confirmation de l'utilisateur.
//  * @param {string} num_carte Numéro de carte de l'utilisateur.
//  */
// const updateUserConfirmationStatus = async (num_carte) => {
//   const user = await findUserByNumCarte(num_carte);
//   if (!user) {
//     throw createNotFoundError("User", "L'utilisateur n'est pas trouvé !");
//   }
//   await user.updateOne({ $set: { confirmed: true } });
// };

// /**
//  * Recherche un utilisateur par numéro de carte.
//  * @param {string} num_carte Numéro de carte de l'utilisateur.
//  * @returns {Promise<User>} Promise résolue avec l'utilisateur trouvé ou null.
//  */
// const findUserByNumCarte = async (num_carte) => {
//   return await User.findOne({ num_carte }).exec();
// };

// /**
//  * Crée un token JWT avec l'ID de l'utilisateur.
//  * @param {string} id ID de l'utilisateur.
//  * @returns {string} Token JWT généré.
//  */
// const createToken = (id) => {
//   return jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
// };

// /**
//  * Hashe le mot de passe avec bcrypt.
//  * @param {string} password Mot de passe à hasher.
//  * @returns {Promise<string>} Promise résolue avec le mot de passe hashé.
//  */

// const hashPassword = async (password) => {
//   return bcrypt.hash(password, 10);
// };

// /**
//  * Recherche un compte par son ID.
//  * @param {string} compteId ID du compte.
//  * @returns {Promise<Compte>} Promise résolue avec le compte trouvé ou null.
//  */
// const findCompteById = async (compteId) => {
//   return await Compte.findById(compteId);
// };

// /**
//  * Compare le mot de passe soumis avec le mot de passe hashé.
//  * @param {string} password Mot de passe soumis.
//  * @param {string} hashedPassword Mot de passe hashé.
//  * @returns {Promise<boolean>} Promise résolue avec true si les mots de passe correspondent, sinon false.
//  */
// const comparePassword = async (password, hashedPassword) => {
//   return await bcrypt.compare(password, hashedPassword);
// };

// /**
//  * Recherche une réservation par l'ID du compte.
//  * @param {string} compteId ID du compte.
//  * @returns {Promise<Resa>} Promise résolue avec la réservation trouvée ou null.
//  */
// const findResaByCompteId = async (compteId) => {
//   return await Resa.findOne({ compte: compteId });
// };

// /**
//  * Recherche une chambre par son ID.
//  * @param {string} chambreId ID de la chambre.
//  * @returns {Promise<Chambre>} Promise résolue avec la chambre trouvée ou null.
//  */
// const findChambreById = async (chambreId) => {
//   return await Chambre.findById(chambreId);
// };

// module.exports = class CompteController {
//   /**
//    * Vérifie l'identité de l'utilisateur en envoyant un code OTP ou en demandant le code secret personnel.
//    * @param {Object} req Objet de requête Express.
//    * @param {Object} res Objet de réponse Express.
//    * @param {Function} next Fonction de middleware suivant.
//    */
//   async verifyIdentity(req, res, next) {
//     try {
//       const { num_carte } = req.params;
//       const user = await findUserByNumCarte(num_carte);

//       if (!user) {
//         throw createNotFoundError("User", "L'utilisateur n'est pas trouvé !");
//       }

//       if (user.role === userRole.STUDENT) {
//         if (user.secret) {
//           return res.json({
//             code: 200,
//             msg: "Renseignez votre code secret personnel",
//             etudiant: {
//               email: user.email,
//               num_carte: user.num_carte,
//               role: user.role,
//             },
//           });
//         }
//         throw createNotFoundError("User", "No secret found for this user!");
//       }

//       const otp = generateOTP();
//       const emailOptions = generateEmailOptions(user, otp);
//       await sendVerificationEmail(emailOptions);

//       otpData.set(user.email, { code: otp, expiration: Date.now() + 600000 });

//       return res.json({
//         code: 200,
//         msg: "E-mail de vérification envoyé avec succès",
//         etudiant: {
//           email: user.email,
//           num_carte: user.num_carte,
//           role: user.role,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Vérifie le code OTP ou le code secret personnel pour la confirmation de l'utilisateur.
//    * @param {Object} req Objet de requête Express.
//    * @param {Object} res Objet de réponse Express.
//    * @param {Function} next Fonction de middleware suivant.
//    */
//   async verifyOtp(req, res, next) {
//     try {
//       const { email, otp, num_carte } = req.body;
//       const user = await findUserByNumCarte(num_carte);
//       if (user && user.role === userRole.STUDENT) {
//         const valid = await comparePassword(otp, user.secret);

//         if (!valid) {
//           throw createNotFoundError(
//             "Compte",
//             "Le code secret personnel est incorrect !"
//           );
//         }

//         await updateUserConfirmationStatus(num_carte);

//         return res.json({
//           code: 200,
//           msg: "Code Secret valide, vérification réussie.",
//           num_carte,
//         });
//       }

//       const storedData = otpData.get(email);
//       if (isValidCode(storedData, otp)) {
//         otpData.delete(email);
//         await updateUserConfirmationStatus(num_carte);

//         return res.json({
//           code: 200,
//           msg: "Code OTP valide, vérification réussie.",
//           num_carte,
//         });
//       } else {
//         let error = new Error(
//           "Code OTP invalide ou expiré, vérification échouée."
//         );
//         error.statusCode = 498;
//         throw error;
//       }
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Définit le mot de passe pour le compte de l'utilisateur.
//    * @param {Object} req Objet de requête Express.
//    * @param {Object} res Objet de réponse Express.
//    * @param {Function} next Fonction de middleware suivant.
//    */
//   async setPassword(req, res, next) {
//     try {
//       req.body.password = await hashPassword(req.body.password);
//       const { num_carte } = req.params;
//       const user = await User.findOne({ num_carte });

//       if (!user) {
//         throw createValidationError("User", "L'utilisateur n'est pas trouvé !");
//       }

//       if (!user.confirmed) {
//         throw createValidationError(
//           "Compte",
//           "Votre compte n'est pas encore vérifié, veuillez recommencer !"
//         );
//       }

//       if (!user.compte) {
//         const newCompte = new Compte({ ...req.body });
//         await newCompte.save();
//         const updatedUser = await User.findOneAndUpdate(
//           { num_carte: num_carte },
//           { $set: { compte: newCompte._id } },
//           { new: true }
//         );

//         const token = createToken(user._id);
//         const userObject = updatedUser.toObject();

//         return res.status(200).json({
//           chambre: null,
//           codifier: false,
//           new: true,
//           user: {
//             ...userObject,
//             token: token,
//           },
//         });
//       }

//       try {
//         const compte = await Compte.findById(user.compte);

//         if (!compte) {
//           throw createNotFoundError("Compte", "Compte non trouvé");
//         }

//         await compte.updateOne({ $set: { password: req.body.password } });
//         let room = null;

//         if (compte.reserver) {
//           const resa = await findResaByCompteId(compte._id);
//           room = await findChambreById(resa.chambre);
//         }

//         const token = createToken(user._id);
//         const userObject = user.toObject();

//         return res.status(200).json({
//           chambre: room,
//           codifier: compte.codifier,
//           user: {
//             ...userObject,
//             token: token,
//           },
//         });
//       } catch (error) {
//         next(error);
//       }
//     } catch (error) {
//       next(error);
//     }
//   }

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
// };
