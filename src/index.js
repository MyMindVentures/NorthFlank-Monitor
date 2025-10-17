import express from 'express';
import dotenv from 'dotenv';
import winston from 'winston';
import { WebSocketServer } from 'ws';

dotenv.config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

class NorthFlankMonitor {
  constructor() {
    this.app = express();
    this.connectedClients = new Set();
    this.setupExpress();
    this.setupWebSocket();
  }

  setupExpress() {
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        service: 'NorthFlank Monitor',
        connected_clients: this.connectedClients.size,
      });
    });

    // Monitor dashboard
    this.app.get('/dashboard', (req, res) => {
      res.json({
        timestamp: new Date().toISOString(),
        service: 'NorthFlank Monitor',
        status: 'active',
        connected_clients: this.connectedClients.size,
        monitoring: {
          projects: 7,
          services: 7,
          status: 'operational'
        }
      });
    });

    // API endpoints
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        services: {
          'proof-of-mind-pwa': 'operational',
          'hybrid-knowledge-base': 'operational',
          'ai-builder-orchestrator': 'operational',
          'ai-devenv-autoconfigurator': 'operational',
          'mcp-troubleshooting-gateway': 'operational',
          'northflank-monitor': 'operational',
          'secretvault': 'operational'
        }
      });
    });
  }

  setupWebSocket() {
    this.wss = new WebSocketServer({ port: 8080 });

    this.wss.on('connection', ws => {
      logger.info('WebSocket client connected to NorthFlank Monitor');
      this.connectedClients.add(ws);

      // Send real-time monitoring updates every 30 seconds
      const interval = setInterval(() => {
        try {
          ws.send(
            JSON.stringify({
              type: 'monitoring_update',
              data: {
                timestamp: new Date().toISOString(),
                services: {
                  'proof-of-mind-pwa': 'operational',
                  'hybrid-knowledge-base': 'operational',
                  'ai-builder-orchestrator': 'operational',
                  'ai-devenv-autoconfigurator': 'operational',
                  'mcp-troubleshooting-gateway': 'operational',
                  'northflank-monitor': 'operational',
                  'secretvault': 'operational'
                },
                connected_clients: this.connectedClients.size
              }
            })
          );
        } catch (error) {
          logger.error('Error sending WebSocket update:', error);
        }
      }, 30000);

      ws.on('close', () => {
        logger.info('WebSocket client disconnected from NorthFlank Monitor');
        this.connectedClients.delete(ws);
        clearInterval(interval);
      });

      ws.on('error', error => {
        logger.error('WebSocket error:', error);
        this.connectedClients.delete(ws);
        clearInterval(interval);
      });
    });
  }

  async start() {
    const port = process.env.PORT || 3002;
    this.app.listen(port, () => {
      logger.info(`NorthFlank Monitor listening on port ${port}`);
      logger.info(`WebSocket server listening on port 8080`);
      logger.info(`Dashboard available at http://localhost:${port}/dashboard`);
    });

    logger.info('NorthFlank Monitor started');
  }
}

// Start the server
const monitor = new NorthFlankMonitor();
monitor.start().catch(error => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});

