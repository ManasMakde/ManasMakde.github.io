const express = require('express');
const path = require('path');
const sass = require('sass');
const { readdirSync, writeFileSync, existsSync } = require('fs');
const server = express();

const PORT = 3000;
const css_filename = "../styles.css";
const scss_filename = "./sass/main.scss";

server.use(express.static(path.join(__dirname, '../')))

server.get('/', (req, res) => { //returns index page on /
  res.sendFile(`index.html`, { root: '../' });
});

server.get('/:id', (req, res) => { //instead of creating a get() for every page, this get() sends non unique pages by :id
  if (existsSync(`../${req.params.id}`))
    res.sendFile(req.params.id, { root: '../' });
  else if (existsSync(`../${req.params.id}.html`))
    res.sendFile(`../${req.params.id}.html`, { root: '../' });
  else
    res.sendFile(`404.html`, { root: '../' });
});

server.listen(PORT, () => {
  const result = sass.compile(scss_filename);
  writeFileSync(path.join(__dirname, css_filename), result.css, 'utf-8');
  console.log(`listening at ${PORT} ...`);
});