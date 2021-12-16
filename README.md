# Streamlabs Desktop

Simple, powerful, and efficient live streaming software built on Electron and OBS.

This application currently only supports OSX 10.14+ and 64-bit Windows.

## Dependencies

### Node.js

Node is required for installing npm packages and for running
various scripts. We recommend the latest LTS release.

https://nodejs.org

### Yarn

In order to ensure you are using the correct version of each
node module, you should use the yarn package manager.
Installation instructions can be found here:

https://yarnpkg.com/en/docs/install

## Prerequsite

Install yarn

```
npm install -g yarn
```

## Installation

Install all node modules via yarn:

```
yarn
```

Then, compile assets with webpack:

```
yarn compile
```

## Starting

If you are using Visual Studio Code, you can start the app
using the built in debugger (default F5).

Otherwise, you can run the app with:

```
yarn start
```

## Packaging / Distributing

Currently only Windows x64 packaging is supported.

### Packaging

Make sure the app is not running in your dev environment
before you start the packaging process.

You can package the app by running:

```
yarn package
```

This will package a distributable installer `.exe` to the `dist/`
directory. There is also an unpacked version in `dist/win-unpacked`.


## ❤ OBS Developers

At its core, Streamlabs Desktop is powered by the [OBS](https://obsproject.com/)
project. We want to thank all of the developers over at the OBS project for
their years of tireless hard work, without which Streamlabs Desktop wouldn't exist today.
