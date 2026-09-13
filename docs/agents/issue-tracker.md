# Issue tracker: GitHub

仓库：ren2019/share-html-slides。规格和任务使用 GitHub Issues，以 gh CLI 操作；未连接本地 remote 时显式传入 --repo ren2019/share-html-slides。

- 发布规格：创建独立 Issue，正文来自可审阅规格，使用 --body-file 保留换行；设置 ready-for-agent。该标签表示准备好开发拆解或执行，不代表用户授权部署。
- 实施任务：每张票一个 Issue，按依赖顺序创建，写明端到端交付和验收条件，使用 GitHub 原生 blocking 关系；接口不可用时明确写 Blocked by: #编号。
- 读取：gh issue view <编号> --comments；同时检查正文和标签。
- 更新：使用 gh issue edit；讨论用 gh issue comment --body-file。完成并验证后才关闭。
- to-tickets 生成的票据无需再次 triage；只有真实阻塞完成的任务可开始。
- 不因拆分子任务而关闭或改写父规格 Issue。

## Pull requests as a triage surface

PRs as a request surface: no.
