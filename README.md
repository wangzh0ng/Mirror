# UnstolenHappiness
我的快乐，你只能围观，这次谁也别想轻易偷走

## 本地执行

```shell
# 第一种本地执行方式
npm run dotenv source_of_happiness.js
# 第二种本地执行方式
node -r dotenv/config source_of_happiness.js
```

### 执行配置

需要在根目录下创建`.env`文件

```js
# 配置要执行的主脚本路径,支持本地也支持远程
SYNC_URL=./data/songyangzz/elemSign.js
# 核心处理库,仅限JSON格式
CORE_URL={"url":"./data/core_encrypt.h", "path":"./core.js", "tip_name":"核心数据", "type":"local", "decrypt":true}
# 额外需要引入的脚本,仅限JSON格式
EXTEND_URL=***
# 替换,json格式BASE64Encode,替换内容是全局替换
# [{"match":"匹配文本","replace":"替换文本","desc":"替换描述","cipher":"有值的显示此,不显示描述内容"},"condition":"匹配文本前提(包含条件文件)"]
SMART_REPLACE=***
POINT_REPLACE=***

# 用于解密加密脚本的
AES_IV=***
AES_KEY=***


# 用于配置要运行的手机脚本别名,用于COOKIE前缀,仅用于不支持NODE的脚本
MODE_QX=ELEM
# 例如脚本中读取的Cookie名为cookie_elem,则我们用MODE_QX的值加下划线来确定名称
ELEM_cookie_elem=***

# 京东主要数据
JD_COOKIE=***
JD_USER_AGENT=***
JS_USER_AGENT=***
# 京东脚本配置
JOY_FEED_COUNT=80
MARKET_COIN_TO_BEANS=20
PET_NOTIFY_CONTROL=true
SUPERMARKET_LOTTERY=true
SUPERMARKET_UPGRADE=true
UN_SUBSCRIBES=50&50
BUSINESS_CIRCLE_JUMP=true
FRUIT_BEAN_CARD=false
JD_BEAN_SIGN_NOTIFY_SIMPLE=true
```

