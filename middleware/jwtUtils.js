const jwt = require('jsonwebtoken')

const signToken = (user) => {
  const token = jwt.sign(
    {
      user: user
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  return token
}

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.loggedUser = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' })
  }
}

const isSignedIn = (req) => {
  try {
    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return true
  } catch (error) {
    return false
  }
}

module.exports = { signToken, verifyToken, isSignedIn }
