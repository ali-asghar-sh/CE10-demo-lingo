// api/server.js
const express = require('express');
const cors = require('cors');
const redis = require('redis');

const app = express();
const port = process.env.PORT || 3000;

// Redis connection (v4+ syntax)
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
});

// Middleware
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
    credentials: true
}));
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static('../frontend'));

// 4-letter words list
const words = [
    "LOVE", "FIRE", "BEAR", "CAKE", "DUCK", "GOLD", "HOPE",
    "LAMP", "MOON", "RAIN", "STAR", "TREE", "WIND", "BOOK",
    "COAT", "DESK", "GATE", "HAND", "JUMP", "KING", "LAKE",
    "MAIL", "NOSE", "OPEN", "PARK", "QUIT", "ROAD", "SHIP",
    "SONG", "SNOW", "BIRD", "CLAP", "FISH", "FROG", "GOAL",
    "HILL", "HOME", "ICE", "KITE", "LEAF", "LOCK", "MATH",
    "MILK", "NOTE", "PEAR", "RING", "ROCK", "SEA", "SHOE",
    "SOUP", "TIME", "TOY", "WALL", "WAVE", "WOOL", "ZERO",
    "BAND", "BATH", "BELL", "BONE", "BUS", "CAMP", "CARD",
    "DARK", "DISH", "DREAM", "DRUM", "DUST", "FACE", "FARM",
    "FEAR", "FLAG", "FOOT", "GAME", "GIFT", "HAIR", "HAT", "JOKE"
];

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get random word endpoint
app.get('/api/word', (req, res) => {
    try {
        const randomWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
        console.log(`Serving word: ${randomWord}`);
        
        res.json({ 
            word: randomWord,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error serving word:', error);
        res.status(500).json({ error: 'Failed to get word' });
    }
});

// Submit score endpoint
app.post('/api/score', async (req, res) => {
    try {
        const { score, attempts, word, won, timestamp } = req.body;
        
        const scoreData = {
            score: score || 0,
            attempts: attempts || 6,
            word: word || 'UNKNOWN',
            won: won || false,
            timestamp: timestamp || new Date().toISOString()
        };

        console.log('Received score:', scoreData);

        // Store in Redis list (v4+ syntax)
        await redisClient.lPush('game_scores', JSON.stringify(scoreData));
        
        // Keep only last 100 scores
        await redisClient.lTrim('game_scores', 0, 99);
        
        console.log('Score saved successfully');
        res.json({ 
            message: 'Score saved successfully',
            score: scoreData
        });
        
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Get high scores endpoint
app.get('/api/scores', async (req, res) => {
    try {
        const scores = await redisClient.lRange('game_scores', 0, 9); // Get top 10
        const parsedScores = scores.map(score => JSON.parse(score));
        
        // Sort by score descending
        parsedScores.sort((a, b) => b.score - a.score);
        
        res.json({
            scores: parsedScores,
            total: parsedScores.length
        });
        
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// Initialize Redis connection
async function initRedis() {
    try {
        console.log('Attempting to connect to Redis...');
        await redisClient.connect();
        console.log('✅ Connected to Redis successfully');
        
        // Test Redis is working
        await redisClient.set('test', 'hello');
        const result = await redisClient.get('test');
        console.log('✅ Redis test successful:', result);
        
    } catch (error) {
        console.error('❌ Redis connection error:', error.message);
        console.log('Continuing without Redis...');
    }
}

// Start server
app.listen(port, () => {
    console.log(`API Server running on port ${port}`);
    initRedis();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    try {
        await redisClient.quit();
    } catch (error) {
        console.log('Error closing Redis connection:', error.message);
    }
    process.exit(0);
});

// Handle uncaught exceptions
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    try {
        await redisClient.quit();
    } catch (error) {
        console.log('Error closing Redis connection:', error.message);
    }
    process.exit(0);
});