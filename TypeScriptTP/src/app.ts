// src/app.ts
// require('dotenv').config();
import { Book } from './Book.js'; // Note: .js extension is needed for browser modules

// DOM Elements
const bookForm = document.getElementById('add-book-form') as HTMLFormElement;
const bookList = document.getElementById('book-list')!;
const totalBooksReadEl = document.getElementById('total-books-read')!;
const totalPagesReadEl = document.getElementById('total-pages-read')!;

// API Base URL (where our server will be running)
const API_URL = 'http://localhost:3000/api/books';

/**
 * Fetches all books from the server and renders them
 */
async function fetchAndRenderBooks() {
    console.log(API_URL);
  try {
    const response = await fetch(API_URL);
    const books: Book[] = await response.json();

    bookList.innerHTML = ''; // Clear existing list
    let totalBooksRead = 0;
    let totalPagesRead = 0;

    books.forEach(book => {
      // Create the book card and add it to the page
      const card = createBookCard(book);
      bookList.appendChild(card);

      // Update global stats
      if (book.finished) {
        totalBooksRead++;
      }
      totalPagesRead += book.pagesRead;
    });

    // Update stats in the DOM
    totalBooksReadEl.textContent = totalBooksRead.toString();
    totalPagesReadEl.textContent = totalPagesRead.toString();

  } catch (error) {
    console.error('Error fetching books:', error);
  }
}

/**
 * Creates an HTML element for a single book
 */
function createBookCard(book: Book): HTMLElement {
  const percentage = (book.pagesRead / book.pagesTotal) * 100 || 0;
  
  const card = document.createElement('div');
  card.className = 'bg-white p-4 rounded-lg shadow-md';
  card.innerHTML = `
    <h3 class="text-xl font-bold">${book.title}</h3>
    <p class="text-gray-600">${book.author}</p>
    <p class="text-sm text-gray-500">${book.status} | ${book.format}</p>
    
    <div class="w-full bg-gray-200 rounded-full h-2.5 my-3">
      <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${percentage}%"></div>
    </div>
    <p class="text-sm">${book.pagesRead} / ${book.pagesTotal} pages (${Math.round(percentage)}%)</p>

    <button data-id="${book._id}" class="delete-btn text-red-500 text-sm mt-3 hover:underline">
      Delete
    </button>
  `;
  return card;
}

/**
 * Handles the form submission to add a new book
 */
async function handleAddBook(event: Event) {
  event.preventDefault();

  const formData = new FormData(bookForm);
  
  // Basic validation
  const pagesTotal = parseInt(formData.get('pagesTotal') as string);
  const pagesRead = parseInt(formData.get('pagesRead') as string);

  if (pagesRead > pagesTotal) {
    alert('Pages read cannot be greater than total pages.');
    return;
  }

  // Create a plain object to send as JSON
  const newBook = {
    title: formData.get('title'),
    author: formData.get('author'),
    pagesTotal: pagesTotal,
    pagesRead: pagesRead,
    status: formData.get('status'),
    format: formData.get('format'),
    price: parseFloat(formData.get('price') as string),
    suggestedBy: formData.get('suggestedBy'),
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newBook),
    });

    bookForm.reset(); // Clear the form
    fetchAndRenderBooks(); // Refresh the list

  } catch (error) {
    console.error('Error adding book:', error);
  }
}

/**
 * Handles deleting a book
 */
async function handleDeleteBook(event: Event) {
  const target = event.target as HTMLElement;
  if (target.classList.contains('delete-btn')) {
    const bookId = target.getAttribute('data-id');
    if (!bookId) return;

    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await fetch(`${API_URL}/${bookId}`, {
          method: 'DELETE',
        });
        fetchAndRenderBooks(); // Refresh the list
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  bookForm.addEventListener('submit', handleAddBook);
  bookList.addEventListener('click', handleDeleteBook);
  fetchAndRenderBooks(); // Load initial books on page load
});