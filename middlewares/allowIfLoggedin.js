const allowIfLoggedin = (req, res, next) => {
  try {
    const user = res.locals.loggedInUser;
    if (!user)
      return res.status(401).json({
        error: "You need to be logged in to access this route !",
      });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = allowIfLoggedin;
