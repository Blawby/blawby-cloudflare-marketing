import fs from 'fs';

async function upsertChunks() {
  const chunks = JSON.parse(fs.readFileSync('lesson-chunks.json', 'utf8'));
  
  console.log(`Upserting ${chunks.length} chunks...`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const response = await fetch('https://compass-ts.paulchrisluke.workers.dev/upsert-mdx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: chunk.text,
          metadata: {
            id: chunk.id,
            ...chunk.metadata
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`Error upserting chunk ${i + 1}:`, error);
      } else {
        console.log(`Upserted chunk ${i + 1}/${chunks.length}`);
      }
    } catch (error) {
      console.error(`Error upserting chunk ${i + 1}:`, error.message);
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('Upsert complete!');
}

upsertChunks().catch(console.error); 