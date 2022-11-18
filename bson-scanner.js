
// https://bsonspec.org/spec.html

// http://jsonpath.com/
// https://github.com/JSONPath-Plus/JSONPath
// https://www.npmjs.com/package/jmespath
// https://jmespath.org/examples.html
// https://github.com/stedolan/jq/
// https://github.com/chrisdone/jl
// https://github.com/jmespath/jp

import * as bson from 'bson'

// for convenience
const serialize = bson.serialize
export { serialize }

// for convenience
const deserialize = bson.deserialize
export { deserialize }

export const NUMBER = bson.BSON_DATA_NUMBER
export const STRING = bson.BSON_DATA_STRING
export const OBJECT = bson.BSON_DATA_OBJECT
export const ARRAY = bson.BSON_DATA_ARRAY
export const BINARY = bson.BSON_DATA_BINARY
export const UNDEFINED = bson.BSON_DATA_UNDEFINED
export const OID = bson.BSON_DATA_OID
export const BOOLEAN = bson.BSON_DATA_BOOLEAN
export const DATE = bson.BSON_DATA_DATE
export const NULL = bson.BSON_DATA_NULL
export const REGEXP = bson.BSON_DATA_REGEXP
export const DBPOINTER = bson.BSON_DATA_DBPOINTER
export const CODE = bson.BSON_DATA_CODE
export const SYMBOL = bson.BSON_DATA_SYMBOL
export const CODE_W_SCOPE = bson.BSON_DATA_CODE_W_SCOPE
export const INT = bson.BSON_DATA_INT
export const TIMESTAMP = bson.BSON_DATA_TIMESTAMP
export const LONG = bson.BSON_DATA_LONG
export const DECIMAL128 = bson.BSON_DATA_DECIMAL128
export const MIN_KEY = bson.BSON_DATA_MIN_KEY
export const MAX_KEY = bson.BSON_DATA_MAX_KEY

function readInt32(buffer,index) {
    return buffer[index] |
        (buffer[index+1] << 8) |
        (buffer[index+2] << 16) |
        (buffer[index+3] << 24)
}

function readDouble(buffer,index) {
    return buffer.readDoubleLE(index)
}

function readString(buffer,index) {
    const stringSize = readInt32(buffer, index);
    return buffer.toString('utf8', index + 4, index + 4 + stringSize - 1)
}

function readBinary(buffer,index) {
    let binarySize = readInt32(buffer, index);
    const subType = buffer[index+4];
    return new bson.Binary(buffer.slice(index + 5, index + 5 + binarySize), subType);
}

function readOID(buffer,index) {
    const oid = Buffer.alloc(12);
    buffer.copy(oid, 0, index, index + 12);
    return new bson.ObjectId(oid);
}

function readBoolean(buffer,index) {
    return buffer[index] === 1
}

function readDate(buffer,index) {
    const lowBits = readInt32(buffer, index);
    const highBits = readInt32(buffer, index + 4);
    return new Date(new Long(lowBits, highBits).toNumber());
}

function readRegexp(buffer,index) {
    
    const regexIndex = index;
    while (buffer[index] !== 0x00 && index < buffer.length) {
        ++index;
    }
    const regex = buffer.toString('utf8', regexIndex, index);
    ++index;

    const optsIndex = index;
    while (buffer[index] !== 0x00 && index < buffer.length) {
        ++index;
    }
    let opts = buffer.toString('utf8', optsIndex, index);
    ++index;
    
    return new RegExp(regex,opts.replace('s','g'));

}

function readTimestamp(buffer,index) {
    const lowBits = readInt32(buffer, index);
    const highBits = readInt32(buffer, index + 4);
    return new Timestamp(lowBits, highBits);

}

function readInt64(buffer,index) {
    const lowBits = readInt32(buffer, index);
    const highBits = readInt32(buffer, index + 4);
    return new Long(lowBits, highBits);
}

function readDecimal128(buffer,index) {
    const bytes = Buffer.alloc(16);
    buffer.copy(bytes, 0, index, index + 16);
    return new bson.Decimal128(bytes);
}

function readMinKey(buffer,index) {
    return new bson.MinKey();
}

function readMaxKey(buffer,index) {
    return new bson.MaxKey();
}

export function readObject(buffer,index) {
    let obj = {};
    _readObject(buffer,index,obj);
    return obj;
}

function _readObject(buffer,index,obj) {
    scan(buffer,index, (name,index,type) => {
        if (type == bson.BSON_DATA_OBJECT) {
            obj[name] = {};
            _readObject(buffer,index,obj[name]);
        } else if (type == bson.BSON_DATA_ARRAY) {
            obj[name] = [];
            _readArray(buffer,index,obj[name]);
        } else {
            obj[name] = read(buffer,index,type);
        }
        return true;
    });
}

function readArray(buffer,index) {
    let arr = [];
    _readArray(buffer,index,arr);
    return arr;
}

function _readArray(buffer,index,arr) {
    let i = 0;
    scan(buffer,index, (name,index,type) => {
        if (type == bson.BSON_DATA_OBJECT) {
            arr[name] = {};
            _readObject(buffer,index,arr[name]);
        } else if (type == bson.BSON_DATA_ARRAY) {
            arr[name] = [];
            _readArray(buffer,index,arr[name]);
        } else {
            arr[name] = read(buffer,index,type);
        }
        return true;
    });
}

export function read(buffer,index,type) {
    switch (type) {
        case bson.BSON_DATA_NUMBER: {
            return readDouble(buffer,index);
        }
        case bson.BSON_DATA_STRING: {
            return readString(buffer,index);
        }
        case bson.BSON_DATA_OBJECT: {
            return readObject(buffer,index);
        }
        case bson.BSON_DATA_ARRAY: {
            return readArray(buffer,index);
        }
        case bson.BSON_DATA_BINARY: {
            return readBinary(buffer,index);
        }
        case bson.BSON_DATA_UNDEFINED: {
            return undefined;
        }
        case bson.BSON_DATA_OID: {
            return readOID(buffer,index);
        }
        case bson.BSON_DATA_BOOLEAN: {
            return readBoolean(buffer,index);
        }
        case bson.BSON_DATA_DATE: {
            return readDate(buffer,index);
        }
        case bson.BSON_DATA_NULL: {
            return null;
        }
        case bson.BSON_DATA_REGEXP: {
            return readRegexp(buffer,index);
        }
        case bson.BSON_DATA_DBPOINTER: {
            return -1;
        }
        case bson.BSON_DATA_CODE: {
            return -1;
        }
        case bson.BSON_DATA_SYMBOL: {
            return -1;
        }
        case bson.BSON_DATA_CODE_W_SCOPE: {
            return -1;
        }
        case bson.BSON_DATA_INT: {
            return readInt32(buffer,index);
        }
        case bson.BSON_DATA_TIMESTAMP: {
            return readTimestamp(buffer,index);
        }
        case bson.BSON_DATA_LONG: {
            return readInt64(buffer,index);
        }
        case bson.BSON_DATA_DECIMAL128: {
            return readDecimal128(buffer,index);
        }
        case bson.BSON_DATA_MIN_KEY: {
            return readMinKey(buffer,index);
        }
        case bson.BSON_DATA_MAX_KEY: {
            return readMaxKey(buffer,index);
        }
        default: return -1;
    }
}

export function scan(buffer,index, cb) {

    const docSize = readInt32(buffer, index)
    const docEnd = index + docSize;

    index = index + 4;

    while (index < docEnd) {

        const type = buffer[index++]

        if (type === 0) break;

        const nameIndex = index;
        while (buffer[index] !== 0x00 && index < buffer.length) {
            ++index;
        }
        const name = buffer.toString('utf8', nameIndex, index);
        ++index;

        if (!cb(name,index,type)) return;

        switch (type) {
            case bson.BSON_DATA_NUMBER: {
                index = index + 8;
                break;
            }
            case bson.BSON_DATA_STRING: {
                const stringSize = readInt32(buffer, index);
                index = index + 4 + stringSize;
                break;
            }
            case bson.BSON_DATA_OBJECT: {
                const docSize = readInt32(buffer, index)
                index = index + docSize;
                break;
            }
            case bson.BSON_DATA_ARRAY: {
                const docSize = readInt32(buffer, index)
                index = index + docSize;
                break;
            }
            case bson.BSON_DATA_BINARY: {
                let binarySize = readInt32(buffer, index);
                index = index + 5 + binarySize;
                break;
            }
            case bson.BSON_DATA_UNDEFINED: {
                // deprecated, not supported
                break;
            }
            case bson.BSON_DATA_OID: {
                index = index + 12;
                break;
            }
            case bson.BSON_DATA_BOOLEAN: {
                index++
                break;
            }
            case bson.BSON_DATA_DATE: {
                index = index + 8
                break;
            }
            case bson.BSON_DATA_NULL: {
                break;
            }
            case bson.BSON_DATA_REGEXP: {

                const regexIndex = index;
                while (buffer[index] !== 0x00 && index < buffer.length) {
                    ++index;
                }
                ++index;

                const optsIndex = index;
                while (buffer[index] !== 0x00 && index < buffer.length) {
                    ++index;
                }
                ++index;

                break;
            }
            case bson.BSON_DATA_DBPOINTER: {
                const stringSize = readInt32(buffer, index);
                // deprecated, not supported
                index = index + stringSize;
                index = index + 12;
                break;
            }
            case bson.BSON_DATA_CODE: {
                const stringSize = readInt32(buffer, index);
                index = index + stringSize;
                break;
            }
            case bson.BSON_DATA_SYMBOL: {
                const stringSize = readInt32(buffer, index);
                // deprecated, not supported
                index = index + stringSize;
                break;
            }
            case bson.BSON_DATA_CODE_W_SCOPE: {
                const totalSize = readInt32(buffer, index);
                // deprecated, not supported
                index = index + totalSize;
                break;
            }
            case bson.BSON_DATA_INT: {
                index = index + 4
                break;
            }
            case bson.BSON_DATA_TIMESTAMP: {
                index = index + 8
                break;
            }
            case bson.BSON_DATA_LONG: {
                index = index + 8
                break;
            }
            case bson.BSON_DATA_DECIMAL128: {
                index = index + 16;
                break;
            }
            case bson.BSON_DATA_MIN_KEY: {
                break;
            }
            case bson.BSON_DATA_MAX_KEY: {
                break;
            }
            default: {
                throw "invalid bson type ("+type+") at index ("+index+")";
            }
        }

    }

    return docEnd;
}

