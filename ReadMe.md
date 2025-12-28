playwright-ts-auto-test/
├── env/                  # 统一管理所有环境配置文件
│   ├── .env              # 默认环境配置
│   ├── .env.test         # 测试环境配置
│   ├── .env.prod         # 生产环境配置（可选）
│   └── .env.local        # 本地私有配置（.gitignore 忽略）
├── playwright.config.ts  # Playwright 核心配置
├── tsconfig.json         # TypeScript 配置
├── package.json          # 项目依赖及脚本
├── src/                  # 源码目录（公共工具/页面模型）
│   ├── common/           # 公共工具类
│   │   ├── logger.ts     # 日志工具
│   │   ├── utils.ts      # 通用工具（时间、数据处理等）
│   │   └── config.ts     # 配置读取工具
│   ├── page-objects/     # 页面对象模型（POM）
│   │   ├── basePage.ts   # 页面基类（封装公共页面操作）
│   │   ├── homePage.ts   # 首页页面模型
│   │   └── loginPage.ts  # 登录页页面模型
│   └── api/              # 接口请求封装（如需接口自动化/接口关联）
│       ├── baseApi.ts    # 接口基类
│       └── userApi.ts    # 用户相关接口
├── tests/                # 测试用例目录
│   ├── smoke/            # 冒烟测试用例
│   │   └── login.spec.ts # 登录冒烟测试
│   ├── regression/       # 回归测试用例
│   │   └── home.spec.ts  # 首页回归测试
│   └── data/             # 测试数据（JSON/CSV）
│       └── loginData.json # 登录测试数据
├── playwright-report/    # 测试报告输出目录（自动生成）
├── test-results/         # 测试结果缓存目录（自动生成）
└── logs/                 # 日志输出目录（自动生成）