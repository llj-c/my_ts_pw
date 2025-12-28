import type { Page, Locator } from "@playwright/test";

export class BaiduPage {

    private readonly inputSearch: Locator;
    private readonly buttonSearch: Locator;
    public readonly page: Page

    constructor(page: Page) {
        this.page = page;
        this.inputSearch = this.page.locator("textarea.chat-input-textarea");
        this.buttonSearch = this.page.locator("button#chat-submit-button");
    }

    async go() {
        await this.page.goto("https://www.baidu.com");
    }

    async search(search: string) {
        await this.inputSearch.fill(search);
        await this.buttonSearch.click();
    }

    async clearSearch() {
        await this.inputSearch.clear();
    }
}