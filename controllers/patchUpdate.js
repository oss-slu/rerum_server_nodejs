#!/usr/bin/env node

/**
 * PATCH Update controller for RERUM operations
 * Handles PATCH updates that modify existing keys
 * @author Claude Sonnet 4, cubap, thehabes
 */

import { basePatchOperation } from './patchBase.js'
import { _contextid } from './utils.js'

const processPatchUpdate = (originalObject, objectReceived, patchedObject) => {
    patchedObject = JSON.parse(JSON.stringify(originalObject))

    delete objectReceived.__rerum
    delete objectReceived._id
    delete objectReceived['@id']

    if (_contextid(objectReceived['@context'])) {
        delete objectReceived.id
    }

    for (let k in objectReceived) {
        if (originalObject.hasOwnProperty(k)) {
            if (objectReceived[k] === null) {
                delete patchedObject[k]
            } else {
                patchedObject[k] = objectReceived[k]
            }
            delete objectReceived[k]
        } else {
            delete objectReceived[k]
        }
    }

    const noChanges = Object.keys(objectReceived).length === 0
    return { patchedObject, noChanges }
}

const patchUpdate = async (req, res, next) => {
    return basePatchOperation(req, res, next, processPatchUpdate, 'PATCH UPDATE')
}

export { patchUpdate }
