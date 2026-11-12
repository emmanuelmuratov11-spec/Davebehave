// Tiny static server. `npm run preview` -> open the printed URL to scrub the ad.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.css': 'text/css' };
function serve(port = 0) {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(port, '127.0.0.1', () => res({ srv, url: `http://127.0.0.1:${srv.address().port}/src/index.html` }));
  });
}
module.exports = { serve, ROOT };
if (require.main === module) serve(5173).then(({ url }) => console.log('Preview:', url));
