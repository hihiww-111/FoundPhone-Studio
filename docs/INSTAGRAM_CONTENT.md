# Instagram 内容接入

主导航只有「主页 / Reels / 个人主页」。旧存档的「私信 / 搜索」会回到主页；`folder: "私信"` 的旧记录仍保留在故事数据中，但不会显示在任何 Instagram 页面。

## Reels（六个视频已接入）

六个本地槽位为 `public/instagram/reels/reel-01.mp4` 至 `reel-06.mp4`，可配同名 `.jpg` 封面。已加入 `stories/template/story.json`，默认按作者指定的上传序号 2 → 1 → 4 → 3 → 6 → 5 播放，文件编号仍对应原上传序号。视频原编码为 H.264/AAC，只重封装为 MP4 并将 moov 前置，未重新压缩画面和声音；移除了容器附加元数据。封面提取自各自的视频。

Reels 顺序固定来自故事数组，网页内不提供排序入口，旧存档 insReelOrder 不再参与排序。

记录使用 `kind: "video"`、`folder: "Reels"`、`media: "/instagram/reels/reel-01.mp4"`。可选 `meta.cover` 为封面路径，`meta.music` 为显示的配乐文字，sender/body/avatar/likes/comments 使用原有字段。`meta.reel: "true"` 也可标记视频。视频应使用移动 Safari 支持的 MP4（H.264/AAC）。只有当前视频播放，默认静音；点画面暂停/继续，声音按钮开启声音。上下滑动、滚轮或方向键切换；退出 App 或切换页面时暂停。

## 主页与个人主页

普通记录显示在首页；`meta.story: "true"` 为快拍。轮播图可在 `meta.images` 中使用安全媒体路径的 JSON 数组。

个人主页只显示 sender 等于机主、outgoing 为 true 或 `meta.owner: "true"` 的记录；陌生人的动态不会被算作机主发帖。可选个人资料记录使用 `meta.profile: "true"`，并配置 `meta.username`、`meta.followers`、`meta.following`、avatar 和 body。未提供粉丝/关注数时显示「—」，不会生成虚假数量。个人资料编辑、点赞、收藏和关注使用现有玩家存档，不改写故事原文。Instagram 的所有点赞数固定显示 999+、评论数固定显示 99+；评论只读且不可打开，无帖子选项或帖子/视频复制入口。个人主页分享仍只复制主页文字，不进入私信或发送给外部账号。

修改素材后运行 story:validate、story:test、build，并检查六个视频的实际解码、手机触屏滑动和退出暂停。
