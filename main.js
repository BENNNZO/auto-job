import puppeteer from 'puppeteer';
import PromptSync from 'prompt-sync';
import { writeFile } from "fs/promises"
import fs from "fs/promises"
import 'dotenv/config';

const prompt = PromptSync();

const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL;
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD;
const JOB_SEARCH_URL = 'https://www.linkedin.com/jobs/search/?f_AL=true&geoId=103644278&keywords=front%20end%20web%20developer'; // URL for Easy Apply jobs

async function writeToFile(data, fileName) {
    try {
        await writeFile(fileName, data);
        console.log(`Successfully wrote to ${fileName}`);
    } catch (err) {
        console.error(`Error writing to ${fileName}: ${err}`);
    }
}

async function readArrayFromFile(fileName) { // if you already have on ready to go
    try {
        const data = await fs.readFile(fileName, 'utf8');
        const array = JSON.parse(data);
        return array;
    } catch (err) {
        console.error(`Error reading ${fileName}: ${err}`);
        return [];
    }
}

async function login(page) {
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'load' });
    await page.type('#username', LINKEDIN_EMAIL);
    await page.type('#password', LINKEDIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
}

async function scrollToEndOfPage(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const container = document.querySelector('.jobs-search-results-list')
                const scrollHeight = container.scrollHeight;
                container.scrollTop = container.scrollTop + distance
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200);
        });
    });
}

async function getJobLinks(page) {
    await scrollToEndOfPage(page); // Ensure all lazy-loaded content is visible
    const jobLinks = await page.$$eval('.job-card-list__title--link', links => links.map(link => link.href));
    return jobLinks;
}

async function applyForEasyApplyJobs() {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1080, height: 1080 } });
    const page = await browser.newPage();

    try {
        await login(page);

        let allJobLinks = await readArrayFromFile("jobs.txt");
        // let pageIndex = 0;
        // while (true) { // comment this while loop out when reading job links from a file, then put file contents into alljoblinks variable
        //     try {
        //         const currentPageUrl = `${JOB_SEARCH_URL}&start=${pageIndex * 25}`;
        //         await page.goto(currentPageUrl, { waitUntil: 'load' });

        //         const jobLinks = await getJobLinks(page);
        //         if (jobLinks.length === 0) break; // No more job links, exit loop

        //         allJobLinks = [...allJobLinks, ...jobLinks];
        //         console.log(`Fetched ${jobLinks.length} job links from page ${pageIndex + 1}`);

        //         pageIndex++;
        //     } catch (pageError) {
        //         console.error(`Error navigating to job listings page ${pageIndex}:`, pageError);
        //         break;
        //     }
        // }
        // 
        // console.log(`Total job links fetched: ${allJobLinks.length}`);
        // writeToFile(JSON.stringify(allJobLinks, null, 4), "jobs.txt")

        // Process each job link and apply for Easy Apply jobs as needed
        for (let link of allJobLinks) {
            try {
                await page.goto(link, { waitUntil: 'load' });
                const easyApplyButton = await page.$('.jobs-apply-button--top-card');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the page to fully load

                if (easyApplyButton) {
                    await easyApplyButton.click();
                    await page.waitForSelector('.jobs-easy-apply-modal', { visible: true });
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the modal to fully load

                    const submitButton = await page.$('button[aria-label="Submit application"]');
                    if (submitButton) {
                        await submitButton.click();
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for the application to be submitted
                        console.log(`Applied for job: ${link}`);
                    } else {
                        console.log(`No submit button found for job: ${link}`);
                    }
                } else {
                    console.log(`Easy Apply button not found for job: ${link}`);
                }
            } catch (jobError) {
                console.error(`Error applying for job ${link}:`, jobError);
            }
        }

    } catch (error) {
        console.error('Error applying for jobs:', error);
    } finally {
        await browser.close();
    }
}

applyForEasyApplyJobs();