# mudl
**A cli tool for downloading music from VK in high quality**

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]

[![NodeICO][nodeico-image]][nodeico-url]

<a href="https://asciinema.org/a/dmb24dlyddfdgrhkac6vbxxet" target="_blank"><img width="500" src="https://asciinema.org/a/dmb24dlyddfdgrhkac6vbxxet.png" /></a>

## Installation

``` bash
  $ [sudo] npm install mudl -g
```

## Usage

```bash
mudl <query> [options]

Options:
  -d, --dir      Directory to save the downloaded mp3 file to           [string]
  -h, --help     Display help message                                  [boolean]
  -v, --version  Display version information                           [boolean]

Examples:
  mudl "Daft Punk - Get Lucky"  Download the track "Get Lucky" by Daft Punk in
                                the current directory
```

## The MIT License

Copyright (C) 2016  Ayan Yenbekbay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

[downloads-image]: https://img.shields.io/npm/dm/mudl.svg
[npm-url]: https://www.npmjs.com/package/mudl
[npm-image]: https://img.shields.io/npm/v/mudl.svg

[daviddm-image]: https://david-dm.org/yenbekbay/node-mudl.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/yenbekbay/node-mudl

[nodeico-url]: https://nodei.co/npm/mudl
[nodeico-image]: https://nodei.co/npm/mudl.png?downloads=true&downloadRank=true
