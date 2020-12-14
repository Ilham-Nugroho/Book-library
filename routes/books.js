const express = require('express');
const router = express.Router();
// const multer = require('multer'); MULTER UNINSTALLED
// const path = require('path');
// const fs = require('fs');
// SUDAH TIDAK DIPAKAI, PAKAI FilePond INSTEAD

const Book = require('../models/book');
const Author = require('../models/author');



// const uploadPath = path.join('public', Book.coverImageBasePath);
// NO LONGER NEEDED, MULTER SUDAH TIDAK DIPAKAI, PATH SUDAH TIDAK DIPAKAI

// MULTER UNINSTALLED, USE FilePond
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
// const upload = multer({
//   dest: uploadPath,
//   fileFilter: (req, file, callback) => {
//     callback(null, imageMimeTypes.includes(file.mimetype))
//   }
// })

// All Books Route
router.get('/', async (req, res) => {
  let query = Book.find()
  if (req.query.title != null && req.query.title != '') {
    query =  query.regex('title', new RegExp(req.query.title, 'i'))
  }

  if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
    query =  query.lte('publishDate', req.query.publishedBefore, 'i')
  }

  if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
    query =  query.gte('publishDate', req.query.publishedAfter, 'i')
  }
  try {
    const books = await query.exec()
    res.render('books/index', {
      books: books,
      searchOptions: req.query
  })
  } catch {
    res.redirect('/')
  }
})



// New Books Route
router.get('/new', async (req, res) => {
  renderNewPage(res, new Book())

})


//Create Book Route
router.post('/',
  // upload.single('cover'), MULTER UNINSTALLED
 async (req, res) => {
  // const fileName = req.file != null ? req.file.filename : null
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      publishDate: new Date(req.body.publishDate),
      pageCount: req.body.pageCount,
      // coverImageName: fileName,
      description: req.body.description
  })
    saveCover(book, req.body.cover)

    try {
      const newBook = await book.save()
      res.redirect('books/${newBook.id}')

    } catch {
      // if (book.coverImageName != null) {
      //   removeBookCover(book.coverImageName)
      // }
      renderNewPage(res, book, true)
    }
  }
);

// async function removeBookCover(fileName) {
//   fs.unlink(path.join(uploadPath, fileName), err => {
//     if (err) console.log(err);
//   })
// }


//SHOW BOOK ROUTE
router.get('/:id', async (req,res) => {
  try {
    const book = await Book.findById(req.params.id)
                           .populate('author')
                           .exec()
    res.render('books/show', {book: book})
  } catch {
    res.redirect('/')
  }
})


//EDIT BOOK ROUTE
router.get('/:id/edit', async (req,res) => {
  try {
    const book = await Book.findById (req.params.id)
    renderEditPage(res, book)
  } catch {
    res.redirect('/')
  }
})

//Update Book Route
router.put('/:id/',
 async (req, res) => {
   let book
   try {
     book = await Book.findById(req.params.id)
     book.title = req.body.title
     book.author = req.body.author
     book.publishDate = new Date(req.body.publishDate)
     book.pageCount = req.body.pageCount
     book.description = req.body.description
     if (req.body.cover != null && req.body.cover !== '') {
       saveCover(book, req.body.cover)
     }
     await book.save()
     res.redirect(`/books/${book.id}`)

  } catch {

    if (book != null) {
      renderEditPage(res, book, true)
    } else {
      redirect('/')
    }

  }
});

//Route Delete Book
router.delete('/:id', async (req, res) => {
  let book
  try {
    book = await Book.findById(req.params.id)
    await book.remove()
    res.redirect('/books')
  } catch {
    if (book != null) {
      res.render('books/show', {
        book: book,
        errorMessage: 'Could not remove book'
      })
    }else {
      res.redirect('/')
    }

  }
})


async function renderNewPage(res, book, hasError = false) {
  renderFormPage(res, book, 'new', hasError)
}


function saveCover(book, coverEncoded) {
  if(coverEncoded == null) return
  const cover = JSON.parse(coverEncoded)

  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, 'base64')
    book.coverImageType = cover.type
  }
}

async function renderEditPage(res, book, hasError = false) {
  renderFormPage(res, book, 'edit', hasError)
}

async function renderFormPage(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({})
    const params = {
      authors: authors,
      book: book
    }
    if(hasError) {
      if (form === 'edit') {
        params.errorMessage = "Error Updating Book"
      } else {
        params.errorMessage = "Error Creating Book"
      }
    }
    res.render(`books/${form}`, params)
  } catch {
    res.redirect('/books')
  }
}


module.exports = router
