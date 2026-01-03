import { test, expect } from '@playwright/test';
import { setupHttpCapture, waitForHttpCapture, HttpCapture } from '@/utils/httpCaptureUtil';

test("test_http_capture", async ({ page }) => {
    await page.goto('file:///D:/code/temp/pyt/user_info_test.html');
    const get_userinfo_btn = page.locator('button.btn-get');
    const set_userinfo_btn = page.locator('button.btn-post');
    expect(get_userinfo_btn).toBeEnabled()
    expect(set_userinfo_btn).toBeEnabled()
    await get_userinfo_btn.click();
    const captured = await waitForHttpCapture(page, '/get-current-user', 10000);
    expect(captured.response.status).toBe(200);
    expect(captured.request.method).toBe("GET")
    console.log(captured.response.body)
    console.log(captured.request.url)
    
    await page.fill('#user_id', `${21331}`);
    await page.fill('#user_name', '张三');
    await page.fill('#user_email', 'zhangsan@example.com');
    await set_userinfo_btn.click();
    const captured2 = await waitForHttpCapture(page, '/update-user-info', 10000);
    expect(captured2.response.status).toBe(200);
    expect(captured2.request.method).toBe("POST")

    
    expect(captured2.request.postData).toMatchObject({
        user_id: 21331,
        user_name: '张三',
        user_email: 'zhangsan@example.com',
    });
    console.log(captured2.response.body)
    console.log(captured2.request.url)

    // expect(captured.request.method).toBe('POST');
    // expect(captured.request.postData).toMatchObject({
    //     name: 'test',
    // });
});