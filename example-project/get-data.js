#!/usr/bin/env node

'use strict'
const { exec } = require('child_process')
const Promise = require('bluebird')
const crypto = require('crypto');

const BUILDS = ['1', '2', '3']

const getMd5Hash = x => crypto.createHash('md5').update(x).digest('hex')

const shrinkwrapFilehashes = Promise.all(BUILDS.map(buildId => {
  return Promise.fromCallback(cb => exec(`md5sum /build${buildId}/npm-shrinkwrap.json`, cb))
    .then(output => output.split(" ")[0])
}))
const fileDirectoryHashes = Promise.all(BUILDS.map(buildId => {
  const outputFile1 = `/build${buildId}/file-hashes.txt`
  const outputFile2 = `/build${buildId}/file-hashes-no-package-json.txt`
  const command1 = `find /build${buildId}/node_modules/ -type f -exec md5sum {} \\; | sort -k 2 | sed 's/build${buildId}/build/' | tee ${outputFile1}`
  const command2 = `cat ${outputFile1} | grep -v "package.json" | tee ${outputFile2}`
  const opts = {maxBuffer: 1024 * 5000} // 5mb
  return Promise.fromCallback(cb => exec(command1, opts, cb))
    .then(hashList => Promise.all([
      hashList,
      Promise.fromCallback(cb => exec(command2, opts, cb))
    ]))
    .then(result => {
      return {
        // hashList
        hash: getMd5Hash(result[0]),
        hashNoPackageJSON: getMd5Hash(result[1])
      }
    })
}))

Promise.props({ shrinkwrapFilehashes, fileDirectoryHashes })
  .then(console.log.bind(console))
