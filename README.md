# parkpostpilot
# 个人工具-留园发帖小助手

## 简介：

一直以来留园发帖是个老大难的问题，尤其是对于一些新手，发帖太繁琐。对于老手，发帖也挠头，自己发的帖子一不小心就乱了，有时候明明编辑的好好的，发出来巨丑。
开发这个小工具的目的，是使得留园发帖更加的简单智能好看。以下是一些初步的设想，有些可能不切实际，但不少我觉得都是可以实现的。我已经实现或者知道如何实现的功能用✅表示

### 更简单
发帖的时候只需要输入视频链接跟图片链接，不需要再进行手动嵌入。

- ✅自动检测 YouTube，转换成 HTML 嵌入代码
- ✅自动检测 sendvid，转换成 HTML 嵌入代码
- ✅自动检测图片连接，转换为 HTML 代码

### 更智能

- ✅繁简体转换
- 自动检测 UBB 代码，转换成对应的 HTML 代码
- ✅根据用户的设定，对于粘贴内容自动的分离出标题，智能选择帖子类型
 - 硬写入是很简单的，如何让不动代码的朋友也可以方便设置是难题
- 增加快捷键，方便对选择的文本进行加粗加下划线或者是切换标题格式
- 发布之前，先检测是否有未合上的html代码，防止发布时被吞掉

### 更好看

- 对于某些不必要的空格进行删除与调整
- 直接生成 HTML 代码，防止在后台转换时被搞乱
- 发帖模板
   - 不同的帖子制作不同风格的模板，根据风格，将发布的文字图片放入合适的背景
- 内置一套自己的 UBB 代码，方便让某些内容以更加独特的风格显示，比如： `[code][/code]` 代码
`[quote][/quote]` 引用

## 代码：
代码我已经分享到下面的地址，目前正在探索中，并不是已经可以用的，有兴趣的朋友可以看看。欢迎大家发表自己的想法建议，或者是一起开发。
- greasyfork:
https://greasyfork.org/zh-CN/scripts/485852-%E4%B8%AA%E4%BA%BA%E5%B7%A5%E5%85%B7-%E7%95%99%E5%9B%AD%E5%8F%91%E5%B8%96%E5%B0%8F%E5%8A%A9%E6%89%8B
- github:
https://github.com/cbayl/parkpostpilot/
- github脚本地址：
https://github.com/cbaly/parkpostpilot/main/main.user.js
