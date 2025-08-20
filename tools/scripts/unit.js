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
args.push('200000');

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

const defaultStorageAccount = 'ciserversdk';
const defaultServiceBusAccount = 'ciserversb';
const defaultSubscription = 'db1ab6f0-4769-4b27-930e-01e2ef9c123c';
const defaultAccessToken = 'access_token';

if (!process.env.AZURE_APNS_CERTIFICATE && process.env.AZURE_APNS_CERTIFICATE_FILE) {
    process.env.AZURE_APNS_CERTIFICATE = Buffer.from(
        safeReadFileSync(process.env['AZURE_APNS_CERTIFICATE_FILE']),
    ).toString('base64');
} else if (process.env.AZURE_APNS_CERTIFICATE && process.env.AZURE_APNS_CERTIFICATE_FILE) {
    throw new Error('Only one of AZURE_APNS_CERTIFICATE or AZURE_APNS_CERTIFICATE_FILE can be set. Not both.');
}

if (!process.env.AZURE_APNS_CERTIFICATE_KEY && process.env.AZURE_APNS_CERTIFICATE_KEY_FILE) {
    process.env.AZURE_APNS_CERTIFICATE_KEY = safeReadFileSync(
        process.env['AZURE_APNS_CERTIFICATE_KEY_FILE'],
    ).toString();
} else if (process.env.AZURE_APNS_CERTIFICATE_KEY && process.env.AZURE_APNS_CERTIFICATE_KEY_FILE) {
    throw new Error('Only one of AZURE_APNS_CERTIFICATE_KEY or AZURE_APNS_CERTIFICATE_KEY_FILE can be set. Not both.');
}

if (!process.env.AZURE_MPNS_CERTIFICATE && process.env.AZURE_MPNS_CERTIFICATE_FILE) {
    process.env.AZURE_MPNS_CERTIFICATE = Buffer.from(
        safeReadFileSync(process.env['AZURE_MPNS_CERTIFICATE_FILE']),
    ).toString('base64');
} else if (process.env.AZURE_MPNS_CERTIFICATE && process.env.AZURE_MPNS_CERTIFICATE_FILE) {
    throw new Error('Only one of AZURE_MPNS_CERTIFICATE or AZURE_MPNS_CERTIFICATE_FILE can be set. Not both.');
}

if (!process.env.AZURE_MPNS_CERTIFICATE_KEY && process.env.AZURE_MPNS_CERTIFICATE_KEY_FILE) {
    process.env.AZURE_MPNS_CERTIFICATE_KEY = safeReadFileSync(
        process.env['AZURE_MPNS_CERTIFICATE_KEY_FILE'],
    ).toString();
} else if (process.env.AZURE_MPNS_CERTIFICATE_KEY && process.env.AZURE_MPNS_CERTIFICATE_KEY_FILE) {
    throw new Error('Only one of AZURE_MPNS_CERTIFICATE_KEY or AZURE_MPNS_CERTIFICATE_KEY_FILE can be set. Not both.');
}

if (!process.env.AZURE_ACCESS_TOKEN) {
    process.env.AZURE_ACCESS_TOKEN = defaultAccessToken;
}

if (!process.env.AZURE_CERTIFICATE_PEM_FILE) {
    process.env.AZURE_CERTIFICATE_PEM_FILE = path.join(__dirname, '../test/data/certificate.pem');
}

if (!process.env.NOCK_OFF && !process.env.AZURE_NOCK_RECORD) {
    process.env.AZURE_APNS_CERTIFICATE = 'fake_certificate';
    process.env.AZURE_APNS_CERTIFICATE_KEY = 'fake_certificate_key';

    process.env.AZURE_WNS_PACKAGE_SID = 'sid';
    process.env.AZURE_WNS_SECRET_KEY = 'key';

    process.env.AZURE_GCM_KEY = 'fakekey'.toString('base64');

    process.env.AZURE_MPNS_CERTIFICATE = 'fake_certificate';
    process.env.AZURE_MPNS_CERTIFICATE_KEY = 'fake_certificate_key';

    if (process.env.AZURE_STORAGE_ACCOUNT !== defaultStorageAccount) {
        process.env.AZURE_STORAGE_ACCOUNT = defaultStorageAccount;
    }

    process.env.AZURE_STORAGE_ACCESS_KEY = Buffer.from('fake_key').toString('base64');

    if (process.env.AZURE_SERVICEBUS_NAMESPACE !== defaultServiceBusAccount) {
        process.env.AZURE_SERVICEBUS_NAMESPACE = defaultServiceBusAccount;
        process.env.AZURE_SERVICEBUS_ACCESS_KEY = Buffer.from('fake_key').toString('base64');
    }

    if (process.env.AZURE_SUBSCRIPTION_ID !== defaultSubscription) {
        process.env.AZURE_SUBSCRIPTION_ID = defaultSubscription;
        process.env.AZURE_CERTIFICATE = 'fake_certificate';
        process.env.AZURE_CERTIFICATE_KEY = 'fake_certificate_key';
    }
} else {
    if (!process.env.NOCK_OFF && process.env.AZURE_NOCK_RECORD) {
        // If in record mode, and environment variables are set, make sure they are the expected one for recording
        // NOTE: For now, only the Core team can update recordings. For non-core team PRs, the recordings will be updated
        // after merge
        if (process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_ACCOUNT !== defaultStorageAccount) {
            throw new Error('Storage recordings can only be made with the account ' + defaultStorageAccount);
        }

        if (
            process.env.AZURE_SERVICEBUS_NAMESPACE &&
            process.env.AZURE_SERVICEBUS_NAMESPACE !== defaultServiceBusAccount
        ) {
            throw new Error('Service Bus recordings can only be made with the namespace ' + defaultServiceBusAccount);
        }

        if (process.env.AZURE_SUBSCRIPTION_ID && process.env.AZURE_SUBSCRIPTION_ID !== defaultSubscription) {
            throw new Error(
                'Service Management recordings can only be made with the subscription ' + defaultSubscription,
            );
        }
    }
}

require('../node_modules/mocha/bin/mocha');
