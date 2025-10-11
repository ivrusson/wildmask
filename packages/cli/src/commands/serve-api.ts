import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';

interface APIServerOptions {
  port: number;
  host: string;
  name?: string;
}

export class DummyAPIServer {
  private server: any;
  private port: number;
  private host: string;
  private name: string;

  constructor(options: APIServerOptions) {
    this.port = options.port;
    this.host = options.host;
    this.name = options.name || 'dummy-api';
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleRequest(req, res);
      });

      this.server.listen(this.port, this.host, () => {
        resolve();
      });

      this.server.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method || 'GET';

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle OPTIONS requests
    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      switch (pathname) {
        case '/':
          this.handleRoot(req, res);
          break;
        case '/health':
          this.handleHealth(req, res);
          break;
        case '/api/test':
          this.handleApiTest(req, res);
          break;
        case '/api/echo':
          this.handleEcho(req, res);
          break;
        case '/api/users':
          this.handleUsers(req, res, method);
          break;
        case '/api/status':
          this.handleStatus(req, res);
          break;
        default:
          this.handleNotFound(req, res);
      }
    } catch (err) {
      this.handleError(req, res, err as Error);
    }
  }

  private handleRoot(_req: IncomingMessage, res: ServerResponse) {
    const html = this.generateHTML();
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(html);
  }

  private handleHealth(_req: IncomingMessage, res: ServerResponse) {
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: this.name,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    };

    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
  }

  private handleApiTest(req: IncomingMessage, res: ServerResponse) {
    const response = {
      message: 'Hello from WildMask Dummy API!',
      server: this.name,
      timestamp: new Date().toISOString(),
      request: {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(
          Object.entries(req.headers).filter(([key]) => 
            !['host', 'connection'].includes(key.toLowerCase())
          )
        )
      }
    };

    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
  }

  private handleEcho(req: IncomingMessage, res: ServerResponse) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      let parsedBody;
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }

      const response = {
        echo: parsedBody,
        timestamp: new Date().toISOString(),
        method: req.method,
        headers: req.headers
      };

      res.writeHead(200);
      res.end(JSON.stringify(response, null, 2));
    });
  }

  private handleUsers(req: IncomingMessage, res: ServerResponse, method: string) {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ];

    switch (method) {
      case 'GET':
        res.writeHead(200);
        res.end(JSON.stringify({ users: mockUsers }, null, 2));
        break;
      case 'POST':
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          const newUser = JSON.parse(body);
          newUser.id = mockUsers.length + 1;
          res.writeHead(201);
          res.end(JSON.stringify({ user: newUser }, null, 2));
        });
        break;
      default:
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }, null, 2));
    }
  }

  private handleStatus(_req: IncomingMessage, res: ServerResponse) {
    const response = {
      server: this.name,
      status: 'running',
      endpoints: [
        'GET /health',
        'GET /api/test',
        'POST /api/echo',
        'GET /api/users',
        'POST /api/users',
        'GET /api/status'
      ],
      timestamp: new Date().toISOString()
    };

    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
  }

  private handleNotFound(req: IncomingMessage, res: ServerResponse) {
    const response = {
      error: 'Not Found',
      message: `Endpoint ${req.url} not found`,
      availableEndpoints: [
        '/',
        '/health',
        '/api/test',
        '/api/echo',
        '/api/users',
        '/api/status'
      ]
    };

    res.writeHead(404);
    res.end(JSON.stringify(response, null, 2));
  }

  private handleError(_req: IncomingMessage, res: ServerResponse, err: Error) {
    const response = {
      error: 'Internal Server Error',
      message: err.message,
      timestamp: new Date().toISOString()
    };

    res.writeHead(500);
    res.end(JSON.stringify(response, null, 2));
  }

  private generateHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.name} - WildMask Dummy API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
        }
        .endpoint {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            border-left: 4px solid #667eea;
        }
        .method {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-right: 0.5rem;
        }
        .get { background: #d4edda; color: #155724; }
        .post { background: #fff3cd; color: #856404; }
        .put { background: #cce5ff; color: #004085; }
        .delete { background: #f8d7da; color: #721c24; }
        code {
            background: #e9ecef;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .test-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin: 0.25rem;
        }
        .test-btn:hover {
            background: #5a6fd8;
        }
        .response {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 1rem;
            margin-top: 1rem;
            font-family: monospace;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎭 ${this.name}</h1>
        <p>WildMask Dummy API Server</p>
        <p><code>http://${this.host}:${this.port}</code></p>
    </div>

    <h2>📋 Available Endpoints</h2>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/health</code> - Health check endpoint
        <button class="test-btn" onclick="testEndpoint('/health')">Test</button>
    </div>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/test</code> - Test API endpoint
        <button class="test-btn" onclick="testEndpoint('/api/test')">Test</button>
    </div>
    
    <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/echo</code> - Echo back request data
        <button class="test-btn" onclick="testEcho()">Test</button>
    </div>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/users</code> - Get mock users
        <button class="test-btn" onclick="testEndpoint('/api/users')">Test</button>
    </div>
    
    <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/status</code> - Server status
        <button class="test-btn" onclick="testEndpoint('/api/status')">Test</button>
    </div>

    <div id="response"></div>

    <script>
        async function testEndpoint(path) {
            const responseEl = document.getElementById('response');
            responseEl.innerHTML = '<div class="response">Testing...</div>';
            
            try {
                const response = await fetch(path);
                const data = await response.json();
                responseEl.innerHTML = \`<div class="response">\${JSON.stringify(data, null, 2)}</div>\`;
            } catch (error) {
                responseEl.innerHTML = \`<div class="response">Error: \${error.message}</div>\`;
            }
        }

        async function testEcho() {
            const responseEl = document.getElementById('response');
            responseEl.innerHTML = '<div class="response">Testing...</div>';
            
            try {
                const response = await fetch('/api/echo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: 'Hello from browser!',
                        timestamp: new Date().toISOString()
                    })
                });
                const data = await response.json();
                responseEl.innerHTML = \`<div class="response">\${JSON.stringify(data, null, 2)}</div>\`;
            } catch (error) {
                responseEl.innerHTML = \`<div class="response">Error: \${error.message}</div>\`;
            }
        }

        // Auto-test health endpoint on load
        document.addEventListener('DOMContentLoaded', () => {
            testEndpoint('/health');
        });
    </script>
</body>
</html>`;
  }
}
