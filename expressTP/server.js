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
const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  categorie: { type: String, required: true },
  published: { type: Date, required: true }
});

const Book = mongoose.model('Book', bookSchema);
const User = mongoose.model('User', userSchema);


// Seed the database on initial connection if collection is empty
async function seedDatabaseIfEmpty() {
  try {
    const count = await Book.countDocuments();
    if (count === 0) {
      await Book.insertMany(seedBooks);
      console.log('Seeded books collection with 20 books.');
    } else {
      console.log('Books collection already contains data; skipping seeding.');
    }
  } catch (err) {
    console.error('Error seeding books collection:', err);
  }
}

// Run seeding once MongoDB connection opens
mongoose.connection.once('open', seedDatabaseIfEmpty);

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
  secret: process.env.SESSION_SECRET,
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
app.get('/books', isAuthenticated, async (req, res) => {
  try {
    // Pagination params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 10; // books per page
    const skip = (page - 1) * limit;

    const total = await Book.countDocuments();
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const books = await Book.find()
      .sort({ published: -1 })
      .skip(skip)
      .limit(limit);

    res.render('books', { user: req.user, books, currentPage: page, totalPages });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.render('books', { user: req.user, books: [], error: 'Failed to load books', currentPage: 1, totalPages: 1 });
  }
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

const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // console.log(process.env.MONGODB_URI);
});