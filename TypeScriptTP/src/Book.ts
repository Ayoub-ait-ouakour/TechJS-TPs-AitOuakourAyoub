// src/Book.ts

// We can define the enums for use in TypeScript
export enum BookStatus {
  Read = "Read",
  ReRead = "Re-read",
  DNF = "DNF",
  CurrentlyReading = "Currently reading",
  ReturnedUnread = "Returned Unread",
  WantToRead = "Want to read"
}

export enum BookFormat {
  Print = "Print",
  PDF = "PDF",
  Ebook = "Ebook",
  AudioBook = "AudioBook"
}

export class Book {
  // MongoDB will add this ID
  _id?: string; 
  title: string;
  author: string;
  pagesTotal: number;
  status: BookStatus;
  price: number;
  pagesRead: number;
  format: BookFormat;
  suggestedBy: string;
  finished: boolean;

  constructor(
    title: string, author: string, pagesTotal: number, status: BookStatus,
    price: number, pagesRead: number, format: BookFormat, suggestedBy: string
  ) {
    this.title = title;
    this.author = author;
    this.pagesTotal = pagesTotal;
    this.status = status;
    this.price = price;
    this.pagesRead = pagesRead;
    this.format = format;
    this.suggestedBy = suggestedBy;
    
    // Auto-set 'finished' based on the rule
    this.finished = this.pagesRead === this.pagesTotal;
  }

  /**
   * Calculates the current reading percentage.
   */
  currentlyAt(): number {
    if (this.pagesTotal === 0) {
      return 0;
    }
    const percentage = (this.pagesRead / this.pagesTotal) * 100;
    return Math.round(percentage);
  }

  // Note: deleteBook() is not here.
  // A class should not be responsible for its own deletion from a database.
  // That logic belongs in your main application/service file (app.ts).
}