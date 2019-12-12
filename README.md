# 手写脚手架

前言:vue-cli主要功能是拉取模版，模版里面配置的是webpack。

Eslint配置

公司中用脚手架的一系列问题

- 业务**类型多**
  - 每个团队都有自己积累下来的东西
  - 比如说拉app的一些方法 jsSDK等 团队工具方法
  - 每次都是从零生成 各种配置 和 移动端适配方案
  - 常用比如日期格式化、防抖截流函数、url拼接等.....
  - 一般axios会进行二次封装更好用
  - 拿到这个项目直接进行业务开发  几乎不用配置
- 多次造轮子，**项目升级**等问题
- 公司代码**规范**,无法统一

## 1.必备模块

vue-cli用哪些npm实现的:

- **commander** ：参数解析 --help其实就借助了他

- **inquirer** ：交互式命令行工具，有他就可以实现命令行的选择功能
- **download-git-repo** ：在git中下载模板
- **chalk** ：粉笔帮我们在控制台中画出各种各样的颜色
- **metalsmith** ：读取所有文件,实现模板渲染

- **consolidate** :  统一模板引擎 

实现的功能:

```js
// 根据模板初始化项目
td-cli create project-name
// 初始化配置文件
td-cli config set repo repo-name
```

项目发布

```js
nrm use npm  // 准备发布包
npm addUser  // 填写账号密码
npm publish  // 已经发布成功
```

## 2.工程创建

### 2.1 创建文件夹

- 整个文件目录

```js
├── bin 
│ └── www // 全局命令执行的根文件 
├── package.json 
├── src 
│ ├── constants.js // 存放常量
│ ├── create.js // create命令逻辑 
│ ├── config.js // config命令逻辑 
│ ├── main.js // 入口文件 
│ └── utils // 存放工具方法 
│── .huskyrc // git hook 
│── .eslintrc.json // 代码规范校验
```

### 2.2 初始化项目配置全局包

- 初始化package.json

- ```js
  npm init -y
  ```

- package.json中设置在命令下执行td-cli时调用bin目录下的www文件

  ```js
  "bin": { 
      "td-cli": "./bin/www"
   }
  ```

- www文件中使用main作为入口文件, 并且以node环境执行此文件

  ```js
  #! /usr/bin/env node
  require('../src/main.js');
  ```

- 链接包到全局下使用 

  ```js
  npm link
  ```

​       测试成功的命令行中使用td-cli命令,并且可以执行main.js文件

### 2.3 使用commander

- 安装模块

  ```js
  npm install commander
  ```

- main.js 就是我们的入口文件

  ```js
  // main.js
  const program = require('commander')
  
  program.version('0.0.1').parse(process.argv) //process.argv 就是用户在命令行中传入的参数
  ```

  执行 `td-cli --help` 命令是不是有提示

- 动态获取版本号

  ```js
  const program = require('commander')
  const {version} = require('./utils/constants')
  program.version(version).parse(process.argv)
  ```

### 2.4 配置指令命令

根据我们想要实现的功能配置执行动作,遍历产生对应的命令

```js
// 配置3个指令命令
const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'td-cli create <project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'td-cli config set <k><v>',
      'td-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};
// 循环创建命令
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
        console.log(action);
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
```

### 2.5 create命令

create命令的主要作用就是去git仓库中拉取模板并下载对应的版本到本地，如果有模板则根据用户填写 

的信息渲染好模板，生成到当前运行命令的目录下~ 

```js
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
```

根据不同的动作,动态引入对应模块的文件

```js
// 创建create.js
module.exports = async (projectName) => {
  console.log(projectName);
};
```

执行td-cli  create  project 可以打印出project

### 2.6 拉去项目

我们需要获取仓库中的所有模版信息,我的模版全部放在了git上,这里就以git为例，通过axios取获取相关信息

```js
npm i axios
```

拉取github上的仓库模版

```js
const axios = require('axios');
// 获取仓库列表
const fetchRepoList = async () => {
  // 获取当前组织中的所有仓库信息，这个仓库中存放的都是项目模版
  const {
    data,
  } = await axios.get('https://api.github.com/orgs/zhu-cli/repos');
  return data;
};
module.exports = async () => {
  let repos = await fetchRepoList();
  repos = repos.map((item) => item.name);
  console.log(repos);
};
```

### 2.7 inquirer&ora

我们来解决上面提到的问题

```js
npm i inquirer ora // 安装模版
```

```js
module.exports = async () => {
  const spinner = ora('fetching template .....');
  spinner.start(); // 开始loading
  let repos = await fetchRepoList();
  spinner.succeed(); // 结束loading
  // 选择模版
  repos = repos.map((item) => item.name);
  const {
    repo,
  } = await Inquirer.prompt({
    name: 'repo', // 获取选择后的结果
    type: 'list', // 什么方式显示在命令行
    message: 'please choise a template to create project', // 提示信息
    choices: repos, // 选择的数据
  });
  console.log(repo);
};
```

我们看到的命令行中选择的功能基本都是基于inquirer实现的 可以实现不同的询问方式

### 2.8 获取版本信息

每次都需要开启loading、关闭loading,重复代码进行封装

```js
const wrapFetchAddLoding = (fn, message) => async (...args) => { 
  const spinner = ora(message);
  spinner.start(); // 开始loading
  const result = await fn(...args);
  spinner.succeed(); // 结束loading
  return result; 
};
```

获取版本信息

```js
// 获取对应的版本号
let tags = await waitFnloading(fetchTagList, 'fetching tags ......')(repo);
tags = tags.map((item) => item.name);
  // 选择版本号
const {
    tag,
  } = await Inquirer.prompt({
    name: 'tag', // 获取选择后的结果
    type: 'list', // 什么方式显示在命令行
    message: 'please choise tags to create project', // 提示信息
    choices: tags, // 选择的数据
});
```

### 2.9 下载项目

下载前先找个临时目录存放下载的文件

```js
// constants.js
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;
module.exports = {
  version, 
  downloadDirectory,
};
```

已经成功获取到了项目模版名称和对应的版本,那我们就可以直接下载

```js
npm i download-git-reop
```

很遗憾的是这个方法不是promise方法,没关系我们自己包装下

```js
const {promisify} = require('util');
let downloadGitRepo = require('download-git-repo');
downloadGitRepo = promisify(downloadGitRepo);
const {downloadDirectory} = require('./constants');
```

我们将文件下载到当前用户的.template文件中,由于系统的不同目录获取方式不一样,process.platform在window下获取的是win32 我这里是mac所有获取的值是drawin,在根据对应的环境变量获取到用户目录

```js
const download = async (repo, tag) => { 
let api = `zhu-cli/${repo}`;  // 下载项目 
if (tag) {
	api += `#${tag}`;
}
const dest = `${downloadDirectory}/${repo}`;  // 将模板下载到对应的目录中 
await downLoadGit(api, dest);
return dest; // 返回下载目录
};
// 下载项目
const target = await wrapFetchAddLoding(download, 'download template')(repo, tag);
```

如果对于简单的项目可以直接把下载好的项目拷贝到当前执行命令的目录下即可

安装ncp可以实现文件的拷贝功能

```js
npm i ncp
```

像这样

```js
let ncp = require('ncp');
ncp = promisify(ncp);
// 将下载的文件拷贝到当前执行命令的目录下
await ncp(target, path.join(path.resolve(), projectName));
```

当然这里可以做的更严谨一些，判断一下当前目录下是否有重名文件等...., 还有很多细节也需要考虑像多次创建项目是否要利用已经下载好的模版,大家可以自由的发挥

### 2.10 模版编译

刚才说的是简单文件,那当然直接拷贝就好了,但是有的时候用户可以定制下载模版中的内容,拿`package.json`文件为例,用户可以根据提示给项目名称、设置描述等

项目模版中增加了ask.js

```js
module.exports = [ {
      type: 'confirm',
      name: 'private',
      message: 'ths resgistery is private?',
},
...
]
```

根据相对应的询问生成最终的`package.json`

下载模版中使用ejs模版

```js
{
"name": "vue-template", 
"version": "0.1.2", 
"private": "<%=private%>",
"scripts": {
  "serve": "vue-cli-service serve", 
  "build": "vue-cli-service build"
  },
"dependencies": {
  "vue": "^2.6.10" },
    "autor":"<%=author%>",
    "description": "<%=description%>",
    "devDependencies": {
  "@vue/cli-service": "^3.11.0",
  "vue-template-compiler": "^2.6.10" },
    "license": "<%=license%>"
}
```

> 写到这里，大家应该想到了!核心原理就是将下载的模板文件，依次遍历根据用户填写的信息渲 染模板，将渲染好的结果拷贝到执行命令的目录下 

安装需要用到的模块

```js
npm i metalsmith ejs consolidate
```

```js
const MetalSmith = require('metalsmith'); // 遍历文件夹 
let { render } = require('consolidate').ejs;
render = promisify(render); // 包装渲染方法
// 没有ask文件说明不需要编译
if (!fs.existsSync(path.join(result, 'ask.js'))) {
    await ncp(result, path.resolve(projectName));
  } else {
    console.log('复杂模版');
    // 复杂的需要模版渲染 渲染后在拷贝
    // 把git上的项目下载下来 如果有ask 文件就是一个复杂的模版,
    // 我们需要用户选择, 选择后编译模版
    // 1.让用户填信息
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname) // 如果你传入路径 他默认会遍历当前路径下的src文件夹
        .source(result)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const args = require(path.join(result, 'ask.js'));
          const obj = await Inquirer.prompt(args);
          const meta = metal.metadata();
          Object.assign(meta, obj);
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          const obj = metal.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            // 这个是要处理的
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString(); // 文件内容
              if (content.includes('<%')) {
                content = await render(content, obj);
                files[file].contents = Buffer.from(content); // 渲染
              }
            }
          });
          // 根据用户的输入 下载模版
          console.log(metal.metadata());
          done();
        })
        .build((err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  }
```

> 这里的逻辑就是上面描述的那样,实现了模版替换！到此安装项目的功能就完成了。





