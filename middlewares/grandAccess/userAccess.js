const userAccess = function (accessControlList, action, resource) {
  return async (req, res, next) => {
    try {
      const userId = req.params.id;
      const isResourceOwner = req.user._id.toString() === userId;
      //   const isResourceOwner = res.locals.loggedInUser._id.toString() === userId;

      let modifiedAction = action;
      if (isResourceOwner) {
        modifiedAction = action.replace("Any", "Own");
      }

      const permission = accessControlList
        .can(req.user.role)
        [modifiedAction](resource);

      if (!permission.granted) {
        return res.status(401).json({
          error: "You don't have enough permission to perform this action",
        });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
};

module.exports = userAccess;
