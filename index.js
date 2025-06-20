const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/noveltopia', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// ==== SCHEMAS ==== //

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  genre: { type: String, default: 'General' }, 
  profilePicture: { type: String, default: '' }, 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Book Schema
const bookSchema = new mongoose.Schema({
  booktitle: { type: String, required: true, unique: true },
  bookauthor: { type: String, required: true },
  bookgenre: { type: String, required: true },
  bookdesc: { type: String },
  content: { type: String },
  bookcover: { type: String }, 

}, { timestamps: true });

const Books = mongoose.model('Books', bookSchema);

// Blog Schema
const blogSchema = new mongoose.Schema({
  blogtitle: { type: String, required: true, unique: true },
  blogauthor: { type: String, required: true },
  blogcontent: { type: String, required: true },
  blogdate: { type: Date, default: Date.now }
}, { timestamps: true });

const Blogs = mongoose.model('Blogs', blogSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  blogsid: { type: mongoose.Schema.Types.ObjectId, ref: 'Blogs', required: false },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Books', required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
 
const likesSchema = new mongoose.Schema({
  blogsid: { type: mongoose.Schema.Types.ObjectId, ref: 'Blogs', required: false },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Books', required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chaptersId: { type: mongoose.Schema.Types.ObjectId, ref: 'chapters', required: true},
  like: { type: String, required: true},
})

const chapterSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Books', required: true },
  chapterTitle: { type: String, required: true },
  chapterContent: { type: String, required: true },
  chapterNumber: { type: Number, required: true },
 }, {timestamps: true}) 

 const Chapters = mongoose.model('chapters', chapterSchema);

// ==== ROUTES ==== //

// Signup Route
app.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email)
    return res.status(400).json({ error: 'Username, password and email are required' });

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword, email });
    await newUser.save();

    res.status(201).json({ message: `Registration successful. Welcome, ${username}!` });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Write a Book Route
app.post('/writebook', async (req, res) => {
  const { booktitle, bookauthor, bookgenre, bookdesc, content, bookcover } = req.body;

  if (!booktitle || !bookauthor || !bookgenre)
    return res.status(400).json({ error: 'Book title, author, and genre are required' });

  try {
    const existingBook = await Books.findOne({ booktitle });
    if (existingBook) {
      return res.status(409).json({ error: 'Book title already exists' });
    }

    const newBook = new Books({ booktitle, bookauthor, bookgenre, bookdesc, content, bookcover });
    await newBook.save();

    res.status(201).json({ message: 'Book created successfully', book: newBook });
  } catch (err) {
    console.error('Book creation error:', err);
    res.status(500).json({ error: 'Server error during book creation' });
  }
});

 //login route...
 app.post('/login', async (req, res) => {
   try {
     const { username, password } = req.body;
     const user = await User.findOne({ username });

     if (!user)
       return res.status(401).json({ success: false, message: "Cannot find username!" });

     const isMatch = await bcrypt.compare(password, user.password);
     if (!isMatch)
       return res.status(401).json({ success: false, message: 'Wrong password!' });

     res.status(200).json({ success: true, message: 'Login successful', user: { username: user.username, email: user.email } });
   } catch (err) {
     console.error('Login error:', err);
     res.status(500).json({ error: 'Server error during login' });
   }
 });

 
// ==== FUTURE ROUTES TO ADD ==== //
// - Write blog route
// - Like/comment routes for blogs and books
// - Get all blogs/books
// - Profile update

// ==== START SERVER ==== //
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
