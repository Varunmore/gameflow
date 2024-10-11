const express = require('express');
const multer = require('multer');
const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' }); // Upload destination folder

// Serve static files from the 'games' directory
app.use('/games', express.static(path.join(__dirname, 'games')));

// Route to handle game uploads
app.post('/upload', upload.single('game'), async (req, res) => {
    const zipPath = req.file.path;
    const gameName = req.file.originalname.split('.zip')[0]; // Use the original filename as the folder name

    // Create a directory to extract the game
    const extractPath = path.join(__dirname, 'games', gameName);
    fs.mkdirSync(extractPath, { recursive: true });

    // Extract the uploaded ZIP file
    fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .on('close', () => {
            // Once extraction is complete, respond with the game's URL
            const gameUrl = `/games/${gameName}/index.htm`; // Assuming the game has an index.html
            res.json({ message: 'Game uploaded successfully!', gameUrl });
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Failed to extract the game.' });
        });
});

// Route to serve a simple HTML page where users can click to play
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body>
                <h1>Game Upload</h1>
                <form ref='uploadForm' 
                    id='uploadForm' 
                    action='/upload' 
                    method='post' 
                    encType="multipart/form-data">
                    <input type="file" name="game" />
                    <input type='submit' value='Upload Game!' />
                </form>
                <h2>Once the game is uploaded, the URL will appear here.</h2>
                <div id="gameLink"></div>
                <script>
                    document.getElementById('uploadForm').onsubmit = function(e) {
                        e.preventDefault();
                        var formData = new FormData(document.forms.namedItem("uploadForm"));
                        fetch('/upload', { method: 'POST', body: formData })
                        .then(response => response.json())
                        .then(data => {
                            if(data.gameUrl) {
                                document.getElementById('gameLink').innerHTML = '<a href="' + data.gameUrl + '">Play Game</a>';
                            } else {
                                document.getElementById('gameLink').innerHTML = '<p>Error uploading game</p>';
                            }
                        });
                    }
                </script>
            </body>
        </html>
    `);
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
