var express = require('express');
var router = express.Router();
const User = require('../models/user')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const secret = process.env.JWT_TOKEN
const withAuth = require('../middlewares/auth');
const user = require('../models/user');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  const user = new User({ name, email, password })
  try {
    await user.save()
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: 'Error registering new user' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    let user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ error: 'incorrect email or password' })
    } else {
      user.isCorrectPassword(password, function (err, same) {
        if (!same) {
          res.status(401).json({ error: 'incorrect email or password' })
        } else {
          const token = jwt.sign({ email }, secret, { expiresIn: '10d' })
          res.status(200).json({ user: user, token: token })
        }
      })
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal error, please try again' })
  }
})

router.put('/edit', withAuth, async (req, res) => {
  const { name, email } = req.body
  try {

    let user = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { name: name, email: email, updated_at: Date.now() } },
      { upsert: true, 'new': true }
    )
    res.json(user)
  } catch (error) {
    res.json({ error: 'Problem to update' })
    console.log(error)
  }
})

router.put('/password', withAuth, async (req, res) => {
  const { password } = req.body
  try {

    let user = await User.findOneAndUpdate({ _id: req.user.id },
      { $set: { password: password, updated_at: Date.now() } },
      { upsert: true, 'new': true }
    )
    res.json(user)
  } catch (error) {
    res.json({ error: 'Problem to update' })
    console.log(error)
  }
})

router.delete('/delete', withAuth, async function (req, res) {
  try {
    let user = await User.findOne({ _id: req.user._id });
    await user.delete();
    res.json({ message: 'OK' }).status(201);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

const confirmPassword = () => {

}

module.exports = router;
