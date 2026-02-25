const express = require('express');
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
        console.log('[LEDGER] PUT', key);
    }
    async getState(key) {
        const value = this.state.get(key);
        return value || Buffer.from('');
    }
    async getQueryResult(query) {
        const queryObj = JSON.parse(query);
        const results = [];
        for (const [key, value] of this.state.entries()) {
            try {
                const obj = JSON.parse(value.toString());
                let match = true;
                for (const [field, expectedValue] of Object.entries(queryObj.selector || {})) {
                    if (obj[field] !== expectedValue) { match = false; break; }
                }
                if (match) results.push({ key, value });
            } catch (e) {}
        }
        let index = 0;
        return {
            async next() {
                if (index < results.length) return { value: results[index++], done: false };
                return { done: true };
            },
            async close() {}
        };
    }
    getHistoryForKey(key) {
        const keyHistory = this.history.filter(h => h.key === key);
        let index = 0;
        return {
            async next() {
                if (index < keyHistory.length) {
                    const item = keyHistory[index++];
                    return { value: { timestamp: item.timestamp, value: Buffer.from(item.value || ''), isDelete: item.type === 'DELETE', txId: 'tx-' + item.timestamp.getTime() }, done: false };
                }
                return { done: true };
            },
            async close() {}
        };
    }
    getTxID() { return 'txid-' + Date.now(); }
    getTxTimestamp() { return { seconds: Math.floor(Date.now() / 1000), nanos: 0 }; }
    getCreator() { return Buffer.from(JSON.stringify({ mspid: 'ECTAMSP', id: 'admin' })); }
    setEvent(name, payload) { console.log('[EVENT]', name); }
}

const contract = new ECTAContract();
const stub = new MockStub();
const createContext = () => ({ stub, clientIdentity: { getMSPID: () => 'ECTAMSP', getID: () => 'admin', getAttributeValue: () => null } });

const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.post('/invoke', async (req, res) => {
    try {
        const { fcn, args } = req.body;
        console.log('[INVOKE]', fcn);
        const result = await contract[fcn](createContext(), ...args);
        res.json({ success: true, result, txId: stub.getTxID() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/query', async (req, res) => {
    try {
        const { fcn, args } = req.body;
        const result = await contract[fcn](createContext(), ...args);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log('Chaincode server on port', PORT));
