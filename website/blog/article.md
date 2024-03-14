---
title: "我用 Python 做了一个轻松爬取各大网站文章并输出为 Markdown 的工具！"
description: "Your summary here"
publishdate: 2023-08-06
authors: 
  name: 周三不Coding
  title: 公众号：周三不Coding @ByteDance
  url: https://juejin.cn/user//user/290747477393821/posts
  image_url: https://p6-passport.byteacctimg.com/img/user-avatar/8e61b75d2b46480f7c34ffc8f980962b~200x200.awebp
tags: ["Python", "爬虫", "Markdown"]
summary: >-
  Your summary here
---
 #  我用 Python 做了一个轻松爬取各大网站文章并输出为 Markdown 的工具！ 



## 前言

大家好，我是「周三不Coding」。

最近摸鱼看技术文章的时候，突然想到了两个需求，想与大家分享一下：

  1. 爬取各大技术网站的文章，转化为 Markdown 格式，防止文章由于不明原因下架。这样可以在本地保存一些高质量文章。
  2. 整理自己过去发布的文章。（我之前写的一些文章并没有在本地备份）



说干就干，我用了几个小时，编写并发布了一个文章爬取工具：Article Crawler，

接下来，我给大家分享一下我的制作过程！

> 其中包含详细的 README 文档
> 
> Github 地址：[github.com/ltyzzzxxx/a…](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fltyzzzxxx%2Farticle_crawler "https://github.com/ltyzzzxxx/article_crawler")
> 
> PyPi 地址：[pypi.org/project/art…](https://link.juejin.cn?target=https%3A%2F%2Fpypi.org%2Fproject%2Farticle-crawler "https://pypi.org/project/article-crawler")

## 需求分析与技术选型

对于爬取类的需求来说，我毫不犹豫地选择了 Python 来编写代码，毕竟一提到爬虫，大家第一反应就是 Python。它确实很方便，提供了很多方便快捷的包。

我们首先拆解一下需求，来确定最终需要使用的 Python 包。

  1. 从某个网站中爬取文章，需要定位文章的位置。网站中除了文章信息之外，可能还有推荐信息、作者信息、广告信息等。因此，我们需要将整个网站内容爬取下来，并从中搜索得出文章的内容。
  2. 将 HTML 文章内容转换 Markdown 格式，并输出到本地指定目录中。



对于第一个需求，我们使用 request 与 BeautifulSoup 包。

  * 使用 request 包向指定网站发送请求，获取其 HTML 内容。

  * 使用 BeautifulSoup 包在指定 HTML 内容中，查找对应的文章内容。

> [Beautiful Soup](https://link.juejin.cn?target=http%3A%2F%2Fwww.crummy.com%2Fsoftware%2FBeautifulSoup%2F "http://www.crummy.com/software/BeautifulSoup/") 是一个可以从 HTML 或 XML 文件中提取数据的 Python 库。它能够通过你喜欢的转换器实现惯用的文档导航 / 查找 / 修改文档的方式。Beautiful Soup 会帮你节省数小时甚至数天的工作时间。




对于第二个需求，我们使用 html2text 包。

  * 使用 html2text 包，将指定的 HTML 文章内容，渲染为对应的 Markdown 格式。



总结技术栈如下：

技术栈| 作用  
---|---  
request| 向指定网站发送请求，获取 HTML 内容  
BeautifulSoup (bs4)| 快速从 HTML 内容中依据指定条件查找内容  
html2text| 将指定的 HTML 内容染为 Markdown 格式  
  
## 实现方案

实现流程图如下：

![whiteboard_exported_image (19).png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/79eb0d30caed4cd78a7b0abe3bf870ee~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?) 

对于这一系列流程，我将其抽象为一个类 `ArticleCrawler`。

> 具体代码位于 `article_crawler/article_crawler.py` 文件中

其初始化 `__init__` 方法如下：
    
    
    ```python
    def __init__(self, url, output_folder, tag, class_, id=''):
        self.url = url
        self.headers = {
            'user-agent': random.choice(USER_AGENT_LIST)
        }
        self.tag = tag
        self.class_ = class_
        self.id = id
        self.html_str = html_str
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
            print(f"{output_folder} does not exist, automatically create...")
        self.output_folder = output_folder
    
    ```

  * `url`：指定网站地址

  * `output_folder`：输出目录

  * `tag / class_ / id`：用于定位文章在网站中所处的位置。

    * 举个🌰，我们通过 `F12` 打开网站控制台，定位文章被该标签包裹：`<div id="article_content" class="article_content clearfix"></div>`

在这里，对应的 `tag` 为 `div`，`class_` 为 `article_content clearfix`，`id` 为 `article_content`。




类中主要包含如下 3 个方法：

  * send_request：向指定网站发送请求，获取其 HTML 内容。
    
        ```python
    def send_request(self, url):
        response = requests.get(url=url, headers=self.headers)
        response.encoding = "utf-8"
        if response.status_code == 200:
            return response
    
    ```

  * parse_detail：通过 BeautifulSoup 定位文章位置，获取到对应的 HTML 内容。
    
        ```python
    def parse_detail(self, response):
        html = response.text
        soup = BeautifulSoup(html, 'lxml')
        content = soup.find(self.tag, id=self.id, class_=self.class_)
        html = self.html_str.format(article=content)
        self.write_content(html, 'article')
    
    ```

  * write_content：将 HTML 和 渲染得到的 Markdown 文本写入到指定的目录 `output_folder` 中。
    
        ```python
    def write_content(self, content, name):
        if not os.path.exists(self.output_folder + '/HTML'):
            os.makedirs(self.output_folder + '/HTML')
        if not os.path.exists(self.output_folder + '/MD'):
            os.makedirs(self.output_folder + '/MD')
        name = self.change_title(name)
        html_path = os.path.join(self.output_folder, "HTML", name + ".html")
        md_path = os.path.join(self.output_folder, "MD", name + ".md")
    ​
        with open(html_path, 'w', encoding="utf-8") as f:
            f.write(content)
            print(f"create {name}.html in {self.output_folder} successfully")
    ​
        html_text = open(html_path, 'r', encoding='utf-8').read()
        markdown_text = html2text.html2text(html_text)
        with open(md_path, 'w', encoding='utf-8') as file:
            file.write(markdown_text)
            print(f"create {name}.md in {self.output_folder} successfully")
    
    ```




## 优化

在 `ArticleCrawler` 中，我们需要自己去网站中查找文章元素，并指定 `tag / class_ / id` 属性，这样比较麻烦。

日常学习中，我们会经常使用几个网站，如：CSDN、掘金、知乎、简书等，于是我将这几个常用的网站抽取成单独的类，作为 `ArticleCrawler` 的子类。

其中需要改变的方法为 `__init__` 与 `parse_detail`，将 `tag / class_ / id` 属性写死，不需要人为指定。

## 命令方式运行

我们通过命令的方式使用该工具，因此我们需要指定一个程序入口 `__main__` 文件：

  * 我们通过 OptionParser，指定命令参数详情，其中包含包描述、版本号、参数简写、参数名、帮助手册等信息。


    
    
    ```python
    if __name__ == '__main__':
        from optparse import OptionParser
    ​
        parser = OptionParser(prog=prog, description=description, version='%prog ' + version, usage=usage)
        parser.add_option("-u", "--url", dest="url", help="crawled url (required)")
        parser.add_option("-t", "--type", dest="type", default="",
                          help="crawled article type [csdn] | [juejin] | [zhihu] | [jianshu]")
        parser.add_option("-o", "--output_folder", dest="output_folder",
                          help="output html / markdown / pdf folder (required)")
        parser.add_option("-w", "--website_tag", dest="website_tag",
                          help="position of the article content in HTML (not required if 'type' is specified)")
        parser.add_option("-c", "--class", dest="class_", default="",
                          help="position of the article content in HTML (not required if 'type' is specified)")
        parser.add_option("-i", "--id", dest="id", default="",
                          help="position of the article content in HTML (not required if 'type' is specified)")
        options, args = parser.parse_args()
        main()
    
    ```

  * 进入`main` 方法中，我们需要依据代码逻辑，对参数进行额外校验，如：空参数异常、参数错误异常等

    * `url` 与 `output_folder` 不得为空
    * `type / website_tag / class_ / id` 不得同时为空
    * `type` 必须在指定的类型内
    * 参数校验完毕后，创建对应的类对象，并执行 `start` 方法


    
    
    ```python
    def main():
        url = options.url
        type = options.type
        output_folder = options.output_folder
        website_tag = options.website_tag
        class_ = options.class_
        id = options.id
        if not url:
            parser.error("url must be specified.")
        if not output_folder:
            parser.error("output folder must be specified.")
        if type == "" and website_tag == "" and class_ == "" and id == "":
            parser.error("'type', 'website_tag', 'class_', 'id' cannot be empty at the same time.")
        if type not in ["csdn", "juejin", "zhihu", "jianshu"]:
            parser.error(
                "The current article type is not supported, you need to specify 'class_' or 'id' to locate the position of the article.")
        if type != '':
            crawler = class_dic[type](url=url, output_folder=output_folder)
        else:
            crawler = ArticleCrawler(url=url, output_folder=output_folder, tag=website_tag, class_=class_, id=id)
        crawler.start()
    
    ```

## 最终效果

最终，我们将其打包发布到 [pypi](https://link.juejin.cn?target=https%3A%2F%2Fpypi.org%2Fproject%2Farticle-crawler%2F "https://pypi.org/project/article-crawler/") 中，并重新安装到本地，执行命令：
    
    
    ```bash
    pip install article-crawler
    python3 -m article_crawler -u https://zhuanlan.zhihu.com/p/644525159 -o /Users/lty/Downloads/article_output -t zhihu
    
    ```

其实现效果如下：

![image-20230805211558806](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c87dc5f74690437691ee1ca800ea86ad~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp) 

我们打开输出的 Markdown 文件，看看效果：

![image-20230805211708640](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5add477c7149424894f93e6b010d1d84~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp) 

大家可以看到，除了换行问题外，其它部分的转换效果还是很不错的，基本与原文一致～

## 总结

今天，我从需求分析、技术选型、实现方案、优化、效果展示等角度，从 0 到 1 实现了 Article Crawler 工具，并向大家介绍了详细的实现过程。

代码和包已经开源，大家感兴趣的可以去使用一下，如果有问题的话，麻烦提一下 Issue 呀～

地址如下：

  * Github 地址：[github.com/ltyzzzxxx/a…](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fltyzzzxxx%2Farticle_crawler "https://github.com/ltyzzzxxx/article_crawler")
  * PyPi 地址：[pypi.org/project/art…](https://link.juejin.cn?target=https%3A%2F%2Fpypi.org%2Fproject%2Farticle-crawler%2F "https://pypi.org/project/article-crawler/")



对于如何从 0 到 1 发布一个 Pypi 包，我会再下一篇文章中，详细进行介绍～

今天的内容就到这里啦，大家觉得有用的话麻烦帮忙点个赞、点个 Star 支持一下呀，下期再见！

:::tip 版权说明

作者：周三不Coding

链接：https://juejin.cn/post/7263840667826323493
::: 
