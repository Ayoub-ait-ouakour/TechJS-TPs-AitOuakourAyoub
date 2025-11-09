// src/Book.ts
// We can define the enums for use in TypeScript
export var BookStatus;
(function (BookStatus) {
    BookStatus["Read"] = "Read";
    BookStatus["ReRead"] = "Re-read";
    BookStatus["DNF"] = "DNF";
    BookStatus["CurrentlyReading"] = "Currently reading";
    BookStatus["ReturnedUnread"] = "Returned Unread";
    BookStatus["WantToRead"] = "Want to read";
})(BookStatus || (BookStatus = {}));
export var BookFormat;
(function (BookFormat) {
    BookFormat["Print"] = "Print";
    BookFormat["PDF"] = "PDF";
    BookFormat["Ebook"] = "Ebook";
    BookFormat["AudioBook"] = "AudioBook";
})(BookFormat || (BookFormat = {}));
export class Book {
    constructor(title, author, pagesTotal, status, price, pagesRead, format, suggestedBy) {
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
    currentlyAt() {
        if (this.pagesTotal === 0) {
            return 0;
        }
        const percentage = (this.pagesRead / this.pagesTotal) * 100;
        return Math.round(percentage);
    }
}
