// const AccessControl = require("accesscontrol");
// const { userRole } = require("../models/user/userRole");
// const ac = new AccessControl();

// exports.defineUserRoles = (function () {
//   ac.grant(userRole.STUDENT).readOwn("profile").updateOwn("profile");

//   ac.grant(userRole.EDITOR).extend(userRole.STUDENT).readAny("profile");

//   ac.grant(userRole.ADMIN)
//     .extend([userRole.STUDENT, userRole.EDITOR])
//     .createAny("profile")
//     .updateAny("profile")
//     .deleteAny("profile");

//   return ac;
// })();
