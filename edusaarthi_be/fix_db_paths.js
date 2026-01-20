const mongoose = require('mongoose');
require('dotenv').config();
const Subject = require('./models/Subject');

const fixPaths = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const subjects = await Subject.find({});
        for (const subject of subjects) {
            let changed = false;
            for (const file of subject.files) {
                if (file.path.includes('\\uploads\\')) {
                    // It's an absolute path
                    const parts = file.path.split('\\uploads\\');
                    file.path = 'uploads\\uploads\\' + parts[1]; // Wait, if it's C:\...\uploads\subjects...
                    // Let's be smarter
                }

                // Let's just extract the filename and rebuild the relative path
                // since we know they are all in uploads/subjects
                if (file.path.toLowerCase().includes('subjects')) {
                    const filename = file.filename;
                    const newPath = 'uploads/subjects/' + filename;
                    if (file.path !== newPath) {
                        console.log(`Fixing path: ${file.path} -> ${newPath}`);
                        file.path = newPath;
                        changed = true;
                    }
                }
            }
            if (changed) {
                await subject.save();
                console.log(`Updated subject: ${subject.title}`);
            }
        }

        console.log('Finished fixing paths');
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

fixPaths();
