const cron = require('node-cron');
const ScheduledTask = require('../models/ScheduledTask');
const Activity = require('../models/Activity');
const aiService = require('./aiService');
const { sendEmail } = require('./emailService');
const fs = require('fs');
const path = require('path');

const executeTask = async (task) => {
    try {
        console.log(`Executing scheduled task: ${task._id} for user ${task.userId}`);

        // 1. Extract Text
        let extractedText = "";
        const fullPath = path.resolve(task.filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${task.filePath}`);
        }

        if (task.filePath.endsWith('.pdf')) {
            extractedText = await aiService.extractTextFromPDF(fs.readFileSync(fullPath));
        } else {
            extractedText = fs.readFileSync(fullPath, 'utf8');
        }

        let activityTitle = '';
        let activityDescription = '';
        let generatedContent = null;

        if (task.taskType === 'question_generation') {
            activityTitle = 'Scheduled: Generated Questions';
            activityDescription = `AI-generated questions from ${task.originalFileName}`;
            const questions = await aiService.generateQuestions(extractedText, task.questionCount);
            generatedContent = {
                type: 'questions',
                data: questions
            };
        } else if (task.taskType === 'quiz') {
            activityTitle = 'Scheduled: Generated Quiz';
            activityDescription = `AI-generated quiz from ${task.originalFileName}`;
            const quizData = await aiService.generateQuiz(extractedText, task.questionCount);
            generatedContent = {
                type: 'quiz',
                data: quizData
            };
        }

        // 2. Create Activity
        await Activity.create({
            userId: task.userId,
            title: activityTitle,
            description: activityDescription,
            type: task.taskType
        });

        // 3. Send Email to Recipients
        const emails = task.recipientEmails.split(',').map(e => e.trim()).filter(e => e);

        const formatEmailBody = (title, content, fileName) => {
            let html = `<div style="font-family: sans-serif; padding: 20px; color: #333;">`;
            html += `<h2 style="color: #6366f1;">${title}</h2>`;
            html += `<p>Scheduled Automation Result for: <strong>${fileName}</strong></p>`;
            html += `<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">`;

            if (content.type === 'questions' && Array.isArray(content.data)) {
                html += '<p>The following questions were generated:</p><ul>';
                content.data.forEach(q => html += `<li style="margin-bottom: 10px;">${q}</li>`);
                html += '</ul>';
            } else if (content.type === 'quiz' && Array.isArray(content.data)) {
                html += '<p>The following quiz was generated:</p>';
                content.data.forEach((item, index) => {
                    html += `<div style="margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 8px;">`;
                    html += `<p><strong>Q${index + 1}: ${item.question}</strong></p><ul>`;
                    item.options.forEach(opt => {
                        html += `<li>${opt} ${opt === item.answer ? '(Correct)' : ''}</li>`;
                    });
                    html += `</ul></div>`;
                });
            }

            html += `<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">`;
            html += `<p style="font-size: 0.8rem; color: #6b7280;">Sent via Edusaarthi AI</p>`;
            html += `</div>`;
            return html;
        };

        const emailHtml = formatEmailBody(activityTitle, generatedContent, task.originalFileName);

        for (const email of emails) {
            await sendEmail(email, `Edusaarthi Scheduled Task: ${activityTitle}`, emailHtml);
        }

        // 4. Update Task Status
        task.status = 'completed';
        await task.save();

        console.log(`Task ${task._id} completed successfully.`);
    } catch (error) {
        console.error(`Error executing task ${task._id}:`, error);
        task.status = 'failed';
        task.error = error.message;
        await task.save();
    }
};

const initScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const pendingTasks = await ScheduledTask.find({
            status: 'pending',
            scheduledDate: { $lte: now }
        });

        if (pendingTasks.length > 0) {
            console.log(`Found ${pendingTasks.length} pending tasks to execute.`);
            for (const task of pendingTasks) {
                await executeTask(task);
            }
        }
    });

    console.log('Scheduler initialized (checking every minute)');
};

module.exports = { initScheduler };
