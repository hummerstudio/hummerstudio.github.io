---
title: 如何将Python包托管到PyPI
author: 唐明
categories: [Python]
tags: [PyPI, setuptools, twine, setup.py, Python]
---
* TOC
{:toc}

# PyPI介绍

PyPI是”Python Package Index“的缩写，翻译为中文是“Python软件包索引”。

PyPI是Python语言的软件存储仓库。

<!--以上为摘要内容-->

官网链接：[https://pypi.org](https://pypi.org)

# 注册

访问官网，点击页面右上角的"Register"，按流程操作即可。


# 打包

`setuptools`是Python的构建、打包工具。

就像`Ant`的构建脚本一般是`build.xml`，`Maven`的构建脚本一般是`pom.xml`一样，`setuptools`的构建脚本一般是`setup.py`。

`setup.py`也是放置在项目根目录。示例内容：

```python
import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="example-pkg-YOUR-USERNAME-HERE", # Replace with your own username
    version="0.0.1",
    author="Example Author",
    author_email="author@example.com",
    description="A small example package",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/pypa/sampleproject",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.6',
)
```

详细打包教程可访问[Python官方文档-Packaging Python Projects](https://packaging.python.org/tutorials/packaging-projects/)（英文）。

脚本配置完成后可以先使用工具进行检查：

`python setup.py check`

如果没有输出问题，正式进行打包：

`python setup.py sdist`

生成的包在`./dist`目录下。

# 上传

使用`twine`来发布Python包到PyPI，执行命令后程序会要求您输入用户名和密码：

 `twine upload dist/*`

