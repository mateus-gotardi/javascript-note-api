var express = require('express');
var router = express.Router();
const User = require('../models/user')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const secret = process.env.JWT_TOKEN
const withAuth = require('../middlewares/auth');


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
  const { name, email, currentPassword, id } = req.body;
  let user = await User.findById(id)
  user.isCorrectPassword(currentPassword, async function (err, same) {
    if (!same) {
      console.log('senha invalida ')
      res.status(401).json({ error: 'invalid password' });
    } else {
      console.log('senha valida ')
      try {
        let usr = await User.findOneAndUpdate(
          { _id: id },
          { $set: { name: name, email: email, updated_at: Date.now() } },
          { upsert: true, 'new': true }
        )
        res.json({ user: usr }).status(200);
      } catch (error) {
        res.status(501).json({ error: error });
        console.log(error)
      }
    }
  })

}
)

router.put('/password', withAuth, async (req, res) => {
  const { newPassword, currentPassword, id } = req.body;
  let user = await User.findById(id)
  user.isCorrectPassword(currentPassword, async function (err, same) {
    if (!same) {
      console.log('senha invalida ')
      res.status(401).json({ error: 'invalid password' });
    } else {
      console.log('senha valida ')
      try {
        user.password = newPassword
        await user.save()
        res.json({ user: user });
      } catch (error) {
        res.status(401).json({ error: 'invalid password' });
      }
    }
  }
  )
});

router.delete('/', async function (req, res) {
  const { currentPassword, id } = req.body;
  try {
    let user = await User.findOne({ _id: id });
    console.log(id, user, currentPassword)
    user.isCorrectPassword(currentPassword, async function (err, same) {
      if (!same) {
        console.log('senha invalida ')
        res.status(401).json({ error: 'invalid password' });
      } else {
        console.log('senha valida ')
        try {
          await user.delete();
          res.json({ message: 'OK' }).status(201);
        } catch (error) {
          res.status(500).json({ error: error });
          console.log(error)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error });
    console.log(error)
  }
});

router.post('/delete', withAuth, async function (req, res) {
  console.log(req.body)
  try {
    let user = await User.findOne({ _id: req.user._id });
    user.isCorrectPassword(req.body.password, async function (err, same) {
      if (!same) {
        console.log('senha invalida ')
        res.status(401).json({ error: 'invalid password' });
      } else {
        console.log('senha valida ')
        await user.delete();
        res.json({ message: 'OK' }).status(201);
      }
    })
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

module.exports = router;
