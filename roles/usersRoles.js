const AccessControl = require("accesscontrol");
const enumUsersRoles = require("./enumUsersRoles");
const ac = new AccessControl();

exports.defineUserRoles = (function () {
  ac.grant(enumUsersRoles.STUDENT).readOwn("profile").updateOwn("profile");

  ac.grant(enumUsersRoles.EDITOR)
    .extend(enumUsersRoles.STUDENT)
    .readAny("profile");

  ac.grant(enumUsersRoles.ADMIN)
    .extend([enumUsersRoles.STUDENT, enumUsersRoles.EDITOR])
    .createAny("profile")
    .updateAny("profile")
    .deleteAny("profile");

  return ac;
})();
