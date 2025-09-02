const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const path = require("path");
const multer = require("multer");
// --- Basic Setup ---
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(bodyParser.json());
// ... after app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const io = new Server(server, {
  cors: {
    origin:"*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// --- MongoDB Connection ---
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Mongoose Schemas & Models ---

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null }, // Add this line
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

const friendshipSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Friendship = mongoose.model('Friendship', friendshipSchema);

// --- Middleware ---
function authenticateToken(req, res, next) {
    const token = req.header("Authorization")?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ success: false, error: "Access denied, token missing!" });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: "Invalid token" });
    }
}

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/'); // The folder where files will be saved
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
// --- API Routes ---

// --- API Routes ---

// ... your other routes ...

// POST /api/v2/users/dp (Upload a user's profile picture)
app.post("/api/v2/users/dp", authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file was uploaded." });
        }

        // Find the user by ID from the authenticated token
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        // Update the user's avatar field with the path of the uploaded file
       user.avatar = req.file.path.replace(/\\/g, "/"); // Normalizes path to use forward slashes
       await user.save(); 
        // Return a success response with the updated user info
        res.json({ 
            success: true, 
            message: "Profile picture updated successfully.", 
            user: user.toObject() 
        });

    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ success: false, error: "Server error during file upload" });
    }
});

// in index.js

// ... after your app.post("/api/v2/users/dp", ...) route

// POST /api/v2/users/edit (Edit a user's name/password)
app.post("/api/v2/users/edit", authenticateToken, async (req, res) => {
    try {
        const { name, password, confirmPassword } = req.body;
        const userId = req.user.id;

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        // Update the name
        user.name = name;

        // If a new password is provided and it matches the confirmation, update it
        if (password && confirmPassword) {
            if (password !== confirmPassword) {
                return res.status(400).json({ success: false, error: "Passwords do not match." });
            }
            // Hash the new password before saving
            user.password = bcrypt.hashSync(password, 10);
        }

        // Save the updated user
        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully.",
            user: user.toObject()
        });

    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ success: false, error: "Server error during profile update" });
    }
});


// ... your other routes like /api/v2/users/search ...
// ✅ THIS IS THE NEW SEARCH ENDPOINT
// GET /api/v2/users/search?text=... (Search for users)
app.get("/api/v2/users/search", authenticateToken, async (req, res) => {
    try {
        const { text } = req.query;
        if (!text) {
            return res.status(400).json({ success: false, error: "Search text is required" });
        }

        // Use a case-insensitive regular expression to find users
        const users = await User.find({
            name: { $regex: text, $options: 'i' }
        });

        res.json({ success: true, data: { users: users.map(u => u.toObject()) } });

    } catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({ success: false, error: "Server error during user search" });
    }
});


// GET /api/v2/friendship/friends (Fetch all friends for a logged-in user)
app.get("/api/v2/friendship/friends", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const friendships = await Friendship.find({
            $or: [{ user1: userId }, { user2: userId }]
        });
        const friendIds = friendships.map(friendship => {
            return friendship.user1.toString() === userId ? friendship.user2 : friendship.user1;
        });
        const friends = await User.find({ '_id': { $in: friendIds } });
        res.json({ success: true, friends: friends.map(f => f.toObject()) });
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ success: false, error: "Server error fetching friends" });
    }
});


// POST /api/v2/comments (Create a new comment)
app.post("/api/v2/comments", authenticateToken, async (req, res) => {
  try {
    const { content, postId } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });
    const newComment = { content, user: userId, likes: [] };
    post.comments.push(newComment);
    await post.save();
    const createdCommentSubdoc = post.comments[post.comments.length - 1];
    const populatedComment = {
      ...createdCommentSubdoc.toObject(),
      user: { _id: userId, name: userName }
    };
    res.json({ success: true, message: "Comment added successfully", comment: populatedComment });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// POST /api/v2/likes/toggle (Toggle like on post/comment)
app.post("/api/v2/likes/toggle", authenticateToken, async (req, res) => {
  try {
    const { id, likeType } = req.body;
    const userId = req.user.id;
    if (likeType === "post") {
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ success: false, error: "Post not found" });
      const isLiked = post.likes.includes(userId);
      const updateOperation = isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
      const updatedPost = await Post.findByIdAndUpdate(id, updateOperation, { new: true })
                                      .populate('user', 'name')
                                      .populate('comments.user', 'name');
      return res.json({ success: true, message: "Post like toggled", data: { likeable: updatedPost, userId, type: "post" } });
    } else if (likeType === "comment") {
      const post = await Post.findOne({ "comments._id": id });
      if (!post) return res.status(404).json({ success: false, error: "Comment not found" });
      const comment = post.comments.id(id);
      const isLiked = comment.likes.includes(userId);
      const updateOperation = isLiked ? { $pull: { "comments.$.likes": userId } } : { $addToSet: { "comments.$.likes": userId } };
      await Post.updateOne({ "comments._id": id }, updateOperation);
      const updatedPost = await Post.findById(post._id).populate('comments.user', 'name');
      const updatedComment = updatedPost.comments.id(id);
      return res.json({ success: true, message: "Comment like toggled", data: { likeable: updatedComment, userId, type: "comment", postId: post.id } });
    }
    return res.status(400).json({ success: false, error: "Invalid likeType" });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// GET /api/v2/user/:id (Fetch user profile)
app.get("/api/v2/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: "Invalid user ID format" });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// GET /api/v2/posts (Paginated)
app.get("/api/v2/posts", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const posts = await Post.find().populate('user', 'name').populate('comments.user', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const formattedPosts = posts.map(post => post.toObject());
        res.json({ success: true, data: { posts: formattedPosts } });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error fetching posts" });
    }
});

// POST /api/v2/users/signup
app.post("/api/v2/users/signup", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, error: "Email already in use" });
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id, name: newUser.name, email: newUser.email }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ success: true, message: "Signup successful", token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error during signup" });
    }
});

// POST /api/v2/users/login
app.post("/api/v2/users/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
            res.json({ success: true, message: "Login successful", token, user: { id: user._id, name: user.name, email: user.email } });
        } else {
            res.status(401).json({ success: false, error: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error during login" });
    }
});

// POST /api/v2/friendship/add
app.post("/api/v2/friendship/add", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.body;
    try {
        if (!friendId || friendId === userId) return res.status(400).json({ success: false, error: "Invalid friend request" });
        const friend = await User.findById(friendId);
        if (!friend) return res.status(404).json({ success: false, error: "User not found" });
        const existingFriendship = await Friendship.findOne({ $or: [{ user1: userId, user2: friendId }, { user1: friendId, user2: userId }] });
        if (existingFriendship) return res.status(400).json({ success: false, error: "Already friends" });
        await Friendship.create({ user1: userId, user2: friendId });
        res.json({ success: true, message: "Friend added successfully", friend: { id: friend._id, name: friend.name, email: friend.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error adding friend" });
    }
});

// POST /api/v2/friendship/remove
app.post("/api/v2/friendship/remove", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.body;
    try {
        const result = await Friendship.deleteOne({ $or: [{ user1: userId, user2: friendId }, { user1: friendId, user2: userId }] });
        if (result.deletedCount === 0) return res.status(400).json({ success: false, error: "Not friends" });
        const removedFriend = await User.findById(friendId);
        res.json({ success: true, message: "Friend removed successfully", friend: { id: removedFriend._id, name: removedFriend.name, email: removedFriend.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error removing friend" });
    }
});

// POST /api/v2/posts/create
app.post("/api/v2/posts/create", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { content } = req.body;
    try {
        if (!content || content.trim() === "") return res.status(400).json({ success: false, error: "Post content cannot be empty" });
        const post = await Post.create({ content, user: userId });
        const populatedPost = await Post.findById(post._id).populate('user', 'name');
        res.json({ success: true, message: "Post created successfully", post: populatedPost.toObject() });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error creating post" });
    }
});

// in index.js

// ✅ ADD THIS TEMPORARY ROUTE FOR DEBUGGING
app.get("/api/v2/health-check", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Deployment is live!", 
    timestamp: new Date() 
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  // ...
});
// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// --- Global Mongoose Settings ---
const globalTransform = (doc, converted) => {
    converted.id = converted._id;
    delete converted._id;
    delete converted.__v;
};
mongoose.set('toJSON', { virtuals: true, transform: globalTransform });
mongoose.set('toObject', { virtuals: true, transform: globalTransform });

