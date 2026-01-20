const path = require('path');
const fs = require('fs');

const uploadsPath = path.resolve(__dirname, 'uploads');
const testFile = 'subjects/file-1768827736373-347552962.pdf';
const fullPath = path.join(uploadsPath, testFile);

console.log('__dirname:', __dirname);
console.log('uploadsPath:', uploadsPath);
console.log('fullPath:', fullPath);
console.log('exists:', fs.existsSync(fullPath));

if (fs.existsSync(uploadsPath)) {
    console.log('Contents of uploads:', fs.readdirSync(uploadsPath));
    const subjectsPath = path.join(uploadsPath, 'subjects');
    if (fs.existsSync(subjectsPath)) {
        console.log('Contents of uploads/subjects:', fs.readdirSync(subjectsPath));
    } else {
        console.log('uploads/subjects does not exist');
    }
} else {
    console.log('uploads folder does not exist');
}
