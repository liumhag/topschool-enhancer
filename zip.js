// ZIP32, STORE (JPEG is already compressed), UTF-8 names, CRC-32.
globalThis.makeZip=entries=>{
 const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
 function crc(data){let c=0xffffffff;for(const b of data){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
 function header(size){const b=new Uint8Array(size);return [b,new DataView(b.buffer)];}
 for(const e of entries){const n=encoder.encode(e.name),data=e.data;if(n.length>65535||data.length>0xffffffff)throw Error('ZIP32 大小超限');const c=crc(data);const [h,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,c,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,n.length,true);parts.push(h,n,data);const [ch,cv]=header(46);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,c,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);central.push(ch,n);offset+=h.length+n.length+data.length;}
 const length=central.reduce((a,b)=>a+b.length,0);if(offset+length>0xffffffff||entries.length>65535)throw Error('ZIP32 大小超限');const [end,v]=header(22);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,length,true);v.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/zip'});
};
