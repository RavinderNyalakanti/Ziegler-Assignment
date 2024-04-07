const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const cors = require('cors'); // Import the CORS middleware 
const { ObjectId } = require('mongodb');

const app = express();
app.use(express.json()); 
app.use(cors());


const uri = 'mongodb+srv://ravinder22:ravinder123@ravindernyalakati08.ovdjwp3.mongodb.net/';
const client = new MongoClient(uri);

let db;

const initializeDB = async () => {
  try {
    await client.connect();
    db = client.db('userdata');
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
  }
};

initializeDB();

// Get user information
// Get user information
// Get user information
app.get('/users', async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await db.collection('users').find().toArray();
    
    // Map over users and include username and hashed password
    const usersWithHashedPassword = users.map(user => {
      return {
        username: user.username,
        password: user.password // Include the hashed password
      };
    });
    
    res.status(200).json(usersWithHashedPassword);
  } catch (error) {
    console.log('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique ID for the user
    const userId = new ObjectId();

    // Insert new user into the database with generated ID
    await db.collection('users').insertOne({ _id: userId, username, password: hashedPassword });

    res.status(201).json({ message: 'User registered successfully', userId: userId });
  } catch (error) {
    console.log('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}); 


// User login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ username: user.username }, 'secret_key', { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.log('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}); 

// Delete a user
app.delete('/users/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Check if the user exists
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user from the database
    await db.collection('users').deleteOne({ username });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Update a user
app.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, password } = req.body;

    // Check if the user exists
    const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password if provided
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user data in the database
    const updatedUserData = {};
    if (username) updatedUserData.username = username;
    if (hashedPassword) updatedUserData.password = hashedPassword;

    await db.collection('users').updateOne({ _id: ObjectId(userId) }, { $set: updatedUserData });

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.log('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
