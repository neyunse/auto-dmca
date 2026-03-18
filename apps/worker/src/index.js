import { connectDB, Alert, Target, Config, Exclusion, User } from 'database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// ... (lines 4-79 unchanged conceptually, but we replace the block)

import dotenv from 'dotenv';
import cron from 'node-cron';
import { scrapeGoogleDork } from './scrapers/google.js';
import { scrapeGrayMarket } from './scrapers/grayMarket.js';
import { lookupHost } from './scrapers/whois.js';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env from the root of the monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PORT = process.env.PORT || 4000;
const httpScraperServer = createServer();
const io = new Server(httpScraperServer, {
  cors: {
    origin: '*',
  }
});

const runScraper = async () => {
  console.log('\n--- [CYCLE START] ---');
  try {
     // Include targets that might not have the 'active' field set (treating them as active by default)
     let activeTargets = await Target.find({ active: { $ne: false } });
     const count = activeTargets.length;
     const exclusions = await Exclusion.find({});
     const excludedKeywords = exclusions.filter(e => e.type === 'keyword').map(e => e.value.toLowerCase());
     const excludedDomains = exclusions.filter(e => e.type === 'domain').map(e => e.value.toLowerCase());
     const excludedUrls = exclusions.filter(e => e.type === 'url').map(e => e.value.toLowerCase());

     if (count === 0) {
        console.log('[System] No active targets found. Deploying initial protocol target...');
        const seed = await Target.create({ name: 'Example Asset', type: 'query', value: 'Example Game Download' });
        activeTargets = [seed];
     }

     console.log(`[Scraper] Processing ${activeTargets.length} intelligence nodes...`);
     
     for (const target of activeTargets) {
        console.log(`[Target] Scanning: ${target.name} [Type: ${target.type}]`);
        try {
           let results = [];
           if (target.type === 'query') {
              results = await scrapeGoogleDork(target.value);
           } else if (target.type === 'domain') {
              results = await scrapeGrayMarket(target.name, target.value, target.queryParam);
           }

           console.log(`   └─ Captured ${results.length} potential vectors.`);

           for (const url of results) {
              try {
                 const urlLower = url.toLowerCase();
                 const urlObj = new URL(url);
                 const domainLower = urlObj.hostname.toLowerCase();

                 // 1. Domain Exclusion
                 if (excludedDomains.some(d => domainLower.includes(d))) continue;

                 // 2. Keyword Exclusion
                 if (excludedKeywords.some(k => urlLower.includes(k))) continue;

                 // 3. Exact URL Exclusion
                 if (excludedUrls.includes(urlLower)) continue;

                 // 4. Approximate Check: If it's a query target, ensure result has some relevance
                 // (Optional but helpful based on "no busque exacto" if results are too noisy)
                 
                 const exists = await Alert.findOne({ url });
                 if (!exists) {
                    const whoisData = await lookupHost(urlObj.hostname);
                    const newAlert = await Alert.create({
                       url,
                       targetId: target._id,
                       type: target.type === 'query' ? 'piracy' : 'resale',
                       abuseEmail: whoisData.abuseEmail
                    });
                    console.log(`      [!] VIOLATION CONFIRMED: ${url}`);
                    io.emit('new-alert', newAlert);
                 }
              } catch (urlErr) {
                 console.error(`      [Error] Processing URL ${url}:`, urlErr.message);
              }
           }
        } catch (targetErr) {
           console.error(`   [Error] Failure in node ${target.name}:`, targetErr.message);
        }
     }
     console.log('--- [CYCLE COMPLETE] ---\n');
  } catch (e) {
     console.error("[Critical] Scraper Loop Failure:", e.message);
  }
};

let currentCronJob = null;

const scheduleScraper = async () => {
  let intervalConfig = await Config.findOne({ key: 'cronInterval' });
  if (!intervalConfig) {
    intervalConfig = await Config.create({ key: 'cronInterval', value: '1' });
  }
  
  const intervalMinutes = parseInt(intervalConfig.value, 10) || 1;
  const cronString = `*/${intervalMinutes} * * * *`;
  
  if (currentCronJob) {
    currentCronJob.stop();
  }
  
  console.log(`[System] Scheduling Scrape Cycle every ${intervalMinutes} minute(s).`);
  currentCronJob = cron.schedule(cronString, runScraper);

  // --- SerpApi Reset Jobs ---
  // Hourly Reset: Every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[System] Resetting hourly SerpApi quota...');
    await Config.findOneAndUpdate({ key: 'serpapiHitsHour' }, { value: "0" }, { upsert: true });
  });

  // Monthly Reset: Every 1st of the month at 00:00
  cron.schedule('0 0 1 * *', async () => {
    console.log('[System] Resetting monthly SerpApi quota...');
    await Config.findOneAndUpdate({ key: 'serpapiHitsMonth' }, { value: "0" }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'serpapiHitsHour' }, { value: "0" }, { upsert: true });
  });
};

io.on('connection', (socket) => {
  console.log('Client connected to dashboard: ' + socket.id);

  socket.on('check-registration-status', async (callback) => {
    try {
      const count = await User.countDocuments();
      if (callback) callback({ registered: count > 0 });
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('register', async (data, callback) => {
    try {
      const count = await User.countDocuments();
      if (count > 0) {
        return callback({ error: 'Registration is locked. Admin already exists.' });
      }
      
      const { username, password } = data;
      const newUser = await User.create({ username, password });
      
      console.log(`[Auth] Admin registered: ${username}`);
      if (callback) callback({ success: true });
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('login', async (data, callback) => {
    try {
      const { username, password } = data;
      const user = await User.findOne({ username });
      
      if (!user || !(await user.comparePassword(password))) {
        return callback({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret-kagarisoft',
        { expiresIn: '7d' }
      );

      console.log(`[Auth] User logged in: ${username}`);
      if (callback) callback({ token, user: { username: user.username, role: user.role } });
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });
  
  socket.on('manual-scan', async (callback) => {
    console.log('[System] Manual scan requested via dashboard.');
    try {
      // 1. Stop current schedule to "skip" next cycle
      if (currentCronJob) {
        currentCronJob.stop();
      }
      
      // 2. Run now
      await runScraper();
      
      // 3. Reschedule based on current config
      await scheduleScraper();
      
      if (callback) callback({ success: true });
    } catch (e) {
      console.error('[System] Manual scan failure:', e.message);
      if (callback) callback({ error: e.message });
      // Ensure we don't leave the system with no scheduler if runScraper fails
      await scheduleScraper();
    }
  });

  socket.on('get-targets', async (callback) => {
    try {
      const targets = await Target.find({});
      if (callback) callback(targets);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('add-target', async (data, callback) => {
    try {
      const newTarget = await Target.create(data);
      io.emit('target-added', newTarget);
      if (callback) callback(newTarget);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('delete-target', async (id, callback) => {
    try {
      await Target.findByIdAndDelete(id);
      io.emit('target-deleted', id);
      if (callback) callback({ success: true });
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('update-target', async (data, callback) => {
    try {
      const { id, ...updates } = data;
      const updatedTarget = await Target.findByIdAndUpdate(id, updates, { new: true });
      io.emit('target-updated', updatedTarget);
      if (callback) callback(updatedTarget);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('get-alerts', async (callback) => {
    try {
      const alerts = await Alert.find({}).sort({ detectedAt: -1 }).limit(100);
      if (callback) callback(alerts);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('delete-alert', async (id, callback) => {
    try {
      await Alert.findByIdAndDelete(id);
      io.emit('alert-deleted', id);
      if (callback) callback({ success: true });
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('purge-alerts', async (targetId, callback) => {
    try {
      const filter = targetId && targetId !== 'all' ? { targetId } : {};
      await Alert.deleteMany(filter);
      io.emit('alerts-purged', targetId);
      if (callback) callback({ success: true });
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('get-alert-detail', async (id, callback) => {
    try {
      const alert = await Alert.findById(id).populate('targetId');
      if (callback) callback(alert);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('mark-sent', async ({ id, body }, callback) => {
    try {
      const alert = await Alert.findByIdAndUpdate(id, { 
        status: 'takedown', 
        sentAt: new Date(),
        sentBody: body
      }, { new: true });
      io.emit('alert-updated', alert);
      if (callback) callback(alert);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('exclude-domain-and-delete', async ({ domain, url, alertId }, callback) => {
    console.log(`[Exclusion] Request received for Domain: ${domain}, URL: ${url}`);
    try {
      // Create domain exclusion if it doesn't exist
      console.log(`[Exclusion] Blacklisting domain: ${domain}...`);
      await Exclusion.findOneAndUpdate(
        { value: domain }, // Only search by value to avoid duplicate key errors if type differs
        { value: domain, type: 'domain' },
        { upsert: true, new: true }
      );
      
      // Create URL exclusion if it doesn't exist
      console.log(`[Exclusion] Blacklisting specific URL...`);
      await Exclusion.findOneAndUpdate(
        { value: url }, // Only search by value
        { value: url, type: 'url' },
        { upsert: true, new: true }
      );

      console.log(`[Exclusion] Purging alert: ${alertId}`);
      await Alert.findByIdAndDelete(alertId);
      
      console.log(`[Exclusion] Broadcasting updates...`);
      io.emit('exclusion-added', { value: domain, type: 'domain' });
      io.emit('exclusion-added', { value: url, type: 'url' });
      io.emit('alert-deleted', alertId);
      
      console.log(`[Exclusion] Success. Resolving callback.`);
      if (callback) callback({ success: true });
    } catch (e) {
      console.error(`[Exclusion] ERROR:`, e.message);
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('get-exclusions', async (callback) => {
    try {
      const exclusions = await Exclusion.find({});
      if (callback) callback(exclusions);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('add-exclusion', async (data, callback) => {
    try {
      const newExclusion = await Exclusion.create(data);
      io.emit('exclusion-added', newExclusion);
      if (callback) callback(newExclusion);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('delete-exclusion', async (id, callback) => {
    try {
      await Exclusion.findByIdAndDelete(id);
      io.emit('exclusion-deleted', id);
      if (callback) callback({ success: true });
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('get-config', async (callback) => {
    try {
      const configs = await Config.find({});
      const configMap = {};
      configs.forEach(c => configMap[c.key] = c.value);
      
      // Defaults if not exists
      if (!configMap.userAgent) {
        const ua = await Config.create({ key: 'userAgent', value: 'KagariSoft-DMCABot/1.0 (+https://kagarisoft.com)' });
        configMap.userAgent = ua.value;
      }
      if (!configMap.cronInterval) {
        const ci = await Config.create({ key: 'cronInterval', value: '1' });
        configMap.cronInterval = ci.value;
      }
      
      if (callback) callback(configMap);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('save-config', async (data, callback) => {
    try {
      // data should be an array of {key, value} objects now to support multiple saves
      if (!Array.isArray(data)) {
        data = [data]; 
      }
      
      let updatedConfigs = [];
      for (const item of data) {
         const config = await Config.findOneAndUpdate(
           { key: item.key },
           { value: item.value },
           { upsert: true, new: true }
         );
         updatedConfigs.push(config);
         
         // If interval changed, reschedule
         if (item.key === 'cronInterval') {
            scheduleScraper();
         }
      }

      io.emit('config-updated', updatedConfigs);
      if (callback) callback(updatedConfigs);
    } catch (e) {
      if (callback) callback({ error: e.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const startWorker = async () => {
  try {
    // Only connect if URI exists. Will output error on dev if not set but won't crash necessarily
    if (process.env.MONGODB_URI) {
       await connectDB(process.env.MONGODB_URI);
       // Run immediately on start
       runScraper();
       // And schedule future runs dynamically
       await scheduleScraper();
    } else {
       console.log('MONGODB_URI not set. Skipping DB connection...');
    }
    
    httpScraperServer.listen(PORT, () => {
      console.log(`Worker and Socket.io server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start worker:', err);
    process.exit(1);
  }
};

startWorker();
