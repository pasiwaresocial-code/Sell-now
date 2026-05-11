import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle Admin App routing
app.get('/admin/:path*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'admin', 'index.html'));
});

// Handle Main App routing - send all requests to index.html
app.get('/:path*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend server running on port ${PORT}`);
});
