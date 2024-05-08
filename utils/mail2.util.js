import { Resend } from "resend";
import { isEmail } from "class-validator";
import { BadRequestException, ForbiddenException } from "@nestjs/common";

const TEST_FROM = "noreply@engineerlab.dev";

/**
 * Sends an email using the Resend API.
 * @param {Object} options - The email options.
 * @param {string} [options.from='noreply@engineerlab.dev'] - The email sender.
 * @param {string} options.to - The email recipient.
 * @param {string[]} [options.cc=[]] - The email CC recipients.
 * @param {string} options.subject - The email subject.
 * @param {string} options.html - The email content in HTML format.
 * @param {boolean} [options.verbose=false] - Whether to log verbose output.
 * @throws {BadRequestException} If the 'from' or 'to' email is invalid.
 * @throws {ForbiddenException} If there is an error sending the email.
 */
export async function sendEmail({
  from = TEST_FROM,
  to,
  cc = [],
  subject,
  html,
  verbose = false,
}) {
  if (!isEmail(from) || !isEmail(to)) {
    throw new BadRequestException("An email is invalid");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const as = process.env.APP_NAME;

  const res = await resend.emails.send({
    from: as ? `${as} <${from}>` : from,
    to: [to, ...cc],
    subject,
    html,
  });

  if (res.error) {
    console.error(res.error);
    throw new ForbiddenException({ ...res.error, message: undefined });
  }

  if (verbose) console.log(res.data);
}
