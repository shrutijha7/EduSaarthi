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
        } else if (task.taskType === 'fill_in_blanks') {
            activityTitle = 'Scheduled: Fill in the Blanks';
            activityDescription = `AI-generated fill-in-the-blanks from ${task.originalFileName}`;
            const fillData = await aiService.generateFillInBlanks(extractedText, task.questionCount);
            generatedContent = {
                type: 'fill_in_blanks',
                data: fillData
            };
        } else if (task.taskType === 'true_false') {
            activityTitle = 'Scheduled: True / False';
            activityDescription = `AI-generated true/false questions from ${task.originalFileName}`;
            const tfData = await aiService.generateTrueFalse(extractedText, task.questionCount);
            generatedContent = {
                type: 'true_false',
                data: tfData
            };
        } else if (task.taskType === 'subjective') {
            activityTitle = 'Scheduled: Subjective Questions';
            activityDescription = `AI-generated subjective questions from ${task.originalFileName}`;
            const subData = await aiService.generateSubjective(extractedText, task.questionCount);
            generatedContent = {
                type: 'subjective',
                data: subData
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
            let questionsHtml = '';

            if (content.type === 'questions' && Array.isArray(content.data)) {
                content.data.forEach((q, i) => {
                    questionsHtml += `
                <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <p style="margin: 0; font-weight: 600; color: #1e293b;">Question ${i + 1}</p>
                    <p style="margin: 8px 0 0; color: #475569;">${q}</p>
                </div>
            `;
                });
            } else if (content.type === 'quiz' && Array.isArray(content.data)) {
                content.data.forEach((item, i) => {
                    questionsHtml += `
                <div style="margin-bottom: 20px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <p style="margin: 0; font-weight: 600; color: #1e293b;">Q${i + 1}: ${item.question}</p>
                    <div style="margin-top: 12px;">
                        ${item.options.map((opt, j) => `
                            <div style="margin-bottom: 8px; padding: 8px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; color: #475569;">
                                <strong>${String.fromCharCode(65 + j)}.</strong> ${opt}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
                });
            } else if (content.type === 'fill_in_blanks' && Array.isArray(content.data)) {
                content.data.forEach((item, i) => {
                    questionsHtml += `
                        <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">Q${i + 1}: ${item.question}</p>
                            <p style="margin: 8px 0 0; color: #64748b; font-style: italic;">Answer: ${item.answer}</p>
                        </div>
                    `;
                });
            } else if (content.type === 'true_false' && Array.isArray(content.data)) {
                content.data.forEach((item, i) => {
                    questionsHtml += `
                        <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">Q${i + 1}: ${item.question}</p>
                            <p style="margin: 8px 0 0; color: #64748b;"><strong>Answer:</strong> ${item.answer ? 'True' : 'False'}</p>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">${item.explanation}</p>
                        </div>
                    `;
                });
            } else if (content.type === 'subjective' && Array.isArray(content.data)) {
                content.data.forEach((item, i) => {
                    questionsHtml += `
                        <div style="margin-bottom: 20px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">Q${i + 1}: ${item.question}</p>
                            <div style="margin-top: 12px;">
                                <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Suggested Answer:</strong> ${item.suggestedAnswer}</p>
                                <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;"><strong>Key Points:</strong> ${item.keyPoints.join(', ')}</p>
                            </div>
                        </div>
                    `;
                });
            }

            return `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px; color: white; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">EduSaarthi Assessment</h1>
                    <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Academic Evaluation Portal</p>
                </div>
                <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                    <p style="margin-top: 0; font-weight: 600; font-size: 16px;">Dear Student,</p>
                    <p style="margin-bottom: 24px; color: #475569;">A scheduled assessment has been prepared for you based on: <strong>${fileName}</strong>.</p>
                    
                    <div style="margin: 24px 0; padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #6366f1;">
                        <span style="display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Topic / Category</span>
                        <span style="font-weight: 600; color: #0f172a;">${title}</span>
                    </div>

                    <div style="margin-top: 32px;">
                        ${questionsHtml || `<p style="text-align: center; color: #94a3b8;">Assessment processed successfully.</p>`}
                    </div>

                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 14px; color: #64748b;">This task was automatically processed at your scheduled time. Best of luck with your studies!</p>
                    </div>
                </div>
                <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 EduSaarthi AI Learning. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
        };

        const emailHtml = formatEmailBody(activityTitle, generatedContent, task.originalFileName);

        /*
        for (const email of emails) {
            await sendEmail(email, `Edusaarthi Scheduled Task: ${activityTitle}`, emailHtml);
        }
        */

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
