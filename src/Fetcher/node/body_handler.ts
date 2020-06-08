import fs from 'fs';
import path from 'path';
import BodyHandler from '../body_handler';
import mockUuid from '../../utils/mockUuid';
import { InputHeader } from '../../Param/Header';

export default class NodeBodyHandler extends BodyHandler<string | Buffer> {
  isNeedFormat(body: any) {
    return !(
      Buffer.isBuffer(body) ||
      typeof body === 'string' ||
      body === null
    );
  }

  static extMapMime = <any>{
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.rtf': 'application/rtf',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.pps': 'application/vnd.ms-powerpoint',
    '.ppsx':
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    '.pdf': 'application/pdf',
    '.swf': 'application/x-shockwave-flash',
    '.dll': 'application/x-msdownload',
    '.exe': 'application/octet-stream',
    '.msi': 'application/octet-stream',
    '.chm': 'application/octet-stream',
    '.cab': 'application/octet-stream',
    '.ocx': 'application/octet-stream',
    '.rar': 'application/octet-stream',
    '.tar': 'application/x-tar',
    '.tgz': 'application/x-compressed',
    '.zip': 'application/x-zip-compressed',
    '.z': 'application/x-compress',
    '.wav': 'audio/wav',
    '.wma': 'audio/x-ms-wma',
    '.wmv': 'video/x-ms-wmv',
    '.mp3': 'audio/mpeg',
    '.mp2': 'audio/mpeg',
    '.mpe': 'audio/mpeg',
    '.mpeg': 'audio/mpeg',
    '.mpg': 'audio/mpeg',
    '.rm': 'application/vnd.rn-realmedia',
    '.mid': 'audio/mid',
    '.midi': 'audio/mid',
    '.rmi': 'audio/mid',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.jpe': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.txt': 'text/plain',
    '.xml': 'text/xml',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.mht': 'message/rfc822',
    '.mhtml': 'message/rfc822',
  };

  protected addContentLength(body: string | Buffer | null): InputHeader {
    const header: InputHeader = {};
    if (body !== null) {
      header['content-length'] = String(Buffer.byteLength(body));
    }
    return header;
  }

  protected createUploadBody(body: object): [string | Buffer, InputHeader] {
    const boundary = mockUuid();
    const block = Object.entries(body).map(([name, target]) => {
      let fileName = '';
      let content = '';
      let contentType = '';
      if (fs.existsSync(target)) {
        fileName = path.basename(target);
        contentType =
          NodeBodyHandler.extMapMime[path.extname(target)] ||
          'application/octet-stream';
        content = fs.readFileSync(target, 'utf-8');
      } else {
        content = target;
      }
      const lineOne = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"`;
      const file = fileName
        ? `; fileName="${fileName}"\r\nContent-Type: ${contentType}`
        : '';
      return lineOne + file + '\r\n\r\n' + content;
    });
    return [
      block.join('\r\n') + `\r\n--${boundary}--`,
      {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
    ];
  }
}
