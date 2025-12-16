#!/bin/bash

# Start simple API services without Docker building
echo "🚀 Starting API services..."

# Create simple API containers
for port in 3001 3002 3003 3004 3005; do
    docker run -d \
        --name api-$port \
        --network coffee-export-network \
        -p $port:3000 \
        -e PORT=3000 \
        node:18-alpine \
        sh -c "
        npm init -y && 
        npm install express && 
        echo 'const express = require(\"express\"); 
        const app = express(); 
        app.use(express.json());
        app.use((req,res,next)=>{res.header(\"Access-Control-Allow-Origin\",\"*\");res.header(\"Access-Control-Allow-Headers\",\"*\");res.header(\"Access-Control-Allow-Methods\",\"*\");next()});
        app.get(\"/health\", (req,res) => res.json({status:\"ok\", service:\"api-$port\"})); 
        app.post(\"/api/auth/login\", (req,res) => res.json({success:true, token:\"demo-token\", user:{id:1,username:\"demo\"}}));
        app.get(\"/api/exports\", (req,res) => res.json({success:true, data:[]}));
        app.listen(3000, () => console.log(\"API running on 3000\"));' > index.js && 
        node index.js"
done

echo "✅ API services started on ports 3001-3005"
