// Canvas text helpers. Keeps generated/encoded artifacts out of player-facing UI.

export function cleanUiText(text){
  if(typeof text!=='string')return text;
  return text
    .replace(/â€”|â€“|Ã¢â‚¬â€|Ã¢â‚¬â€œ/g,'-')
    .replace(/â†’|Ã¢â€ â€™/g,'>')
    .replace(/âœ¦|Ã¢Å“Â¦/g,'*')
    .replace(/âš¡|Ã¢Å¡Â¡/g,'SIG')
    .replace(/★|â˜…|Ã¢Ëœâ€¦/g,'*')
    .replace(/×|Ã—|Ãƒâ€”/g,'x')
    .replace(/•|â€¢|â„¢|Ã¢â‚¬Â¢|·|Ã‚Â·/g,'-')
    .replace(/‹|Ã¢â‚¬Â¹/g,'<')
    .replace(/›|Ã¢â‚¬Âº/g,'>')
    .replace(/▲|Ã¢â€“Â²/g,'^')
    .replace(/▼|Ã¢â€“Â¼/g,'v')
    .replace(/💰|ðŸ’°/g,'g')
    .replace(/Ã‚/g,'')
    .replace(/Ã¢/g,'');
}

export function installCleanCanvasText(ctx){
  const fillTextRaw=ctx.fillText.bind(ctx);
  ctx.fillText=function(text,x,y,maxWidth){
    text=cleanUiText(text);
    return maxWidth==null?fillTextRaw(text,x,y):fillTextRaw(text,x,y,maxWidth);
  };
  const measureTextRaw=ctx.measureText.bind(ctx);
  ctx.measureText=function(text){return measureTextRaw(cleanUiText(text))};
}
