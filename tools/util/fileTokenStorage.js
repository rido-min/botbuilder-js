/**
 * Copyright (c) Microsoft.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const _ = require('underscore');
const fs = require('fs');
const path = require('path');

/**
 * Validates a file path to ensure it's safe to use
 *
 * @param {string} filePath - Path to validate
 * @returns {string} Normalized and validated path
 */
function validatePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path provided');
    }

    const resolvedPath = path.resolve(filePath);
    const normalizedPath = path.normalize(resolvedPath);

    return normalizedPath;
}

/**
 * Constructs a new disk file based token storage.
 *
 * @class
 *
 * @param {string} filename filename to store/retrieve data from
 */
function FileTokenStorage(filename) {
    this._setFile(filename);
    //this._filename = filename;
}

_.extend(FileTokenStorage.prototype, {
    _save: function (entries, done) {
        const writeOptions = {
            encoding: 'utf8',
            mode: 384, // Permission 0600 - owner read/write, nobody else has access
            flag: 'w',
        };

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.writeFile(this._filename, JSON.stringify(entries), writeOptions, done);
    },

    _setFile: function (filename) {
        const validatedPath = validatePath(filename);

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (!fs.existsSync(validatedPath)) {
            const dirname = path.dirname(validatedPath);
            //create the directory if it does not exist
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            if (!fs.existsSync(dirname)) {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                fs.mkdirSync(dirname);
            }
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            fs.writeFileSync(validatedPath, JSON.stringify([]));
        }
        this._filename = validatedPath;
    },

    loadEntries: function (callback) {
        let entries = [];
        let err;
        try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            const content = fs.readFileSync(this._filename);
            entries = JSON.parse(content);
            entries.forEach(function (entry) {
                entry.expiresOn = new Date(entry.expiresOn);
            });
        } catch (ex) {
            if (ex.code !== 'ENOENT') {
                err = ex;
            }
        }
        callback(err, entries);
    },

    removeEntries: function (entriesToRemove, entriesToKeep, callback) {
        this._save(entriesToKeep, callback);
    },

    addEntries: function (newEntries, existingEntries, callback) {
        const entries = existingEntries.concat(newEntries);
        this._save(entries, callback);
    },

    clear: function (callback) {
        this._save([], callback);
    },
});

module.exports = FileTokenStorage;
