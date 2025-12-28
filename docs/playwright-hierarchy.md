# Playwright 中 Browser、Context、Page 的关系

## 层级关系

```
Browser (浏览器实例)
  └── BrowserContext (浏览器上下文)
        └── Page (页面/标签页)
```

## 详细说明

### 1. Browser（浏览器实例）

**定义**：代表一个浏览器进程，是最高层的对象。

**特点**：
- 一个 Browser 实例对应一个真实的浏览器进程（如 Chrome、Firefox、Safari）
- 可以创建多个 BrowserContext
- 通常由 Playwright 自动管理，测试中很少直接操作

**创建方式**：
```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch();
```

### 2. BrowserContext（浏览器上下文）

**定义**：代表一个独立的浏览器会话，类似于"无痕模式"窗口。

**特点**：
- 每个 Context 都有独立的：
  - Cookie 和存储
  - 缓存
  - 权限设置
  - 地理位置等
- 一个 Browser 可以创建多个 Context
- 一个 Context 可以包含多个 Page（标签页）
- **测试隔离的关键**：每个测试通常使用独立的 Context，确保测试之间不相互影响

**创建方式**：
```typescript
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  userAgent: '...'
});
```

### 3. Page（页面/标签页）

**定义**：代表浏览器中的一个标签页或页面。

**特点**：
- 一个 Context 可以包含多个 Page
- 是实际执行操作的对象（点击、输入、导航等）
- 在测试中最常使用的对象

**创建方式**：
```typescript
const page = await context.newPage();
// 或者直接使用 Playwright 提供的 page fixture
```

## 在您的项目中的应用

### 示例 1：使用 page fixture（最常见）

在您的 `tests/example.spec.ts` 中：

```3:8:tests/example.spec.ts
test('has title', async ({ page }) => {
  await page.goto('https://www.baidu.com');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/百度/);
});
```

这里 `page` 是 Playwright 自动提供的 fixture，它已经包含了完整的层级关系：
- Playwright 自动创建 Browser
- 为每个测试创建独立的 BrowserContext
- 在 Context 中创建 Page

### 示例 2：在自定义 fixture 中使用 page

在您的 `tests/test_baidu.spec.ts` 中：

```5:14:tests/test_baidu.spec.ts
const test = base.extend<{ baiduPage: BaiduPage }>({
    baiduPage: async ({ page }, use, testInfo) => {
        const baiduPage = new BaiduPage(page);
        await baiduPage.go();
        await baiduPage.search("Playwright");
        await use(baiduPage);
        const logFile = testInfo.outputPath('log.txt');
        fs.promises.writeFile(logFile, 'Hello, world!','utf-8');
    }
});
```

这里 `page` 参数来自 Playwright 的 fixture，然后传递给 `BaiduPage` 类。

### 示例 3：在 Page Object 中使用 page

在您的 `src/fixtures/baidu-page.ts` 中：

```9:13:src/fixtures/baidu-page.ts
    constructor(page: Page) {
        this.page = page;
        this.inputSearch = this.page.locator("textarea.chat-input-textarea");
        this.buttonSearch = this.page.locator("button#chat-submit-button");
    }
```

`BaiduPage` 类接收 `Page` 对象，并使用它来执行操作。

## 访问关系

### 从 Page 访问 Context 和 Browser

```typescript
test('访问层级关系', async ({ page }) => {
  // 从 page 访问 context
  const context = page.context();
  
  // 从 context 访问 browser
  const browser = context.browser();
  
  // 注意：如果 browser 是通过 launch() 创建的，browser 可能为 null
  // 因为 Playwright 的 fixture 可能使用不同的管理方式
});
```

### 创建多个 Page

```typescript
test('多个标签页', async ({ context }) => {
  // 在同一个 context 中创建多个 page
  const page1 = await context.newPage();
  const page2 = await context.newPage();
  
  await page1.goto('https://example.com');
  await page2.goto('https://google.com');
  
  // 关闭页面
  await page1.close();
  await page2.close();
});
```

## 生命周期

### 自动管理（推荐）

使用 Playwright 的 fixture 时，生命周期自动管理：

```typescript
test('自动管理', async ({ page }) => {
  // Playwright 自动：
  // 1. 创建 Browser（如果不存在）
  // 2. 为每个测试创建新的 BrowserContext
  // 3. 在 Context 中创建 Page
  // 4. 测试结束后自动清理
});
```

### 手动管理

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

// 执行操作
await page.goto('https://example.com');

// 手动清理
await page.close();
await context.close();
await browser.close();
```

## 最佳实践

1. **使用 fixture**：让 Playwright 自动管理 Browser、Context 和 Page
2. **测试隔离**：每个测试使用独立的 Context（Playwright 默认行为）
3. **避免共享状态**：不要在不同测试之间共享 Page 或 Context
4. **合理使用多个 Page**：在同一个测试中需要多个标签页时，使用 `context.newPage()`

## 总结

- **Browser**：浏览器进程，最高层
- **BrowserContext**：独立的浏览器会话，提供测试隔离
- **Page**：具体的标签页，执行实际操作的对象

在大多数测试中，您只需要使用 `page` fixture，Playwright 会自动处理底层的 Browser 和 Context 的创建和管理。

