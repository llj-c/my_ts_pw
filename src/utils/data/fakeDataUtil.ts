/**
 * 假数据生成工具
 * 
 * 功能：
 * - 生成随机用户名、邮箱、手机号、身份证号
 * - 生成随机字符串、数字、日期
 * - 生成随机地址、公司名称、职位
 * - 生成符合特定格式的数据（如：UUID、订单号、流水号）
 * 
 * 使用场景：
 * - 测试数据准备：快速生成大量测试数据
 * - 表单填写：自动填充表单字段
 * - 边界测试：生成超长字符串、特殊字符等
 * - 性能测试：批量生成测试数据
 */

/**
 * 用户数据接口
 */
export interface UserData {
    name: string;
    email: string;
    phone: string;
    idCard?: string;
    address?: string;
    company?: string;
    position?: string;
}

/**
 * 假数据生成工具类
 */
export class FakeDataUtil {
    // 中文姓氏
    private static readonly SURNAMES = [
        '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
        '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
        '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧'
    ];

    // 中文名字常用字
    private static readonly GIVEN_NAMES = [
        '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军',
        '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平',
        '刚', '桂英', '建华', '文', '华', '红', '建国', '桂兰', '志强', '梅'
    ];

    // 公司名称后缀
    private static readonly COMPANY_SUFFIXES = [
        '有限公司', '股份有限公司', '科技公司', '贸易公司', '实业公司',
        '集团', '企业', '工作室', '咨询公司', '服务公司'
    ];

    // 职位名称
    private static readonly POSITIONS = [
        '软件工程师', '产品经理', 'UI设计师', '测试工程师', '项目经理',
        '前端开发', '后端开发', '运维工程师', '数据分析师', '运营专员',
        '销售经理', '市场专员', '人事专员', '财务专员', '客服专员'
    ];

    // 城市列表
    private static readonly CITIES = [
        '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉',
        '西安', '重庆', '天津', '苏州', '长沙', '郑州', '青岛', '大连'
    ];

    // 区县列表
    private static readonly DISTRICTS = [
        '朝阳区', '海淀区', '西城区', '东城区', '丰台区', '石景山区',
        '通州区', '昌平区', '大兴区', '房山区', '顺义区', '怀柔区'
    ];

    // 街道列表
    private static readonly STREETS = [
        '中关村大街', '建国门外大街', '王府井大街', '西单北大街',
        '长安街', '复兴路', '建国路', '朝阳路', '海淀路', '学院路'
    ];

    /**
     * 生成随机整数
     * @param min 最小值（包含）
     * @param max 最大值（包含）
     * @returns 随机整数
     */
    static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 生成随机浮点数
     * @param min 最小值
     * @param max 最大值
     * @param decimals 小数位数，默认2位
     * @returns 随机浮点数
     */
    static randomFloat(min: number, max: number, decimals: number = 2): number {
        const value = Math.random() * (max - min) + min;
        return parseFloat(value.toFixed(decimals));
    }

    /**
     * 生成随机字符串
     * @param length 字符串长度
     * @param includeNumbers 是否包含数字，默认true
     * @param includeSpecialChars 是否包含特殊字符，默认false
     * @returns 随机字符串
     */
    static randomString(
        length: number = 10,
        includeNumbers: boolean = true,
        includeSpecialChars: boolean = false
    ): string {
        let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers) {
            chars += '0123456789';
        }
        if (includeSpecialChars) {
            chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }

        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 生成随机中文姓名
     * @returns 随机中文姓名
     */
    static randomChineseName(): string {
        const surname = this.SURNAMES[this.randomInt(0, this.SURNAMES.length - 1)];
        const givenNameLength = this.randomInt(1, 2); // 1-2个字的名字
        let givenName = '';
        for (let i = 0; i < givenNameLength; i++) {
            givenName += this.GIVEN_NAMES[this.randomInt(0, this.GIVEN_NAMES.length - 1)];
        }
        return surname + givenName;
    }

    /**
     * 生成随机邮箱
     * @param domain 邮箱域名，默认随机生成
     * @returns 随机邮箱地址
     */
    static randomEmail(domain?: string): string {
        const username = this.randomString(8, true, false).toLowerCase();
        const domains = domain
            ? [domain]
            : ['gmail.com', 'qq.com', '163.com', 'sina.com', 'outlook.com', 'hotmail.com'];
        const selectedDomain = domains[this.randomInt(0, domains.length - 1)];
        return `${username}@${selectedDomain}`;
    }

    /**
     * 生成随机手机号（中国大陆）
     * @returns 随机手机号
     */
    static randomPhone(): string {
        const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
            '150', '151', '152', '153', '155', '156', '157', '158', '159',
            '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
        const prefix = prefixes[this.randomInt(0, prefixes.length - 1)];
        const suffix = String(this.randomInt(10000000, 99999999));
        return prefix + suffix;
    }

    /**
     * 生成随机身份证号（中国大陆，18位）
     * @param areaCode 地区代码，默认随机
     * @param birthDate 出生日期，格式 YYYYMMDD，默认随机
     * @param gender 性别，'M'男 'F'女，默认随机
     * @returns 随机身份证号
     */
    static randomIdCard(
        areaCode?: string,
        birthDate?: string,
        gender?: 'M' | 'F'
    ): string {
        // 地区代码（6位）
        const area = areaCode || String(this.randomInt(110000, 659999));
        
        // 出生日期（8位）
        const birth = birthDate || this.randomDate(
            new Date(1970, 0, 1),
            new Date(2000, 11, 31)
        ).toISOString().slice(0, 10).replace(/-/g, '');

        // 顺序码（3位）
        const sequence = gender
            ? (gender === 'M' ? this.randomInt(1, 999) : this.randomInt(0, 998))
            : this.randomInt(0, 999);
        const sequenceStr = String(sequence).padStart(3, '0');

        // 前17位
        const first17 = area + birth + sequenceStr;

        // 计算校验码（第18位）
        const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
        let sum = 0;
        for (let i = 0; i < 17; i++) {
            sum += parseInt(first17[i]) * weights[i];
        }
        const checkCode = checkCodes[sum % 11];

        return first17 + checkCode;
    }

    /**
     * 生成随机日期
     * @param start 开始日期
     * @param end 结束日期
     * @returns 随机日期对象
     */
    static randomDate(start: Date, end: Date): Date {
        const startTime = start.getTime();
        const endTime = end.getTime();
        const randomTime = this.randomInt(startTime, endTime);
        return new Date(randomTime);
    }

    /**
     * 生成随机地址
     * @param includeDetail 是否包含详细地址，默认true
     * @returns 随机地址
     */
    static randomAddress(includeDetail: boolean = true): string {
        const city = this.CITIES[this.randomInt(0, this.CITIES.length - 1)];
        const district = this.DISTRICTS[this.randomInt(0, this.DISTRICTS.length - 1)];
        const street = this.STREETS[this.randomInt(0, this.STREETS.length - 1)];
        
        let address = `${city}${district}${street}`;
        if (includeDetail) {
            const number = this.randomInt(1, 999);
            address += `${number}号`;
        }
        return address;
    }

    /**
     * 生成随机公司名称
     * @returns 随机公司名称
     */
    static randomCompanyName(): string {
        const prefixes = ['北京', '上海', '深圳', '杭州', '广州', '成都', '武汉', '西安'];
        const prefix = prefixes[this.randomInt(0, prefixes.length - 1)];
        const name = this.randomString(3, false, false);
        const suffix = this.COMPANY_SUFFIXES[this.randomInt(0, this.COMPANY_SUFFIXES.length - 1)];
        return `${prefix}${name}${suffix}`;
    }

    /**
     * 生成随机职位
     * @returns 随机职位名称
     */
    static randomPosition(): string {
        return this.POSITIONS[this.randomInt(0, this.POSITIONS.length - 1)];
    }

    /**
     * 生成用户数据
     * @param options 用户数据选项
     * @returns 用户数据对象
     */
    static generateUser(options: Partial<UserData> = {}): UserData {
        return {
            name: options.name || this.randomChineseName(),
            email: options.email || this.randomEmail(),
            phone: options.phone || this.randomPhone(),
            idCard: options.idCard !== undefined ? options.idCard : this.randomIdCard(),
            address: options.address !== undefined ? options.address : this.randomAddress(),
            company: options.company !== undefined ? options.company : this.randomCompanyName(),
            position: options.position !== undefined ? options.position : this.randomPosition(),
        };
    }

    /**
     * 生成UUID（简化版，符合UUID v4格式）
     * @returns UUID字符串
     */
    static generateUUID(): string {
        const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        return template.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * 生成订单号
     * @param prefix 订单号前缀，默认'ORD'
     * @param dateFormat 日期格式，默认'YYYYMMDD'
     * @returns 订单号
     */
    static generateOrderNo(prefix: string = 'ORD', dateFormat: string = 'YYYYMMDD'): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        let dateStr = dateFormat
            .replace('YYYY', String(year))
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);

        const randomSuffix = this.randomInt(10000, 99999);
        return `${prefix}${dateStr}${randomSuffix}`;
    }

    /**
     * 生成流水号
     * @param prefix 流水号前缀
     * @param length 流水号总长度（不包含前缀）
     * @returns 流水号
     */
    static generateSerialNo(prefix: string = '', length: number = 10): string {
        const randomPart = String(this.randomInt(0, Math.pow(10, length) - 1)).padStart(length, '0');
        return prefix + randomPart;
    }

    /**
     * 生成随机数组元素
     * @param array 数组
     * @returns 随机元素
     */
    static randomArrayElement<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error('数组不能为空');
        }
        return array[this.randomInt(0, array.length - 1)];
    }

    /**
     * 生成随机数组（从给定数组中随机选择）
     * @param array 源数组
     * @param count 要选择的元素数量
     * @param allowDuplicate 是否允许重复，默认false
     * @returns 随机数组
     */
    static randomArray<T>(array: T[], count: number, allowDuplicate: boolean = false): T[] {
        if (count > array.length && !allowDuplicate) {
            throw new Error(`无法从长度为 ${array.length} 的数组中不重复地选择 ${count} 个元素`);
        }

        const result: T[] = [];
        const usedIndices = new Set<number>();

        for (let i = 0; i < count; i++) {
            let index: number;
            if (allowDuplicate) {
                index = this.randomInt(0, array.length - 1);
            } else {
                do {
                    index = this.randomInt(0, array.length - 1);
                } while (usedIndices.has(index));
                usedIndices.add(index);
            }
            result.push(array[index]);
        }

        return result;
    }
}

// 导出单例实例，方便直接使用
export const fakeDataUtil = new FakeDataUtil();

// 导出所有静态方法作为函数，提供更灵活的调用方式
export const {
    randomInt,
    randomFloat,
    randomString,
    randomChineseName,
    randomEmail,
    randomPhone,
    randomIdCard,
    randomDate,
    randomAddress,
    randomCompanyName,
    randomPosition,
    generateUser,
    generateUUID,
    generateOrderNo,
    generateSerialNo,
    randomArrayElement,
    randomArray,
} = FakeDataUtil;