// BUILD_1_SHRINKWRAP_SUM=$()
// BUILD_2_SHRINKWRAP_SUM=$(md5sum /build2/npm-shrinkwrap.json)
// # These can be different based mostly on differences to formatting issues
// SHRINKWRAP_SUM_DIFF=$(diff $BUILD_1_SHRINKWRAP_SUM $BUILD_2_SHRINKWRAP_SUM)
 // | md5sum
// sha1sum /build2/npm-shrinkwrap.json
// find /build2/node_modules/ -type f -exec md5sum {} \; | sort -k 2 | sed 's/build1/build/' | md5sum

'use strict'
const { exec } = require('child_process')
const Promise = require('bluebird')
const crypto = require('crypto');

const BUILDS = ['1', '2']

const getMd5Hash = x => crypto.createHash('md5').update(x).digest('hex')

const shrinkwrapFilehashes = Promise.all(BUILDS.map(buildId => {
  return Promise.fromCallback(cb => exec(`md5sum /build${buildId}/npm-shrinkwrap`, cb))
}))
const fileDirectoryHashes = Promise.all(BUILDS.map(buildId => {
  return Promise.fromCallback(cb => exec(`find /build${buildId}/node_modules/ -type f -exec md5sum {} \; | sort -k 2 | sed 's/build${buildId}/build/`, cb))
    .map(hashList => {
      const replaceText = hashList.replace(buildId, "")
      console.log(hashList, replaceText)
      return {
        // hashList
        hash: getMd5Hash(hashList)
        hashNoPackageJSON: getMd5Hash(replaceText)
      }
    })
}))

Promise.props({ shrinkwrapFilehashes, fileDirectoryHashes })
  .then(console.log.bind(console))
