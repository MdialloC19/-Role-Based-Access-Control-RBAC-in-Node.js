const AccessControl = require("accesscontrol");
const enumUsersRoles = require("./enumUsersRoles");
const ac = new AccessControl();

exports.defineUserRoles = (function () {
  ac.grant(enumUsersRoles.STUDENT)
    .readOwn("compte")
    .updateOwn("compte")
    .readOwn("user")
    .updateOwn("user");

  ac.grant(enumUsersRoles.EDITOR)
    .extend(enumUsersRoles.STUDENT)
    .readAny("compte")
    .readAny("user")
    .updateAny("user");

  ac.grant(enumUsersRoles.ADMIN)
    .extend([enumUsersRoles.STUDENT, enumUsersRoles.EDITOR])
    .deleteAny("user")
    .deleteAny("compte");

  return ac;
})();
