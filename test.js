import puppeteer from 'puppeteer';
import PromptSync from 'prompt-sync';
import 'dotenv/config'

const prompt = PromptSync()

const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL;
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD;
const JOB_SEARCH_URL = 'https://www.linkedin.com/jobs/search/?f_AL=true';  // URL for Easy Apply jobs

async function applyForEasyApplyJobs() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate to LinkedIn login page
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

        // Log in
        await page.type('#username', LINKEDIN_EMAIL);
        await page.type('#password', LINKEDIN_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        // Navigate to Easy Apply jobs
        await page.goto(JOB_SEARCH_URL, { waitUntil: 'networkidle2' });

        let jobLinks = await page.$$eval('.job-card-list__title--link', links => links.map(link => link.href));

        for (let link of jobLinks) {
            await page.goto(link, { waitUntil: 'networkidle2' });

            const easyApplyButton = await page.$('.jobs-apply-button--top-card');

            if (easyApplyButton) {
                await easyApplyButton.click();
                await page.waitForSelector('.jobs-easy-apply-modal', { visible: true });

                // Pause for manual input if necessary
                // const hasAdditionalQuestions = await page.$('.jobs-easy-apply-form-section__grouping');
                // if (hasAdditionalQuestions) {
                    // console.log(`Manual input required for job: ${link}`);
                    // prompt('Please complete the required fields in the browser and press Enter to continue...');
                // }
                const modalTitle = await page.$eval("form div div h3", el => el.innerText)
                console.log(modalTitle)

                // // Assuming the form doesn't have any extra fields to fill
                // const submitButton = await page.$('button[aria-label="Submit application"]');
                // if (submitButton) {
                //     await submitButton.click();
                //     await page.waitForTimeout(2000);  // Adjust time as needed for submission to complete
                //     console.log(`Applied for job: ${link}`);
                // } else {
                //     console.log(`Submit button not found for job: ${link}`);
                // }

                // // Close the modal
                // const closeButton = await page.$('.artdeco-modal__dismiss');
                // if (closeButton) {
                //     await closeButton.click();
                //     await page.waitForTimeout(1000);  // Wait for the modal to close
                // }
            } else {
                console.log(`Easy Apply button not found for job: ${link}`);
            }
        }
    } catch (error) {
        console.error('Error applying for jobs:', error);
    } finally {
        await browser.close();
    }
}

// Execute the function
applyForEasyApplyJobs();