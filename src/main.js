// 找到要执行的核心文件

// 1. 要解析用户的参数
const program = require('commander');
const path = require('path');
// 配置指令命令
const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'tdsp-cli create <project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'tdsp-cli config set <k><v>',
      'tdsp-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};
// 配置命令
Reflect.ownKeys(mapActions).forEach((action) => {
  program
    .command(action) // 配置命令的名字
    .alias(mapActions[action].alias) // 命令的别名
    .description(mapActions[action].description) // 命令对应的描述
    .action(() => {
      // 访问不到对应的命令 就打印找不到命令
      if (action === '*') {
        console.log(mapActions[action].description);
      } else {
        // 截取命令
        // td-cli create xxx // [node,td-cli,create,xxx]
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    });
});
// 监听用户的help事件
program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(`${example}`);
    });
  });
});

// 导入版本号
const {
  version,
} = require('./constants');
// 解析用户传递过来的参数
// program.parse(process.argv);
program.version(version).parse(process.argv);
