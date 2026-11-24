// Turns a MediaFire page link into a direct download (302 redirect).
// Usage: /api/dl?u=https://www.mediafire.com/file/xxxx/name.apk/file
module.exports = async (req, res) => {
  try {
    const url = new URL(String(req.query.u || ''));
    if (!/(^|\.)mediafire\.com$/.test(url.hostname) || !url.pathname.startsWith('/file')) {
      res.statusCode = 400; return res.end('Only MediaFire file links are supported');
    }
    const r = await fetch(url.href, {
      headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36' }
    });
    const html = await r.text();
    let link = (html.match(/https?:\/\/download[0-9]*\.mediafire\.com\/[^"'\s<>]+/) || [])[0];
    if (!link) {
      const b64 = (html.match(/data-scrambled-url="([^"]+)"/) || [])[1];
      if (b64) link = Buffer.from(b64, 'base64').toString('utf8');
    }
    if (!link || !/^https:\/\/download[0-9]*\.mediafire\.com\//.test(link)) {
      res.statusCode = 502; return res.end('Could not find a direct link on that MediaFire page');
    }
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(302, { Location: link.replace(/&amp;/g, '&') });
    res.end();
  } catch (e) {
    res.statusCode = 500; res.end('Error resolving link');
  }
};
