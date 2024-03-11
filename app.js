const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Replace this with your actual PostgreSQL connection URI
const postgresUri = 'postgresql://kaviarasanmani:oMKndtHvu3q1@ep-wispy-morning-a55wl5kw.us-east-2.aws.neon.tech/blog?sslmode=require';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: postgresUri
});

// Define a schema for the blog model
const blogSchema = {
  title: 'VARCHAR(255)',
  price: 'DECIMAL',
  product_url: 'VARCHAR(255)',
  created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  modified_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  image_url: 'VARCHAR(255)'
};

// Create a blogs table if it doesn't exist
pool.query(`CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  ${Object.entries(blogSchema).map(([columnName, columnDefinition]) => `${columnName} ${columnDefinition}`).join(',\n  ')}
)`);

app.use(bodyParser.json());

// Get all blogs
app.get('/blogs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM blogs');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a specific blog by ID
app.get('/blogs/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const { rows } = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new blog
app.post('/blogs', async (req, res) => {
  const { title, price, product_url, image_url } = req.body;

  if (!title || !price || !product_url || !image_url) {
    res.status(400).json({ error: 'All fields are required' });
  } else {
    try {
      const { rows } = await pool.query('INSERT INTO blogs (title, price, product_url, image_url) VALUES ($1, $2, $3, $4) RETURNING *', [title, price, product_url, image_url]);
      const createdBlog = rows[0];

      res.status(201).json({
        status: 'success',
        message: 'Blog created successfully',
        data: createdBlog
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// Update an existing blog
app.put('/blogs/:id', async (req, res) => {
  const id = req.params.id;
  const { title, price, product_url, image_url } = req.body;

  try {
    const { rows } = await pool.query('UPDATE blogs SET title = $1, price = $2, product_url = $3, image_url = $4, modified_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *', [title, price, product_url, image_url, id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a blog
app.delete('/blogs/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const { rows } = await pool.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

