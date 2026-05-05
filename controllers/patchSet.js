#!/usr/bin/env node

/**
 * PATCH Set controller for RERUM operations
 * Handles PATCH operations that add new keys only
 * @author Claude Sonnet 4, cubap, thehabes
 */

import { basePatchOperation } from './patchBase.js'
import { _contextid } from './utils.js'

const processPatchSet = (originalObject, objectReceived, patchedObject) => {
    patchedObject = JSON.parse(JSON.stringify(originalObject))

    if(_contextid(originalObject['@context'])) {
        delete objectReceived.id
        delete originalObject.id
        delete patchedObject.id
    }

    delete objectReceived._id

    for (let k in objectReceived) {
        if (originalObject.hasOwnProperty(k)) {
            delete objectReceived[k]
        } else {
            patchedObject[k] = objectReceived[k]
        }
    }

    const noChanges = Object.keys(objectReceived).length === 0
    return { patchedObject, noChanges }
}

const patchSet = async (req, res, next) => {
    return basePatchOperation(req, res, next, processPatchSet, 'PATCH SET')
}

export { patchSet }
