# Instagram 内容接入

主导航只有「主页 / Reels / 个人主页」。旧存档的「私信 / 搜索」会回到主页；`folder: "私信"` 的旧记录仍保留在故事数据中，但不会显示在任何 Instagram 页面。

## Reels（六个视频已接入）

六个本地槽位为 `public/instagram/reels/reel-01.mp4` 至 `reel-06.mp4`，可配同名 `.jpg` 封面。已加入 `stories/template/story.json`，默认按作者指定的上传序号 2 → 1 → 4 → 3 → 6 → 5 播放，文件编号仍对应原上传序号。视频原编码为 H.264/AAC，只重封装为 MP4 并将 moov 前置，未重新压缩画面和声音；移除了容器附加元数据。封面提取自各自的视频。

Reels 顺序固定来自故事数组，网页内不提供排序入口，旧存档 insReelOrder 不再参与排序。

记录使用 `kind: "video"`、`folder: "Reels"`、`media: "/instagram/reels/reel-01.mp4"`。可选 `meta.cover` 为封面路径，`meta.music` 为显示的配乐文字，sender/body/avatar/likes/comments 使用原有字段。`meta.reel: "true"` 也可标记视频。视频应使用移动 Safari 支持的 MP4（H.264/AAC）。只有当前视频播放，每次进入 Reels 默认开启声音；点画面暂停/继续，声音按钮可手动静音。切入 Reels 时在点击事件内同步启动播放，若浏览器阻止自动播放则显示播放按钮供再次点击。上下滑动、滚轮或方向键切换；退出 App 或切换页面时暂停。

## 主页与个人主页

普通记录显示在首页；`meta.story: "true"` 为快拍。轮播图可在 `meta.images` 中使用安全媒体路径的 JSON 数组。

个人主页只显示 sender 等于机主、outgoing 为 true 或 `meta.owner: "true"` 的记录；陌生人的动态不会被算作机主发帖。可选个人资料记录使用 `meta.profile: "true"`，并配置 `meta.username`、`meta.followers`、`meta.following`、avatar 和 body。未提供粉丝/关注数时显示「—」，不会生成虚假数量。个人资料编辑、点赞、收藏和关注使用现有玩家存档，不改写故事原文。原六条 Reels 与普通动态的点赞数固定显示 999+、评论数固定显示 99+；评论不可打开，无帖子选项或帖子/视频复制入口。个人主页分享仍只复制主页文字，不进入私信或发送给外部账号。

修改素材后运行 story:validate、story:test、build，并检查六个视频的实际解码、手机触屏滑动和退出暂停。


## 个人主页发布的三条 Reels

三个独立槽位为 `public/instagram/profile-reels/reel-01.mp4` 至 `reel-03.mp4`，配同名 JPG 封面。记录标记 `meta.profileReel: "true"` 和 `meta.owner: "true"`；按上传顺序仅显示在个人主页Reels 子标签中，首页不显示这组三条预览，不加入原六条推荐视频流。

点击缩略图后进入共享的 Reels 全屏播放器，只在这三条中滑动；左上角可返回网格。原六条播放顺序和固定数字不受影响。三条点赞数分别为 123 / 152 / 99；评论数直接来自各自 comments 数组（2 / 3 / 1），可打开只读评论面板，内容保留作者原文，不提供发表评论或私信入口。


## 当前账号资料

账号 ID 与主页显示名为 `404NOTFound`，粉丝 333、关注 0，使用 `public/instagram/avatar.jpg`（作者提供的 HEIC 图片转换为 JPEG，移除附加元数据）作为 Instagram 内的机主头像。角色姓名仍由原 phone.owner 提供。个人主页不显示发现用户、新建内容或新建精选快拍入口；已有快拍内容保留。


## 图片帖子

个人主页「帖子」仅显示 ownPosts，三列网格只显示每条帖子的首图，多图帖子带叠图标记；Reels 仅显示在个人主页 Reels 子标签中。图片帖子同时进入首页动态。点击网格展开后与首页共享图片轮播，可左右滑动或用左右方向键翻图。

第一条帖子 id 为 instagram-post-01，配文为「摸摸小狗爪」，包含作者依次上传的 IMG_3704.jpg、IMG_3705.jpg。素材位于 public/instagram/posts/post-01/photo-01.jpg 和 photo-02.jpg，meta.images 保存顺序，meta.aspectRatio 为 1（方图完整显示）。后续帖子沿用独立 post-XX/photo-XX.jpg 目录，不合并成多条重复动态。

Instagram 帖子不显示发布时间（保留底层 time 数据供故事引擎使用）。首页无动态通知爱心入口，个人主页无三杆菜单。点赞爱心仍保留。
