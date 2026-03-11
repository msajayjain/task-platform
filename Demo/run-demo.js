/**
 * File Description:
 * Playwright-driven product demonstration script.
 *
 * Purpose:
 * Execute an end-to-end scripted walkthrough (login, task creation, review, edit, delete) for demo environments.
 */

const { chromium } = require("playwright");
const script = require("./demo-script.json");

// Get app URL from command line argument
const appUrl = process.argv[2];

if (!appUrl) {
  console.error("❌ Please provide the app URL as the first argument!");
  console.error("Usage: node run-demo.js https://your-app-url.com");
  process.exit(1);
}

(async () => {

  const browser = await chromium.launch({
    headless: false,
    slowMo: 600
  });

  const page = await browser.newPage();

  console.log(`🚀 Opening application at ${appUrl}`);
  await page.goto(appUrl);

  // -----------------------
  // LOGIN
  // -----------------------
  console.log("🔐 Logging in");
  await page.fill('input[name="email"]', script.login.email);
  await page.fill('input[name="password"]', script.login.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // -----------------------
  // FUNCTION TO CREATE A TASK
  // -----------------------
  async function createTaskDemo(aiInputText, priority, dueDate, team, assignee, initialNotes) {
    console.log("\n📌 Opening Create Task");
    await page.click("text=Create Task");
    await page.waitForTimeout(2000);

    console.log("🤖 Entering AI text to generate task");
    await page.fill('textarea[name="aiTaskInput"]', aiInputText);

    console.log("✨ Clicking 'Generate Task from AI'");
    await page.click("text=Generate Task from AI");
    console.log("🧠 AI is parsing the problem and generating title + description");
    await page.waitForTimeout(6000);

    console.log("📄 Generating AI Summary");
    await page.click("text=Generate Summary with AI");
    console.log("🧠 AI is summarizing the issue");
    await page.waitForTimeout(5000);

    console.log("⚠️ Generating Priority");
    await page.selectOption('select[name="priority"]', priority);
    await page.click("text=Generate Priority");
    await page.waitForTimeout(2000);

    console.log("📅 Setting due date, team, assignee, and initial notes");
    await page.fill('input[name="dueDate"]', dueDate);
    await page.selectOption('select[name="team"]', team);
    await page.selectOption('select[name="assignee"]', assignee);
    await page.fill('textarea[name="initialNotes"]', initialNotes);

    console.log("💾 Clicking 'Create Issue'");
    await page.click("text=Create Issue");
    await page.waitForTimeout(4000);
  }

  // -----------------------
  // CREATE 3 TASKS
  // -----------------------
  const demoTasks = [
    {
      text: `Dashboard loading slowly, APIs timing out. Users cannot access reports on time.`,
      priority: "High",
      dueDate: "2026-03-15",
      team: "DevTeam1",
      assignee: "dev1",
      notes: "Initial investigation pending"
    },
    {
      text: `Login with Google OAuth fails for some users, causing access issues.`,
      priority: "Medium",
      dueDate: "2026-03-17",
      team: "DevTeam2",
      assignee: "dev2",
      notes: "Check OAuth integration logs"
    },
    {
      text: `File upload feature throwing 500 error intermittently, affecting client uploads.`,
      priority: "High",
      dueDate: "2026-03-20",
      team: "DevTeam1",
      assignee: "dev3",
      notes: "Investigate storage API"
    }
  ];

  for (const task of demoTasks) {
    await createTaskDemo(task.text, task.priority, task.dueDate, task.team, task.assignee, task.notes);
  }

  // -----------------------
  // VIEW, EDIT, DELETE TASKS
  // -----------------------
  console.log("\n👀 Viewing created tasks");
  await page.click("text=My Created Tasks");
  await page.waitForTimeout(2000);

  for (const task of demoTasks) {
    console.log(`🔍 Viewing task: ${task.text.slice(0, 30)}...`);
    await page.click(`text=${task.text.slice(0, 20)}`); // Click to view
    await page.waitForTimeout(3000);

    console.log("↩️ Going back to task list");
    await page.click("text=My Created Tasks");
    await page.waitForTimeout(2000);
  }

  console.log("\n✏️ Editing a task");
  const firstTask = demoTasks[0];
  await page.click(`text=${firstTask.text.slice(0, 20)}`);
  await page.waitForTimeout(2000);
  await page.click("text=Edit");
  await page.fill('textarea[name="description"]', firstTask.text + " [Edited during demo]");
  await page.click("text=Save");
  await page.waitForTimeout(3000);

  console.log("\n🗑️ Deleting a task");
  await page.click(`text=${firstTask.text.slice(0, 20)}`);
  await page.waitForTimeout(2000);
  await page.click("text=Delete");
  await page.waitForTimeout(3000);

  console.log("🎉 Demo completed successfully!");
  await browser.close();

})();