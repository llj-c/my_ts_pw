/**
 * 数据生成工具类使用示例
 * 
 * 运行示例：
 * tsx src/utils/data/example.ts
 */

import { fakeDataUtil, generateUser, randomEmail, generateOrderNo } from './fakeDataUtil';
import { testDataUtil, load, save } from './testDataUtil';
import * as path from 'path';
import { PROJECT_ROOT } from '../pathUtil';

// ========== fakeDataUtil 使用示例 ==========

console.log('=== fakeDataUtil 使用示例 ===\n');

// 1. 生成随机用户数据
console.log('1. 生成随机用户数据:');
const user = fakeDataUtil.generateUser();
console.log(user);
console.log();

// 2. 生成指定字段的用户数据
console.log('2. 生成指定字段的用户数据:');
const customUser = generateUser({
    name: '张三',
    email: 'zhangsan@example.com',
});
console.log(customUser);
console.log();

// 3. 生成随机邮箱
console.log('3. 生成随机邮箱:');
console.log(randomEmail());
console.log(randomEmail('company.com'));
console.log();

// 4. 生成随机手机号
console.log('4. 生成随机手机号:');
console.log(fakeDataUtil.randomPhone());
console.log();

// 5. 生成身份证号
console.log('5. 生成身份证号:');
console.log(fakeDataUtil.randomIdCard());
console.log(fakeDataUtil.randomIdCard(undefined, undefined, 'M')); // 男性
console.log();

// 6. 生成订单号
console.log('6. 生成订单号:');
console.log(generateOrderNo('ORD'));
console.log(generateOrderNo('PAY', 'YYYYMMDDHHmmss'));
console.log();

// 7. 生成UUID
console.log('7. 生成UUID:');
console.log(fakeDataUtil.generateUUID());
console.log();

// 8. 生成随机地址
console.log('8. 生成随机地址:');
console.log(fakeDataUtil.randomAddress());
console.log();

// 9. 生成随机公司名称和职位
console.log('9. 生成随机公司名称和职位:');
console.log('公司:', fakeDataUtil.randomCompanyName());
console.log('职位:', fakeDataUtil.randomPosition());
console.log();

// ========== testDataUtil 使用示例 ==========

console.log('\n=== testDataUtil 使用示例 ===\n');

// 创建测试数据目录
const testDataDir = path.join(PROJECT_ROOT, 'src', 'utils', 'data', 'test-data');

// 1. 保存测试数据到JSON文件
console.log('1. 保存测试数据到JSON文件:');
const testUsers = [
    generateUser({ name: '用户1' }),
    generateUser({ name: '用户2' }),
    generateUser({ name: '用户3' }),
];

const jsonFilePath = path.join(testDataDir, 'users.json');
save(jsonFilePath, testUsers);
console.log(`已保存到: ${jsonFilePath}`);
console.log();

// 2. 从JSON文件加载数据
console.log('2. 从JSON文件加载数据:');
const loadedUsers = load(jsonFilePath);
console.log('加载的数据:', loadedUsers);
console.log();

// 3. 使用变量替换
console.log('3. 使用变量替换:');
const templateData = {
    name: '${userName}',
    email: '${userEmail}',
    phone: '13800138000',
};
const templateFilePath = path.join(testDataDir, 'template.json');
save(templateFilePath, templateData);

const replacedData = load(templateFilePath, {
    variables: {
        userName: '李四',
        userEmail: 'lisi@example.com',
    },
});
console.log('替换后的数据:', replacedData);
console.log();

// 4. 数据验证
console.log('4. 数据验证:');
try {
    load(jsonFilePath, {
        validationRules: [
            {
                field: '0.name',
                type: 'required',
                message: '第一个用户必须有名称为',
            },
            {
                field: '0.email',
                type: 'pattern',
                params: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: '邮箱格式不正确',
            },
        ],
    });
    console.log('数据验证通过');
} catch (error) {
    console.log('数据验证失败:', error);
}
console.log();

// 5. CSV文件示例
console.log('5. CSV文件示例:');
const csvData = [
    { name: '张三', age: 25, city: '北京' },
    { name: '李四', age: 30, city: '上海' },
    { name: '王五', age: 28, city: '广州' },
];
const csvFilePath = path.join(testDataDir, 'users.csv');
save(csvFilePath, csvData);
console.log(`已保存CSV到: ${csvFilePath}`);

const loadedCsv = load(csvFilePath);
console.log('加载的CSV数据:', loadedCsv);
console.log();

console.log('示例运行完成！');