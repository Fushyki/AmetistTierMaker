const fs = require('fs');

async function fetchWaifus() {
  const query = `
    query {
      Page(page: 1, perPage: 50) {
        characters(sort: FAVOURITES_DESC) {
          name { full }
          gender
          image { large }
        }
      }
    }
  `;
  
  let allFemales = [];
  
  for (let i = 1; i <= 5; i++) {
    const query = `
      query {
        Page(page: ${i}, perPage: 50) {
          characters(sort: FAVOURITES_DESC) {
            name { full }
            gender
            image { large }
          }
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query })
    });
    
    if (!res.ok) break;
    
    const data = await res.json();
    const characters = data.data.Page.characters;
    const females = characters.filter(c => c.gender === 'Female');
    
    allFemales.push(...females);
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync('public/waifus.json', JSON.stringify(allFemales, null, 2));
  console.log('Saved ' + allFemales.length + ' female characters to public/waifus.json');
}

fetchWaifus();
