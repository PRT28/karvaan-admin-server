const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user');

const checkKarvaanToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token && token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        User.findOne({
          _id: decoded.id
        }, (err, user) => {
          if (err || !user) {
            return res.json({
              success: false,
              message: 'User not found'
            });
          }
          if (!decoded.is_karvaan) {
            return res.json({
              success: false,
              message: 'User is not Karvaan Employee'
            });
          }
          req.user = decoded;
          next();
        });
      }
    });
  } else {
    return res.json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
};

module.exports = {
  checkToken: checkToken
};
