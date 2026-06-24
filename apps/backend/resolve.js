import https from 'https';

https.get('https://dns.google/resolve?name=_mongodb._tcp.cluster0.tnkfodr.mongodb.net&type=SRV', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const hosts = json.Answer.map(ans => ans.data.split(' ')[3]);
    
    https.get('https://dns.google/resolve?name=cluster0.tnkfodr.mongodb.net&type=TXT', (resTxt) => {
      let dataTxt = '';
      resTxt.on('data', chunk => dataTxt += chunk);
      resTxt.on('end', () => {
        const jsonTxt = JSON.parse(dataTxt);
        const txt = jsonTxt.Answer[0].data;
        console.log("HOSTS=" + hosts.join(','));
        console.log("TXT=" + txt);
      });
    });
  });
});
