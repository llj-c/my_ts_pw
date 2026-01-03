import {Prisma } from '@prisma/client';
import { expect, test } from './fixtures/db-fixture';


test('test_db', async ({ db }) => {
    try {

        await db.create<Prisma.TestDataUrlCaptureGetPayload<{}>>('testDataUrlCapture', {
            apiUrl: 'api/users',
            apiMethod: 'GET',
            apiParams: JSON.stringify({
                page: 1,
                limit: 10,
            }),
            apiRequestHeaders: JSON.stringify({
                'Content-Type': 'application/json',
            }),
            apiResponseHeaders: JSON.stringify({
                'Content-Type': 'application/json',
            }),
            apiResponseBody: JSON.stringify({
                data: [
                    {
                        id: 1,
                        name: 'test',
                        email: 'test@example.com',
                    },
                ],
            }),
            apiStatusCode: 200,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 推荐：指定泛型类型以获得类型安全
        // 使用 Prisma 生成的类型（根据你的 schema 中的模型名称）
        const capture = await db.findOne<Prisma.TestDataUrlCaptureGetPayload<{}>>(
            'testDataUrlCapture',
            { apiUrl: 'api/users' }
        );
        if (capture) {
            // 现在有完整的类型提示
            console.log('API URL:', capture.apiUrl);
            console.log('Method:', capture.apiMethod);
            console.log('Params:', capture.apiParams ? JSON.parse(capture.apiParams) : null);
            console.log('Request Headers:', capture.apiRequestHeaders ? JSON.parse(capture.apiRequestHeaders) : null);
            console.log('Response Headers:', capture.apiResponseHeaders ? JSON.parse(capture.apiResponseHeaders) : null);
            console.log('Response Body:', capture.apiResponseBody ? JSON.parse(capture.apiResponseBody) : null);
            console.log('Status Code:', capture.apiStatusCode);
            console.log('Created At:', capture.createdAt);
            console.log('Updated At:', capture.updatedAt);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});