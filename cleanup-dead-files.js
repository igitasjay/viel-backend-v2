const fs = require('fs');
const path = require('path');

const reportText = fs.readFileSync('knip_report.json', 'utf8');
const jsonStartIndex = reportText.indexOf('{');
const jsonText = reportText.substring(jsonStartIndex);
const report = JSON.parse(jsonText);

const toDelete = [];
for (const issue of report.issues) {
  if (issue.files && issue.files.length > 0) {
    toDelete.push(issue.file);
  }
}

console.log(`Found ${toDelete.length} dead files.`);

for (const file of toDelete) {
  const fullPath = path.resolve(__dirname, file);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted: ${file}`);
    }
  } catch (err) {
    console.error(`Failed to delete ${file}:`, err);
  }
}

function removeEmptyDirectories(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      removeEmptyDirectories(fullPath);
    }
  }
  
  if (fs.readdirSync(dir).length === 0) {
    try {
      fs.rmdirSync(dir);
      console.log(`Deleted empty folder: ${dir}`);
    } catch (err) {
      console.error(`Failed to delete folder ${dir}:`, err);
    }
  }
}

console.log('Cleaning up empty folders...');
// Run on the src directory and others if needed
const dirsToCheck = ['src', 'prisma'];
for (const d of dirsToCheck) {
  removeEmptyDirectories(path.resolve(__dirname, d));
}

console.log('Done.');
