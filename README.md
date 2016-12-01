# mudl

[![Version](https://img.shields.io/npm/v/mudl.svg)](http://npm.im/mudl)
[![Dependency Status](https://img.shields.io/david/yenbekbay/node-mudl.svg)](https://david-dm.org/yenbekbay/node-mudl)
[![devDependency Status](https://img.shields.io/david/dev/yenbekbay/node-mudl.svg)](https://david-dm.org/yenbekbay/node-mudl?type=dev)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![Commitizen Friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli)

[![NodeICO](https://nodei.co/npm/mudl.png?downloads=true&downloadRank=true)](https://nodei.co/npm/mudl)

A cli tool for downloading music from VK in high quality

<a href="https://asciinema.org/a/dmb24dlyddfdgrhkac6vbxxet" target="_blank"><img width="500" src="https://asciinema.org/a/dmb24dlyddfdgrhkac6vbxxet.png" /></a>

## Installation

``` bash
$ yarn global add mudl # npm install mudl -g
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

## License

[MIT License](./LICENSE) © Ayan Yenbekbay
