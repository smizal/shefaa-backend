const isAuthorized = (roles) => {
  return (req, res, next) => {
    if (roles.includes(req.loggedUser.user.role)) {
      return next()
    }
    return res
      .status(200)
      .json({ error: 'You are not authorized to get in this page' })
  }
}

module.exports = {
  isAuthorized
}
