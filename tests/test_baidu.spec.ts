import { test as base, expect } from '@playwright/test';
import { BaiduPage } from '@/fixtures/baidu-page';
import fs from 'fs';

const test = base.extend<{ baiduPage: BaiduPage }>({
    baiduPage: async ({ page }, use, testInfo) => {
        const baiduPage = new BaiduPage(page);
        await baiduPage.go();
        await baiduPage.search("Playwright");
        await use(baiduPage);
        const logFile = testInfo.outputPath('log.txt');
        fs.promises.writeFile(logFile, 'Hello, world!', 'utf-8');
    }
});

test('should search for Playwright and verify title contains search term', async ({ baiduPage }) => {
    const title = await baiduPage.page.title();
    expect(title).toContain("Playwright");
    await baiduPage.page.getByAltText("aaa").fill("luo")

});