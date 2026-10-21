const express = require('express');
const md5 = require('md5');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const APPID = process.env.BAIDU_APPID;
const KEY   = process.env.BAIDU_KEY;

// 健康检查
app.get('/', (req, res) => res.send('jishi-translate-proxy OK'));

// 翻译接口
app.post('/translate', async (req, res) => {
  const { q, from = 'zh', to = 'en' } = req.body || {};
  if (!q) return res.status(400).json({ error: 'missing q' });
  if (!APPID || !KEY) return res.status(500).json({ error: 'server not configured' });

  const salt = Date.now().toString();
  const sign = md5(APPID + q + salt + KEY);
  const body = new URLSearchParams({ q, from, to, appid: APPID, salt, sign });

  try {
    const r = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'upstream error: ' + e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('proxy listening on ' + PORT));