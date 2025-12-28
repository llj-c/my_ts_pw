import * as path from 'path';

// 方法1：逐级向上追溯（推荐，不受文件层级变动影响）
// 从当前文件出发，向上找到包含 package.json 的目录（即项目根）
function getProjectRootPath(): string {
    let currentPath = __dirname;
    // 循环向上查找，直到找到 package.json
    while (true) {
        // 拼接当前目录下的 package.json 路径
        const packageJsonPath = path.join(currentPath, 'package.json');
        try {
            // 尝试访问 package.json，存在则返回当前目录（根目录）
            require.resolve(packageJsonPath);
            return currentPath;
        } catch (err) {
            // 不存在则向上一级目录
            const parentPath = path.dirname(currentPath);
            // 到达磁盘根目录仍未找到，抛出异常
            if (parentPath === currentPath) {
                throw new Error('未找到项目根目录（未发现 package.json）');
            }
            currentPath = parentPath;
        }
    }
}

export const PROJECT_ROOT: string = getProjectRootPath() || process.env.PROJECT_ROOT || process.cwd();