#!/usr/bin/env node
//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

const fs = require('fs');
const path = require('path');

/**
 * Safely reads a file by validating the path to prevent directory traversal
 *
 * @param {string} filePath - Path to the file to read
 * @returns {string} File contents
 */
function safeReadFileSync(filePath) {
    const resolvedPath = path.resolve(filePath);
    const normalizedPath = path.normalize(resolvedPath);

    // Basic validation to prevent directory traversal
    if (normalizedPath.includes('..')) {
        throw new Error(`Invalid path: ${filePath}`);
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fs.readFileSync(normalizedPath);
}

/**
 * Safely checks if a file exists by validating the path
 *
 * @param {string} filePath - Path to check
 * @returns {boolean} Whether the file exists
 */
function safeExistsSync(filePath) {
    const resolvedPath = path.resolve(filePath);
    const normalizedPath = path.normalize(resolvedPath);

    // Basic validation to prevent directory traversal
    if (normalizedPath.includes('..')) {
        return false;
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fs.existsSync(normalizedPath);
}

const args = process.ARGV || process.argv;

const xunitOption = Array.prototype.indexOf.call(args, '-xunit');
if (xunitOption !== -1) {
    args.splice(xunitOption, 1);
}

const testList = args.pop();

let fileContent;
let root = false;

if (!fs.existsSync) {
    fs.existsSync = require('path').existsSync;
}

if (safeExistsSync(testList)) {
    fileContent = safeReadFileSync(testList).toString();
} else {
    fileContent = safeReadFileSync('./test/' + testList).toString();
    root = true;
}

const files = fileContent.split('\n');

args.push('-u');
args.push('tdd');

// TODO: remove this timeout once tests are faster
args.push('-t');
args.push('5000000');

files.forEach(function (file) {
    if (file.length > 0 && file.trim()[0] !== '#') {
        // trim trailing \r if it exists
        file = file.endsWith('\r') ? file.slice(0, -1) : file;

        if (root) {
            args.push('test/' + file);
        } else {
            args.push(file);
        }
    }
});

args.push('-R');
args.push('xunit');

require('../node_modules/mocha/bin/mocha');
