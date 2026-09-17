# 发布者身份与个人材料库（#8）

本切片提供手机号验证注册、密码登录、短信找回密码、退出、持久化会话和本人材料库。发布材料属于后续 #9，本切片没有上传入口。微信扫码尚未实现，不显示有效扫码入口。

## 本地 Node 启动

需要 Node.js 24 LTS、pnpm 11.22.0 和 PostgreSQL 17。复制 `.env.example` 为 `.env`，仅在本机填写配置。`DATABASE_URL` 指向部署者自己的数据库；`BETTER_AUTH_SECRET` 使用至少 32 字符随机值。应用启动时校验这些配置，不能使用默认演示账号或模拟验证码。

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

本地 `APP_URL=http://localhost:3000`。生产使用固定 HTTPS 管理站 origin，配置完成后 `pnpm build`、`pnpm db:migrate`、`pnpm start`。不要把开发服务器用于生产。启动命令从 `.env` 读取配置；迁移脚本也可只使用进程环境变量。迁移可重复执行，按 Drizzle 迁移记录只应用未执行部分。

## Compose 自托管

填写 `.env`：`POSTGRES_PASSWORD` 是自建数据库密码，`DATABASE_URL` 使用 `postgresql://paperplane:<URL编码后的密码>@db:5432/paperplane`，`APP_URL` 是反向代理提供的 HTTPS origin。

```sh
docker compose up --build -d
```

应用只绑定主机 `127.0.0.1:3000`，通过可信 HTTPS 反向代理访问。代理必须覆盖客户端传入的 `X-Forwarded-For` 等转发头，不可直接透传不可信客户端值，也不可将应用端口直接开放到公网：Better Auth 依赖这些头做 IP 限流。每手机号 60 秒发送冷却单独保存在 PostgreSQL，进程重启不清零。

数据库使用命名持久卷。正常停止用 `docker compose down`；不要添加 `-v`，它会删除数据卷。此切片不启动 worker，因为尚无发布/索引后台任务。

备份（输出文件应保存在私有目录）：

```sh
docker compose exec -T db pg_dump -U paperplane -d paperplane -Fc > paperplane.dump
```

恢复到新建的空数据库：先启动数据库，停止 app，使用 `pg_restore` 指定目标数据库并检查退出状态，再启动 app 应用未执行迁移。恢复命令（仅针对空数据库）：

```sh
docker compose exec -T db pg_restore -U paperplane -d paperplane --no-owner --exit-on-error < paperplane.dump
```

首次部署必须实际演练备份恢复，仓库中的 Compose 文件未经当前无 Docker 的开发机运行验证。

## 短信网关契约与接入边界

部署者配置 `SMS_GATEWAY_URL` 和 `SMS_GATEWAY_TOKEN`。应用向该地址发送 `POST`，`Authorization: Bearer <部署密钥>`，JSON 字段为 `phoneNumber`（E.164）、`code`（随机六位码）、`expiresIn`（300 秒）。网关返回 2xx 表示供应商已接受发送，非 2xx、超时或跳转均作为失败处理；网关不得回显或记录验证码。应用不记录密码、验证码或密钥。生产强制网关 HTTPS，10 秒超时，禁止重定向。

这是 HTTP 适配契约，**不是已接通某家真实短信供应商**。部署者仍需让该网关调用选定供应商及已批准的签名/模板。两个配置缺任意一项时，网页禁注册/找回，相关 API 返回 503；已有已验证账号仍能密码登录。普通用户不用提供供应商 key。

服务端先单次消费有效验证码，再以事务写入已验证账号及密码凭据；注册响应不授予会话，网页随后执行密码登录。OTP 5 分钟有效、最多 3 次错误尝试；原生验证码登录、邮箱注册和账号资料变更端点不向外暴露，防止绕过手机号及密码要求。密码重置撤销旧会话，管理 Cookie 为 host-only，查询不接受用户指定其他 ownerId。

待验收：配置真实供应商并实际收码、注册、错误码/超时、找回及重登；HTTPS 部署与反向代理；Docker Compose 实机启动、备份恢复。完成前不得关闭 #8，也不宣称微信渠道或全部认证已交付。

## 自动验证

```sh
pnpm exec playwright install chromium
TEST_DATABASE_URL=postgresql://<user>:<password>@127.0.0.1:<port>/paperplane_test pnpm test
pnpm typecheck
pnpm build
```

`TEST_DATABASE_URL` 必须以 `_test` 数据库名结尾。测试启动会清空该库的账号、材料和认证状态，绝不可指向工作数据库。测试网关仅从 `tests/` 启动，绑定回环地址；它接收并供测试读回随机码，不会发送短信，生产代码不导入它。测试通过网页和公开 HTTP API断言行为，SQL 仅用于准备材料、模拟过期等测试前置状态，不作为验收断言。进程重启测试使用独立 Next.js 子进程。已有 Microsoft Edge 可用 `PLAYWRIGHT_CHANNEL=msedge`。

参考：[Better Auth 手机号插件](https://better-auth.com/docs/plugins/phone-number)、[Drizzle 适配器](https://better-auth.com/docs/adapters/drizzle)。以锁定依赖源码核对单次消费、密码哈希及会话行为，未假定框架提供微信或 CLI 授权。
