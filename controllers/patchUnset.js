#!/usr/bin/env node

/**
 * PATCH Unset controller for RERUM operations
 * Handles PATCH operations that remove keys
 * @author Claude Sonnet 4, cubap, thehabes
 */

import { basePatchOperation } from './patchBase.js'
import { _contextid } from './utils.js'

const processPatchUnset = (originalObject, objectReceived, patchedObject) => {
    patchedObject = JSON.parse(JSON.stringify(originalObject))

    delete objectReceived._id
    delete objectReceived.__rerum
    delete objectReceived['@id']
    if (_contextid(originalObject['@context'])) delete objectReceived.id

    for (let k in objectReceived) {
        if (originalObject.hasOwnProperty(k) && objectReceived[k] === null) {
            delete patchedObject[k]
            delete objectReceived[k]
        } else {
            delete objectReceived[k]
        }
    }

    const noChanges = Object.keys(objectReceived).length === 0
    return { patchedObject, noChanges }
}

const patchUnset = async (req, res, next) => {
    return basePatchOperation(req, res, next, processPatchUnset, 'PATCH UNSET')
}

export { patchUnset }
