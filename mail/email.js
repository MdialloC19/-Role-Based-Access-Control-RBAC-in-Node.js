/**
 * Module de gestion des e-mails.
 * @module email
 */

const nodemailer = require("nodemailer");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();
// Configuration des variables d'environnement
const { EMAIL, EMAIL_PASS, REMOTE_CLIENT } = process.env;

/**
 * Transporteur de messagerie utilisé pour envoyer des e-mails.
 * @type {Object}
 * @property {string} service - Service de messagerie utilisé (gmail).
 * @property {Object} auth - Informations d'authentification pour le service de messagerie.
 * @property {string} auth.user - Adresse e-mail de l'expéditeur.
 * @property {string} auth.pass - Mot de passe de l'expéditeur.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL,
    pass: EMAIL_PASS,
  },
});

// Stockage des données OTP et des jetons dans des Maps
const otpData = new Map();
const tokenData = new Map();

/**
 * Génère un OTP (One-Time Password) aléatoire.
 * @returns {string} - OTP généré.
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Génère les options d'e-mail pour l'autorisation d'inscription.
 * @param {Object} user - Informations sur l'utilisateur.
 * @param {string} secret - Code secret personnel.
 * @returns {Object} - Options d'e-mail pour l'autorisation d'inscription.
 */
const generateSecretEmail = (user, secret) => {
  return {
    from: EMAIL,
    to: user.email,
    subject: "[LAMBTECH] Autorisation d'inscription à la plateforme ",
    html: `
                        <html lang="fr-Fr">
                            <body>
                                <div><h3>Autorisation d'inscription à la plateforme</h3></div>
                                <p>Bienvenue ${user.prenom} ${user.nom},</p>
                                <p>Vous êtes autorisé à créer votre compte sur la plateforme.</p>
                                <p><strong>Note :</strong> Ce code secret est personnel et doit être gardé en sécurité. Il sera utilisé uniquement lors de la création de compte ou du changement de mot de passe.</p>
                                <div><h4 style="text-align: center">Code secret personnel</h4></div>
                                <div><h1 style="text-align: center">${secret}</h1></div>
                                <p style="text-align: center">(Ce code peut être régénéré par l'administrateur en cas de besoin.)</p>
                                <p>Rendez-vous sur la plateforme pour commencer votre expérience de codification.</p>
                                <a href="${REMOTE_CLIENT}/signup/verifyIdentity" >LambTech.sn</a>
                            </body>
                        </html>`,
  };
};

/**
 * Génère les options d'e-mail pour la réinitialisation du code secret.
 * @param {Object} user - Informations sur l'utilisateur.
 * @param {string} secret - Code secret personnel.
 * @returns {Object} - Options d'e-mail pour la réinitialisation du code secret.
 */
const generateSecretResetEmail = (user, secret) => {
  return {
    from: EMAIL,
    to: user.email,
    subject:
      "[LAMBTECH] Réinitialisation du code secret personnel sur la plateformeE",
    html: `
                        <html lang="fr-Fr">
                            <body>
                                <div><h3>Réinitialisation du code secret personnel sur la plateforme</h3></div>
                                <p>Bonjour ${user.prenom} ${user.nom},</p>
                                <p>Votre code secret personnel sur la plateforme a été réinitialisé.</p>
                                <p><strong>Note :</strong> Ce code secret est personnel et doit être gardé en sécurité. Il sera utilisé uniquement lors de la réinitialisation de votre mot de passe.</p>
                                <div><h4 style="text-align: center">Code secret personel</h4></div>
                                <div><h1 style="text-align: center">${secret}</h1></div>
                                <p style="text-align: center">(Ce code peut être régénéré par l'administrateur en cas de besoin.)</p>
                                <p>Rendez-vous sur la plateforme pour réinitialiser votre mot de passe.</p>
                                <a href="${REMOTE_CLIENT}/signup/verifyIdentity" >Lamtech.sn</a>
                            </body>
                        </html>`,
  };
};

/**
 * Génère les options d'e-mail pour la vérification de l'adresse e-mail.
 * @param {Object} user - Informations sur l'utilisateur.
 * @param {string} otp - OTP (One-Time Password) généré.
 * @returns {Object} - Options d'e-mail pour la vérification de l'adresse e-mail.
 */
const generateEmailOptions = (user, otp) => {
  return {
    from: EMAIL,
    to: user.email,
    subject: "[LAMBTECH] Vérifiez votre email",
    html: `
                        <html lang="fr-Fr">
                            <body>
                                <div><h3>Vérifiez votre adresse email </h3></div>
                                <p>Bonjour ${user.prenom} ${user.nom},</p>
                                 <p>Merci d'avoir démarré le processus de vérification de compte .
                                Nous voulons nous assurer qu'il s'agit vraiment de vous.
                                Veuillez saisir le code de vérification suivant lorsque vous y êtes invité.
                                Si vous ne souhaitez pas créer de compte ou changer de mot de passe, vous pouvez ignorer ce message.
                                </p>
                                <div><h4 style="text-align: center">Code de vérification</h4></div>
                                <div><h1 style="text-align: center">${otp}</h1></div>
                                <p style="text-align: center">(Ce code expire dans 10 minutes.)</p>
                            </body>
                        </html>`,
  };
};

/**
 * Envoie l'e-mail de vérification.
 * @param {Object} emailOptions - Options d'e-mail.
 * @returns {Promise} - Résultat de l'envoi de l'e-mail de vérification.
 */
const sendVerificationEmail = async (emailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(emailOptions, (error, info) => {
      if (error) {
        reject(new Error("Erreur lors de l'envoi de l'e-mail de vérification"));
      } else {
        console.log("E-mail de vérification envoyé : " + info.response);
        resolve();
      }
    });
  });
};

module.exports = {
  transporter,
  otpData,
  tokenData,
  generateOTP,
  generateSecretEmail,
  generateSecretResetEmail,
  generateEmailOptions,
  sendVerificationEmail,
};
