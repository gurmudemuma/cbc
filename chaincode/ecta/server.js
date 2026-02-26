const { Contract } = require('fabric-contract-api');
const ECTAContract = require('./index');

class MockStub {
    constructor() {
        this.state = new Map();
        this.history = [];
    }

    async putState(key, value) {
        const valueStr = value.toString('utf8');
        this.state.set(key, Buffer.from(valueStr));
        this.history.push({ type: 'PUT', key, value: valueStr, timestamp: new Date() });
        console.log(`[LEDGER] PUT ${key}:`, valueStr.substring(0, 100));
    }

    async getState(key) {
        const value = this.state.get(key);
        console.log(`[LEDGER] GET ${key}:`, value ? 'Found' : 'Not found');
        return value || Buffer.from('');
    }

    async deleteState(key) {
        this.state.delete(key);
        this.history.push({ type: 'DELETE', key, timestamp: new Date() });
        console.log(`[LEDGER] DELETE ${key}`);
    }

    async getStateByRange(startKey, endKey) {
        const results = [];
        for (const [key, value] of this.state.entries()) {
            if (key >= startKey && key < endKey) {
                results.push({ key, value });
            }
        }
        console.log(`[LEDGER] RANGE ${startKey} to ${endKey}: ${results.length} records`);
        return {
            async *[Symbol.asyncIterator]() {
                for (const item of results) {
                    yield item;
                }
            }
        };
    }

    async getQueryResult(query) {
        const queryObj = JSON.parse(query);
        const results = [];
        
        for (const [key, value] of this.state.entries()) {
            try {
                const obj = JSON.parse(value.toString());
                let match = true;
                
                for (const [field, expectedValue] of Object.entries(queryObj.selector || {})) {
                    if (obj[field] !== expectedValue) {
                        match = false;
                        break;
                    }
                }
                
                if (match) {
                    results.push({ key, value });
                }
            } catch (e) {
                // Skip non-JSON values
            }
        }
        
        console.log(`[LEDGER] QUERY: ${results.length} records matched`);
        
        let index = 0;
        return {
            async next() {
                if (index < results.length) {
                    return { value: results[index++], done: false };
                }
                return { done: true };
            },
            async close() {}
        };
    }

    getHistoryForKey(key) {
        const keyHistory = this.history.filter(h => h.key === key);
        console.log(`[LEDGER] HISTORY ${key}: ${keyHistory.length} entries`);
        
        let index = 0;
        return {
            async next() {
                if (index < keyHistory.length) {
                    const item = keyHistory[index++];
                    return {
                        value: {
                            timestamp: item.timestamp,
                            value: Buffer.from(item.value || ''),
                            isDelete: item.type === 'DELETE',
                            txId: `tx-${item.timestamp.getTime()}`
                        },
                        done: false
                    };
                }
                return { done: true };
            },
            async close() {}
        };
    }

    getTxID() {
        return 'txid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    getTxTimestamp() {
        return { seconds: Math.floor(Date.now() / 1000), nanos: 0 };
    }

    getCreator() {
        return Buffer.from(JSON.stringify({ mspid: 'ECTAMSP', id: 'admin' }));
    }

    setEvent(name, payload) {
        console.log(`[EVENT] ${name}:`, payload.toString().substring(0, 100));
    }
}

const contract = new ECTAContract();
const stub = new MockStub();

const createContext = () => ({
    stub,
    clientIdentity: {
        getMSPID: () => 'ECTAMSP',
        getID: () => 'x509::/CN=admin::/CN=ca.ecta.example.com',
        getAttributeValue: (attr) => null
    }
});

const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', chaincode: 'ecta', version: '1.0' });
});

app.post('/invoke', async (req, res) => {
    try {
        const { fcn, args } = req.body;
        console.log(`\n[INVOKE] Function: ${fcn}, Args:`, args);
        
        const ctx = createContext();
        let result;
        if (typeof contract[fcn] === 'function') {
            result = await contract[fcn](ctx, ...args);
        } else {
            throw new Error(`Function ${fcn} not found in contract`);
        }
        
        console.log(`[RESULT] Success:`, typeof result === 'string' ? result.substring(0, 200) : result);
        
        res.json({ success: true, result: result, txId: stub.getTxID() });
    } catch (error) {
        console.error(`[ERROR]`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/query', async (req, res) => {
    try {
        const { fcn, args } = req.body;
        console.log(`\n[QUERY] Function: ${fcn}, Args:`, args);
        
        const ctx = createContext();
        let result;
        if (typeof contract[fcn] === 'function') {
            result = await contract[fcn](ctx, ...args);
        } else {
            throw new Error(`Function ${fcn} not found in contract`);
        }
        
        console.log(`[RESULT] Success:`, typeof result === 'string' ? result.substring(0, 200) : result);
        
        res.json({ success: true, result: result });
    } catch (error) {
        console.error(`[ERROR]`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/ledger', (req, res) => {
    const state = {};
    for (const [key, value] of stub.state.entries()) {
        try {
            state[key] = JSON.parse(value.toString());
        } catch (e) {
            state[key] = value.toString();
        }
    }
    res.json({ state, count: stub.state.size });
});

app.get('/history', (req, res) => {
    res.json({ history: stub.history });
});

const PORT = process.env.CHAINCODE_PORT || 3001;
app.listen(PORT, () => {
    console.log('========================================');
    console.log('ECTA Chaincode Server Started');
    console.log('========================================');
    console.log(`Port: ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Invoke: POST http://localhost:${PORT}/invoke`);
    console.log(`Query: POST http://localhost:${PORT}/query`);
    console.log('========================================\n');
});

module.exports = app;
