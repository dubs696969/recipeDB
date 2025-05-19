const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const PORT = 3000;

// —— Middleware ——
app.use(express.json());                    // parse JSON bodies (optional fallback)
app.use(express.urlencoded({ extended: true })); // parse HTML form bodies
app.use(express.static(path.join(__dirname, 'public')));

// —— Database Setup —— If database file doesn't exist, then it is created
const db = new sqlite3.Database("recipes.db", (err) => {
  if (err) {
    console.error("Error opening database " + err.message);
  } else {
    console.log("Connected to the SQLite database.");
    // Create the recipes table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            ingredients TEXT NOT NULL,
            instructions TEXT NOT NULL,
            prep_time TEXT,
            cook_time TEXT,
            cuisine_type TEXT,
            rating INTEGER
        )`, (err) => {
            if (err) {
                console.error('Error creating recipes table:', err.message);
            } else {
                console.log('Recipes table checked/created.');
            }

  });
}
});

// API endpoint to get all recipes
app.get('/api/recipes', (req, res) => {
    const sql = 'SELECT * FROM recipes';
    db.all (sql, [], (err,rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json(rows);
        }    )
})

// API endpoint to add new recipe
app.post('/api/recipes', (req,res) => {
    const {name, description, ingredients, instructions, prep_time, cook_time, cuisine_type, rating}=req.body;
    db.run('INSERT INTO recipes (name, description, ingredients, instructions, prep_time, cook_time, cuisine_type, rating) VALUES (?,?,?,?,?,?,?,?)',
    [name, description, ingredients, instructions, prep_time, cook_time, cuisine_type, rating], 
    function(err) {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            message: 'Recipe added succesfully'
        });
    })

})

// API endpoint to get single recipe for detail view
app.get('/api/recipes/:id', (req,res) => {
    const sql = 'SELECT * FROM recipes WHERE id = ?';
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        if (!row) {
            res.status(404).json({"error": "recipe not found"});
        }
        res.json(row);
    });
});

// API endpoint to get single recipe for detail view
app.delete('/api/recipes/:id', (req,res) => {
    const sql = 'DELETE FROM recipes WHERE id = ?';
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({"message": "Recipe deleted", changes: this.changes});
    });
});

// API endpoint to update recipe with edited details
app.put('/api/recipes/:id', (req,res) => {
    const {name, description, ingredients, instructions, prep_time, cook_time, cuisine_type, rating } = req.body;

    const sql = `UPDATE recipes
                SET name = ?,
                    description = ?, 
                    ingredients = ?, 
                    instructions = ?, 
                    prep_time = ?, 
                    cook_time = ?, 
                    cuisine_type = ?, 
                    rating = ? 
                WHERE id = ?`;
                
    db.run (sql,
        [name, description, ingredients, instructions, prep_time, cook_time, cuisine_type, rating, req.params.id],
        function(err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.json({
                message: "Recipe updated succesfully",
                changes: this.changes
            });
        });
    });
 
// Start server
app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`);
});