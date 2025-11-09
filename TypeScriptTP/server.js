// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT;

// --- Middleware ---
app.use(cors()); // Allows your frontend to talk to this server
app.use(express.json()); // Parses incoming JSON request bodies
app.use(express.static('public')); // Serves your 'public' folder (HTML/JS/CSS)

// --- Database Connection ---
// Replace with your own MongoDB connection string
// const MONGO_URI = 'mongodb://localhost:27017/bookTrackerDB'; 
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// --- Database Schema and Model ---
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  pagesTotal: { type: Number, required: true, min: 1 },
  pagesRead: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Read', 'Re-read', 'DNF', 'Currently reading', 'Returned Unread', 'Want to read'],
    default: 'Want to read'
  },
  price: { type: Number, default: 0 },
  format: {
    type: String,
    enum: ['Print', 'PDF', 'Ebook', 'AudioBook'],
    default: 'Print'
  },
  suggestedBy: { type: String, default: '' },
  finished: { type: Boolean, default: false }
});

// **This is the automatic 'finished' logic on the backend**
// It runs every time a book is saved or updated
bookSchema.pre('save', function(next) {
  if (this.pagesRead >= this.pagesTotal) {
    this.finished = true;
    this.status = 'Read'; // You could also auto-update status
  } else {
    this.finished = false;
  }
  next();
});

const Book = mongoose.model('Book', bookSchema);

// --- API Routes (Endpoints) ---

// GET: Get all books
app.get('/api/books', async (req, res) => {
  const books = await Book.find().sort({ title: 1 });
  res.json(books);
});

// POST: Add a new book
app.post('/api/books', async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete a book by ID
app.delete('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).send('No book found.');
    res.status(200).json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(process.env.MONGODB_URI
  )
});