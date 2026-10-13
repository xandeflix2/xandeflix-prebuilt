export interface ArtworkPalette {base:string;ambient:string}
const palettes=new Map<string,ArtworkPalette>();
export function paletteFromPixels(pixels:ArrayLike<number>):ArtworkPalette|undefined{
  const bins=new Map<string,{score:number;r:number;g:number;b:number}>();
  for(let i=0;i+3<pixels.length;i+=4){
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2],high=Math.max(r,g,b),low=Math.min(r,g,b);
    if(pixels[i+3]<128 || high<24 || low>235)continue;
    const weight=(.2+(high-low)/255)*(high/255)**2,key=[r>>5,g>>5,b>>5].join(',');
    const bin=bins.get(key)||{score:0,r:0,g:0,b:0};
    bin.score+=weight;bin.r+=r*weight;bin.g+=g*weight;bin.b+=b*weight;bins.set(key,bin);
  }
  const strongest=[...bins.values()].sort((a,b)=>b.score-a.score)[0];if(!strongest)return;
  const rgb=[strongest.r,strongest.g,strongest.b].map(v=>v/strongest.score);
  const color=(scale:number,offset:number)=>`rgb(${rgb.map(v=>Math.min(84,Math.round(v*scale+offset))).join(', ')})`;
  return{base:color(.12,5),ambient:color(.36,0)};
}
/** Reuses only the displayed, decoded image; no fetch, persisted URL or extra decode. */
export function paletteForImage(image:HTMLImageElement):ArtworkPalette|undefined{
  if(!image.complete || !image.naturalWidth)return;
  const key=image.currentSrc||image.src;const known=palettes.get(key);
  if(known){palettes.delete(key);palettes.set(key,known);return known;}
  try{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=24;
    const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return;
    context.drawImage(image,0,0,24,24);
    const result=paletteFromPixels(context.getImageData(0,0,24,24).data);
    if(result){palettes.set(key,result);while(palettes.size>48)palettes.delete(palettes.keys().next().value!);}
    return result;
  }catch{return undefined;}
}
