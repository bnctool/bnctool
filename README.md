
## Install

```console
$ npm install -g bnctool
```

## Usage

```console
$ bnc --help

      Usage: bnc <command>


        Options:

          -V, --version  output the version number
          -v, --version  output the version number
          -d, --doc      open page https://bnc.baidu.com/contact/docs?docName=platformDoc
          -s, --site     open page https://bnc.baidu.com/
          -h, --help     output usage information


        Commands:

          init        generate a new ability from template
          create      create a single page frame from template
          debug       build ability and launch a http server
          build       build project for debug
          server      launch a http server
          pack        pack project to upload
          list        list available abilities
          help [cmd]  display help for [cmd]
          download    download the  ability
          injection   inject the ability into the project

```


## First: init
```console
$ bnc init [project-name]

example:

    $ bnc init wxshare
```

## Second: debug
```console
$ cd [your-project]

$ bnc debug

```
entry.js will created in your-project/debug/entry.js
server will start at 'your-project/debug/'.(port 1234)

## Last: pack
```console
$ cd [your-project]

$ bnc pack

```
We will pack directory src/ to your-project.zip