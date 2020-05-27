'use strict';

var cp = require('child_process');
var path = require('path');
var fs = require('fs');
var util = require('./util');
var suffix = '-' + Date.now() + '-pngdefry';
var pngMetaData = require('png-metadata');

module.exports = pngdefry;

function pngdefry(input, output, cb) {
  var pngdefryBinPath = util.getPngdefryBinPath();
  var outputDir = getOutputDir(output);
  var outputFilePath = getOutputFilePath(input, outputDir, suffix);
  convert(input, output, outputDir, outputFilePath, pngdefryBinPath, suffix, function(err) {
    if (err) {
      cb(err);
      return;
    }

    cb();
  });
}

/**
 * get output directory from original output
 * @param  {string} output
 * @return {string} outputDir
 * @private
 */
function getOutputDir(output) {
  var arr = output.split(path.sep);
  arr.pop();
  return arr.join(path.sep);
}

/**
 * get temp output file path with our suffix
 * @param  {string} output
 * @return {string} outputDir
 * @return {string} suffix
 * @return {string} outputFilePath
 * @private
 */
function getOutputFilePath(input, outputDir, suffix) {
  var inputArr = input.split(path.sep);
  var originFileName = inputArr[inputArr.length - 1];
  var newFileName = originFileName.replace(/\.png$/, suffix + '.png');
  var outputFilePath = path.join(outputDir, newFileName);
  return outputFilePath;
}

function convert(input, output, outputDir, outputFilePath, pngdefryBinPath, suffix, cb) {

  // WIP: another attempt to address https://www.huntr.dev/app/bounties/open/2-npm-node-pngdefry
  var img = pngMetaData.readFileSync(input);
  var list = pngMetaData.splitChunk(img);

  console.log('[+] Time to try another way of parsing chunks.');
  for (var i = 0; i < list.length; i++)
  {
    console.log('[-] Type: ' + list[i].type + '; Size: ' + list[i].size + list[i].crc);
  }

  var command = [
    '-s',
    suffix,
    '-o',
    outputDir,
    input
  ];

  cp.execFile(pngdefryBinPath, command, {}, function(error, stdout, stderr) {
    if (error) {
      return cb(error);
    }

    if (stdout.indexOf('not a PNG file') > -1) {
      return cb('convert fail, not a PNG file');
    }

    if (stdout.indexOf('not an -iphone crushed PNG file') > -1) {
      return cb('convert fail, the png wasn\'t in the correct format');
    }

    if (!util.fsExistsSync(outputFilePath)) {
      console.log('pngdefry is taking too much time to write the file on disk.');
    }

    console.log(stdout);
    fs.rename(outputFilePath, output, function(err) {
      cb(err);
    });
  });
}
