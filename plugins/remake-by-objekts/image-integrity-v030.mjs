// REMAKE by objekts v0.30 — bounded media container integrity checks.
// Validates PNG chunk CRC and JPEG marker envelope. Does NOT decode pixels,
// prove image semantics, prove host model vision or replace a secure image decoder.
const fail=(x)=>{throw Error(x)};
const sig=Uint8Array.from([137,80,78,71,13,10,26,10]);
const read32=(bytes,pos)=>((bytes[pos]*0x1000000)+((bytes[pos+1]<<16)|(bytes[pos+2]<<8)|bytes[pos+3]))>>>0;
const fourcc=(b,p)=>String.fromCharCode(...b.subarray(p,p+4));
const PNG_LIMIT=2*1024*1024;
const crcTable=(()=>{
 const t=new Uint32Array(256);
 for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):(c>>>1);t[n]=c>>>0;}
 return t;
})();
export function pngCRC32(b,offset,length){
 let crc=0xffffffff;
 for(let i=offset;i<offset+length;i++)crc=crcTable[(crc^b[i])&255]^(crc>>>8);
 return (crc^0xffffffff)>>>0;
}
export function validatePNGStructure(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<45||bytes.length>PNG_LIMIT)fail("invalid_png_size");
 if(!sig.every((x,i)=>bytes[i]===x))fail("invalid_png_signature");
 let pos=8,index=0,idats=0,ended=false,width=0,height=0;
 while(pos<bytes.length){
  if(pos+12>bytes.length)fail("truncated_png_chunk_header");
  const length=read32(bytes,pos),dataStart=pos+8;
  if(length>PNG_LIMIT||dataStart+length+4>bytes.length)fail("png_chunk_exceeds_buffer");
  const name=fourcc(bytes,pos+4), expected=read32(bytes,dataStart+length);
  const actual=pngCRC32(bytes,pos+4,length+4);
  if(actual!==expected)fail("png_crc_mismatch_"+name);
  if(index===0){
    if(name!=="IHDR"||length!==13)fail("invalid_png_first_chunk");
    width=read32(bytes,dataStart);height=read32(bytes,dataStart+4);
    const depth=bytes[dataStart+8],type=bytes[dataStart+9],compression=bytes[dataStart+10],filter=bytes[dataStart+11],interlace=bytes[dataStart+12];
    if(!width||!height||width>4096||height>4096||![1,2,4,8,16].includes(depth)||![0,2,3,4,6].includes(type)||compression!==0||filter!==0||interlace>1)fail("invalid_png_ihdr");
  }else if(name==="IHDR")fail("duplicate_png_ihdr");
  if(name==="IDAT")idats++;
  if(name==="IEND"){
   if(length!==0||idats===0)fail("missing_or_invalid_png_idat");
   ended=true;
   if(dataStart+length+4!==bytes.length)fail("png_trailing_bytes");
  }
  pos=dataStart+length+4;index++;
  if(index>4096)fail("too_many_png_chunks");
  if(ended)break;
 }
 if(!ended)fail("missing_png_iend");
 return {width,height,chunks:index,idat_chunks:idats,scope:"CRC/chunk envelope only; IDAT zlib stream and displayed pixels not decoded."};
}
const SOF=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
export function validateJPEGStructure(b){
 if(!(b instanceof Uint8Array)||b.length<16||b.length>PNG_LIMIT)fail("invalid_jpeg_size");
 if(b[0]!==0xff||b[1]!==0xd8||b[b.length-2]!==0xff||b[b.length-1]!==0xd9)fail("jpeg_missing_soi_or_eoi");
 let pos=2,sof=false,sos=false,width=0,height=0,count=0;
 while(pos<b.length-2){
  if(b[pos++]!==0xff)fail("jpeg_unexpected_segment_prefix");
  while(pos<b.length&&b[pos]===0xff)pos++;
  if(pos>=b.length)fail("jpeg_missing_marker");
  const marker=b[pos++];
  if(marker===0xda){
   if(!sof)fail("jpeg_sos_without_sof");
   if(pos+2>b.length)fail("truncated_jpeg_sos");
   const n=(b[pos]<<8)|b[pos+1];
   if(n<6||pos+n>b.length-2)fail("invalid_jpeg_sos");
   sos=true; break; // remaining entropy is deliberately not decoded
  }
  if(marker===0xd8||marker===0xd9||marker===0x01||marker>=0xd0&&marker<=0xd7)fail("jpeg_unexpected_marker");
  if(pos+2>b.length)fail("truncated_jpeg_segment");
  const n=(b[pos]<<8)|b[pos+1];
  if(n<2||pos+n>b.length-2)fail("invalid_jpeg_segment_length");
  if(SOF.has(marker)){
   if(n<8||sof)fail("invalid_jpeg_sof");
   height=(b[pos+3]<<8)|b[pos+4];width=(b[pos+5]<<8)|b[pos+6];
   if(!width||!height||width>4096||height>4096)fail("jpeg_bad_dimensions");
   sof=true;
  }
  pos+=n;
  count++;
  if(count>4096)fail("too_many_jpeg_markers");
 }
 if(!sof||!sos)fail("jpeg_missing_image_markers");
 return {width,height,segments:count,scope:"SOI/SOF/SOS/EOI marker envelope only; JPEG entropy and displayed pixels not decoded."};
}
export function verifyInlineImage(bytes,mime){
 if(mime==="image/png")return validatePNGStructure(bytes);
 if(mime==="image/jpeg")return validateJPEGStructure(bytes);
 fail("unsupported_inline_image_type");
}
