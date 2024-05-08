const isNumber = (value) => {
  const numbers = /^[0-9]+$/;
  return value.match(numbers);
};

const isEmail = (value) => {
  const email = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return value.match(email);
};

const isRole = (value) => {
  const role = ["STUDENT", "TEACHER", "ADMIN", "SUPERADMIN"];
  return role.includes(value);
};

const isPhone = (value) => {
  const phone = /^[0-9]{12}$/;
  return value.match(phone);
};

const hasInjection = (str) => {
  const sqlInjectionRegex =
    /(\b(union|select|insert|update|delete|drop|alter)\b)|(--)|(\/\*)|(\*\/)|(#)/i; // Injection SQL
  const xssInjectionRegex =
    /<\s*script.*?>.*?<\s*\/\s*script\s*>|<\s*img.*?onerror\s*=\s*".*?".*?>/i; // Injection XSS

  if (sqlInjectionRegex.test(str)) {
    return true;
  }

  if (xssInjectionRegex.test(str)) {
    return true;
  }

  return false;
};

module.exports = {
  isNumber,
  isPhone,
  hasInjection,
  isEmail,
  isRole,
};
