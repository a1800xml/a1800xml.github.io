import fs from 'fs';
import path from 'path';
import { minify } from 'minify-xml';

// Directory containing XML files
const directoryPath = './';

// Function to minify XML files
function minifyXMLFiles(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }

    // Loop through all the files in the directory
    files.forEach(file => {
      const filePath = path.join(dir, file);

      // Process only .xml files
      if (path.extname(file) === '.xml') {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.log(`Error reading file ${file}: ${err}`);
            return;
          }

          // Minify the XML content
          const minifiedContent = minify(data, { removeComments: true });

          // Save the minified file (overwrite original file)
          fs.writeFile(filePath, minifiedContent, 'utf8', err => {
            if (err) {
              console.log(`Error writing file ${file}: ${err}`);
            } else {
              console.log(`Successfully minified: ${file}`);
            }
          });
        });
      }
    });
  });
}

// Run the minification function
minifyXMLFiles(directoryPath);
