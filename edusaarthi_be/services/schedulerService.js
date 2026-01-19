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
        } else if (task.taskType === 'email_automation') {
            activityTitle = 'Scheduled: Email Drafts';
            activityDescription = `AI-drafted email for ${task.originalFileName}`;
            const emailData = await aiService.generateEmail(extractedText, task.originalFileName);
            generatedContent = {
                type: 'email',
                data: emailData
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
            } else if (content.type === 'email' && content.data) {
                html += `<p>A draft has been prepared:</p>`;
                html += `<div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">`;
                html += `<p><strong>Subject:</strong> ${content.data.subject}</p>`;
                html += `<p>${content.data.body?.replace(/\n/g, '<br>')}</p>`;
                html += `</div>`;
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
