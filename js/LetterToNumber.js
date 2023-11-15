/****Chome书签版本，功能：类似 hacker => h4ck3r 的快速转换***/
javascript:(function(){var s=prompt('letter2number:'),m={0:'o,O',1:'I,i,L,l',2:'z,Z',3:'E,e',4:'a,A',5:'s,S',6:'b',7:'T',8:'B',9:'g'},r={};Object.keys(m).forEach(k=>m[k].split(',').forEach(v=>r[v]=k));s&&alert([...s].map(c=>r[c]?r[c]:c).join(%27%27));})()
