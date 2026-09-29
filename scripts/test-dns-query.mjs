import dgram from 'node:dgram';

function queryDns(host, server) {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    const id = 0x1234;
    const parts = host.split('.');
    let qname = Buffer.alloc(0);
    for (const p of parts) {
      qname = Buffer.concat([qname, Buffer.from([p.length]), Buffer.from(p)]);
    }
    qname = Buffer.concat([qname, Buffer.from([0])]);
    const header = Buffer.from([
      (id >> 8) & 0xff, id & 0xff,
      0x01, 0x00,
      0x00, 0x01,
      0x00, 0x00,
      0x00, 0x00,
      0x00, 0x00
    ]);
    const typeClass = Buffer.from([0x00, 0x01, 0x00, 0x01]);
    const msg = Buffer.concat([header, qname, typeClass]);
    
    socket.on('message', (resp) => {
      socket.close();
      let offset = 12;
      while (resp[offset] !== 0) {
        if ((resp[offset] & 0xc0) === 0xc0) { offset += 2; break; }
        offset += resp[offset] + 1;
      }
      if (resp[offset] === 0) offset += 1;
      offset += 4; // qtype + qclass
      
      const ips = [];
      while (offset < resp.length) {
        if ((resp[offset] & 0xc0) === 0xc0) { offset += 2; }
        else { while (resp[offset] !== 0) offset += resp[offset] + 1; offset += 1; }
        const type = resp.readUInt16BE(offset); offset += 2;
        const cls = resp.readUInt16BE(offset); offset += 2;
        const ttl = resp.readUInt32BE(offset); offset += 4;
        const rdlength = resp.readUInt16BE(offset); offset += 2;
        if (type === 1 && rdlength === 4) {
          ips.push(`${resp[offset]}.${resp[offset+1]}.${resp[offset+2]}.${resp[offset+3]}`);
        }
        offset += rdlength;
      }
      resolve(ips);
    });
    socket.on('error', (err) => {
      socket.close();
      reject(err);
    });
    socket.send(msg, 53, server);
  });
}

const ips1 = await queryDns('234.bxdtxs.space', '1.1.1.1');
console.log('1.1.1.1 resolved:', ips1);
const ips2 = await queryDns('234.bxdtxs.space', '8.8.8.8');
console.log('8.8.8.8 resolved:', ips2);
