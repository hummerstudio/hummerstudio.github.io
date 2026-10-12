---
title: How to Host a Python Package on PyPI
date: 2020-04-12
author: Tang Moying
categories: [build]
tags: [PyPI, setuptools, twine, setup.py, Python]
lang: en
alt_url: /post/how-to-host-python-app-to-pypi
---

## Introduction to PyPI

PyPI is short for ”Python Package Index“, which translates into Chinese as “Python软件包索引”.

PyPI is the software repository for the Python language.

<!--以上为摘要内容-->

Official website: [https://pypi.org](https://pypi.org)

## Registration

Visit the official website, click "Register" in the top right corner of the page, and follow the steps.

## Packaging

`setuptools` is Python's build and packaging tool.

Just as Ant's build script is usually `build.xml` and Maven's build script is usually `pom.xml`, setuptools' build script is usually `setup.py`.

`setup.py` also goes in the project root directory. Example content:

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

For a detailed packaging tutorial, see [Python's official documentation - Packaging Python Projects](https://packaging.python.org/tutorials/packaging-projects/) (in English).

Once the script is configured, you can check it first with a tool:

`python setup.py check`

If it reports no problems, go ahead and package for real:

- tar.gz package:

`python setup.py sdist`

- whl package (you need to install wheel first with `pip install wheel`):

`python setup.py bdist_wheel`

- Build both packages together

`python setup.py sdist bdist_wheel`

The generated packages are in the `./dist` directory.

## Uploading

Use `twine` to publish the Python package to PyPI; after you run the command, the program will ask you for your username and password:

 `twine upload dist/*`
