# Redis Cloud Integration Setup Guide

## 🔑 API Key Configuration

**Your Redis Cloud API Key**: `A1yyflastlw544a0y0oo6nfyb6idxw1n3hr5co0cfqvpga0n8hs`

## 🚀 Quick Setup Steps

### 1. Get Your Redis Cloud Connection Details

You need to get your specific Redis Cloud endpoint details from your Redis Cloud dashboard:

1. **Login to Redis Cloud**: Go to [Redis Cloud Console](https://app.redislabs.com/)
2. **Find your database**: Look for your database in the dashboard
3. **Get connection details**: You'll need:
   - **Endpoint**: Something like `redis-12345.c1.us-east-1-2.ec2.redislabs.com`
   - **Port**: Usually `12345` or similar
   - **Password**: Your API key `A1yyflastlw544a0y0oo6nfyb6idxw1n3hr5co0cfqvpga0n8hs`

### 2. Update Backend Configuration

Update `/backend/.env` with your actual Redis Cloud endpoint:

```bash
# Redis Cloud Configuration (Primary - Using provided API key)
REDIS_API_KEY=A1yyflastlw544a0y0oo6nfyb6idxw1n3hr5co0cfqvpga0n8hs
REDIS_PASSWORD=A1yyflastlw544a0y0oo6nfyb6idxw1n3hr5co0cfqvpga0n8hs
REDIS_HOST=your-actual-redis-endpoint.redislabs.com  # ⚠️ UPDATE THIS
REDIS_PORT=your-actual-port-number                   # ⚠️ UPDATE THIS
REDIS_DB=0
REDIS_SSL=true
REDIS_DECODE_RESPONSES=true
REDIS_MAX_CONNECTIONS=20
REDIS_CONNECTION_TIMEOUT=10
REDIS_SOCKET_TIMEOUT=10

# Redis Cloud URL (constructed from above parameters)
REDIS_URL=rediss://default:A1yyflastlw544a0y0oo6nfyb6idxw1n3hr5co0cfqvpga0n8hs@your-actual-endpoint:port
```

### 3. Test the Connection

Run the test script to verify everything works:

```bash
cd backend
source venv/bin/activate  # or activate your virtual environment
python test_redis_cloud_connection.py
```

## 🔧 Configuration Details

### Current Setup Status

✅ **Backend Redis Service**: Updated to support Redis Cloud with SSL  
✅ **API Key Integration**: Your API key is configured as the password  
✅ **SSL Support**: Enabled for secure Redis Cloud connections  
✅ **Caching Methods**: All medical caching functionality ready  
✅ **Fallback Support**: Will work with local Redis if cloud is unavailable  

### What You Need to Update

⚠️ **REDIS_HOST**: Replace `redis-12345.c1.us-east-1-2.ec2.redislabs.com` with your actual endpoint  
⚠️ **REDIS_PORT**: Replace `12345` with your actual port number  

### Finding Your Redis Cloud Details

1. **Redis Cloud Dashboard Method**:
   - Login to [Redis Cloud Console](https://app.redislabs.com/)
   - Navigate to your database
   - Look for "Configuration" or "Connect" section
   - Copy the endpoint and port

2. **Connection String Method**:
   - If you have a connection string like:
     `rediss://default:A1yyflastlw544a0y0oo6nfyb6idxw1n3hr5co0cfqvpga0n8hs@redis-12345.c1.us-east-1-2.ec2.redislabs.com:12345`
   - Extract:
     - **Host**: `redis-12345.c1.us-east-1-2.ec2.redislabs.com`
     - **Port**: `12345`

## 🧪 Testing Commands

### Test Redis Connection
```bash
# Test the Python Redis service
cd backend && python test_redis_cloud_connection.py

# Test with redis-cli (if you have Redis installed locally)
redis-cli -h your-endpoint -p your-port -a A1yyflastlw544a0y0oo6nfyb6idxw1n3hr5co0cfqvpga0n8hs --tls ping
```

### Test Backend API
```bash
# Start the backend server
cd backend && python -m uvicorn app.main:app --reload

# Test cache health endpoint
curl http://localhost:8000/api/v1/cache/health
```

### Test Frontend Integration
```bash
# Start both frontend and backend
npm run fullstack

# The frontend will automatically use Redis through the backend API
```

## 📊 Caching Features Available

### Session Management
- User session persistence across browser refreshes
- User preferences caching
- Analysis progress tracking

### Medical Data Caching
- Drug analysis results (24-hour TTL)
- OCR processing results (1-hour TTL)
- FDA validation data (24-hour TTL)
- Medication information (1-week TTL)

### Performance Optimization
- Analysis result caching to avoid re-computation
- Image hash-based OCR caching
- Real-time progress updates

## 🔍 Monitoring and Health

### Cache Health Endpoint
```bash
GET /api/v1/cache/health
```

### Cache Statistics
```bash
GET /api/v1/cache/stats
```

### Redis Monitoring Dashboard
The app includes a Redis monitoring component at `/src/components/RedisMonitoringDashboard.tsx`

## 🚨 Troubleshooting

### Common Issues

1. **Connection Timeout**:
   - Check if your Redis Cloud endpoint and port are correct
   - Verify your API key is valid
   - Ensure SSL is enabled (`REDIS_SSL=true`)

2. **Authentication Failed**:
   - Double-check your API key
   - Make sure you're using `default` as the username

3. **SSL Certificate Issues**:
   - Ensure `REDIS_SSL=true` is set
   - Check if your system has updated CA certificates

### Fallback Behavior
If Redis Cloud is unavailable, the app will:
- Fall back to localStorage for session data
- Continue working without caching (with performance impact)
- Log warnings but not crash

## 🎯 Next Steps

1. **Get your Redis Cloud endpoint details** from the dashboard
2. **Update the REDIS_HOST and REDIS_PORT** in `/backend/.env`
3. **Run the test script** to verify the connection
4. **Start the application** and test the caching functionality

## 📞 Support

If you encounter issues:
1. Check the test script output for specific error messages
2. Verify your Redis Cloud dashboard shows an active database
3. Ensure your API key has the correct permissions
4. Check the backend logs for detailed error information

---

**Status**: ✅ Redis Cloud integration configured and ready for testing  
**Next**: Update endpoint details and run connection test
