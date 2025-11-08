// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// MongoDB User Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Local books data
const books = [
  { id: 1, title: 'To Kill a Mockingbird', author: 'Harper Lee', year: 1960 },
  { id: 2, title: '1984', author: 'George Orwell', year: 1949 },
  { id: 3, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813 },
  { id: 4, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925 },
  { id: 5, title: 'The Catcher in the Rye', author: 'J.D. Salinger', year: 1951 }
];

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Registration page
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.render('register', { error: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.render('register', { error: 'Passwords do not match' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('register', { error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render('login', { error: info.message || 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/books');
    });
  })(req, res, next);
});

// Books page (protected)
app.get('/books', isAuthenticated, (req, res) => {
  res.render('books', { user: req.user, books });
});

// Logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});