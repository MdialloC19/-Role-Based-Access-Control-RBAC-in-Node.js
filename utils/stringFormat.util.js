/**
 * Formats a phone number by removing whitespace and adding Senegal's country code if necessary.
 *
 * @param {string} phone - The phone number to be formatted.
 * @returns {string} The formatted phone number.
 */
export function formatPhoneNumber(phone) {
  // Remove any whitespace from the phone number
  phone = phone.replace(/\s/g, "");

  // Check if the phone number starts with '+', '00', or '0'
  if (!phone.startsWith("+") && !phone.startsWith("00")) {
    // If it doesn't, assume it's a local number and prepend Senegal's country code
    phone = "+221" + phone;
  }

  return phone;
}

/**
 * Returns the current date and time in French format: DD/MM/YYYY HH:mm:ss.
 *
 * @returns {string} The current date and time in French format.
 */
export function getFrenchDateTime() {
  const currentDateTime = new Date();
  const frenchDateTime = currentDateTime.toLocaleString("fr-FR", {
    timeZone: "UTC",
  });
  return frenchDateTime;
}

/**
 * Converts a string to a valid folder name.
 * Replaces spaces with underscores, removes special characters,
 * keeps alphanumeric characters and underscores, and converts to lowercase.
 *
 * @param {string} input - The input string to be converted.
 * @returns {string} The converted string as a valid folder name.
 */
export function toValidFolderName(input) {
  // Replace spaces with underscores
  const formatted = input.replace(/\s+/g, "_");

  // Remove special characters and keep alphanumeric characters and underscores
  const validName = formatted.replace(/[^\w]/g, "");

  // Convert to lowercase
  const lowercased = validName.toLowerCase();

  return lowercased;
}
