import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const webRoot = resolve(import.meta.dirname, '../www');
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.glb', 'model/gltf-binary'],
  ['.html', 'text/html; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mp3', 'audio/mpeg'],
  ['.mp4', 'video/mp4'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webm', 'video/webm'],
]);

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const requestedPath = resolve(webRoot, `.${pathname}`);
    if (requestedPath !== webRoot && !requestedPath.startsWith(`${webRoot}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    const filePath = (await stat(requestedPath)).isDirectory()
      ? resolve(requestedPath, 'index.html')
      : requestedPath;
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream',
    }).end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(8080, () => {
  console.log('Nocturne Night is available at http://localhost:8080');
});
